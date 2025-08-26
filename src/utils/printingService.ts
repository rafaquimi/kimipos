// Definición local de OrderItem para compatibilidad
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  modifiers?: string[];
  taxRate?: number;
  taxName?: string;
}
import { useProducts } from '../contexts/ProductContext';
import { useConfig } from '../contexts/ConfigContext';
import toast from 'react-hot-toast';

export interface PrintJob {
  items: OrderItem[];
  printerName: string;
  tableNumber: string;
  customerName?: string;
  timestamp: Date;
}

/**
 * Agrupa los productos del pedido según su impresora configurada
 */
export const groupItemsByPrinter = (
  orderItems: OrderItem[],
  getProductPrinter: (productId: string) => string | undefined
): Map<string, OrderItem[]> => {
  const printerGroups = new Map<string, OrderItem[]>();

  orderItems.forEach(item => {
    // Extraer el productId del item
    const productId = item.productId?.toString() || '';
    
    if (productId) {
      // Obtener la impresora configurada para este producto
      const printerName = getProductPrinter(productId);
      
      if (printerName) {
        // Si tiene impresora configurada, agrupar por impresora
        if (!printerGroups.has(printerName)) {
          printerGroups.set(printerName, []);
        }
        printerGroups.get(printerName)!.push(item);
      } else {
        // Si no tiene impresora configurada, usar "Sin Impresora"
        const defaultGroup = 'Sin Impresora';
        if (!printerGroups.has(defaultGroup)) {
          printerGroups.set(defaultGroup, []);
        }
        printerGroups.get(defaultGroup)!.push(item);
      }
    } else {
      // Si no hay productId, ir al grupo "Sin Impresora"
      const defaultGroup = 'Sin Impresora';
      if (!printerGroups.has(defaultGroup)) {
        printerGroups.set(defaultGroup, []);
      }
      printerGroups.get(defaultGroup)!.push(item);
    }
  });

  return printerGroups;
};

/**
 * Genera un ticket para una impresora específica
 */
export const generateTicketForPrinter = (
  items: OrderItem[],
  tableNumber: string,
  customerName?: string,
  config?: any,
  printerName?: string
): string => {
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const restaurantName = config?.businessData?.commercialName || 'Restaurante';
  
  const ticketContent = `
<div class="header">
  ${restaurantName}
</div>
<div class="header">
  ${printerName ? `TICKET - ${printerName.toUpperCase()}` : 'TICKET DE COBRO'}
</div>

Mesa: ${tableNumber}
${customerName ? `Cliente: ${customerName}` : ''}
Fecha: ${new Date().toLocaleString()}

<div class="header">PRODUCTOS</div>
${items.map(item => `
<div class="item">
  ${item.quantity}x ${item.productName}
  <div style="text-align: right;">$${item.totalPrice.toFixed(2)}</div>
</div>
`).join('')}

<div class="total">
  TOTAL: $${total.toFixed(2)}
</div>

<div style="text-align: center; margin-top: 20px;">
  ¡Gracias por su visita!
</div>
  `;
  
  return ticketContent;
};

/**
 * Función para imprimir usando el servidor backend
 */
const printToPrinter = async (content: string, printerName?: string, type: string = 'documento'): Promise<void> => {
  try {
    // Crear un timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    const response = await fetch('http://localhost:3001/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        printerName,
        type
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido del servidor');
    }

    console.log(`✅ ${result.message}`);
    
    // Esperar un poco para asegurar que la impresión se procese
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La impresión tardó demasiado en completarse');
    }
    console.error('Error imprimiendo:', error);
    throw error;
  }
};

/**
 * Función principal para procesar la impresión de un pedido
 */
export const processOrderPrinting = async (
  orderItems: OrderItem[],
  tableNumber: string,
  customerName?: string,
  getProductPrinter?: (productId: string) => string | undefined,
  config?: any
): Promise<void> => {
  try {
    if (!getProductPrinter) {
      console.warn('Función de configuración de impresora no disponible');
      return;
    }

    // Agrupar productos por impresora
    const printerGroups = groupItemsByPrinter(orderItems, getProductPrinter);

    console.log('📋 Grupos de impresión:', printerGroups.size);
    printerGroups.forEach((items, printer) => {
      console.log(`   - ${printer}: ${items.length} productos`);
    });

    let hasPrintingErrors = false;
    let printedCount = 0;
    let totalPrintJobs = 0;

    // Contar trabajos de impresión totales
    for (const [printerName, items] of printerGroups) {
      if (items.length > 0 && printerName !== 'Sin Impresora') {
        totalPrintJobs++;
      }
    }

    // Imprimir cada grupo en su impresora correspondiente
    for (const [printerName, items] of printerGroups) {
      if (items.length === 0) continue;

      const ticketContent = generateTicketForPrinter(items, tableNumber, customerName, config, printerName);
      console.log(`🖨️ Imprimiendo en ${printerName}:`, ticketContent);
      
      try {
        const toastId = `printer-${printerName}`;
        toast.loading(`Imprimiendo en ${printerName} (${items.length} productos)...`, { id: toastId });
        
        // Solo imprimir si tiene una impresora configurada
        if (printerName !== 'Sin Impresora') {
          // Esperar a que termine completamente esta impresión
          await printToPrinter(ticketContent, printerName, `Ticket ${printerName}`);
          
          // Esperar un poco más para asegurar que la impresión se complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          toast.success(`Impreso correctamente en ${printerName}`, { id: toastId });
          console.log(`✅ Impreso correctamente en ${printerName}`);
          printedCount++;
        } else {
          toast.error(`Sin impresora configurada para ${items.length} productos`, { id: toastId });
          console.warn(`⚠️ Sin impresora configurada para ${items.length} productos`);
        }
      } catch (error) {
        const toastId = `printer-${printerName}`;
        toast.error(`Error imprimiendo en ${printerName}`, { id: toastId });
        console.error(`❌ Error imprimiendo en ${printerName}:`, error);
        hasPrintingErrors = true;
      }
    }

    // Mostrar resumen final
    console.log('✅ Impresión procesada correctamente');
    console.log(`📊 Resumen: ${printedCount}/${totalPrintJobs} impresiones exitosas`);
    printerGroups.forEach((items, printer) => {
      console.log(`   - ${printer}: ${items.length} productos`);
    });

    // Si hubo errores, lanzar una excepción para que el Dashboard lo maneje
    if (hasPrintingErrors) {
      throw new Error('Algunas impresiones fallaron');
    }

  } catch (error) {
    console.error('❌ Error procesando impresión:', error);
    throw error; // Re-lanzar el error para que el Dashboard lo maneje
  }
};

/**
 * Función para imprimir usando la API del navegador (fallback)
 */
export const printUsingBrowserAPI = (content: string, printerName?: string): void => {
  try {
    // Crear un iframe temporal para la impresión
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    printFrame.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket</title>
          <style>
            body { 
              font-family: monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 10px;
              white-space: pre-line;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    
    document.body.appendChild(printFrame);
    
    printFrame.onload = () => {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  } catch (error) {
    console.error('Error imprimiendo con API del navegador:', error);
  }
};
