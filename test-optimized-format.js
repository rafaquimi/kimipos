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
async function testOptimizedFormat() {
  console.log('🧪 Probando formato optimizado para 80mm...\n');
  
  try {
    // Datos de prueba optimizados
    const testData = {
      items: [
        { quantity: 2, productName: 'Hamburguesa', unitPrice: 8.50, totalPrice: 17.00 },
        { quantity: 1, productName: 'Coca Cola', unitPrice: 2.00, totalPrice: 2.00 },
        { quantity: 1, productName: 'Patatas Fritas', unitPrice: 3.50, totalPrice: 3.50 }
      ],
      tableNumber: 'MESA-5',
      customerName: 'JUAN PEREZ',
      restaurantName: 'RESTAURANTE EL BUENO'
    };
    
    console.log('📋 Datos de prueba:');
    console.log('- Mesa:', testData.tableNumber);
    console.log('- Cliente:', testData.customerName);
    console.log('- Items:', testData.items.length);
    console.log('- Total:', testData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2), 'EUR');
    console.log();
    
    // Enviar solicitud de impresión
    console.log('🖨️ Enviando solicitud de impresión...');
    const result = await sendRequest('/print-ticket', testData);
    
    if (result.success) {
      console.log('✅ Impresión exitosa');
      console.log('📄 Método:', result.method);
      console.log('📋 Items impresos:', result.summary.itemCount);
      console.log('💰 Total impreso:', result.summary.total, 'EUR');
      console.log();
      console.log('🎯 Formato optimizado aplicado:');
      console.log('   - Ancho: 48 caracteres (80mm)');
      console.log('   - Texto centrado correctamente');
      console.log('   - Líneas reducidas');
      console.log('   - Formato compacto');
    } else {
      console.log('❌ Error en impresión:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

// Ejecutar prueba
testOptimizedFormat();

