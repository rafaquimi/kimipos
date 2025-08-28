const http = require('http');

console.log('🖨️ PRUEBA DE IMPRESIÓN - KIMIPOS');
console.log('='.repeat(50));
console.log();

// Función para enviar datos al servicio Java
function enviarAImpresora(datos) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(datos);
    
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
async function probarImpresion() {
  console.log('📋 PASO 1: Preparando datos de prueba...');
  
  const datosPrueba = {
    items: [
      { quantity: 2, productName: 'Hamburguesa Clásica', unitPrice: 12.50, totalPrice: 25.00 },
      { quantity: 1, productName: 'Coca Cola 330ml', unitPrice: 2.50, totalPrice: 2.50 },
      { quantity: 1, productName: 'Patatas Fritas', unitPrice: 4.00, totalPrice: 4.00 }
    ],
    tableNumber: 'MESA-12',
    customerName: 'MARÍA GARCÍA',
    restaurantName: 'RESTAURANTE EL BUENO'
  };
  
  console.log('✅ Datos preparados:');
  console.log(`   Mesa: ${datosPrueba.tableNumber}`);
  console.log(`   Cliente: ${datosPrueba.customerName}`);
  console.log(`   Items: ${datosPrueba.items.length}`);
  console.log(`   Total: ${datosPrueba.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} EUR`);
  console.log();
  
  console.log('📡 PASO 2: Enviando datos al servicio Java...');
  console.log('   Puerto: 3002');
  console.log('   Método: POST');
  console.log();
  
  try {
    console.log('⏳ Enviando solicitud...');
    const resultado = await enviarAImpresora(datosPrueba);
    
    console.log('📥 PASO 3: Respuesta recibida:');
    console.log(`   Success: ${resultado.success}`);
    console.log(`   Message: ${resultado.message}`);
    if (resultado.method) {
      console.log(`   Method: ${resultado.method}`);
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
      console.log('❌ ERROR EN IMPRESIÓN:');
      console.log(`   ${resultado.message}`);
      console.log();
      console.log('🔧 SOLUCIÓN DE PROBLEMAS:');
      console.log('   1. Verifica que la impresora POS-80C esté conectada');
      console.log('   2. Verifica que sea la impresora predeterminada');
      console.log('   3. Revisa los logs del servicio Java');
      console.log('   4. Verifica que haya papel en la impresora');
    }
    
  } catch (error) {
    console.log('❌ ERROR DE COMUNICACIÓN:');
    if (error.code === 'ECONNREFUSED') {
      console.log('   No se puede conectar al servicio Java en puerto 3002');
      console.log('   Verifica que el servicio esté ejecutándose');
      console.log();
      console.log('💡 Para iniciar el servicio Java:');
      console.log('   1. Ejecuta: .\\compile-and-run-java.bat');
      console.log('   2. O compila manualmente: javac PrinterServiceDev.java');
      console.log('   3. Y ejecuta: java PrinterServiceDev');
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log();
  console.log('='.repeat(50));
  console.log('🏁 Prueba completada');
}

// Ejecutar la prueba
probarImpresion();
