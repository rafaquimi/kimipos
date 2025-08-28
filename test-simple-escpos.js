const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar comandos ESC/POS básicos
function generateBasicESCPOS() {
  let commands = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Initialize printer
  
  // Configurar alineación izquierda
  commands.push(0x1B, 0x61, 0); // ESC a n - Alignment (0 = left)
  
  // Configurar fuente normal
  commands.push(0x1B, 0x21, 0x00); // ESC ! n - Select print mode (normal)
  
  return Buffer.from(commands);
}

// Función para generar contenido simple
function generateSimpleContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  let content = '';
  
  // Encabezado
  content += restaurantName + '\n';
  content += '='.repeat(40) + '\n';
  
  // Información
  content += `MESA: ${tableNumber}\n`;
  if (customerName) {
    content += `CLIENTE: ${customerName}\n`;
  }
  content += `FECHA: ${timestamp}\n`;
  content += '-'.repeat(40) + '\n';
  
  // Título
  content += 'PEDIDO:\n';
  
  // Items
  items.forEach(item => {
    content += `${item.quantity}x ${item.productName}\n`;
    content += `   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR\n`;
  });
  
  content += '-'.repeat(40) + '\n';
  
  // Total
  content += `TOTAL: ${total.toFixed(2)} EUR\n`;
  content += '\n';
  
  // Agradecimiento
  content += '¡GRACIAS!\n';
  content += '\n\n\n';
  
  return content;
}

// Función para combinar y enviar
function sendToPrinter(escposCommands, textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `simple_${Date.now()}.bin`);
    
    // Crear directorio temporal si no existe
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Combinar comandos ESC/POS + texto
    const textBytes = Buffer.from(textContent, 'utf8');
    const combined = Buffer.concat([escposCommands, textBytes]);
    
    fs.writeFileSync(tempFile, combined);
    
    // Enviar a la impresora
    const copyCommand = `copy "${tempFile}" "USB002"`;
    
    exec(copyCommand, { timeout: 10000 }, (error, stdout, stderr) => {
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
    console.log('🔍 Probando comandos ESC/POS básicos...\n');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido simple
    console.log('📋 Generando contenido simple...');
    const textContent = generateSimpleContent(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Contenido generado');
    
    // Mostrar el contenido
    console.log('\n📄 Contenido generado:');
    console.log('─'.repeat(50));
    console.log(textContent);
    console.log('─'.repeat(50));
    
    // Generar comandos ESC/POS básicos
    console.log('\n⚙️ Generando comandos ESC/POS básicos...');
    const escposCommands = generateBasicESCPOS();
    console.log('✅ Comandos ESC/POS generados');
    
    // Enviar a la impresora
    console.log('\n📤 Enviando a la impresora...');
    try {
      await sendToPrinter(escposCommands, textContent);
      console.log('✅ Impresión completada');
    } catch (error) {
      console.error('❌ Error en impresión:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba básica:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateBasicESCPOS,
  generateSimpleContent,
  sendToPrinter
};


