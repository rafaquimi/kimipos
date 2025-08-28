// Script para generar HTML optimizado para impresoras térmicas
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para generar HTML optimizado para impresoras térmicas
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
        @media print {
            @page {
                size: 80mm auto;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            body {
                margin: 0 !important;
                padding: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                font-family: 'Courier New', monospace !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
            }
            
            * {
                box-sizing: border-box !important;
            }
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            width: 80mm;
            max-width: 80mm;
            background: white;
        }
        
        .ticket {
            width: 100%;
            padding: 2mm;
            box-sizing: border-box;
        }
        
        .header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 3mm;
            text-transform: uppercase;
        }
        
        .separator {
            border-top: 1px solid #000;
            margin: 2mm 0;
            width: 100%;
        }
        
        .info-line {
            margin: 1mm 0;
            font-size: 11px;
        }
        
        .order-title {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin: 3mm 0;
            text-transform: uppercase;
        }
        
        .item {
            margin: 2mm 0;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 11px;
        }
        
        .item-price {
            text-align: right;
            font-size: 10px;
            margin-top: 1mm;
        }
        
        .total {
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            margin: 4mm 0;
            text-transform: uppercase;
        }
        
        .thanks {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin: 5mm 0;
            text-transform: uppercase;
        }
        
        .spacer {
            height: 10mm;
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

async function testThermalHTML() {
  try {
    console.log('🔍 Probando HTML optimizado para impresoras térmicas...');
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Crear contenido de prueba
    const testItems = [
      { quantity: 1, productName: 'Sprite', unitPrice: 25, totalPrice: 25 },
      { quantity: 1, productName: 'Pepsi', unitPrice: 25, totalPrice: 25 }
    ];
    
    // Generar HTML optimizado
    console.log('\n📋 Generando HTML térmico...');
    const htmlContent = generateThermalHTML(testItems, 'TEST', 'PRUEBA');
    const htmlFile = path.join(tempDir, `thermal_ticket_${Date.now()}.html`);
    fs.writeFileSync(htmlFile, htmlContent, 'utf8');
    
    console.log('✅ HTML generado:', htmlFile);
    console.log('📄 Contenido HTML:');
    console.log(htmlContent);
    
    // Método 1: Imprimir usando mshta (más directo)
    console.log('\n🖨️ Método 1: Imprimiendo con mshta...');
    const mshtaCommand = `mshta "javascript:var w=window.open('${htmlFile}','','width=80mm,height=auto');w.print();w.close();close();"`;
    
    exec(mshtaCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error con mshta:', error.message);
        
        // Método 2: Imprimir usando PowerShell Start-Process
        console.log('\n🖨️ Método 2: Imprimiendo con PowerShell...');
        const psCommand = `powershell -Command "Start-Process -FilePath '${htmlFile}' -Verb Print -WindowStyle Hidden"`;
        
        exec(psCommand, (error2, stdout2, stderr2) => {
          if (error2) {
            console.error('❌ Error con PowerShell:', error2.message);
            
            // Método 3: Imprimir usando el comando print
            console.log('\n🖨️ Método 3: Imprimiendo con comando print...');
            const printCommand = `print "${htmlFile}"`;
            
            exec(printCommand, (error3, stdout3, stderr3) => {
              if (error3) {
                console.error('❌ Error con print:', error3.message);
              } else {
                console.log('✅ Impresión con print ejecutada');
              }
            });
          } else {
            console.log('✅ Impresión con PowerShell ejecutada');
          }
        });
      } else {
        console.log('✅ Impresión con mshta ejecutada');
      }
    });
    
    // Limpiar archivo después de un delay
    setTimeout(() => {
      if (fs.existsSync(htmlFile)) {
        fs.unlinkSync(htmlFile);
        console.log('🧹 Archivo HTML limpiado');
      }
    }, 15000);
    
  } catch (error) {
    console.error('❌ Error en prueba HTML térmico:', error);
  }
}

// Ejecutar prueba
testThermalHTML();


