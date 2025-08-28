const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar contenido con ancho forzado
function generateWideContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho muy amplio para forzar el ancho completo
  const maxWidth = 100;
  
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

// Función para imprimir usando comando print de Windows
async function printWithWindowsCommand(textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `wide_${Date.now()}.txt`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, textContent, 'utf8');
    
    // Usar comando print de Windows
    const printCommand = `print "${tempFile}"`;
    
    exec(printCommand, { timeout: 15000 }, (error, stdout, stderr) => {
      // Limpiar archivo temporal después de un delay
      setTimeout(() => {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }, 5000);
      
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

// Función para imprimir usando PowerShell con configuración específica
async function printWithPowerShell(textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `wide_ps_${Date.now()}.txt`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, textContent, 'utf8');
    
    // Comando PowerShell específico
    const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommand, { timeout: 10000 }, (error, stdout, stderr) => {
      // Limpiar archivo temporal
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

// Función principal
async function main() {
  try {
    console.log('🔍 Probando impresión con ancho forzado...\n');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido con ancho forzado
    console.log('📋 Generando contenido con ancho forzado (100 caracteres)...');
    const textContent = generateWideContent(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Contenido generado');
    
    // Mostrar el contenido generado
    console.log('\n📄 Contenido generado:');
    console.log('─'.repeat(110));
    console.log(textContent);
    console.log('─'.repeat(110));
    
    // Probar con comando print de Windows
    console.log('\n🖨️ Probando con comando print de Windows...');
    try {
      await printWithWindowsCommand(textContent);
      console.log('✅ Impresión con comando print completada');
    } catch (error) {
      console.log('⚠️ Error con comando print:', error.message);
      
      // Probar con PowerShell como alternativa
      console.log('\n🖨️ Probando con PowerShell como alternativa...');
      try {
        await printWithPowerShell(textContent);
        console.log('✅ Impresión con PowerShell completada');
      } catch (psError) {
        console.error('❌ Error con PowerShell:', psError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en prueba de ancho forzado:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateWideContent,
  printWithWindowsCommand,
  printWithPowerShell
};


