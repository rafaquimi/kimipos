// Script para comunicación directa con impresora térmica usando node-thermal-printer
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para detectar el puerto USB de la impresora
async function findThermalPrinter() {
  return new Promise((resolve, reject) => {
    exec('wmic path win32_serialport get name,deviceid', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim());
      console.log('🔍 Puertos seriales detectados:');
      lines.forEach(line => console.log(line));
      
      // Buscar puertos que puedan ser la impresora térmica
      const possiblePorts = lines.filter(line => 
        line.toLowerCase().includes('usb') || 
        line.toLowerCase().includes('com')
      );
      
      if (possiblePorts.length > 0) {
        console.log('✅ Posibles puertos para impresora térmica:', possiblePorts);
        resolve(possiblePorts);
      } else {
        reject(new Error('No se encontraron puertos USB para impresora térmica'));
      }
    });
  });
}

// Función para imprimir usando node-thermal-printer
async function printWithThermalPrinter(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  try {
    console.log('🔍 Configurando impresora térmica...');
    
    // Configurar impresora térmica
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'USB',
      driver: require('printer'),
      width: 48, // Ancho para papel de 80mm
      characterSet: 'SPAIN',
      removeSpecialCharacters: false,
      lineCharacter: '-'
    });
    
    console.log('✅ Impresora configurada');
    
    // Verificar conexión
    const isConnected = await printer.isPrinterConnected();
    console.log('🔌 Impresora conectada:', isConnected);
    
    if (!isConnected) {
      throw new Error('Impresora no conectada');
    }
    
    // Generar contenido del ticket
    const timestamp = new Date().toLocaleString('es-ES');
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    console.log('📋 Generando ticket...');
    
    // Imprimir encabezado
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(restaurantName);
    printer.drawLine();
    
    // Información de mesa y cliente
    printer.alignLeft();
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.println(`MESA: ${tableNumber}`);
    if (customerName) {
      printer.println(`CLIENTE: ${customerName}`);
    }
    printer.println(`FECHA: ${timestamp}`);
    printer.drawLine();
    
    // Título del pedido
    printer.alignCenter();
    printer.bold(true);
    printer.println('PEDIDO:');
    
    // Items del pedido
    printer.alignLeft();
    printer.bold(false);
    items.forEach(item => {
      printer.println(`${item.quantity}x ${item.productName}`);
      printer.alignRight();
      printer.println(`${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR`);
      printer.alignLeft();
    });
    
    printer.drawLine();
    
    // Total
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`TOTAL: ${total.toFixed(2)} EUR`);
    printer.println('');
    
    // Mensaje de agradecimiento
    printer.println('¡GRACIAS!');
    printer.println('');
    printer.println('');
    printer.println('');
    
    // Cortar papel
    printer.cut();
    
    // Ejecutar impresión
    console.log('🖨️ Ejecutando impresión...');
    await printer.execute();
    
    console.log('✅ Impresión completada');
    return true;
    
  } catch (error) {
    console.error('❌ Error con impresora térmica:', error.message);
    return false;
  }
}

// Función alternativa usando comandos ESC/POS directos
async function printWithESCPOS(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  try {
    console.log('🔍 Intentando impresión ESC/POS directa...');
    
    const timestamp = new Date().toLocaleString('es-ES');
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Comandos ESC/POS para impresora térmica
    const escposCommands = [
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
      'PEDIDO:\n',
      '\x1B\x61\x00', // Left alignment
      ...items.map(item => 
        `${item.quantity}x ${item.productName}\n` +
        `   ${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR\n`
      ),
      '\x1B\x61\x01', // Center alignment
      `TOTAL: ${total.toFixed(2)} EUR\n\n`,
      '¡GRACIAS!\n\n\n',
      '\x1B\x69', // Cut paper
    ].join('');
    
    // Crear archivo con comandos ESC/POS
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const escposFile = path.join(tempDir, `escpos_${Date.now()}.bin`);
    fs.writeFileSync(escposFile, escposCommands, 'binary');
    
    console.log('📄 Archivo ESC/POS generado:', escposFile);
    
    // Intentar enviar a la impresora usando copy
    const copyCommand = `copy "${escposFile}" "USB002"`;
    
    return new Promise((resolve, reject) => {
      exec(copyCommand, (error, stdout, stderr) => {
        // Limpiar archivo
        if (fs.existsSync(escposFile)) {
          fs.unlinkSync(escposFile);
        }
        
        if (error) {
          console.error('❌ Error con copy:', error.message);
          reject(error);
        } else {
          console.log('✅ Comandos ESC/POS enviados');
          resolve(true);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error con ESC/POS:', error.message);
    return false;
  }
}

async function testThermalDirect() {
  try {
    console.log('🔍 Probando comunicación directa con impresora térmica...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Intentar detectar puertos
    try {
      await findThermalPrinter();
    } catch (error) {
      console.log('⚠️ No se pudieron detectar puertos, continuando...');
    }
    
    // Método 1: node-thermal-printer
    console.log('\n🖨️ Método 1: Usando node-thermal-printer...');
    const result1 = await printWithThermalPrinter(testItems, 'TEST', 'PRUEBA');
    
    if (!result1) {
      // Método 2: ESC/POS directo
      console.log('\n🖨️ Método 2: Usando ESC/POS directo...');
      await printWithESCPOS(testItems, 'TEST', 'PRUEBA');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba térmica directa:', error);
  }
}

// Ejecutar prueba
testThermalDirect();


