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
  maxWidth: 80, // Ancho máximo para impresora térmica 80mm
  restaurantName: 'RESTAURANTE EL BUENO',
  currency: 'EUR',
  autoConfigure: true // Configurar automáticamente la impresora
};

// Función para generar comandos ESC/POS de configuración
function generateESCPOSSetup() {
  let commands = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Initialize printer
  
  // Configurar márgenes izquierdo y derecho a 0
  commands.push(0x1B, 0x6C, 0x00); // ESC l n - Set left margin (0)
  commands.push(0x1B, 0x51, 0x00); // ESC Q n - Set right margin (0)
  
  // Configurar ancho de línea máximo
  commands.push(0x1B, 0x51, CONFIG.maxWidth); // ESC Q n - Set right margin to maxWidth
  
  // Configurar alineación centrada
  commands.push(0x1B, 0x61, 1); // ESC a n - Alignment (1 = center)
  
  // Configurar fuente normal
  commands.push(0x1B, 0x21, 0x00); // ESC ! n - Select print mode (normal)
  
  // Configurar espaciado de línea
  commands.push(0x1B, 0x32); // ESC 2 - Select default line spacing
  
  return Buffer.from(commands);
}

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

// Función para enviar comandos ESC/POS
async function sendESCPOSCommands(commands) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `escpos_${Date.now()}.bin`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, commands);
    
    // Enviar comandos a la impresora
    const copyCommand = `copy "${tempFile}" "USB002"`;
    
    exec(copyCommand, (error, stdout, stderr) => {
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

// Función para configurar la impresora automáticamente
async function configurePrinter() {
  if (!CONFIG.autoConfigure) {
    return { success: true, message: 'Configuración automática deshabilitada' };
  }
  
  try {
    console.log('⚙️ Configurando impresora automáticamente...');
    
    const escposCommands = generateESCPOSSetup();
    await sendESCPOSCommands(escposCommands);
    
    console.log('✅ Impresora configurada automáticamente');
    return { success: true, message: 'Impresora configurada automáticamente' };
    
  } catch (error) {
    console.log('⚠️ No se pudo configurar la impresora automáticamente:', error.message);
    return { success: false, error: error.message };
  }
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
    
    // Configurar impresora automáticamente
    const configResult = await configurePrinter();
    
    // Esperar un momento para que la configuración se aplique
    if (configResult.success) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generar contenido del ticket
    const ticketContent = generateOptimizedTicket(ticketData);
    
    // Imprimir
    await printTicket(ticketContent);
    
    res.json({ 
      success: true, 
      message: 'Ticket impreso exitosamente',
      config: {
        maxWidth: CONFIG.maxWidth,
        restaurantName: CONFIG.restaurantName,
        currency: CONFIG.currency,
        autoConfigure: CONFIG.autoConfigure
      },
      printerConfig: configResult,
      summary: {
        tableNumber,
        customerName,
        itemCount: items.length,
        total: items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
      }
    });
    
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
    
    // Configurar impresora automáticamente
    const configResult = await configurePrinter();
    
    // Esperar un momento para que la configuración se aplique
    if (configResult.success) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const ticketContent = generateOptimizedTicket(testData);
    await printTicket(ticketContent);
    
    res.json({ 
      success: true, 
      message: 'Datos de prueba enviados e impresos',
      data: testData,
      content: ticketContent,
      config: CONFIG,
      printerConfig: configResult
    });
    
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
    description: 'Configuración actual del servidor de impresión con ESC/POS'
  });
});

// Endpoint de estado
app.get('/status', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    mode: 'escpos-automatic',
    description: 'Servidor de impresión con configuración automática ESC/POS',
    config: CONFIG
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ESC/POS automático iniciado en puerto ${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /print-ticket - Imprimir ticket`);
  console.log(`   POST /test-print - Probar impresión`);
  console.log(`   GET /config - Ver configuración`);
  console.log(`   GET /status - Estado del servidor`);
  console.log(`\n⚙️ Configuración actual:`);
  console.log(`   - Ancho máximo: ${CONFIG.maxWidth} caracteres`);
  console.log(`   - Restaurante: ${CONFIG.restaurantName}`);
  console.log(`   - Moneda: ${CONFIG.currency}`);
  console.log(`   - Configuración automática: ${CONFIG.autoConfigure ? 'Activada' : 'Desactivada'}`);
  console.log(`\n💡 La impresora se configurará automáticamente antes de cada impresión`);
});

module.exports = app;


