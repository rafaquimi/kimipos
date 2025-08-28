// Script de prueba con ancho ultra reducido para eliminar márgenes
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar contenido con ancho ultra reducido
function generateUltraNarrowContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho ultra reducido para forzar sin márgenes
  const maxWidth = 16;
  
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
  content += centerText('!GRACIAS!') + '\n';
  content += '\n\n\n';
  
  return content;
}

// Función para generar contenido sin formato (solo texto)
function generatePlainContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  let content = '';
  
  // Contenido simple sin formato
  content += `${restaurantName}\n`;
  content += `MESA: ${tableNumber}\n`;
  if (customerName) {
    content += `CLIENTE: ${customerName}\n`;
  }
  content += `FECHA: ${timestamp}\n`;
  content += `PEDIDO:\n`;
  
  // Items del pedido
  items.forEach(item => {
    content += `${item.quantity}x ${item.productName}\n`;
    content += `   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR\n`;
  });
  
  content += `TOTAL: ${total.toFixed(2)} EUR\n`;
  content += `!GRACIAS!\n\n\n`;
  
  return content;
}

async function testUltraNarrow() {
  try {
    console.log('🔍 Probando ancho ultra reducido (16 caracteres)...');
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Probar con ancho ultra reducido
    console.log('\n📋 Probando con ancho 16 caracteres...');
    const content16 = generateUltraNarrowContent(testItems, 'TEST', 'PRUEBA');
    const file16 = path.join(tempDir, `ultra_narrow_${Date.now()}.txt`);
    fs.writeFileSync(file16, content16, 'utf8');
    console.log('📄 Contenido (16 chars):');
    console.log(content16);
    
    const printCommand16 = `powershell -Command "Get-Content '${file16}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommand16, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error con ancho 16:', error.message);
      } else {
        console.log('✅ Impresión con ancho 16 ejecutada');
      }
      
      // Limpiar archivo
      setTimeout(() => {
        if (fs.existsSync(file16)) {
          fs.unlinkSync(file16);
        }
      }, 5000);
    });
    
    // Esperar un poco y probar con texto plano sin formato
    setTimeout(() => {
      console.log('\n📋 Probando con texto plano sin formato...');
      const contentPlain = generatePlainContent(testItems, 'TEST', 'PRUEBA');
      const filePlain = path.join(tempDir, `plain_text_${Date.now()}.txt`);
      fs.writeFileSync(filePlain, contentPlain, 'utf8');
      console.log('📄 Contenido (texto plano):');
      console.log(contentPlain);
      
      const printCommandPlain = `powershell -Command "Get-Content '${filePlain}' | Out-Printer -Name 'POS-80C'"`;
      
      exec(printCommandPlain, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error con texto plano:', error.message);
        } else {
          console.log('✅ Impresión con texto plano ejecutada');
        }
        
        // Limpiar archivo
        setTimeout(() => {
          if (fs.existsSync(filePlain)) {
            fs.unlinkSync(filePlain);
          }
        }, 5000);
      });
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en prueba ultra narrow:', error);
  }
}

// Ejecutar prueba
testUltraNarrow();


