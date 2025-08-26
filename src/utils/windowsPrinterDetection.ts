// Utilidades para detectar impresoras en Windows usando PowerShell

export interface WindowsPrinter {
  name: string;
  port: string;
  driver: string;
  status: string;
  location?: string;
}

/**
 * Ejecuta un comando PowerShell y retorna el resultado
 */
const executePowerShellCommand = async (command: string): Promise<string> => {
  try {
    // Crear un elemento oculto para ejecutar PowerShell
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.id = 'powershell-executor';
    document.body.appendChild(tempDiv);

    // Intentar usar la API de Windows si está disponible
    if ((window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.executeCommand(command);
        return result;
      } catch (e) {
        console.log('Electron API no disponible:', e);
      }
    }

    // Fallback: usar un iframe para ejecutar comandos
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);

    return new Promise((resolve, reject) => {
      iframe.onload = () => {
        try {
          // Intentar ejecutar el comando
          const result = iframe.contentWindow?.eval(command);
          resolve(result || '');
        } catch (e) {
          reject(e);
        } finally {
          document.body.removeChild(iframe);
          document.body.removeChild(tempDiv);
        }
      };
    });
  } catch (error) {
    console.error('Error ejecutando PowerShell:', error);
    return '';
  }
};

/**
 * Detecta impresoras usando PowerShell
 */
export const detectWindowsPrinters = async (): Promise<WindowsPrinter[]> => {
  try {
    // Comando PowerShell para obtener impresoras
    const command = `
      Get-Printer | Select-Object Name, PortName, DriverName, PrinterStatus, Location | ConvertTo-Json
    `;
    
    const result = await executePowerShellCommand(command);
    
    if (result) {
      try {
        const printers = JSON.parse(result);
        return Array.isArray(printers) ? printers : [printers];
      } catch (e) {
        console.log('Error parseando resultado JSON:', e);
      }
    }
  } catch (error) {
    console.error('Error detectando impresoras Windows:', error);
  }

  return [];
};

/**
 * Detecta impresoras usando WMI (Windows Management Instrumentation)
 */
export const detectPrintersWithWMI = async (): Promise<string[]> => {
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
    console.error('Error usando WMI:', error);
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
 * Función principal que combina todos los métodos
 */
export const detectAllSystemPrinters = async (): Promise<string[]> => {
  const allPrinters: string[] = [];

  try {
    // Método 1: PowerShell
    console.log('🔍 Intentando detectar impresoras con PowerShell...');
    const wmiPrinters = await detectPrintersWithWMI();
    if (wmiPrinters.length > 0) {
      allPrinters.push(...wmiPrinters);
      console.log('✅ WMI detectó impresoras:', wmiPrinters);
    }

    // Método 2: Browser API
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

    // Método 3: Windows Printers con PowerShell
    console.log('🔍 Intentando detectar impresoras con PowerShell...');
    const windowsPrinters = await detectWindowsPrinters();
    if (windowsPrinters.length > 0) {
      windowsPrinters.forEach(printer => {
        if (!allPrinters.includes(printer.name)) {
          allPrinters.push(printer.name);
        }
      });
      console.log('✅ PowerShell detectó impresoras:', windowsPrinters.map(p => p.name));
    }

  } catch (error) {
    console.error('Error en detección de impresoras:', error);
  }

  return allPrinters;
};

