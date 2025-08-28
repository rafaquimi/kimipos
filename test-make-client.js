const axios = require('axios');

// Configuración del servidor
const SERVER_URL = 'http://localhost:3000';

// Función para enviar ticket de prueba
async function sendTestTicket() {
  try {
    console.log('🧪 Enviando ticket de prueba al servidor...');
    
    const ticketData = {
      items: [
        { quantity: 1, productName: 'Sprite', unitPrice: 2.50, totalPrice: 2.50 },
        { quantity: 2, productName: 'Hamburguesa', unitPrice: 8.00, totalPrice: 16.00 },
        { quantity: 1, productName: 'Patatas Fritas', unitPrice: 3.50, totalPrice: 3.50 }
      ],
      tableNumber: '5',
      customerName: 'Juan Pérez',
      restaurantName: 'RESTAURANTE EL BUENO'
    };
    
    const response = await axios.post(`${SERVER_URL}/print-ticket`, ticketData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta del servidor:');
    console.log('- Status:', response.status);
    console.log('- Mensaje:', response.data.message);
    
    if (response.data.status) {
      console.log('- Status Make.com:', response.data.status);
    }
    
  } catch (error) {
    console.error('❌ Error enviando ticket:', error.message);
    
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    }
  }
}

// Función para probar endpoint de prueba
async function testPrintEndpoint() {
  try {
    console.log('🧪 Probando endpoint de prueba...');
    
    const response = await axios.post(`${SERVER_URL}/test-print`);
    
    console.log('✅ Respuesta del endpoint de prueba:');
    console.log('- Status:', response.status);
    console.log('- Mensaje:', response.data.message);
    
    if (response.data.data) {
      console.log('- Datos enviados:', response.data.data);
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint de prueba:', error.message);
    
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    }
  }
}

// Función para verificar estado del servidor
async function checkServerStatus() {
  try {
    console.log('🔍 Verificando estado del servidor...');
    
    const response = await axios.get(`${SERVER_URL}/status`);
    
    console.log('✅ Estado del servidor:');
    console.log('- Status:', response.data.status);
    console.log('- Timestamp:', response.data.timestamp);
    console.log('- Make Webhook:', response.data.makeWebhook);
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 El servidor no está ejecutándose. Ejecuta: node server-make.js');
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 Cliente de prueba para Make.com\n');
  
  // Verificar estado del servidor
  await checkServerStatus();
  console.log('');
  
  // Probar endpoint de prueba
  await testPrintEndpoint();
  console.log('');
  
  // Enviar ticket de prueba
  await sendTestTicket();
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  sendTestTicket,
  testPrintEndpoint,
  checkServerStatus
};


