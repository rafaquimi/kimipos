const http = require('http');

console.log('🖨️ PRUEBA COMPLETA: Dashboard → Servidor → Java');
console.log('='.repeat(60));
console.log();

// Función que simula el dashboard enviando al servidor principal
function enviarDesdeDashboard(datos) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(datos);
    
    const options = {
      hostname: 'localhost',
      port: 3000, // Servidor principal
      method: 'POST',
      path: '/print-ticket', // Endpoint del servidor principal
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonStart = responseData.indexOf('{');
          const jsonEnd = responseData.lastIndexOf('}') + 1;
          const jsonResponse = responseData.substring(jsonStart, jsonEnd);
          const result = JSON.parse(jsonResponse);
          resolve(result);
        } catch (error) {
          resolve({ success: false, message: 'Error parsing response', raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Datos de prueba que simulan un pedido del dashboard
const datosPrueba = {
  items: [
    {
      quantity: 2,
      productName: "Hamburguesa Clásica",
      unitPrice: 12.50,
      totalPrice: 25.00
    },
    {
      quantity: 1,
      productName: "Coca Cola 330ml",
      unitPrice: 2.50,
      totalPrice: 2.50
    },
    {
      quantity: 1,
      productName: "Patatas Fritas",
      unitPrice: 4.00,
      totalPrice: 4.00
    }
  ],
  tableNumber: "MESA-12",
  customerName: "MARÍA GARCÍA",
  restaurantName: "RESTAURANTE EL BUENO"
};

async function probarFlujoCompleto() {
  console.log('📋 PASO 1: Preparando datos del dashboard...');
  console.log('   Mesa:', datosPrueba.tableNumber);
  console.log('   Cliente:', datosPrueba.customerName);
  console.log('   Items:', datosPrueba.items.length);
  console.log('   Total:', datosPrueba.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2), 'EUR');
  console.log();

  console.log('📡 PASO 2: Enviando desde dashboard al servidor principal...');
  console.log('   Puerto: 3000 (servidor principal)');
  console.log('   Endpoint: /print-ticket');
  console.log();

  try {
    console.log('⏳ Enviando solicitud...');
    const resultado = await enviarDesdeDashboard(datosPrueba);
    
    console.log('📥 PASO 3: Respuesta del servidor principal:');
    console.log('   Success:', resultado.success);
    console.log('   Message:', resultado.message);
    if (resultado.method) {
      console.log('   Method:', resultado.method);
    }
    console.log();

    if (resultado.success) {
      console.log('🎉 ¡IMPRESIÓN EXITOSA!');
      console.log();
      console.log('✅ VERIFICACIONES:');
      console.log('   1. ¿Se imprimió el ticket en la impresora POS-80C?');
      console.log('   2. ¿El formato es correcto (48 caracteres de ancho)?');
      console.log('   3. ¿Se realizó el corte automático?');
      console.log('   4. ¿Los datos son correctos?');
      console.log();
      console.log('💡 Si todo está bien, ¡tu sistema está funcionando perfectamente!');
    } else {
      console.log('❌ Error en la impresión:');
      console.log('   ', resultado.message);
    }

  } catch (error) {
    console.log('❌ Error de conexión:');
    console.log('   ', error.message);
    console.log();
    console.log('🔧 Verifica que:');
    console.log('   1. El servidor principal esté ejecutándose en puerto 3000');
    console.log('   2. El servicio Java esté ejecutándose en puerto 3002');
  }

  console.log('='.repeat(60));
  console.log('🏁 Prueba completada');
}

// Ejecutar la prueba
probarFlujoCompleto();
