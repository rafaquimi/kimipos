// Script para configurar la impresora con comandos ESC/POS específicos
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar comandos ESC/POS de configuración
function generateSetupCommands() {
  let commands = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Initialize printer
  
  // Configurar márgenes izquierdo y derecho a 0
  commands.push(0x1B, 0x6C, 0x00); // ESC l n - Set left margin (0)
  commands.push(0x1B, 0x51, 0x00); // ESC Q n - Set right margin (0)
  
  // Configurar ancho de línea máximo (48 caracteres para 80mm)
  commands.push(0x1B, 0x51, 48); // ESC Q n - Set right margin to 48
  
  // Configurar alineación centrada
  commands.push(0x1B, 0x61, 1); // ESC a n - Alignment (1 = center)
  
  return Buffer.from(commands);
}

// Función para generar contenido de texto con ancho completo
function generateFullWidthText(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho para impresora térmica 80mm (48 caracteres)
  const maxWidth = 48;
  
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

// Función para enviar comandos de configuración
async function sendSetupCommands() {
  return new Promise((resolve, reject) => {
    const setupCommands = generateSetupCommands();
    const tempFile = path.join(__dirname, 'temp', `setup_${Date.now()}.bin`);
    
    fs.writeFileSync(tempFile, setupCommands);
    
    const copyCommand = `copy "${tempFile}" "USB002"`;
    
    exec(copyCommand, (error, stdout, stderr) => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      
      if (error) {
        console.log('⚠️ No se pudieron enviar comandos de configuración:', error.message);
        resolve(false);
      } else {
        console.log('✅ Comandos de configuración enviados');
        resolve(true);
      }
    });
  });
}

// Función para imprimir texto después de la configuración
async function printAfterSetup(textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `print_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, textContent, 'utf8');
    
    const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommand, (error, stdout, stderr) => {
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

async function testESCPOSSetup() {
  try {
    console.log('🔍 Probando configuración ESC/POS y ancho completo...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido de texto
    console.log('\n📋 Generando contenido de texto...');
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
    
    // Enviar comandos de configuración
    console.log('\n⚙️ Enviando comandos de configuración ESC/POS...');
    await sendSetupCommands();
    
    // Esperar un momento para que la configuración se aplique
    console.log('\n⏳ Esperando configuración...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Imprimir texto
    console.log('\n🖨️ Imprimiendo texto después de configuración...');
    try {
      await printAfterSetup(textContent);
      console.log('✅ Impresión completada');
    } catch (printError) {
      console.error('❌ Error en impresión:', printError.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba ESC/POS setup:', error);
  }
}

// Ejecutar prueba
testESCPOSSetup();


