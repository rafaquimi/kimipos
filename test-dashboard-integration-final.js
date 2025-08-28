const http = require('http');

console.log('🖨️ PRUEBA FINAL - INTEGRACIÓN DASHBOARD → JAVA');
console.log('='.repeat(60));
console.log();

// Función que simula exactamente lo que hace el dashboard
function enviarDesdeDashboard(datos) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(datos);
    
    const options = {
      hostname: 'localhost',
      port: 3002, // Servicio Java
      method: 'POST',
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

// Datos que simulan el pedido actual del dashboard (Dr Pepper y Mountain Dew)
const datosPedidoActual = {
  items: [
    {
      quantity: 1,
      productName: "Dr Pepper",
      unitPrice: 30.00,
      totalPrice: 30.00
    },
    {
      quantity: 1,
      productName: "Mountain Dew",
      unitPrice: 28.00,
      totalPrice: 28.00
    }
  ],
  tableNumber: "Mesa 7",
  customerName: "Cliente General",
  restaurantName: "RESTAURANTE EL BUENO"
};

async function probarIntegracionFinal() {
  console.log('📋 PASO 1: Simulando pedido del dashboard...');
  console.log('   Mesa:', datosPedidoActual.tableNumber);
  console.log('   Cliente:', datosPedidoActual.customerName);
  console.log('   Items:', datosPedidoActual.items.length);
  console.log('   - Dr Pepper: 1x €30.00');
  console.log('   - Mountain Dew: 1x €28.00');
  console.log('   Total: €58.00');
  console.log();

  console.log('📡 PASO 2: Enviando desde dashboard al servicio Java...');
  console.log('   Puerto: 3002 (FinalPrinterService)');
  console.log();

  try {
    console.log('⏳ Enviando solicitud...');
    const resultado = await enviarDesdeDashboard(datosPedidoActual);
    
    console.log('📥 PASO 3: Respuesta del servicio Java:');
    console.log('   Success:', resultado.success);
    console.log('   Message:', resultado.message);
    console.log('   Method:', resultado.method || 'N/A');
    console.log();

    if (resultado.success) {
      console.log('🎉 ¡INTEGRACIÓN EXITOSA!');
      console.log();
      console.log('✅ VERIFICACIONES:');
      console.log('   1. ¿Se imprimió el ticket en la impresora POS-80C?');
      console.log('   2. ¿El formato es correcto (48 caracteres de ancho)?');
      console.log('   3. ¿Los datos son correctos (Dr Pepper y Mountain Dew)?');
      console.log('   4. ¿Aparece "Mesa 7" en el ticket?');
      console.log();
      console.log('💡 Si todo está bien, ¡la integración está funcionando perfectamente!');
      console.log('🚀 Ahora puedes probar el botón "Imprimir Térmica" en tu dashboard.');
    } else {
      console.log('❌ Error en la integración:');
      console.log('   ', resultado.message);
    }

  } catch (error) {
    console.log('❌ Error de conexión:');
    console.log('   ', error.message);
    console.log();
    console.log('🔧 Verifica que:');
    console.log('   1. El servicio Java esté ejecutándose en puerto 3002');
    console.log('   2. No haya otro proceso usando el puerto 3002');
  }

  console.log('='.repeat(60));
  console.log('🏁 Prueba de integración completada');
}

// Ejecutar la prueba
probarIntegracionFinal();
