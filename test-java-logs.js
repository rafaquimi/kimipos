const http = require('http');

console.log('🔍 DIAGNÓSTICO: Verificando logs del servicio Java');
console.log('='.repeat(60));
console.log();

// Función para enviar datos directamente al servicio Java
function enviarDirectoAJava(datos) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(datos);
    
    const options = {
      hostname: 'localhost',
      port: 3002, // Servicio Java directamente
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
      quantity: 1,
      productName: "TEST IMPRESIÓN",
      unitPrice: 10.00,
      totalPrice: 10.00
    }
  ],
  tableNumber: "TEST-01",
  customerName: "PRUEBA",
  restaurantName: "RESTAURANTE EL BUENO"
};

async function diagnosticarJava() {
  console.log('📋 PASO 1: Enviando datos de prueba al servicio Java...');
  console.log('   Puerto: 3002 (servicio Java)');
  console.log('   Datos:', JSON.stringify(datosPrueba, null, 2));
  console.log();

  try {
    console.log('⏳ Enviando solicitud...');
    const resultado = await enviarDirectoAJava(datosPrueba);
    
    console.log('📥 PASO 2: Respuesta del servicio Java:');
    console.log('   Success:', resultado.success);
    console.log('   Message:', resultado.message);
    console.log('   Method:', resultado.method || 'N/A');
    console.log();

    if (resultado.success) {
      console.log('✅ Servicio Java reporta éxito');
      console.log('🔍 Verifica en la ventana del servicio Java:');
      console.log('   1. ¿Aparecen los logs de conexión?');
      console.log('   2. ¿Se procesaron los datos JSON?');
      console.log('   3. ¿Se intentó la impresión?');
      console.log('   4. ¿Qué método se usó?');
    } else {
      console.log('❌ Servicio Java reporta error:');
      console.log('   ', resultado.message);
    }

  } catch (error) {
    console.log('❌ Error de conexión con Java:');
    console.log('   ', error.message);
  }

  console.log('='.repeat(60));
  console.log('🏁 Diagnóstico completado');
}

// Ejecutar diagnóstico
diagnosticarJava();
