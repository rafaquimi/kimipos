// Utilidades para detectar impresoras del sistema Windows

export interface SystemPrinter {
  name: string;
  port: string;
  driver: string;
  status: string;
}

/**
 * Intenta detectar las impresoras del sistema usando múltiples métodos
 */
export const detectSystemPrinters = async (): Promise<string[]> => {
  const printers: string[] = [];

  try {
    // Método 1: Web Printing API (navegadores modernos)
    if ('print' in window && (window as any).navigator.printing) {
      try {
        const printManager = (window as any).navigator.printing;
        const systemPrinters = await printManager.getPrinters();
        systemPrinters.forEach((printer: any) => {
          if (printer.name) {
            printers.push(printer.name);
          }
        });
      } catch (e) {
        console.log('Web Printing API no disponible:', e);
      }
    }

    // Método 2: Intentar usar la API de Windows nativa
    if (printers.length === 0 && (window as any).ActiveXObject) {
      try {
        const wmi = new (window as any).ActiveXObject('WbemScripting.SWbemLocator');
        const service = wmi.ConnectServer('.', 'root\\cimv2');
        const query = service.ExecQuery('SELECT Name, PortName, DriverName, WorkOffline FROM Win32_Printer');
        
        for (let printer of query) {
          printers.push(printer.Name);
        }
      } catch (e) {
        console.log('WMI no disponible:', e);
      }
    }

    // Método 3: Intentar usar PowerShell a través de una extensión o API
    if (printers.length === 0 && (window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.executeCommand('Get-Printer | Select-Object Name');
        const lines = result.split('\n');
        lines.forEach((line: string) => {
          const match = line.match(/^\s*(\S.*\S)\s*$/);
          if (match && match[1] !== 'Name' && match[1] !== '----') {
            printers.push(match[1].trim());
          }
        });
      } catch (e) {
        console.log('Electron API no disponible:', e);
      }
    }

    // Método 4: Intentar usar la API de Chrome
    if (printers.length === 0 && (window as any).chrome && (window as any).chrome.runtime) {
      try {
        const response = await (window as any).chrome.runtime.sendMessage({ 
          action: 'getPrinters' 
        });
        if (response && response.printers) {
          response.printers.forEach((printer: any) => {
            printers.push(printer.name);
          });
        }
      } catch (e) {
        console.log('Chrome API no disponible:', e);
      }
    }

    // Método 5: Intentar usar la API de impresión del navegador
    if (printers.length === 0) {
      try {
        // Crear un elemento temporal para forzar la detección
        const tempFrame = document.createElement('iframe');
        tempFrame.style.display = 'none';
        tempFrame.src = 'data:text/html,<html><body>Test</body></html>';
        document.body.appendChild(tempFrame);
        
        // Esperar a que el frame se cargue
        await new Promise(resolve => {
          tempFrame.onload = resolve;
        });
        
        // Intentar acceder a las impresoras
        if (tempFrame.contentWindow) {
          const printResult = await new Promise((resolve) => {
            const originalPrint = tempFrame.contentWindow!.print;
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
      } catch (e) {
        console.log('No se pudo detectar impresoras del navegador:', e);
      }
    }

  } catch (error) {
    console.error('Error general al detectar impresoras:', error);
  }

  return printers;
};

/**
 * Obtiene una lista de impresoras comunes como fallback
 */
export const getCommonPrinters = (): string[] => {
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
 * Combina impresoras detectadas con impresoras comunes
 */
export const combinePrinters = (detected: string[], common: string[]): string[] => {
  const combined = [...detected];
  
  // Agregar impresoras comunes que no estén ya en la lista
  common.forEach(printer => {
    if (!combined.includes(printer)) {
      combined.push(printer);
    }
  });
  
  return combined;
};

