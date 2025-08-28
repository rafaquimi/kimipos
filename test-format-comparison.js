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

// Función para generar ticket con ancho específico
function generateTicketWithWidth(items, tableNumber, customerName, restaurantName, maxWidth) {
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
async function testFormatComparison() {
  console.log('🧪 PRUEBA DE COMPARACIÓN DE FORMATOS');
  console.log('='.repeat(50));
  console.log();
  
  const testData = {
    items: [
      { quantity: 2, productName: 'Hamburguesa Clásica', unitPrice: 12.50, totalPrice: 25.00 },
      { quantity: 1, productName: 'Coca Cola 330ml', unitPrice: 2.50, totalPrice: 2.50 },
      { quantity: 1, productName: 'Patatas Fritas', unitPrice: 4.00, totalPrice: 4.00 }
    ],
    tableNumber: 'MESA-12',
    customerName: 'MARÍA GARCÍA',
    restaurantName: 'RESTAURANTE EL BUENO'
  };
  
  // Diferentes anchos a probar
  const widths = [32, 40, 48, 56, 64];
  
  for (let i = 0; i < widths.length; i++) {
    const width = widths[i];
    console.log(`📏 PRUEBA ${i + 1}: Ancho ${width} caracteres`);
    console.log('-'.repeat(30));
    
    // Generar contenido con el ancho específico
    const content = generateTicketWithWidth(
      testData.items,
      testData.tableNumber,
      testData.customerName,
      testData.restaurantName,
      width
    );
    
    // Mostrar preview del formato
    console.log('📄 PREVIEW DEL FORMATO:');
    console.log(content);
    console.log();
    
    // Preguntar si imprimir esta versión
    console.log(`¿Quieres imprimir esta versión con ancho ${width}? (s/n)`);
    console.log('(Presiona Enter para continuar con la siguiente prueba)');
    console.log();
  }
  
  console.log('🎯 RECOMENDACIONES:');
  console.log('- 32 caracteres: Muy estrecho, puede cortar texto');
  console.log('- 40 caracteres: Estrecho, pero funcional');
  console.log('- 48 caracteres: ÓPTIMO para 80mm (recomendado)');
  console.log('- 56 caracteres: Ancho, puede desbordar');
  console.log('- 64 caracteres: Muy ancho, probablemente se corte');
  console.log();
  console.log('💡 Para una impresora térmica de 80mm, se recomienda 48 caracteres');
}

// Ejecutar prueba
testFormatComparison();
