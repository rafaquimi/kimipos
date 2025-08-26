// Utilidades para detectar impresoras usando métodos nativos

export interface NativePrinter {
  name: string;
  port: string;
  driver: string;
  status: string;
  location?: string;
}

/**
 * Detecta impresoras usando el comando wmic de Windows
 */
export const detectPrintersWithWMIC = async (): Promise<string[]> => {
  const printers: string[] = [];

  try {
    // Crear un elemento oculto para ejecutar comandos
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.id = 'wmic-executor';
    document.body.appendChild(tempDiv);

    // Intentar usar la API de Windows si está disponible
    if ((window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.executeCommand('wmic printer get name /format:csv');
        const lines = result.split('\n');
        lines.forEach((line: string) => {
          const match = line.match(/^[^,]*,\s*([^,\s].*[^,\s])\s*$/);
          if (match && match[1] !== 'Name' && match[1] !== '----') {
            printers.push(match[1].trim());
          }
        });
      } catch (e) {
        console.log('Electron API no disponible para WMIC:', e);
      }
    }

    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error('Error usando WMIC:', error);
  }

  return printers;
};

/**
 * Detecta impresoras usando PowerShell
 */
export const detectPrintersWithPowerShell = async (): Promise<string[]> => {
  const printers: string[] = [];

  try {
    // Intentar usar la API de Windows si está disponible
    if ((window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.executeCommand('powershell -Command "Get-Printer | Select-Object Name | ConvertTo-Json"');
        try {
          const data = JSON.parse(result);
          if (Array.isArray(data)) {
            data.forEach((printer: any) => {
              if (printer.Name) {
                printers.push(printer.Name);
              }
            });
          } else if (data.Name) {
            printers.push(data.Name);
          }
        } catch (e) {
          console.log('Error parseando resultado de PowerShell:', e);
        }
      } catch (e) {
        console.log('Electron API no disponible para PowerShell:', e);
      }
    }
  } catch (error) {
    console.error('Error usando PowerShell:', error);
  }

  return printers;
};

/**
 * Detecta impresoras usando la API de Windows nativa
 */
export const detectPrintersWithWindowsAPI = async (): Promise<string[]> => {
  const printers: string[] = [];

  try {
    // Intentar usar ActiveX para WMI (solo funciona en IE/Edge legacy)
    if ((window as any).ActiveXObject) {
      try {
        const wmi = new (window as any).ActiveXObject('WbemScripting.SWbemLocator');
        const service = wmi.ConnectServer('.', 'root\\cimv2');
        const query = service.ExecQuery('SELECT Name FROM Win32_Printer');
        
        for (let printer of query) {
          printers.push(printer.Name);
        }
      } catch (e) {
        console.log('WMI no disponible:', e);
      }
    }
  } catch (error) {
    console.error('Error usando Windows API:', error);
  }

  return printers;
};

/**
 * Detecta impresoras usando la API de impresión del navegador
 */
export const detectPrintersWithBrowserAPI = async (): Promise<string[]> => {
  const printers: string[] = [];

  try {
    // Método 1: Web Printing API moderna
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

    // Método 2: Intentar usar la función de impresión nativa
    if (printers.length === 0) {
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
      } catch (e) {
        console.log('No se pudo detectar impresoras del navegador:', e);
      }
    }
  } catch (error) {
    console.error('Error usando API del navegador:', error);
  }

  return printers;
};

/**
 * Función principal que combina todos los métodos de detección
 */
export const detectAllNativePrinters = async (): Promise<string[]> => {
  const allPrinters: string[] = [];

  try {
    // Método 1: WMIC
    console.log('🔍 Intentando detectar impresoras con WMIC...');
    const wmicPrinters = await detectPrintersWithWMIC();
    if (wmicPrinters.length > 0) {
      allPrinters.push(...wmicPrinters);
      console.log('✅ WMIC detectó impresoras:', wmicPrinters);
    }

    // Método 2: PowerShell
    console.log('🔍 Intentando detectar impresoras con PowerShell...');
    const psPrinters = await detectPrintersWithPowerShell();
    if (psPrinters.length > 0) {
      psPrinters.forEach(printer => {
        if (!allPrinters.includes(printer)) {
          allPrinters.push(printer);
        }
      });
      console.log('✅ PowerShell detectó impresoras:', psPrinters);
    }

    // Método 3: Windows API
    console.log('🔍 Intentando detectar impresoras con Windows API...');
    const winPrinters = await detectPrintersWithWindowsAPI();
    if (winPrinters.length > 0) {
      winPrinters.forEach(printer => {
        if (!allPrinters.includes(printer)) {
          allPrinters.push(printer);
        }
      });
      console.log('✅ Windows API detectó impresoras:', winPrinters);
    }

    // Método 4: Browser API
    console.log('🔍 Intentando detectar impresoras con Browser API...');
    const browserPrinters = await detectPrintersWithBrowserAPI();
    if (browserPrinters.length > 0) {
      browserPrinters.forEach(printer => {
        if (!allPrinters.includes(printer)) {
          allPrinters.push(printer);
        }
      });
      console.log('✅ Browser API detectó impresoras:', browserPrinters);
    }

  } catch (error) {
    console.error('Error en detección de impresoras:', error);
  }

  return allPrinters;
};

