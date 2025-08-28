// Servidor backend para detectar impresoras del sistema
const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const puppeteer = require('puppeteer');

// Librerías ESC/POS
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
escpos.Network = require('escpos-network');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para obtener todas las impresoras
app.get('/printers', async (req, res) => {
  try {
    console.log('🔍 Detectando impresoras del sistema...');

    const printers = await si.printer();

    console.log(`✅ Se detectaron ${printers.length} impresoras:`);
    printers.forEach((printer, index) => {
      console.log(`  ${index + 1}. ${printer.name} (${printer.status || 'Estado desconocido'})`);
    });

    res.json({
      success: true,
      printers: printers,
      count: printers.length
    });
  } catch (error) {
    console.error('❌ Error detectando impresoras:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      printers: []
    });
  }
});

// Endpoint para obtener la impresora predeterminada
app.get('/printers/default', async (req, res) => {
  try {
    const printers = await si.printer();
    const defaultPrinter = printers.find(p => p.default) || printers[0];

    res.json({
      success: true,
      printer: defaultPrinter
    });
  } catch (error) {
    console.error('❌ Error obteniendo impresora predeterminada:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint de prueba
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor de impresoras funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para imprimir en impresora ESC/POS
app.post('/escpos/print', async (req, res) => {
  try {
    const { items, tableNumber, customerName, timestamp, printerId } = req.body;
    
    console.log(`🖨️ ===== IMPRESIÓN ESC/POS =====`);
    console.log(`🖨️ Impresora: ${printerId}`);
    console.log(`🖨️ Mesa: ${tableNumber}`);
    console.log(`🖨️ Cliente: ${customerName || 'Sin cliente'}`);
    console.log(`🖨️ Productos: ${items.length}`);
    
    // Intentar imprimir usando PDF optimizado para impresoras térmicas
    try {
      const { exec } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      const puppeteer = require('puppeteer');
      
      // Crear directorio temporal si no existe
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const pdfFile = path.join(tempDir, `print_${timestamp}.pdf`);
      
      // Generar contenido HTML optimizado para térmica
      const htmlContent = generateThermalHTML(items, tableNumber, customerName);
      
      // Generar PDF con Puppeteer
      const pdfGenerated = await generatePDFWithPuppeteer(htmlContent, pdfFile);
      
      if (pdfGenerated) {
        console.log('📄 PDF generado:', pdfFile);
        
        // Imprimir PDF usando PowerShell
        const printCommand = `powershell -Command "Start-Process -FilePath '${pdfFile}' -Verb Print -WindowStyle Hidden"`;
        
        exec(printCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Error ejecutando comando de impresión:', error);
            // Limpiar archivo temporal
            if (fs.existsSync(pdfFile)) {
              fs.unlinkSync(pdfFile);
            }
            
            res.status(500).json({
              success: false,
              error: `Error de impresión: ${error.message}`,
              fallbackContent: htmlContent
            });
          } else {
            console.log('✅ Comando de impresión ejecutado');
            
            // Limpiar archivo temporal después de un delay
            setTimeout(() => {
              if (fs.existsSync(pdfFile)) {
                fs.unlinkSync(pdfFile);
              }
            }, 10000);
            
            res.json({
              success: true,
              message: `Ticket impreso correctamente en ${printerId}`,
              printerId: printerId,
              itemsCount: items.length,
              timestamp: new Date().toISOString()
            });
          }
        });
        
      } else {
        // Fallback: imprimir HTML directamente
        console.log('🔄 Intentando fallback con HTML directo...');
        const htmlFile = path.join(tempDir, `fallback_${timestamp}.html`);
        fs.writeFileSync(htmlFile, htmlContent, 'utf8');
        
        const mshtaCommand = `mshta "javascript:var w=window.open('${htmlFile}','','width=80mm,height=auto');w.print();w.close();close();"`;
        
        exec(mshtaCommand, (error, stdout, stderr) => {
          // Limpiar archivo HTML
          setTimeout(() => {
            if (fs.existsSync(htmlFile)) {
              fs.unlinkSync(htmlFile);
            }
          }, 5000);
          
          if (error) {
            console.error('❌ Error con HTML directo:', error.message);
            res.status(500).json({
              success: false,
              error: `Error de impresión: ${error.message}`
            });
          } else {
            console.log('✅ Impresión HTML directa ejecutada');
            res.json({
              success: true,
              message: `Ticket impreso correctamente en ${printerId}`,
              printerId: printerId,
              itemsCount: items.length,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
      
    } catch (printError) {
      console.error('❌ Error en impresión:', printError);
      
      res.status(500).json({
        success: false,
        error: `Error de impresión: ${printError.message}`
      });
    }
    
  } catch (error) {
    console.error('❌ Error imprimiendo ESC/POS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ENDPOINTS ESC/POS =====

// Almacenar conexiones activas de impresoras
const activeConnections = new Map();

// Endpoint para detectar impresoras USB ESC/POS
app.get('/escpos/usb-printers', async (req, res) => {
  try {
    console.log('🔍 Detectando impresoras USB ESC/POS...');
    
    const devices = escpos.USB.findPrinter();
    const printers = devices.map((device, index) => ({
      id: `usb-${index}`,
      name: `Impresora USB ${index + 1}`,
      type: 'usb',
      device: device,
      isConnected: false
    }));

    console.log(`✅ Se detectaron ${printers.length} impresoras USB ESC/POS`);
    printers.forEach((printer, index) => {
      console.log(`  ${index + 1}. ${printer.name}`);
    });

    res.json({
      success: true,
      printers: printers,
      count: printers.length
    });
  } catch (error) {
    console.error('❌ Error detectando impresoras USB ESC/POS:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      printers: []
    });
  }
});

// Endpoint para conectar a una impresora ESC/POS
app.post('/escpos/connect', async (req, res) => {
  try {
    const { printerId } = req.body;
    
    console.log(`🔌 Conectando a impresora ESC/POS: ${printerId}`);
    
    // Por ahora, simular conexión exitosa
    activeConnections.set(printerId, { connected: true, timestamp: new Date() });
    
    console.log(`✅ Conectado a impresora ${printerId}`);
    
    res.json({
      success: true,
      message: `Conectado a impresora ${printerId}`,
      printerId: printerId
    });
  } catch (error) {
    console.error('❌ Error conectando a impresora ESC/POS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para desconectar de una impresora ESC/POS
app.post('/escpos/disconnect', async (req, res) => {
  try {
    const { printerId } = req.body;
    
    console.log(`🔌 Desconectando de impresora ESC/POS: ${printerId}`);
    
    activeConnections.delete(printerId);
    
    console.log(`✅ Desconectado de impresora ${printerId}`);
    
    res.json({
      success: true,
      message: `Desconectado de impresora ${printerId}`,
      printerId: printerId
    });
  } catch (error) {
    console.error('❌ Error desconectando de impresora ESC/POS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
        @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 42px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            width: 80mm;
            max-width: 80mm;
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
            font-size: 54px;
            margin-bottom: 8mm;
            text-transform: uppercase;
        }
        
        .separator {
            border-top: 6px solid #000;
            margin: 4mm 0;
            width: 100%;
        }
        
        .info-line {
            margin: 3mm 0;
            font-size: 36px;
        }
        
        .order-title {
            text-align: center;
            font-weight: bold;
            font-size: 42px;
            margin: 6mm 0;
            text-transform: uppercase;
        }
        
        .item {
            margin: 4mm 0;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 36px;
        }
        
        .item-price {
            text-align: right;
            font-size: 33px;
            margin-top: 2mm;
        }
        
        .total {
            text-align: center;
            font-weight: bold;
            font-size: 48px;
            margin: 8mm 0;
            text-transform: uppercase;
        }
        
        .thanks {
            text-align: center;
            font-weight: bold;
            font-size: 42px;
            margin: 10mm 0;
            text-transform: uppercase;
        }
        
        .spacer {
            height: 8mm;
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
       preferCSSPageSize: false
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

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor de impresoras iniciado en http://localhost:${PORT}`);
  console.log(`📋 Endpoint de impresoras: http://localhost:${PORT}/printers`);
  console.log(`🏠 Endpoint de salud: http://localhost:${PORT}/health`);
});

// Mantener el servidor ejecutándose
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor de impresoras...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor de impresoras...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
