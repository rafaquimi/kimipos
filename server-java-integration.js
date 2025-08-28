const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configuración
const CONFIG = {
  javaServicePort: 3002,
  javaServiceHost: 'localhost',
  restaurantName: 'RESTAURANTE EL BUENO',
  currency: 'EUR',
  autoStartJavaService: true
};

// Función para iniciar el servicio Java
async function startJavaService() {
  if (!CONFIG.autoStartJavaService) {
    return { success: true, message: 'Inicio automático deshabilitado' };
  }

  try {
    console.log('🚀 Iniciando servicio Java de impresión...');
    
    // Verificar si el archivo Java existe
    const javaFile = path.join(__dirname, 'PrinterService.java');
    if (!fs.existsSync(javaFile)) {
      throw new Error('Archivo PrinterService.java no encontrado');
    }

    // Compilar el archivo Java
    console.log('📦 Compilando PrinterService.java...');
    await new Promise((resolve, reject) => {
      exec('javac PrinterService.java', (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error al compilar: ${error.message}`));
        } else {
          resolve();
        }
      });
    });

    // Ejecutar el servicio Java en segundo plano
    console.log('🖨️ Ejecutando servicio Java...');
    const javaProcess = exec('java PrinterService', {
      cwd: __dirname,
      windowsHide: true // Ocultar ventana en Windows
    });

    // Manejar salida del proceso Java
    javaProcess.stdout.on('data', (data) => {
      console.log(`[Java Service] ${data.toString().trim()}`);
    });

    javaProcess.stderr.on('data', (data) => {
      console.log(`[Java Service Error] ${data.toString().trim()}`);
    });

    javaProcess.on('close', (code) => {
      console.log(`[Java Service] Proceso terminado con código ${code}`);
    });

    // Esperar un momento para que el servicio se inicie
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Servicio Java iniciado correctamente');
    return { success: true, message: 'Servicio Java iniciado correctamente' };

  } catch (error) {
    console.error('❌ Error al iniciar servicio Java:', error.message);
    return { success: false, error: error.message };
  }
}

// Función para enviar datos al servicio Java
async function sendToJavaService(ticketData) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    
    const postData = JSON.stringify(ticketData);
    
    const options = {
      hostname: CONFIG.javaServiceHost,
      port: CONFIG.javaServicePort,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          resolve({ success: true, message: 'Respuesta recibida del servicio Java' });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error de conexión con servicio Java: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Endpoint principal para imprimir ticket
app.post('/print-ticket', async (req, res) => {
  try {
    const { items, tableNumber, customerName, restaurantName } = req.body;
    
    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items requeridos',
        message: 'Debe proporcionar al menos un item para imprimir'
      });
    }
    
    if (!tableNumber) {
      return res.status(400).json({ 
        error: 'Número de mesa requerido',
        message: 'Debe especificar el número de mesa'
      });
    }
    
    console.log('🖨️ Solicitud de impresión recibida:');
    console.log('- Mesa:', tableNumber);
    console.log('- Cliente:', customerName || 'Sin nombre');
    console.log('- Items:', items.length);
    
    const ticketData = {
      items,
      tableNumber,
      customerName,
      restaurantName: restaurantName || CONFIG.restaurantName
    };
    
    // Enviar al servicio Java
    console.log('📤 Enviando datos al servicio Java...');
    const javaResponse = await sendToJavaService(ticketData);
    
    if (javaResponse.success) {
      res.json({ 
        success: true, 
        message: 'Ticket impreso exitosamente',
        method: 'java-service',
        javaResponse: javaResponse,
        summary: {
          tableNumber,
          customerName,
          itemCount: items.length,
          total: items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
        }
      });
    } else {
      res.status(500).json({ 
        error: 'Error en impresión',
        message: javaResponse.message || 'Error desconocido en el servicio Java'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint /print-ticket:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint de prueba
app.post('/test-print', async (req, res) => {
  try {
    const testData = {
      items: [
        { quantity: 1, productName: 'Sprite', unitPrice: 2.50, totalPrice: 2.50 },
        { quantity: 2, productName: 'Hamburguesa', unitPrice: 8.00, totalPrice: 16.00 },
        { quantity: 1, productName: 'Patatas Fritas', unitPrice: 3.50, totalPrice: 3.50 }
      ],
      tableNumber: 'TEST',
      customerName: 'PRUEBA',
      restaurantName: CONFIG.restaurantName
    };
    
    console.log('🧪 Enviando datos de prueba al servicio Java...');
    
    const javaResponse = await sendToJavaService(testData);
    
    res.json({ 
      success: true, 
      message: 'Datos de prueba enviados',
      data: testData,
      method: 'java-service',
      javaResponse: javaResponse
    });
    
  } catch (error) {
    console.error('❌ Error en endpoint /test-print:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para verificar estado del servicio Java
app.get('/java-status', async (req, res) => {
  try {
    const javaResponse = await sendToJavaService({
      items: [{ quantity: 1, productName: 'TEST', unitPrice: 0, totalPrice: 0 }],
      tableNumber: 'STATUS',
      customerName: 'STATUS'
    });
    
    res.json({
      status: 'connected',
      javaService: {
        host: CONFIG.javaServiceHost,
        port: CONFIG.javaServicePort,
        response: javaResponse
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({
      status: 'disconnected',
      error: error.message,
      javaService: {
        host: CONFIG.javaServiceHost,
        port: CONFIG.javaServicePort
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de configuración
app.get('/config', (req, res) => {
  res.json({ 
    config: CONFIG,
    timestamp: new Date().toISOString(),
    description: 'Servidor Node.js con integración Java para impresión térmica'
  });
});

// Endpoint de estado
app.get('/status', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    mode: 'java-integration',
    description: 'Servidor de impresión con integración Java',
    config: CONFIG
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor Node.js iniciado en puerto ${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /print-ticket - Imprimir ticket`);
  console.log(`   POST /test-print - Probar impresión`);
  console.log(`   GET /java-status - Estado del servicio Java`);
  console.log(`   GET /config - Ver configuración`);
  console.log(`   GET /status - Estado del servidor`);
  console.log(`\n⚙️ Configuración actual:`);
  console.log(`   - Servicio Java: ${CONFIG.javaServiceHost}:${CONFIG.javaServicePort}`);
  console.log(`   - Restaurante: ${CONFIG.restaurantName}`);
  console.log(`   - Moneda: ${CONFIG.currency}`);
  console.log(`   - Inicio automático Java: ${CONFIG.autoStartJavaService ? 'Activado' : 'Desactivado'}`);
  
  // Iniciar servicio Java automáticamente
  if (CONFIG.autoStartJavaService) {
    console.log(`\n🔄 Iniciando servicio Java automáticamente...`);
    const javaResult = await startJavaService();
    if (javaResult.success) {
      console.log(`✅ ${javaResult.message}`);
    } else {
      console.log(`⚠️ ${javaResult.error}`);
      console.log(`💡 Puedes iniciar el servicio Java manualmente ejecutando: java PrinterService`);
    }
  }
  
  console.log(`\n💡 El servidor está listo para recibir solicitudes de impresión`);
});

module.exports = app;

