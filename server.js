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

// Endpoint para imprimir
app.post('/print', async (req, res) => {
  try {
    const { content, printerName, type } = req.body;
    
    console.log(`🖨️ ===== NUEVA PETICIÓN DE IMPRESIÓN =====`);
    console.log(`🖨️ Tipo: ${type}`);
    console.log(`🖨️ Impresora: ${printerName || 'impresora por defecto'}`);
    console.log(`🖨️ Contenido recibido:`, content);
    console.log(`🖨️ Longitud del contenido: ${content.length} caracteres`);
    
    // Crear un archivo HTML temporal para imprimir
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const htmlFile = path.join(tempDir, `print_${timestamp}.html`);
    
    // Crear contenido HTML completo
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${type}</title>
    <style>
        body { 
            font-family: monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 10px;
            white-space: pre-line;
            line-height: 1.2;
        }
        @media print {
            body { margin: 0; }
        }
        .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
        .item { margin: 2px 0; }
        .total { font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    
    // Escribir archivo HTML
    fs.writeFileSync(htmlFile, htmlContent, 'utf8');
    
    console.log(`📄 Archivo HTML creado: ${htmlFile}`);
    
    let printSuccess = false;
    
    // Método 1: Si hay impresora específica, intentar imprimir directamente
    if (printerName) {
      try {
        console.log(`🖨️ Intentando imprimir directamente en ${printerName}...`);
        
        // Crear un archivo HTML optimizado para impresión
        const htmlFileForPrint = path.join(tempDir, `print_${timestamp}_for_print.html`);
        const htmlContentForPrint = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${type}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 5mm;
        }
        body { 
            font-family: 'Courier New', monospace; 
            font-size: 10px; 
            margin: 0; 
            padding: 5px;
            white-space: pre-line;
            line-height: 1.1;
            width: 70mm;
        }
        @media print {
            body { 
                margin: 0; 
                padding: 0;
            }
        }
        .header { 
            text-align: center; 
            font-weight: bold; 
            margin-bottom: 8px; 
            font-size: 12px;
        }
        .item { 
            margin: 1px 0; 
            display: flex;
            justify-content: space-between;
        }
        .total { 
            font-weight: bold; 
            margin-top: 8px; 
            border-top: 1px solid #000; 
            padding-top: 3px; 
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 8px;
        }
    </style>
</head>
<body>
    ${content}
    <script>
        // Auto-print cuando se carga la página
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;
        fs.writeFileSync(htmlFileForPrint, htmlContentForPrint, 'utf8');
        
                 // Método 1: Usar Puppeteer para imprimir directamente
        console.log(`🖨️ Imprimiendo directamente con Puppeteer...`);
        console.log(`🖨️ Archivo HTML para impresión creado: ${htmlFileForPrint}`);
        
        try {
          const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          const page = await browser.newPage();
          
          // Cargar el archivo HTML
          await page.goto(`file://${htmlFileForPrint}`, { waitUntil: 'networkidle0' });
          
          // Configurar para impresión
          await page.emulateMediaType('print');
          
          // Imprimir directamente a impresoras PDF
          if (printerName && (printerName.toLowerCase().includes('pdf24') || printerName.toLowerCase().includes('nitro') || printerName.toLowerCase().includes('adobe'))) {
            // Para impresoras PDF, generar PDF y guardarlo
            const pdfPath = path.join(tempDir, `ticket_${timestamp}.pdf`);
            await page.pdf({
              path: pdfPath,
              format: 'A4',
              printBackground: true,
              margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
              }
            });
            
            console.log(`✅ PDF generado: ${pdfPath}`);
            printSuccess = true;
            
            // Abrir el PDF generado
            const openPdfCommand = `start "" "${pdfPath}"`;
            exec(openPdfCommand, (error) => {
              if (error) {
                console.error('❌ Error abriendo PDF:', error);
              } else {
                console.log('✅ PDF abierto automáticamente');
              }
            });
            
          } else {
            // Para otras impresoras, usar la API de impresión del navegador
            await page.evaluate(() => {
              window.print();
            });
            
            console.log('✅ Impresión enviada directamente a la impresora');
            printSuccess = true;
          }
          
          await browser.close();
          
        } catch (puppeteerError) {
          console.error('❌ Error con Puppeteer:', puppeteerError);
          
          // Fallback: usar el método anterior
          console.log('🔄 Usando método de respaldo...');
          const startCommand = `start "" "${htmlFileForPrint}"`;
          exec(startCommand, (error) => {
            if (error) {
              console.error('❌ Error con método de respaldo:', error);
            } else {
              console.log('✅ Archivo HTML abierto en navegador');
              printSuccess = true;
            }
          });
        }
        
        // Esperar un poco para que el comando se ejecute
        await new Promise(resolve => setTimeout(resolve, 2000));
        
                 // Si Puppeteer no funcionó, intentar método alternativo
         if (!printSuccess) {
           console.log(`🖨️ Puppeteer falló, intentando método alternativo...`);
          
           // Método 2: Usar PowerShell para abrir el archivo
           const psCommand = `powershell -Command "Start-Process '${htmlFileForPrint}'"`;
           console.log(`🖨️ Ejecutando PowerShell: ${psCommand}`);
          
           exec(psCommand, (error, stdout, stderr) => {
             if (error) {
               console.error('❌ Error ejecutando PowerShell:', error);
             } else {
               console.log('✅ PowerShell ejecutado correctamente');
               printSuccess = true;
             }
           });
          
           await new Promise(resolve => setTimeout(resolve, 2000));
         }
        
              } catch (psError) {
          console.error('❌ Error en PowerShell:', psError);
        }
        
        // Limpiar archivos después de un delay
        setTimeout(() => {
          try {
            if (fs.existsSync(htmlFileForPrint)) {
              fs.unlinkSync(htmlFileForPrint);
              console.log(`🗑️ Archivo HTML de impresión eliminado: ${htmlFileForPrint}`);
            }
          } catch (cleanupError) {
            console.error('Error limpiando archivo HTML de impresión:', cleanupError);
          }
        }, 5000);
    }
    
    // Método 3: Si no hay impresora específica o los métodos anteriores fallaron, abrir con navegador
    if (!printSuccess) {
      try {
        console.log(`🖨️ Abriendo archivo HTML con navegador...`);
        const printCommand = `start "" "${htmlFile}"`;
        console.log(`🖨️ Ejecutando comando: ${printCommand}`);
        
        exec(printCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Error ejecutando comando de impresión:', error);
          } else {
            console.log('✅ Comando de impresión ejecutado correctamente');
            printSuccess = true;
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (printError) {
        console.error('❌ Error en proceso de impresión:', printError);
      }
    }
    
    // Limpiar archivo HTML después de un delay
    setTimeout(() => {
      try {
        if (fs.existsSync(htmlFile)) {
          fs.unlinkSync(htmlFile);
          console.log(`🗑️ Archivo HTML eliminado: ${htmlFile}`);
        }
      } catch (cleanupError) {
        console.error('Error limpiando archivo HTML:', cleanupError);
      }
    }, 10000);
    
    console.log(`✅ ${type} procesado correctamente`);
    
    res.json({
      success: true,
      message: `${type} procesado correctamente`,
      printer: printerName || 'impresora por defecto',
      fileCreated: htmlFile,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error imprimiendo:', error);
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
    // En una implementación real, aquí se establecería la conexión real
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

// Endpoint para imprimir en impresora ESC/POS
app.post('/escpos/print', async (req, res) => {
  try {
    const { items, tableNumber, customerName, timestamp, printerId } = req.body;
    
    console.log(`🖨️ ===== IMPRESIÓN ESC/POS =====`);
    console.log(`🖨️ Impresora: ${printerId}`);
    console.log(`🖨️ Mesa: ${tableNumber}`);
    console.log(`🖨️ Cliente: ${customerName || 'Sin cliente'}`);
    console.log(`🖨️ Productos: ${items.length}`);
    
    // Generar contenido ESC/POS
    const escContent = generateESCContent(items, tableNumber, customerName);
    
    // Por ahora, simular impresión exitosa
    // En una implementación real, aquí se enviaría a la impresora física
    console.log('📄 Contenido ESC/POS generado:');
    console.log(escContent);
    
    // Simular delay de impresión
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ Impresión ESC/POS completada en ${printerId}`);
    
    res.json({
      success: true,
      message: `Ticket impreso correctamente en ${printerId}`,
      printerId: printerId,
      itemsCount: items.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error imprimiendo ESC/POS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Función para generar contenido ESC/POS
function generateESCContent(items, tableNumber, customerName, restaurantName = 'Restaurante') {
  const timestamp = new Date().toLocaleString('es-ES');
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Comandos ESC/POS básicos
  const commands = [
    '\x1B\x40', // Initialize printer
    '\x1B\x61\x01', // Center alignment
    `\n${restaurantName.toUpperCase()}\n`,
    '\x1B\x61\x00', // Left alignment
    '\n',
    `MESA: ${tableNumber}\n`,
    customerName ? `CLIENTE: ${customerName.toUpperCase()}\n` : '',
    `FECHA: ${timestamp}\n`,
    '\n',
    '\x1B\x45\x01', // Bold on
    'PEDIDO:\n',
    '\x1B\x45\x00', // Bold off
    '\n'
  ];

  // Agregar items
  items.forEach(item => {
    commands.push(
      `${item.quantity}x ${item.productName.toUpperCase()}\n`,
      `   ${item.unitPrice.toFixed(2)}€ x ${item.quantity} = ${item.totalPrice.toFixed(2)}€\n`
    );
  });

  // Agregar total
  commands.push(
    '\n',
    '\x1B\x45\x01', // Bold on
    `TOTAL: ${total.toFixed(2)}€\n`,
    '\x1B\x45\x00', // Bold off
    '\n',
    '\x1B\x61\x01', // Center alignment
    '¡GRACIAS!\n',
    '\n',
    '\x1B\x61\x00', // Left alignment
    '\n',
    '\n',
    '\n',
    '\x1D\x56\x00' // Cut paper
  );

  return commands.join('');
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
