// Script para configurar la impresora desde Windows y imprimir con ancho completo
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para configurar la impresora POS-80C
async function configurePrinter() {
  return new Promise((resolve, reject) => {
    // Configurar la impresora POS-80C como predeterminada
    const configCommand = `powershell -Command "Set-Printer -Name 'POS-80C' -Default"`;
    
    exec(configCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ No se pudo configurar como predeterminada, continuando...');
        resolve(false);
      } else {
        console.log('✅ Impresora configurada como predeterminada');
        resolve(true);
      }
    });
  });
}

// Función para generar contenido con ancho máximo
function generateMaxWidthContent(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Ancho máximo para forzar uso completo del papel
  const maxWidth = 64; // Más ancho para forzar el uso completo
  
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

// Función para imprimir usando diferentes métodos
async function printWithMultipleMethods(filePath) {
  const methods = [
    // Método 1: PowerShell Out-Printer sin especificar impresora (usa predeterminada)
    `powershell -Command "Get-Content '${filePath}' | Out-Printer"`,
    
    // Método 2: PowerShell Out-Printer con impresora específica
    `powershell -Command "Get-Content '${filePath}' | Out-Printer -Name 'POS-80C'"`,
    
    // Método 3: Comando print directo
    `print "${filePath}"`,
    
    // Método 4: PowerShell Start-Process
    `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print -WindowStyle Hidden"`
  ];
  
  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    console.log(`\n🖨️ Probando método ${i + 1}...`);
    
    try {
      await new Promise((resolve, reject) => {
        exec(method, (error, stdout, stderr) => {
          if (error) {
            console.log(`❌ Método ${i + 1} falló:`, error.message);
            reject(error);
          } else {
            console.log(`✅ Método ${i + 1} ejecutado correctamente`);
            resolve(true);
          }
        });
      });
      
      // Si llegamos aquí, el método funcionó
      return true;
      
    } catch (error) {
      console.log(`⚠️ Método ${i + 1} no funcionó, probando siguiente...`);
    }
  }
  
  throw new Error('Ningún método de impresión funcionó');
}

async function testPrinterConfig() {
  try {
    console.log('🔍 Probando configuración de impresora y ancho completo...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar contenido con ancho máximo
    console.log('\n📋 Generando contenido con ancho máximo (64 caracteres)...');
    const textContent = generateMaxWidthContent(testItems, 'TEST', 'PRUEBA');
    console.log('✅ Contenido generado');
    
    // Mostrar el contenido generado
    console.log('\n📄 Contenido generado:');
    console.log(textContent);
    
    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Crear archivo de texto
    const textPath = path.join(tempDir, `max_width_${Date.now()}.txt`);
    fs.writeFileSync(textPath, textContent, 'utf8');
    console.log('\n📄 Archivo de texto creado:', textPath);
    
    // Configurar impresora
    console.log('\n⚙️ Configurando impresora...');
    await configurePrinter();
    
    // Imprimir con múltiples métodos
    console.log('\n🖨️ Imprimiendo con múltiples métodos...');
    try {
      await printWithMultipleMethods(textPath);
      console.log('✅ Impresión completada');
    } catch (printError) {
      console.error('❌ Error en impresión:', printError.message);
    }
    
    // Limpiar archivo después de un delay
    setTimeout(() => {
      if (fs.existsSync(textPath)) {
        fs.unlinkSync(textPath);
        console.log('🧹 Archivo de texto limpiado');
      }
    }, 15000);
    
  } catch (error) {
    console.error('❌ Error en prueba printer config:', error);
  }
}

// Ejecutar prueba
testPrinterConfig();


