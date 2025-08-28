// Script para probar múltiples puertos USB con comandos ESC/POS
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar comandos ESC/POS optimizados
function generateESCPOSCommands(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Comandos ESC/POS optimizados para impresora térmica 80mm
  const commands = [
    '\x1B\x40', // Initialize printer
    '\x1B\x61\x01', // Center alignment
    '\x1B\x45\x01', // Bold on
    '\x1B\x21\x10', // Double height and width
    `${restaurantName}\n`,
    '\x1B\x21\x00', // Normal size
    '\x1B\x45\x00', // Bold off
    '\x1B\x61\x00', // Left alignment
    `MESA: ${tableNumber}\n`,
    customerName ? `CLIENTE: ${customerName}\n` : '',
    `FECHA: ${timestamp}\n`,
    '\x1B\x61\x01', // Center alignment
    '\x1B\x45\x01', // Bold on
    'PEDIDO:\n',
    '\x1B\x45\x00', // Bold off
    '\x1B\x61\x00', // Left alignment
    ...items.map(item => 
      `${item.quantity}x ${item.productName}\n` +
      `   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR\n`
    ),
    '\x1B\x61\x01', // Center alignment
    '\x1B\x45\x01', // Bold on
    `TOTAL: ${total.toFixed(2)} EUR\n\n`,
    '¡GRACIAS!\n\n\n',
    '\x1B\x69', // Cut paper
  ];
  
  return commands.join('');
}

// Función para probar múltiples puertos USB
async function testMultipleUSBPorts(escposCommands) {
  const usbPorts = ['USB001', 'USB002', 'USB003', 'USB004', 'USB005'];
  const tempDir = path.join(__dirname, 'temp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const escposFile = path.join(tempDir, `escpos_${Date.now()}.bin`);
  fs.writeFileSync(escposFile, escposCommands, 'binary');
  
  console.log('📄 Archivo ESC/POS generado:', escposFile);
  
  for (const port of usbPorts) {
    console.log(`\n🖨️ Probando puerto ${port}...`);
    
    try {
      const copyCommand = `copy "${escposFile}" "${port}"`;
      
      await new Promise((resolve, reject) => {
        exec(copyCommand, (error, stdout, stderr) => {
          if (error) {
            console.log(`❌ Error con ${port}:`, error.message);
            resolve(false);
          } else {
            console.log(`✅ Comandos enviados exitosamente a ${port}`);
            resolve(true);
          }
        });
      });
      
      // Esperar un poco entre intentos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error probando ${port}:`, error.message);
    }
  }
  
  // Limpiar archivo
  setTimeout(() => {
    if (fs.existsSync(escposFile)) {
      fs.unlinkSync(escposFile);
      console.log('🧹 Archivo ESC/POS limpiado');
    }
  }, 5000);
}

// Función para detectar impresoras USB específicas
async function detectUSBPrinters() {
  return new Promise((resolve, reject) => {
    exec('wmic printer get name,portname', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim());
      console.log('🔍 Impresoras detectadas:');
      lines.forEach(line => console.log(line));
      
      // Buscar impresoras USB
      const usbPrinters = lines.filter(line => 
        line.toLowerCase().includes('usb') || 
        line.toLowerCase().includes('pos-80c')
      );
      
      if (usbPrinters.length > 0) {
        console.log('✅ Impresoras USB encontradas:', usbPrinters);
        resolve(usbPrinters);
      } else {
        console.log('⚠️ No se encontraron impresoras USB específicas');
        resolve([]);
      }
    });
  });
}

async function testESCPOSMulti() {
  try {
    console.log('🔍 Probando múltiples puertos USB con ESC/POS...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Detectar impresoras USB
    try {
      await detectUSBPrinters();
    } catch (error) {
      console.log('⚠️ No se pudieron detectar impresoras, continuando...');
    }
    
    // Generar comandos ESC/POS
    console.log('\n📋 Generando comandos ESC/POS...');
    const escposCommands = generateESCPOSCommands(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Comandos ESC/POS generados');
    
    // Probar múltiples puertos
    console.log('\n🖨️ Probando múltiples puertos USB...');
    await testMultipleUSBPorts(escposCommands);
    
  } catch (error) {
    console.error('❌ Error en prueba ESC/POS múltiple:', error);
  }
}

// Ejecutar prueba
testESCPOSMulti();


