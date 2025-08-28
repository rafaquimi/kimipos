const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar comandos ESC/POS nativos
function generateESCPOSCommands() {
  let commands = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Initialize printer
  
  // Configurar márgenes izquierdo y derecho a 0
  commands.push(0x1B, 0x6C, 0x00); // ESC l n - Set left margin (0)
  commands.push(0x1B, 0x51, 0x00); // ESC Q n - Set right margin (0)
  
  // Configurar ancho de línea máximo (80 caracteres para 80mm)
  commands.push(0x1B, 0x51, 80); // ESC Q n - Set right margin to 80
  
  // Configurar alineación centrada
  commands.push(0x1B, 0x61, 1); // ESC a n - Alignment (1 = center)
  
  // Configurar fuente normal
  commands.push(0x1B, 0x21, 0x00); // ESC ! n - Select print mode (normal)
  
  // Configurar espaciado de línea
  commands.push(0x1B, 0x32); // ESC 2 - Select default line spacing
  
  return Buffer.from(commands);
}

// Función para generar contenido del ticket
function generateTicketContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho máximo para impresora térmica 80mm
  const maxWidth = 80;
  
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

// Función para enviar comandos ESC/POS
async function sendESCPOSCommands(commands) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `escpos_${Date.now()}.bin`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, commands);
    
    // Enviar comandos a la impresora
    const copyCommand = `copy "${tempFile}" "USB002"`;
    
    exec(copyCommand, (error, stdout, stderr) => {
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

// Función para imprimir texto
async function printText(textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `print_${Date.now()}.txt`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, textContent, 'utf8');
    
    const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'POS-80C'"`;
    
    exec(printCommand, (error, stdout, stderr) => {
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
    console.log('🔍 Probando comandos ESC/POS nativos para ancho completo...\n');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido del ticket
    console.log('📋 Generando contenido del ticket...');
    const textContent = generateTicketContent(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Contenido generado');
    
    // Mostrar el contenido generado
    console.log('\n📄 Contenido generado:');
    console.log('─'.repeat(90));
    console.log(textContent);
    console.log('─'.repeat(90));
    
    // Generar comandos ESC/POS
    console.log('\n⚙️ Generando comandos ESC/POS...');
    const escposCommands = generateESCPOSCommands();
    console.log('✅ Comandos ESC/POS generados');
    
    // Enviar comandos de configuración
    console.log('\n📤 Enviando comandos de configuración ESC/POS...');
    try {
      await sendESCPOSCommands(escposCommands);
      console.log('✅ Comandos de configuración enviados');
    } catch (error) {
      console.log('⚠️ No se pudieron enviar comandos de configuración:', error.message);
    }
    
    // Esperar un momento para que la configuración se aplique
    console.log('\n⏳ Esperando configuración...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Imprimir texto
    console.log('\n🖨️ Imprimiendo texto después de configuración...');
    try {
      await printText(textContent);
      console.log('✅ Impresión completada');
    } catch (printError) {
      console.error('❌ Error en impresión:', printError.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba ESC/POS nativo:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateESCPOSCommands,
  generateTicketContent,
  sendESCPOSCommands,
  printText
};


