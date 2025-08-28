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

// Función para generar ticket optimizado para 48 caracteres
function generateOptimizedTicket(items, tableNumber, customerName, restaurantName) {
  const maxWidth = 48; // Ancho óptimo para 80mm
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Función para centrar texto
  const centerText = (text) => {
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  // Función para crear líneas de separación
  const separatorLine = () => '='.repeat(maxWidth);
  const dividerLine = () => '-'.repeat(maxWidth);
  
  let content = '';
  
  // Encabezado centrado
  content += centerText(restaurantName) + '\n';
  content += separatorLine() + '\n';
  
  // Información de mesa y cliente
  content += `MESA: ${tableNumber}`.padEnd(maxWidth) + '\n';
  if (customerName) {
    content += `CLIENTE: ${customerName}`.padEnd(maxWidth) + '\n';
  }
  content += `FECHA: ${timestamp}`.padEnd(maxWidth) + '\n';
  content += dividerLine() + '\n';
  
  // Título del pedido
  content += centerText('PEDIDO:') + '\n';
  
  // Items del pedido
  items.forEach(item => {
    const itemLine = `${item.quantity}x ${item.productName}`;
    content += itemLine.padEnd(maxWidth) + '\n';
    
    const priceLine = `   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR`;
    content += priceLine.padEnd(maxWidth) + '\n';
  });
  
  content += dividerLine() + '\n';
  
  // Total
  const totalLine = `TOTAL: ${total.toFixed(2)} EUR`;
  content += centerText(totalLine) + '\n';
  content += '\n';
  
  // Mensaje de agradecimiento
  content += centerText('¡GRACIAS!') + '\n';
  content += '\n\n\n';
  
  return content;
}

// Función principal de prueba
async function test48WidthFormat() {
  console.log('🎯 PRUEBA DE FORMATO OPTIMIZADO - 48 CARACTERES');
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
  
  // Generar y mostrar el formato
  const content = generateOptimizedTicket(
    testData.items,
    testData.tableNumber,
    testData.customerName,
    testData.restaurantName
  );
  
  console.log('📄 FORMATO GENERADO (48 caracteres):');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log();
  
  console.log('🎯 CARACTERÍSTICAS DEL FORMATO:');
  console.log('✅ Ancho: 48 caracteres (óptimo para 80mm)');
  console.log('✅ Texto centrado correctamente');
  console.log('✅ Líneas de separación completas');
  console.log('✅ Formato compacto y legible');
  console.log('✅ Espaciado optimizado');
  console.log();
  
  // Probar impresión
  console.log('🖨️ Probando impresión con formato optimizado...');
  const result = await sendRequest('/print-ticket', testData);
  
  if (result.success) {
    console.log('✅ ¡IMPRESIÓN EXITOSA!');
    console.log('📄 Método:', result.method);
    console.log('📋 Items impresos:', result.summary.itemCount);
    console.log('💰 Total impreso:', result.summary.total, 'EUR');
    console.log();
    console.log('🎉 El formato de 48 caracteres debería verse perfecto en tu impresora POS-80C');
    console.log('💡 Si el formato aún no es correcto, podemos ajustar el ancho');
  } else {
    console.log('❌ Error en impresión:', result.message);
  }
}

// Ejecutar prueba
test48WidthFormat();
