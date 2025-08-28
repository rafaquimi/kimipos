const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configuración optimizada
const CONFIG = {
  maxWidth: 48, // Ancho óptimo para impresoras térmicas de 80mm
  restaurantName: 'RESTAURANTE EL BUENO',
  currency: 'EUR'
};

// Función para generar contenido del ticket optimizado
function generateOptimizedTicket(ticketData) {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = ticketData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Función para centrar texto
  const centerText = (text) => {
    const padding = Math.max(0, Math.floor((CONFIG.maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  // Función para crear líneas de separación
  const separatorLine = () => '='.repeat(CONFIG.maxWidth);
  const dividerLine = () => '-'.repeat(CONFIG.maxWidth);
  
  let content = '';
  
  // Encabezado centrado
  content += centerText(ticketData.restaurantName || CONFIG.restaurantName) + '\n';
  content += separatorLine() + '\n';
  
  // Información de mesa y cliente
  content += `MESA: ${ticketData.tableNumber}`.padEnd(CONFIG.maxWidth) + '\n';
  if (ticketData.customerName) {
    content += `CLIENTE: ${ticketData.customerName}`.padEnd(CONFIG.maxWidth) + '\n';
  }
  content += `FECHA: ${timestamp}`.padEnd(CONFIG.maxWidth) + '\n';
  content += dividerLine() + '\n';
  
  // Título del pedido
  content += centerText('PEDIDO:') + '\n';
  
  // Items del pedido
  ticketData.items.forEach(item => {
    const itemLine = `${item.quantity}x ${item.productName}`;
    content += itemLine.padEnd(CONFIG.maxWidth) + '\n';
    
    const priceLine = `   ${item.unitPrice.toFixed(2)} ${CONFIG.currency} x ${item.quantity} = ${item.totalPrice.toFixed(2)} ${CONFIG.currency}`;
    content += priceLine.padEnd(CONFIG.maxWidth) + '\n';
  });
  
  content += dividerLine() + '\n';
  
  // Total
  const totalLine = `TOTAL: ${total.toFixed(2)} ${CONFIG.currency}`;
  content += centerText(totalLine) + '\n';
  content += '\n';
  
  // Mensaje de agradecimiento
  content += centerText('¡GRACIAS!') + '\n';
  content += '\n\n\n';
  
  return content;
}

// Función para imprimir usando PowerShell
async function printTicket(textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `ticket_${Date.now()}.txt`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, textContent, 'utf8');
    
    const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommand, (error, stdout, stderr) => {
      // Limpiar archivo temporal
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

// Función para enviar a Make.com (simulada)
async function sendToMakeCom(ticketData) {
  console.log('📤 Enviando datos a Make.com...');
  console.log('- Mesa:', ticketData.tableNumber);
  console.log('- Cliente:', ticketData.customerName || 'Sin nombre');
  console.log('- Items:', ticketData.items.length);
  console.log('- Total:', ticketData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('✅ Datos procesados por Make.com');
  return { success: true, status: 200 };
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
      restaurantName
    };
    
    // Enviar a Make.com
    const makeResult = await sendToMakeCom(ticketData);
    
    if (makeResult.success) {
      // Generar contenido del ticket
      const ticketContent = generateOptimizedTicket(ticketData);
      
      // Imprimir
      await printTicket(ticketContent);
      
      res.json({ 
        success: true, 
        message: 'Ticket enviado a Make.com e impreso exitosamente',
        status: makeResult.status,
        config: {
          maxWidth: CONFIG.maxWidth,
          restaurantName: CONFIG.restaurantName,
          currency: CONFIG.currency
        },
        summary: {
          tableNumber,
          customerName,
          itemCount: items.length,
          total: items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
        }
      });
    } else {
      res.status(500).json({ 
        error: 'Error en Make.com',
        details: makeResult.error
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
    
    console.log('🧪 Enviando datos de prueba...');
    
    const makeResult = await sendToMakeCom(testData);
    
    if (makeResult.success) {
      const ticketContent = generateOptimizedTicket(testData);
      await printTicket(ticketContent);
      
      res.json({ 
        success: true, 
        message: 'Datos de prueba enviados e impresos',
        data: testData,
        content: ticketContent,
        config: CONFIG
      });
    } else {
      res.status(500).json({ 
        error: 'Error enviando datos de prueba',
        details: makeResult.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint /test-print:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de configuración
app.get('/config', (req, res) => {
  res.json({ 
    config: CONFIG,
    timestamp: new Date().toISOString(),
    description: 'Configuración actual del servidor de impresión'
  });
});

// Endpoint de estado
app.get('/status', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    mode: 'make-com-simulation',
    description: 'Servidor de impresión optimizado para Make.com',
    config: CONFIG
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de impresión final iniciado en puerto ${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /print-ticket - Imprimir ticket`);
  console.log(`   POST /test-print - Probar impresión`);
  console.log(`   GET /config - Ver configuración`);
  console.log(`   GET /status - Estado del servidor`);
  console.log(`\n⚙️ Configuración actual:`);
  console.log(`   - Ancho máximo: ${CONFIG.maxWidth} caracteres`);
  console.log(`   - Restaurante: ${CONFIG.restaurantName}`);
  console.log(`   - Moneda: ${CONFIG.currency}`);
  console.log(`\n💡 Para usar Make.com real, sigue las instrucciones en MAKE_SETUP.md`);
});

module.exports = app;


