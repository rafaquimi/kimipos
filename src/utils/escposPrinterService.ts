import { OrderItem } from '../types/Ticket';

export interface ESCPOSPrinter {
  id: string;
  name: string;
  type: 'usb' | 'network' | 'serial';
  address?: string;
  port?: number;
  baudRate?: number;
  isConnected: boolean;
}

export interface ESCPOSPrintJob {
  items: OrderItem[];
  tableNumber: string;
  customerName?: string;
  timestamp: Date;
  printerId: string;
}

/**
 * Servicio para manejar impresoras térmicas ESC/POS
 */
class ESCPOSPrinterService {
  private printers: ESCPOSPrinter[] = [];
  private isInitialized = false;

  /**
   * Inicializar el servicio de impresoras ESC/POS
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Inicializando servicio ESC/POS...');
      
      // Detectar impresoras USB
      await this.detectUSBPrinters();
      
      // Detectar impresoras de red
      await this.detectNetworkPrinters();
      
      this.isInitialized = true;
      console.log(`✅ Servicio ESC/POS inicializado. ${this.printers.length} impresoras detectadas.`);
    } catch (error) {
      console.error('❌ Error inicializando servicio ESC/POS:', error);
      throw error;
    }
  }

  /**
   * Detectar impresoras USB
   */
  private async detectUSBPrinters(): Promise<void> {
    try {
      // En un entorno Electron, necesitamos usar el backend para detectar impresoras USB
      const response = await fetch('http://localhost:3001/escpos/usb-printers');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.printers.push(...data.printers);
          console.log(`🔌 ${data.printers.length} impresoras USB detectadas`);
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron detectar impresoras USB:', error);
    }
  }

  /**
   * Detectar impresoras de red
   */
  private async detectNetworkPrinters(): Promise<void> {
    try {
      // Por ahora, agregar algunas impresoras de red comunes
      const commonNetworkPrinters = [
        {
          id: 'network-1',
          name: 'Impresora Red 1',
          type: 'network' as const,
          address: '192.168.1.100',
          port: 9100,
          isConnected: false
        },
        {
          id: 'network-2', 
          name: 'Impresora Red 2',
          type: 'network' as const,
          address: '192.168.1.101',
          port: 9100,
          isConnected: false
        }
      ];

      this.printers.push(...commonNetworkPrinters);
      console.log(`🌐 ${commonNetworkPrinters.length} impresoras de red configuradas`);
    } catch (error) {
      console.warn('⚠️ Error configurando impresoras de red:', error);
    }
  }

  /**
   * Obtener todas las impresoras ESC/POS
   */
  getPrinters(): ESCPOSPrinter[] {
    return [...this.printers];
  }

  /**
   * Obtener una impresora por ID
   */
  getPrinterById(id: string): ESCPOSPrinter | undefined {
    return this.printers.find(p => p.id === id);
  }

  /**
   * Conectar a una impresora
   */
  async connectToPrinter(printerId: string): Promise<boolean> {
    try {
      const printer = this.getPrinterById(printerId);
      if (!printer) {
        throw new Error(`Impresora ${printerId} no encontrada`);
      }

      console.log(`🔌 Conectando a impresora ${printer.name}...`);

      const response = await fetch('http://localhost:3001/escpos/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          printer.isConnected = true;
          console.log(`✅ Conectado a impresora ${printer.name}`);
          return true;
        }
      }

      throw new Error('Error conectando a la impresora');
    } catch (error) {
      console.error(`❌ Error conectando a impresora ${printerId}:`, error);
      return false;
    }
  }

  /**
   * Desconectar de una impresora
   */
  async disconnectFromPrinter(printerId: string): Promise<boolean> {
    try {
      const printer = this.getPrinterById(printerId);
      if (!printer) {
        return false;
      }

      const response = await fetch('http://localhost:3001/escpos/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerId })
      });

      if (response.ok) {
        printer.isConnected = false;
        console.log(`🔌 Desconectado de impresora ${printer.name}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Error desconectando de impresora ${printerId}:`, error);
      return false;
    }
  }

  /**
   * Imprimir un ticket en una impresora ESC/POS
   */
  async printTicket(printJob: ESCPOSPrintJob): Promise<boolean> {
    try {
      console.log(`🖨️ Imprimiendo ticket en impresora ${printJob.printerId}...`);

      const response = await fetch('http://localhost:3001/escpos/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printJob)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Ticket impreso correctamente en ${printJob.printerId}`);
          return true;
        }
      }

      throw new Error('Error imprimiendo ticket');
    } catch (error) {
      console.error(`❌ Error imprimiendo ticket en ${printJob.printerId}:`, error);
      return false;
    }
  }

  /**
   * Generar contenido ESC/POS para un ticket
   */
  generateESCContent(
    items: OrderItem[],
    tableNumber: string,
    customerName?: string,
    restaurantName: string = 'Restaurante'
  ): string {
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

  /**
   * Probar una impresora
   */
  async testPrinter(printerId: string): Promise<boolean> {
    try {
      const testJob: ESCPOSPrintJob = {
        items: [
          {
            productId: 'test',
            productName: 'PRUEBA DE IMPRESORA',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            status: 'pending'
          }
        ],
        tableNumber: 'TEST',
        customerName: 'PRUEBA',
        timestamp: new Date(),
        printerId
      };

      return await this.printTicket(testJob);
    } catch (error) {
      console.error(`❌ Error en prueba de impresora ${printerId}:`, error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const escposPrinterService = new ESCPOSPrinterService();
