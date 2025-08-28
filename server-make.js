const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configuración de Make.com
const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/YOUR_WEBHOOK_ID'; // Reemplazar con tu webhook real

// Función para enviar datos a Make.com
async function sendToMake(ticketData) {
  try {
    console.log('📤 Enviando datos a Make.com...');
    
    const response = await axios.post(MAKE_WEBHOOK_URL, {
      items: ticketData.items,
      tableNumber: ticketData.tableNumber,
      customerName: ticketData.customerName,
      restaurantName: ticketData.restaurantName || 'RESTAURANTE',
      timestamp: new Date().toISOString(),
      total: ticketData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos timeout
    });
    
    console.log('✅ Datos enviados a Make.com:', response.status);
    return { success: true, status: response.status };
    
  } catch (error) {
    console.error('❌ Error enviando a Make.com:', error.message);
    return { success: false, error: error.message };
  }
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
    
    // Enviar a Make.com
    const result = await sendToMake({
      items,
      tableNumber,
      customerName,
      restaurantName
    });
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Ticket enviado a Make.com para impresión',
        status: result.status
      });
    } else {
      res.status(500).json({ 
        error: 'Error enviando a Make.com',
        details: result.error
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
    
    console.log('🧪 Enviando datos de prueba a Make.com...');
    
    const result = await sendToMake(testData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Datos de prueba enviados a Make.com',
        data: testData
      });
    } else {
      res.status(500).json({ 
        error: 'Error enviando datos de prueba',
        details: result.error
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
    makeWebhook: MAKE_WEBHOOK_URL ? 'Configurado' : 'No configurado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Make.com iniciado en puerto ${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /print-ticket - Imprimir ticket`);
  console.log(`   POST /test-print - Probar impresión`);
  console.log(`   GET /status - Estado del servidor`);
  console.log(`\n⚠️ IMPORTANTE: Configura tu webhook de Make.com en MAKE_WEBHOOK_URL`);
});

module.exports = app;


