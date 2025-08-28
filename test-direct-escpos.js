const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar comandos ESC/POS de configuración
function generateESCPOSSetup() {
  let commands = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Initialize printer
  
  // Configurar márgenes izquierdo y derecho a 0
  commands.push(0x1B, 0x6C, 0x00); // ESC l n - Set left margin (0)
  commands.push(0x1B, 0x51, 0x00); // ESC Q n - Set right margin (0)
  
  // Configurar ancho de línea máximo (80 caracteres para 80mm)
  commands.push(0x1B, 0x51, 80); // ESC Q n - Set right margin to 80
  
  // Configurar alineación izquierda (no centrada)
  commands.push(0x1B, 0x61, 0); // ESC a n - Alignment (0 = left)
  
  // Configurar fuente normal
  commands.push(0x1B, 0x21, 0x00); // ESC ! n - Select print mode (normal)
  
  // Configurar espaciado de línea
  commands.push(0x1B, 0x32); // ESC 2 - Select default line spacing
  
  // Configurar ancho de línea específico
  commands.push(0x1B, 0x57, 0x00, 0x00, 0x00, 0x00); // ESC W - Set print area width
  
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

// Función para combinar comandos ESC/POS con contenido
function combineESCPOSAndContent(escposCommands, textContent) {
  // Convertir el texto a bytes
  const textBytes = Buffer.from(textContent, 'utf8');
  
  // Combinar comandos ESC/POS + texto + comandos de finalización
  let combined = Buffer.concat([
    escposCommands,
    textBytes,
    Buffer.from([0x1B, 0x69]) // ESC i - Partial cut
  ]);
  
  return combined;
}

// Función para enviar directamente a la impresora
async function sendDirectToPrinter(combinedData) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `direct_${Date.now()}.bin`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFile, combinedData);
    
    // Enviar directamente a la impresora
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

// Función principal
async function main() {
  try {
    console.log('🔍 Probando impresión directa ESC/POS para ancho completo...\n');
    
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
    const escposCommands = generateESCPOSSetup();
    console.log('✅ Comandos ESC/POS generados');
    
    // Combinar comandos ESC/POS con contenido
    console.log('\n🔗 Combinando comandos ESC/POS con contenido...');
    const combinedData = combineESCPOSAndContent(escposCommands, textContent);
    console.log('✅ Datos combinados');
    console.log(`   - Tamaño total: ${combinedData.length} bytes`);
    console.log(`   - Comandos ESC/POS: ${escposCommands.length} bytes`);
    console.log(`   - Contenido texto: ${textContent.length} caracteres`);
    
    // Enviar directamente a la impresora
    console.log('\n📤 Enviando directamente a la impresora...');
    try {
      await sendDirectToPrinter(combinedData);
      console.log('✅ Impresión directa completada');
    } catch (error) {
      console.error('❌ Error en impresión directa:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba directa ESC/POS:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateESCPOSSetup,
  generateTicketContent,
  combineESCPOSAndContent,
  sendDirectToPrinter
};


