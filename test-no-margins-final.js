// Script final para eliminar márgenes completamente
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar contenido sin formato (texto crudo)
function generateRawContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  let content = '';
  
  // Contenido completamente sin formato
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
    content += `${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR\n`;
  });
  
  content += `TOTAL: ${total.toFixed(2)} EUR\n`;
  content += `!GRACIAS!\n\n\n`;
  
  return content;
}

// Función para generar contenido con ancho mínimo (12 caracteres)
function generateMinimalContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho mínimo para forzar sin márgenes
  const maxWidth = 12;
  
  // Función para centrar texto
  const centerText = (text) => {
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  let content = '';
  
  // Encabezado centrado
  content += centerText(restaurantName) + '\n';
  content += '='.repeat(maxWidth) + '\n';
  
  // Información de mesa y cliente
  content += `MESA: ${tableNumber}`.padEnd(maxWidth) + '\n';
  if (customerName) {
    content += `CLIENTE: ${customerName}`.padEnd(maxWidth) + '\n';
  }
  content += `FECHA: ${timestamp}`.padEnd(maxWidth) + '\n';
  content += '-'.repeat(maxWidth) + '\n';
  
  // Título del pedido
  content += centerText('PEDIDO:') + '\n';
  
  // Items del pedido
  items.forEach(item => {
    const itemLine = `${item.quantity}x ${item.productName}`;
    content += itemLine.padEnd(maxWidth) + '\n';
    
    const priceLine = `${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR`;
    content += priceLine.padEnd(maxWidth) + '\n';
  });
  
  content += '-'.repeat(maxWidth) + '\n';
  
  // Total
  const totalLine = `TOTAL: ${total.toFixed(2)} EUR`;
  content += centerText(totalLine) + '\n';
  content += '\n';
  
  // Mensaje de agradecimiento
  content += centerText('!GRACIAS!') + '\n';
  content += '\n\n\n';
  
  return content;
}

async function testNoMarginsFinal() {
  try {
    console.log('🔍 Probando eliminación final de márgenes...');
    
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
    
    // Probar con texto completamente sin formato
    console.log('\n📋 Probando con texto completamente sin formato...');
    const contentRaw = generateRawContent(testItems, 'TEST', 'PRUEBA');
    const fileRaw = path.join(tempDir, `raw_text_${Date.now()}.txt`);
    fs.writeFileSync(fileRaw, contentRaw, 'utf8');
    console.log('📄 Contenido (texto crudo):');
    console.log(contentRaw);
    
    const printCommandRaw = `powershell -Command "Get-Content '${fileRaw}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommandRaw, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error con texto crudo:', error.message);
      } else {
        console.log('✅ Impresión con texto crudo ejecutada');
      }
      
      // Limpiar archivo
      setTimeout(() => {
        if (fs.existsSync(fileRaw)) {
          fs.unlinkSync(fileRaw);
        }
      }, 5000);
    });
    
    // Esperar un poco y probar con ancho mínimo
    setTimeout(() => {
      console.log('\n📋 Probando con ancho mínimo (12 caracteres)...');
      const contentMinimal = generateMinimalContent(testItems, 'TEST', 'PRUEBA');
      const fileMinimal = path.join(tempDir, `minimal_width_${Date.now()}.txt`);
      fs.writeFileSync(fileMinimal, contentMinimal, 'utf8');
      console.log('📄 Contenido (ancho 12):');
      console.log(contentMinimal);
      
      const printCommandMinimal = `powershell -Command "Get-Content '${fileMinimal}' | Out-Printer -Name 'POS-80C'"`;
      
      exec(printCommandMinimal, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error con ancho mínimo:', error.message);
        } else {
          console.log('✅ Impresión con ancho mínimo ejecutada');
        }
        
        // Limpiar archivo
        setTimeout(() => {
          if (fs.existsSync(fileMinimal)) {
            fs.unlinkSync(fileMinimal);
          }
        }, 5000);
      });
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error);
  }
}

// Ejecutar prueba
testNoMarginsFinal();


