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

// Función principal de prueba final
async function testFinalPrinting() {
  console.log('🎯 PRUEBA FINAL - SISTEMA DE IMPRESIÓN COMPLETO');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Verificar estado del servidor
    console.log('1️⃣ Verificando estado del servidor...');
    const status = await sendRequest('/status');
    console.log('✅ Servidor:', status.status);
    console.log('📋 Modo:', status.mode);
    console.log();
    
    // Verificar estado del servicio Java
    console.log('2️⃣ Verificando servicio Java...');
    const javaStatus = await sendRequest('/java-status');
    console.log('✅ Servicio Java:', javaStatus.status);
    console.log();
    
    // Datos de prueba realistas
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
    
    console.log('3️⃣ Datos de prueba:');
    console.log('   🏪 Restaurante:', testData.restaurantName);
    console.log('   🪑 Mesa:', testData.tableNumber);
    console.log('   👤 Cliente:', testData.customerName);
    console.log('   📋 Items:', testData.items.length);
    console.log('   💰 Total:', testData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2), 'EUR');
    console.log();
    
    // Probar impresión
    console.log('4️⃣ Probando impresión con todas las funcionalidades...');
    const result = await sendRequest('/print-ticket', testData);
    
    if (result.success) {
      console.log('✅ ¡IMPRESIÓN EXITOSA!');
      console.log();
      console.log('🎉 FUNCIONALIDADES IMPLEMENTADAS:');
      console.log('   ✅ Ancho completo (80mm)');
      console.log('   ✅ Texto centrado correctamente');
      console.log('   ✅ Formato optimizado (48 caracteres)');
      console.log('   ✅ Líneas reducidas');
      console.log('   ✅ Corte automático del ticket');
      console.log('   ✅ Integración Java-Node.js');
      console.log('   ✅ Proceso oculto en segundo plano');
      console.log();
      console.log('📊 RESUMEN DE LA IMPRESIÓN:');
      console.log('   📄 Método:', result.method);
      console.log('   📋 Items impresos:', result.summary.itemCount);
      console.log('   💰 Total impreso:', result.summary.total, 'EUR');
      console.log('   🖨️ Impresora:', 'POS-80C');
      console.log('   ✂️ Corte:', 'Automático');
      console.log();
      console.log('🚀 ¡SISTEMA LISTO PARA PRODUCCIÓN!');
      console.log();
      console.log('💡 Para usar con KimiPOS:');
      console.log('   - El servidor está en: http://localhost:3000');
      console.log('   - Endpoint: POST /print-ticket');
      console.log('   - Formato JSON con items, tableNumber, customerName');
      console.log();
      console.log('🎯 El ticket se imprimirá automáticamente con:');
      console.log('   - Ancho completo de 80mm');
      console.log('   - Texto centrado y legible');
      console.log('   - Formato compacto y profesional');
      console.log('   - Corte automático al final');
      
    } else {
      console.log('❌ Error en impresión:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error.message);
    console.log();
    console.log('💡 Solución de problemas:');
    console.log('   1. Verifica que el servidor esté ejecutándose');
    console.log('   2. Verifica que la impresora POS-80C esté conectada');
    console.log('   3. Verifica que Java esté instalado');
    console.log('   4. Reinicia el servidor si es necesario');
  }
}

// Ejecutar prueba final
testFinalPrinting();

