// Script para probar impresión con texto plano usando todo el ancho
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar contenido de texto plano usando todo el ancho
function generateFullWidthText(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho máximo para impresora térmica 80mm (aproximadamente 48-56 caracteres)
  const maxWidth = 56;
  
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

// Función para imprimir texto plano
async function printTextFile(filePath) {
  return new Promise((resolve, reject) => {
    // Usar PowerShell Out-Printer con la impresora específica
    const printCommand = `powershell -Command "Get-Content '${filePath}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error con PowerShell:', error.message);
        reject(error);
      } else {
        console.log('✅ Impresión con PowerShell ejecutada');
        resolve(true);
      }
    });
  });
}

async function testTextFullWidth() {
  try {
    console.log('🔍 Probando texto plano con ancho completo (56 caracteres)...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido de texto
    console.log('\n📋 Generando contenido de texto con ancho completo...');
    const textContent = generateFullWidthText(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Contenido generado');
    
    // Mostrar el contenido generado
    console.log('\n📄 Contenido generado:');
    console.log(textContent);
    
    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Crear archivo de texto
    const textPath = path.join(tempDir, `full_width_text_${Date.now()}.txt`);
    fs.writeFileSync(textPath, textContent, 'utf8');
    console.log('\n📄 Archivo de texto creado:', textPath);
    
    // Imprimir archivo
    console.log('\n🖨️ Imprimiendo archivo de texto...');
    try {
      await printTextFile(textPath);
      console.log('✅ Comando de impresión ejecutado');
    } catch (printError) {
      console.error('❌ Error imprimiendo archivo:', printError.message);
    }
    
    // Limpiar archivo después de un delay
    setTimeout(() => {
      if (fs.existsSync(textPath)) {
        fs.unlinkSync(textPath);
        console.log('🧹 Archivo de texto limpiado');
      }
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error en prueba text full width:', error);
  }
}

// Ejecutar prueba
testTextFullWidth();


