// Script para generar PDF perfecto con Puppeteer para impresoras térmicas
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar HTML optimizado para PDF térmico
function generateThermalHTML(items, tableNumber, customerName, restaurantName = 'RESTAURANTE') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ticket Térmico</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.1;
            margin: 0;
            padding: 2mm;
            width: 76mm;
            max-width: 76mm;
            background: white;
            color: black;
        }
        
        .ticket {
            width: 100%;
            box-sizing: border-box;
        }
        
        .header {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 2mm;
            text-transform: uppercase;
        }
        
        .separator {
            border-top: 1px solid #000;
            margin: 1mm 0;
            width: 100%;
        }
        
        .info-line {
            margin: 0.5mm 0;
            font-size: 9px;
        }
        
        .order-title {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            margin: 2mm 0;
            text-transform: uppercase;
        }
        
        .item {
            margin: 1mm 0;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 9px;
        }
        
        .item-price {
            text-align: right;
            font-size: 8px;
            margin-top: 0.5mm;
        }
        
        .total {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin: 3mm 0;
            text-transform: uppercase;
        }
        
        .thanks {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            margin: 4mm 0;
            text-transform: uppercase;
        }
        
        .spacer {
            height: 5mm;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">${restaurantName}</div>
        <div class="separator"></div>
        
        <div class="info-line">MESA: ${tableNumber}</div>
        ${customerName ? `<div class="info-line">CLIENTE: ${customerName}</div>` : ''}
        <div class="info-line">FECHA: ${timestamp}</div>
        
        <div class="separator"></div>
        
        <div class="order-title">PEDIDO:</div>
        
        ${items.map(item => `
            <div class="item">
                <div class="item-name">${item.quantity}x ${item.productName}</div>
                <div class="item-price">${item.unitPrice.toFixed(2)} EUR x ${item.quantity} = ${item.totalPrice.toFixed(2)} EUR</div>
            </div>
        `).join('')}
        
        <div class="separator"></div>
        
        <div class="total">TOTAL: ${total.toFixed(2)} EUR</div>
        
        <div class="thanks">¡GRACIAS!</div>
        
        <div class="spacer"></div>
    </div>
</body>
</html>`;
}

// Función para generar PDF con Puppeteer
async function generatePDFWithPuppeteer(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar el contenido HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generar PDF optimizado para impresoras térmicas
    await page.pdf({
      path: outputPath,
      format: 'A4',
      width: '80mm',
      height: 'auto',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true
    });
    
    console.log('✅ PDF generado con Puppeteer:', outputPath);
    return true;
    
  } catch (error) {
    console.error('❌ Error generando PDF con Puppeteer:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Función para imprimir PDF
async function printPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    // Método 1: Usando PowerShell Start-Process
    const printCommand = `powershell -Command "Start-Process -FilePath '${pdfPath}' -Verb Print -WindowStyle Hidden"`;
    
    exec(printCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error con PowerShell:', error.message);
        
        // Método 2: Usando el comando print
        const printCommand2 = `print "${pdfPath}"`;
        
        exec(printCommand2, (error2, stdout2, stderr2) => {
          if (error2) {
            console.error('❌ Error con print:', error2.message);
            reject(error2);
          } else {
            console.log('✅ Impresión con print ejecutada');
            resolve(true);
          }
        });
      } else {
        console.log('✅ Impresión con PowerShell ejecutada');
        resolve(true);
      }
    });
  });
}

// Función para imprimir HTML directamente como fallback
async function printHTMLDirect(htmlContent) {
  try {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const htmlFile = path.join(tempDir, `thermal_${Date.now()}.html`);
    fs.writeFileSync(htmlFile, htmlContent, 'utf8');
    
    console.log('📄 Archivo HTML generado:', htmlFile);
    
    // Imprimir usando mshta
    const mshtaCommand = `mshta "javascript:var w=window.open('${htmlFile}','','width=80mm,height=auto');w.print();w.close();close();"`;
    
    return new Promise((resolve, reject) => {
      exec(mshtaCommand, (error, stdout, stderr) => {
        // Limpiar archivo
        setTimeout(() => {
          if (fs.existsSync(htmlFile)) {
            fs.unlinkSync(htmlFile);
          }
        }, 5000);
        
        if (error) {
          console.error('❌ Error con mshta:', error.message);
          reject(error);
        } else {
          console.log('✅ Impresión HTML directa ejecutada');
          resolve(true);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error con HTML directo:', error.message);
    return false;
  }
}

async function testPuppeteerPDF() {
  try {
    console.log('🔍 Probando generación de PDF con Puppeteer...');
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar HTML optimizado
    console.log('\n📋 Generando HTML térmico...');
    const htmlContent = generateThermalHTML(testItems, 'TEST', 'PRUEBA');
    console.log('✅ HTML generado');
    
    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Generar PDF
    console.log('\n📄 Generando PDF con Puppeteer...');
    const pdfPath = path.join(tempDir, `thermal_ticket_${Date.now()}.pdf`);
    
    const pdfGenerated = await generatePDFWithPuppeteer(htmlContent, pdfPath);
    
    if (pdfGenerated) {
      // Imprimir PDF
      console.log('\n🖨️ Imprimiendo PDF...');
      try {
        await printPDF(pdfPath);
        console.log('✅ Comando de impresión ejecutado');
      } catch (printError) {
        console.error('❌ Error imprimiendo PDF:', printError.message);
      }
      
      // Limpiar archivo después de un delay
      setTimeout(() => {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          console.log('🧹 Archivo PDF limpiado');
        }
      }, 10000);
      
    } else {
      // Fallback: imprimir HTML directamente
      console.log('\n🔄 Intentando fallback con HTML directo...');
      await printHTMLDirect(htmlContent);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba Puppeteer PDF:', error);
  }
}

// Ejecutar prueba
testPuppeteerPDF();


