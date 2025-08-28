// Script para configurar la impresora POS-80C desde Windows
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para configurar la impresora POS-80C
async function configurePOS80C() {
  console.log('⚙️ Configurando impresora POS-80C...');
  
  const commands = [
    // Configurar como impresora predeterminada
    `powershell -Command "Set-Printer -Name 'POS-80C' -Default"`,
    
    // Configurar propiedades de la impresora
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -DriverName 'Generic / Text Only'"`,
    
    // Configurar puerto USB
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -PortName 'USB002'"`,
    
    // Configurar propiedades avanzadas
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -Shared $false"`
  ];
  
  for (let i = 0; i < commands.length; i++) {
    try {
      await new Promise((resolve, reject) => {
        exec(commands[i], (error, stdout, stderr) => {
          if (error) {
            console.log(`⚠️ Comando ${i + 1} falló:`, error.message);
            resolve(false);
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.log(`❌ Error en comando ${i + 1}:`, error.message);
    }
  }
}

// Función para generar contenido con ancho máximo forzado
function generateForcedWidthContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho máximo forzado (más ancho de lo normal)
  const maxWidth = 72; // Forzar ancho máximo
  
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

// Función para imprimir con configuración específica
async function printWithConfiguration(textContent) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, 'temp', `forced_width_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, textContent, 'utf8');
    
    // Comando específico para POS-80C con configuración forzada
    const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'POS-80C' -DriverName 'Generic / Text Only'"`;
    
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

async function testPrinterSettings() {
  try {
    console.log('🔍 Probando configuración específica de impresora POS-80C...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido con ancho forzado
    console.log('\n📋 Generando contenido con ancho forzado (72 caracteres)...');
    const textContent = generateForcedWidthContent(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Contenido generado');
    
    // Mostrar el contenido generado
    console.log('\n📄 Contenido generado:');
    console.log(textContent);
    
    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Configurar impresora
    await configurePOS80C();
    
    // Esperar un momento para que la configuración se aplique
    console.log('\n⏳ Esperando configuración...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Imprimir con configuración específica
    console.log('\n🖨️ Imprimiendo con configuración específica...');
    try {
      await printWithConfiguration(textContent);
      console.log('✅ Impresión completada');
    } catch (printError) {
      console.error('❌ Error en impresión:', printError.message);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba printer settings:', error);
  }
}

// Ejecutar prueba
testPrinterSettings();


