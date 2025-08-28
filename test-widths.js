const axios = require('axios');

// Configuración del servidor
const SERVER_URL = 'http://localhost:3000';

// Función para generar contenido con ancho específico
function generateContentWithWidth(maxWidth) {
  const timestamp = new Date().toLocaleString('es-ES');
  
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
  content += centerText('RESTAURANTE TEST') + '\n';
  content += separatorLine() + '\n';
  
  // Información de prueba
  content += `ANCHO: ${maxWidth} caracteres`.padEnd(maxWidth) + '\n';
  content += `MESA: TEST`.padEnd(maxWidth) + '\n';
  content += `FECHA: ${timestamp}`.padEnd(maxWidth) + '\n';
  content += dividerLine() + '\n';
  
  // Título del pedido
  content += centerText('PEDIDO DE PRUEBA:') + '\n';
  
  // Items de prueba
  content += `1x Sprite`.padEnd(maxWidth) + '\n';
  content += `   2.50 EUR x 1 = 2.50 EUR`.padEnd(maxWidth) + '\n';
  content += `2x Hamburguesa`.padEnd(maxWidth) + '\n';
  content += `   8.00 EUR x 2 = 16.00 EUR`.padEnd(maxWidth) + '\n';
  
  content += dividerLine() + '\n';
  
  // Total
  const totalLine = `TOTAL: 18.50 EUR`;
  content += centerText(totalLine) + '\n';
  content += '\n';
  
  // Mensaje de agradecimiento
  content += centerText('¡GRACIAS!') + '\n';
  content += '\n\n\n';
  
  return content;
}

// Función para probar un ancho específico
async function testWidth(width) {
  try {
    console.log(`\n🧪 Probando ancho: ${width} caracteres`);
    
    const ticketData = {
      items: [
        { quantity: 1, productName: 'Sprite', unitPrice: 2.50, totalPrice: 2.50 },
        { quantity: 2, productName: 'Hamburguesa', unitPrice: 8.00, totalPrice: 16.00 }
      ],
      tableNumber: `ANCHO-${width}`,
      customerName: 'PRUEBA',
      restaurantName: 'RESTAURANTE TEST'
    };
    
    const response = await axios.post(`${SERVER_URL}/print-ticket`, ticketData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Ancho ${width}: Impreso exitosamente`);
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Mensaje: ${response.data.message}`);
    
    return { success: true, width };
    
  } catch (error) {
    console.log(`❌ Ancho ${width}: Error`);
    console.log(`   - Error: ${error.message}`);
    return { success: false, width, error: error.message };
  }
}

// Función para mostrar el contenido generado
function showGeneratedContent(width) {
  console.log(`\n📄 Contenido generado para ancho ${width}:`);
  console.log('─'.repeat(width + 10));
  console.log(generateContentWithWidth(width));
  console.log('─'.repeat(width + 10));
}

// Función principal
async function main() {
  console.log('🔍 Probando diferentes anchos para impresora POS-80C\n');
  
  // Anchos a probar (de menor a mayor)
  const widths = [32, 40, 48, 56, 64, 72, 80];
  
  console.log('📋 Anchos que se van a probar:', widths.join(', '));
  console.log('\n💡 Después de cada impresión, revisa el resultado en la impresora');
  console.log('💡 El ancho óptimo debería ocupar todo el ancho del papel sin cortar texto\n');
  
  const results = [];
  
  for (const width of widths) {
    // Mostrar contenido que se va a imprimir
    showGeneratedContent(width);
    
    // Preguntar si continuar
    console.log(`\n¿Imprimir con ancho ${width}? (s/n): `);
    
    // En una implementación real, aquí habría una pausa para que el usuario decida
    // Por ahora, continuamos automáticamente
    console.log('Continuando automáticamente...\n');
    
    const result = await testWidth(width);
    results.push(result);
    
    // Pausa entre impresiones
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Resumen de resultados
  console.log('\n📊 Resumen de resultados:');
  console.log('─'.repeat(50));
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ Ancho ${result.width}: EXITOSO`);
    } else {
      console.log(`❌ Ancho ${result.width}: FALLÓ - ${result.error}`);
    }
  });
  
  console.log('\n💡 Recomendación:');
  console.log('- El ancho óptimo es el más grande que imprima correctamente');
  console.log('- Para impresora térmica 80mm, típicamente es entre 48-56 caracteres');
  console.log('- Si el texto se corta, reduce el ancho');
  console.log('- Si hay mucho margen, aumenta el ancho');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  testWidth,
  generateContentWithWidth,
  showGeneratedContent
};


