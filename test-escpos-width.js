// Script para probar comandos ESC/POS directos para configurar el ancho
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar comandos ESC/POS con configuración de ancho
function generateESCPOSCommands(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Comandos ESC/POS para configurar la impresora
  let commands = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Initialize printer
  
  // Configurar ancho de línea (48 caracteres para 80mm)
  commands.push(0x1B, 0x51, 48); // ESC Q n - Set right margin
  
  // Configurar alineación centrada
  commands.push(0x1B, 0x61, 1); // ESC a n - Alignment (1 = center)
  
  // Texto en negrita y doble altura
  commands.push(0x1B, 0x21, 0x30); // ESC ! n - Select print mode (bold + double height)
  
  // Encabezado
  commands.push(...Buffer.from(restaurantName + '\n', 'utf8'));
  
  // Reset print mode
  commands.push(0x1B, 0x21, 0x00); // ESC ! n - Normal print mode
  
  // Línea separadora
  commands.push(...Buffer.from('='.repeat(48) + '\n', 'utf8'));
  
  // Alineación izquierda
  commands.push(0x1B, 0x61, 0); // ESC a n - Alignment (0 = left)
  
  // Información
  commands.push(...Buffer.from(`MESA: ${tableNumber}\n`, 'utf8'));
  if (customerName) {
    commands.push(...Buffer.from(`CLIENTE: ${customerName}\n`, 'utf8'));
  }
  commands.push(...Buffer.from(`FECHA: ${timestamp}\n`, 'utf8'));
  
  // Línea separadora
  commands.push(...Buffer.from('-'.repeat(48) + '\n', 'utf8'));
  
  // Alineación centrada para título
  commands.push(0x1B, 0x61, 1); // ESC a n - Alignment (1 = center)
  commands.push(...Buffer.from('PEDIDO:\n', 'utf8'));
  
  // Alineación izquierda para items
  commands.push(0x1B, 0x61, 0); // ESC a n - Alignment (0 = left)
  
  // Items del pedido
  items.forEach(item => {
    commands.push(...Buffer.from(`${item.quantity}x ${item.productName}\n`, 'utf8'));
    commands.push(...Buffer.from(`   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR\n`, 'utf8'));
  });
  
  // Línea separadora
  commands.push(...Buffer.from('-'.repeat(48) + '\n', 'utf8'));
  
  // Alineación centrada para total
  commands.push(0x1B, 0x61, 1); // ESC a n - Alignment (1 = center)
  commands.push(0x1B, 0x21, 0x30); // ESC ! n - Bold + double height
  commands.push(...Buffer.from(`TOTAL: ${total.toFixed(2)} EUR\n`, 'utf8'));
  
  // Reset print mode
  commands.push(0x1B, 0x21, 0x00); // ESC ! n - Normal print mode
  
  commands.push(...Buffer.from('\n', 'utf8'));
  commands.push(...Buffer.from('¡GRACIAS!\n', 'utf8'));
  commands.push(...Buffer.from('\n\n\n', 'utf8'));
  
  // Cortar papel
  commands.push(0x1D, 0x56, 0x41, 0x00); // GS V A - Full cut
  
  return Buffer.from(commands);
}

// Función para detectar puertos USB
async function detectUSBPorts() {
  return new Promise((resolve, reject) => {
    exec('wmic printer get name,portname', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim());
      const printers = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('POS-80C') || line.includes('USB')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            printers.push({
              name: parts[0],
              port: parts[1]
            });
          }
        }
      }
      
      resolve(printers);
    });
  });
}

// Función para enviar comandos ESC/POS a un puerto
async function sendESCPOSCommands(commands, port) {
  return new Promise((resolve, reject) => {
    // Crear archivo temporal con comandos ESC/POS
    const tempFile = path.join(__dirname, 'temp', `escpos_${Date.now()}.bin`);
    fs.writeFileSync(tempFile, commands);
    
    // Enviar comandos usando copy
    const copyCommand = `copy "${tempFile}" "${port}"`;
    
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

async function testESCPOSWidth() {
  try {
    console.log('🔍 Probando comandos ESC/POS para configurar ancho...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar comandos ESC/POS
    console.log('\n📋 Generando comandos ESC/POS...');
    const escposCommands = generateESCPOSCommands(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Comandos ESC/POS generados');
    
    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Detectar puertos USB
    console.log('\n🔍 Detectando puertos USB...');
    const printers = await detectUSBPorts();
    console.log('✅ Puertos detectados:', printers);
    
    if (printers.length === 0) {
      console.log('⚠️ No se detectaron impresoras USB, probando puertos comunes...');
      
      // Probar puertos comunes
      const commonPorts = ['USB001', 'USB002', 'USB003', 'USB004', 'USB005'];
      
      for (const port of commonPorts) {
        console.log(`\n🖨️ Probando puerto ${port}...`);
        try {
          await sendESCPOSCommands(escposCommands, port);
          console.log(`✅ Comandos enviados a ${port}`);
          break;
        } catch (error) {
          console.log(`❌ Error con ${port}:`, error.message);
        }
      }
    } else {
      // Probar con las impresoras detectadas
      for (const printer of printers) {
        console.log(`\n🖨️ Probando impresora ${printer.name} en puerto ${printer.port}...`);
        try {
          await sendESCPOSCommands(escposCommands, printer.port);
          console.log(`✅ Comandos enviados a ${printer.name}`);
          break;
        } catch (error) {
          console.log(`❌ Error con ${printer.name}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en prueba ESC/POS width:', error);
  }
}

// Ejecutar prueba
testESCPOSWidth();


