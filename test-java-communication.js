const http = require('http');

// Función para enviar solicitud al servidor Java
function sendToJavaService(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3002,
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
          // Extraer solo el JSON de la respuesta HTTP
          const jsonStart = responseData.indexOf('{');
          const jsonEnd = responseData.lastIndexOf('}') + 1;
          const jsonResponse = responseData.substring(jsonStart, jsonEnd);
          
          const response = JSON.parse(jsonResponse);
          resolve(response);
        } catch (error) {
          resolve({ raw: responseData, error: error.message });
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

// Función principal de prueba
async function testJavaCommunication() {
  console.log('🧪 PRUEBA DE COMUNICACIÓN CON SERVICIO JAVA');
  console.log('='.repeat(60));
  console.log();
  
  const testData = {
    items: [
      { quantity: 2, productName: 'Hamburguesa Clásica', unitPrice: 12.50, totalPrice: 25.00 },
      { quantity: 1, productName: 'Coca Cola 330ml', unitPrice: 2.50, totalPrice: 2.50 },
      { quantity: 1, productName: 'Patatas Fritas', unitPrice: 4.00, totalPrice: 4.00 },
      { quantity: 1, productName: 'Ensalada César', unitPrice: 8.00, totalPrice: 8.00 }
    ],
    tableNumber: 'MESA-12',
    customerName: 'MARÍA GARCÍA',
    restaurantName: 'RESTAURANTE EL BUENO'
  };
  
  console.log('📋 Datos de prueba:');
  console.log('- Mesa:', testData.tableNumber);
  console.log('- Cliente:', testData.customerName);
  console.log('- Items:', testData.items.length);
  console.log('- Total:', testData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2), 'EUR');
  console.log();
  
  try {
    console.log('📡 Enviando datos al servicio Java (puerto 3002)...');
    const result = await sendToJavaService(testData);
    
    console.log('📥 Respuesta del servicio Java:');
    console.log('- Success:', result.success);
    console.log('- Message:', result.message);
    if (result.method) {
      console.log('- Method:', result.method);
    }
    console.log();
    
    if (result.success) {
      console.log('✅ ¡COMUNICACIÓN EXITOSA!');
      console.log('🎯 El servicio Java procesó correctamente los datos');
      console.log('🖨️ Método de impresión usado:', result.method);
      console.log();
      console.log('💡 Verifica que:');
      console.log('   1. Se imprimió el ticket en la impresora POS-80C');
      console.log('   2. El formato es correcto (48 caracteres)');
      console.log('   3. Se realizó el corte automático');
    } else {
      console.log('❌ Error en el servicio Java:');
      console.log('   - Mensaje:', result.message);
      console.log();
      console.log('🔧 Solución de problemas:');
      console.log('   1. Verifica que el servicio Java esté ejecutándose');
      console.log('   2. Verifica que la impresora POS-80C esté conectada');
      console.log('   3. Revisa los logs del servicio Java');
    }
    
  } catch (error) {
    console.log('❌ Error de comunicación:');
    if (error.code === 'ECONNREFUSED') {
      console.log('   No se puede conectar al servicio Java en puerto 3002');
      console.log('   Verifica que el servicio Java esté ejecutándose');
      console.log();
      console.log('💡 Para iniciar el servicio Java:');
      console.log('   1. Ejecuta: compile-and-run-java.bat');
      console.log('   2. O compila manualmente: javac PrinterServiceDev.java');
      console.log('   3. Y ejecuta: java PrinterServiceDev');
    } else {
      console.log('   Error:', error.message);
    }
  }
}

// Ejecutar prueba
testJavaCommunication();
