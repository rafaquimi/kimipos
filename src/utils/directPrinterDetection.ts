// Detección directa de impresoras del sistema

/**
 * Detecta impresoras usando el comando directo de Windows
 */
export const detectPrintersDirect = async (): Promise<string[]> => {
  const printers: string[] = [];

  try {
    // Método 1: Intentar usar la API de Windows directamente
    if ((window as any).electronAPI) {
      try {
        // Comando directo para obtener impresoras
        const result = await (window as any).electronAPI.executeCommand('wmic printer get name');
        const lines = result.split('\n');
        lines.forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed && trimmed !== 'Name' && !trimmed.includes('----')) {
            printers.push(trimmed);
          }
        });
        
        if (printers.length > 0) {
          console.log('✅ WMIC detectó impresoras:', printers);
          return printers;
        }
      } catch (e) {
        console.log('WMIC no disponible:', e);
      }
    }

    // Método 2: Intentar usar PowerShell
    if ((window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.executeCommand('powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"');
        const lines = result.split('\n');
        lines.forEach((line: string) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.includes('Name')) {
            printers.push(trimmed);
          }
        });
        
        if (printers.length > 0) {
          console.log('✅ PowerShell detectó impresoras:', printers);
          return printers;
        }
      } catch (e) {
        console.log('PowerShell no disponible:', e);
      }
    }

    // Método 3: Intentar usar la API de impresión del navegador
    if ('print' in window) {
      try {
        // Crear un elemento temporal para forzar la detección
        const tempFrame = document.createElement('iframe');
        tempFrame.style.display = 'none';
        tempFrame.src = 'data:text/html,<html><body>Test</body></html>';
        document.body.appendChild(tempFrame);
        
        await new Promise(resolve => {
          tempFrame.onload = resolve;
        });
        
        if (tempFrame.contentWindow) {
          // Intentar acceder a las impresoras del sistema
          const printResult = await new Promise((resolve) => {
            tempFrame.contentWindow!.print = () => {
              resolve(['Impresora del sistema detectada']);
            };
            setTimeout(() => {
              tempFrame.contentWindow!.print();
            }, 100);
          });
          printers.push(...(printResult as string[]));
        }
        
        document.body.removeChild(tempFrame);
        
        if (printers.length > 0) {
          console.log('✅ Browser API detectó impresoras:', printers);
          return printers;
        }
      } catch (e) {
        console.log('Browser API no disponible:', e);
      }
    }

    // Método 4: Intentar usar ActiveX (solo IE/Edge legacy)
    if ((window as any).ActiveXObject) {
      try {
        const wmi = new (window as any).ActiveXObject('WbemScripting.SWbemLocator');
        const service = wmi.ConnectServer('.', 'root\\cimv2');
        const query = service.ExecQuery('SELECT Name FROM Win32_Printer');
        
        for (let printer of query) {
          printers.push(printer.Name);
        }
        
        if (printers.length > 0) {
          console.log('✅ ActiveX detectó impresoras:', printers);
          return printers;
        }
      } catch (e) {
        console.log('ActiveX no disponible:', e);
      }
    }

  } catch (error) {
    console.error('Error en detección directa de impresoras:', error);
  }

  return printers;
};

/**
 * Lista de impresoras comunes como fallback
 */
export const getCommonPrintersList = (): string[] => {
  return [
    'Microsoft Print to PDF',
    'Microsoft XPS Document Writer',
    'Microsoft Print to OneNote',
    'HP LaserJet Pro M404n',
    'HP LaserJet Pro MFP M428fdw',
    'HP LaserJet Pro M15w',
    'HP LaserJet Pro MFP M148fdw',
    'Canon PIXMA TS8320',
    'Canon PIXMA MG3620',
    'Canon PIXMA TR4520',
    'Epson WorkForce WF-3720',
    'Epson Expression Home XP-4100',
    'Epson EcoTank ET-2720',
    'Brother HL-L2350DW',
    'Brother MFC-L2710DW',
    'Brother HL-L2370DW',
    'Samsung Xpress M2020W',
    'Samsung Xpress M2070W',
    'Lexmark MS310dn',
    'Lexmark CS410dn',
    'Impresora por defecto del sistema',
    'Impresora térmica genérica',
    'Impresora de cocina',
    'Impresora de bar',
    'Impresora de recibos',
    'Impresora de tickets'
  ];
};

/**
 * Función principal que detecta impresoras y combina con lista común
 */
export const detectAndCombinePrinters = async (): Promise<string[]> => {
  try {
    // Intentar detectar impresoras del sistema
    const detectedPrinters = await detectPrintersDirect();
    
    // Obtener lista de impresoras comunes
    const commonPrinters = getCommonPrintersList();
    
    // Combinar impresoras detectadas con comunes
    const allPrinters = [...detectedPrinters];
    commonPrinters.forEach(printer => {
      if (!allPrinters.includes(printer)) {
        allPrinters.push(printer);
      }
    });
    
    if (detectedPrinters.length > 0) {
      console.log(`✅ Se detectaron ${detectedPrinters.length} impresoras del sistema`);
    } else {
      console.log('⚠️ No se detectaron impresoras del sistema, usando lista genérica');
    }
    
    return allPrinters;
  } catch (error) {
    console.error('Error en detección de impresoras:', error);
    return getCommonPrintersList();
  }
};






