const http = require('http');

console.log('🖨️ PRUEBA - APLICACIÓN JAVA FUNCIONANDO');
console.log('='.repeat(60));
console.log();

// Función para enviar datos al servicio Java que funciona
function enviarAJavaFuncionando(datos) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(datos);
    
    const options = {
      hostname: 'localhost',
      port: 3002, // Puerto del servicio Java
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

// Datos de prueba
const datosPrueba = {
  items: [
    {
      quantity: 2,
      productName: "Hamburguesa Clasica",
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
  customerName: "MARIA GARCIA",
  restaurantName: "RESTAURANTE EL BUENO"
};

async function probarAplicacionJava() {
  console.log('📋 PASO 1: Preparando datos de prueba...');
  console.log('   Mesa:', datosPrueba.tableNumber);
  console.log('   Cliente:', datosPrueba.customerName);
  console.log('   Items:', datosPrueba.items.length);
  console.log('   Total:', datosPrueba.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2), 'EUR');
  console.log();

  console.log('📡 PASO 2: Enviando datos al servicio Java...');
  console.log('   Puerto: 3002 (WorkingPrinterService)');
  console.log();

  try {
    console.log('⏳ Enviando solicitud...');
    const resultado = await enviarAJavaFuncionando(datosPrueba);
    
    console.log('📥 PASO 3: Respuesta del servicio Java:');
    console.log('   Success:', resultado.success);
    console.log('   Message:', resultado.message);
    console.log('   Method:', resultado.method || 'N/A');
    console.log();

    if (resultado.success) {
      console.log('🎉 ¡IMPRESIÓN EXITOSA!');
      console.log();
      console.log('✅ VERIFICACIONES:');
      console.log('   1. ¿Se imprimió el ticket en la impresora POS-80C?');
      console.log('   2. ¿El formato es correcto (48 caracteres de ancho)?');
      console.log('   3. ¿Los datos son correctos?');
      console.log();
      console.log('💡 Si todo está bien, ¡tu aplicación Java está funcionando perfectamente!');
    } else {
      console.log('❌ Error en la impresión:');
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
  console.log('🏁 Prueba completada');
}

// Ejecutar la prueba
probarAplicacionJava();
