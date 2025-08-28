// Script de prueba usando la impresora predeterminada del sistema
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar contenido de texto plano optimizado para impresoras térmicas (sin márgenes)
function generateTextContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho máximo para impresora térmica 80mm (aproximadamente 24 caracteres para forzar sin márgenes)
  const maxWidth = 24;
  
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
  content += centerText('!GRACIAS!') + '\n';
  content += '\n\n\n';
  
  return content;
}

async function testDefaultPrinter() {
  try {
    console.log('🔍 Probando con impresora predeterminada del sistema...');
    
    // Primero, obtener la impresora predeterminada
    console.log('📋 Obteniendo impresora predeterminada...');
    const getDefaultPrinterCommand = `powershell -Command "Get-Printer | Where-Object {$_.Default -eq $true} | Select-Object Name, DriverName, PortName"`;
    
    exec(getDefaultPrinterCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error obteniendo impresora predeterminada:', error.message);
        return;
      }
      
      console.log('📋 Impresora predeterminada:');
      console.log(stdout);
      
      // Crear directorio temporal si no existe
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const textFile = path.join(tempDir, `default_printer_${timestamp}.txt`);
      
      // Crear contenido de prueba
      const testItems = [
        { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
        { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
      ];
      
      const textContent = generateTextContent(testItems, 'TEST', 'PRUEBA');
      
      // Escribir archivo de texto
      fs.writeFileSync(textFile, textContent, 'utf8');
      
      console.log('📄 Archivo de texto generado:', textFile);
      console.log('📋 Contenido del archivo:');
      console.log(textContent);
      
      // Imprimir usando la impresora predeterminada
      console.log('\n🖨️ Imprimiendo con impresora predeterminada...');
      const printCommand = `powershell -Command "Get-Content '${textFile}' | Out-Printer"`;
      
      exec(printCommand, (printError, printStdout, printStderr) => {
        if (printError) {
          console.error('❌ Error ejecutando comando de impresión:', printError.message);
        } else {
          console.log('✅ Comando de impresión ejecutado');
          console.log('📋 Verifica que se imprimió correctamente en tu impresora predeterminada');
          console.log('🎯 Este es el método que está configurado en el servidor');
          console.log('📏 Ancho configurado: 24 caracteres (mínimo para eliminar márgenes)');
        }
        
        // Limpiar archivo después de un delay
        setTimeout(() => {
          if (fs.existsSync(textFile)) {
            fs.unlinkSync(textFile);
            console.log('🧹 Archivo temporal eliminado');
          }
        }, 10000);
      });
    });
    
  } catch (error) {
    console.error('❌ Error en prueba impresora predeterminada:', error);
  }
}

// Ejecutar prueba
testDefaultPrinter();


