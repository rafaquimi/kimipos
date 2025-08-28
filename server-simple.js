const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Función para generar contenido del ticket
function generateTicketContent(ticketData) {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = ticketData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho máximo para impresora térmica 80mm
  const maxWidth = 48;
  
  // Función para centrar texto
  const centerText = (text) => {
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  // Función para crear líneas de separación
  const separatorLine = () => '='.repeat(maxWidth);
  const dividerLine = () => '-'.repeat(maxWidth);
  
  let content = '';
  
  // Encabezado centrado
  content += centerText(ticketData.restaurantName || 'RESTAURANTE') + '\n';
  content += separatorLine() + '\n';
  
  // Información de mesa y cliente
  content += `MESA: ${ticketData.tableNumber}`.padEnd(maxWidth) + '\n';
  if (ticketData.customerName) {
    content += `CLIENTE: ${ticketData.customerName}`.padEnd(maxWidth) + '\n';
  }
  content += `FECHA: ${timestamp}`.padEnd(maxWidth) + '\n';
  content += dividerLine() + '\n';
  
  // Título del pedido
  content += centerText('PEDIDO:') + '\n';
  
  // Items del pedido
  ticketData.items.forEach(item => {
    const itemLine = `${item.quantity}x ${item.productName}`;
    content += itemLine.padEnd(maxWidth) + '\n';
    
    const priceLine = `   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR`;
    content += priceLine.padEnd(maxWidth) + '\n';
  });
  
  content += dividerLine() + '\n';
  
  // Total
  const totalLine = `TOTAL: ${total.toFixed(2)} EUR`;
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

// Función para simular envío a Make.com
async function simulateMakeCom(ticketData) {
  console.log('📤 Simulando envío a Make.com...');
  console.log('- Datos recibidos:', JSON.stringify(ticketData, null, 2));
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Datos procesados por Make.com');
  return { success: true, status: 200 };
}

// Endpoint para imprimir ticket
app.post('/print-ticket', async (req, res) => {
  try {
    const { items, tableNumber, customerName, restaurantName } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items requeridos' });
    }
    
    if (!tableNumber) {
      return res.status(400).json({ error: 'Número de mesa requerido' });
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
    
    // Simular envío a Make.com
    const makeResult = await simulateMakeCom(ticketData);
    
    if (makeResult.success) {
      // Generar contenido del ticket
      const ticketContent = generateTicketContent(ticketData);
      
      // Imprimir localmente (simulando que Make.com lo hace)
      await printTicket(ticketContent);
      
      res.json({ 
        success: true, 
        message: 'Ticket enviado a Make.com e impreso exitosamente',
        status: makeResult.status,
        content: ticketContent
      });
    } else {
      res.status(500).json({ 
        error: 'Error en Make.com',
        details: makeResult.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint /print-ticket:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de prueba
app.post('/test-print', async (req, res) => {
  try {
    const testData = {
      items: [
        { quantity: 1, productName: 'Sprite', unitPrice: 2.50, totalPrice: 2.50 },
        { quantity: 2, productName: 'Hamburguesa', unitPrice: 8.00, totalPrice: 16.00 }
      ],
      tableNumber: 'TEST',
      customerName: 'PRUEBA',
      restaurantName: 'RESTAURANTE TEST'
    };
    
    console.log('🧪 Enviando datos de prueba...');
    
    const makeResult = await simulateMakeCom(testData);
    
    if (makeResult.success) {
      const ticketContent = generateTicketContent(testData);
      await printTicket(ticketContent);
      
      res.json({ 
        success: true, 
        message: 'Datos de prueba enviados e impresos',
        data: testData,
        content: ticketContent
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

// Endpoint de estado
app.get('/status', (req, res) => {
  res.json({ 
    status: 'running', 
    timestamp: new Date().toISOString(),
    mode: 'simulation',
    description: 'Simulando Make.com con impresión local'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Make.com (simulación) iniciado en puerto ${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /print-ticket - Imprimir ticket`);
  console.log(`   POST /test-print - Probar impresión`);
  console.log(`   GET /status - Estado del servidor`);
  console.log(`\n💡 Este servidor simula Make.com pero imprime localmente`);
  console.log(`💡 Para usar Make.com real, sigue las instrucciones en MAKE_SETUP.md`);
});

module.exports = app;


