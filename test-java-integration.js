const http = require('http');

// Función para enviar solicitud al servidor
function sendRequest(endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      method: data ? 'POST' : 'GET',
      path: endpoint,
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
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

// Función principal de prueba
async function runTests() {
  console.log('🧪 Iniciando pruebas de integración Java-Node.js...\n');
  
  try {
    // 1. Verificar estado del servidor
    console.log('1️⃣ Verificando estado del servidor...');
    const status = await sendRequest('/status');
    console.log('✅ Estado del servidor:', status.status);
    console.log('📋 Modo:', status.mode);
    console.log();
    
    // 2. Verificar configuración
    console.log('2️⃣ Verificando configuración...');
    const config = await sendRequest('/config');
    console.log('✅ Configuración cargada');
    console.log('🖨️ Impresora:', config.config.restaurantName);
    console.log('📡 Puerto Java:', config.config.javaServicePort);
    console.log();
    
    // 3. Verificar estado del servicio Java
    console.log('3️⃣ Verificando estado del servicio Java...');
    const javaStatus = await sendRequest('/java-status');
    console.log('✅ Estado Java:', javaStatus.status);
    if (javaStatus.status === 'connected') {
      console.log('🟢 Servicio Java conectado');
    } else {
      console.log('🔴 Servicio Java desconectado');
      console.log('💡 Asegúrate de que el servicio Java esté ejecutándose');
    }
    console.log();
    
    // 4. Probar impresión
    console.log('4️⃣ Probando impresión...');
    const testData = {
      items: [
        { quantity: 1, productName: 'Sprite', unitPrice: 2.50, totalPrice: 2.50 },
        { quantity: 2, productName: 'Hamburguesa', unitPrice: 8.00, totalPrice: 16.00 },
        { quantity: 1, productName: 'Patatas Fritas', unitPrice: 3.50, totalPrice: 3.50 }
      ],
      tableNumber: 'TEST-INTEGRATION',
      customerName: 'PRUEBA INTEGRACIÓN',
      restaurantName: 'RESTAURANTE TEST'
    };
    
    const printResult = await sendRequest('/test-print', testData);
    console.log('✅ Resultado de impresión:', printResult.success ? 'ÉXITO' : 'ERROR');
    if (printResult.success) {
      console.log('📄 Método usado:', printResult.method);
      console.log('📋 Items impresos:', printResult.data.items.length);
      console.log('💰 Total:', printResult.data.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2), 'EUR');
    } else {
      console.log('❌ Error:', printResult.message);
    }
    console.log();
    
    // 5. Resumen final
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Servidor Node.js: ${status.status === 'running' ? 'FUNCIONANDO' : 'ERROR'}`);
    console.log(`✅ Servicio Java: ${javaStatus.status === 'connected' ? 'CONECTADO' : 'DESCONECTADO'}`);
    console.log(`✅ Impresión: ${printResult.success ? 'EXITOSA' : 'FALLIDA'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (javaStatus.status === 'connected' && printResult.success) {
      console.log('\n🎉 ¡Todas las pruebas pasaron! La integración está funcionando correctamente.');
    } else {
      console.log('\n⚠️ Algunas pruebas fallaron. Revisa los errores anteriores.');
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. El servidor Node.js esté ejecutándose en puerto 3000');
    console.log('   2. El servicio Java esté ejecutándose en puerto 3002');
    console.log('   3. La impresora POS-80C esté conectada y configurada');
  }
}

// Ejecutar pruebas
runTests();

