// Ejemplo de integración del servicio Java en el dashboard de KimiPOS
// Este archivo muestra cómo implementar la impresión en tu aplicación React

import React, { useState } from 'react';

// Tipos TypeScript para la integración
interface PrintItem {
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

interface TicketData {
  items: PrintItem[];
  tableNumber: string;
  customerName?: string;
  restaurantName?: string;
}

interface PrintResponse {
  success: boolean;
  message: string;
  method?: string;
}

// Función para enviar datos al servicio Java
async function sendToJavaPrinter(ticketData: TicketData): Promise<PrintResponse> {
  try {
    const response = await fetch('http://localhost:3002', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al comunicarse con el servicio Java:', error);
    throw error;
  }
}

// Componente de ejemplo para el botón de impresión
interface PrintButtonProps {
  orderData: TicketData;
  onPrintSuccess?: () => void;
  onPrintError?: (error: string) => void;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ 
  orderData, 
  onPrintSuccess, 
  onPrintError 
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus('printing');

    try {
      console.log('🖨️ Enviando pedido a impresión:', orderData);
      
      const result = await sendToJavaPrinter(orderData);
      
      if (result.success) {
        setPrintStatus('success');
        console.log('✅ Impresión exitosa:', result.message);
        onPrintSuccess?.();
        
        // Resetear estado después de 3 segundos
        setTimeout(() => {
          setPrintStatus('idle');
        }, 3000);
      } else {
        setPrintStatus('error');
        console.error('❌ Error en impresión:', result.message);
        onPrintError?.(result.message);
      }
    } catch (error) {
      setPrintStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error de comunicación:', errorMessage);
      onPrintError?.(errorMessage);
    } finally {
      setIsPrinting(false);
    }
  };

  const getButtonText = () => {
    switch (printStatus) {
      case 'printing':
        return '🖨️ Imprimiendo...';
      case 'success':
        return '✅ ¡Impreso!';
      case 'error':
        return '❌ Error';
      default:
        return '🖨️ Imprimir Ticket';
    }
  };

  const getButtonClass = () => {
    switch (printStatus) {
      case 'printing':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`px-6 py-3 text-white font-semibold rounded-lg transition-colors duration-200 ${getButtonClass()} ${
        isPrinting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {getButtonText()}
    </button>
  );
};

// Hook personalizado para manejar la impresión
export const usePrintService = () => {
  const [isPrinting, setIsPrinting] = useState(false);

  const printTicket = async (ticketData: TicketData): Promise<PrintResponse> => {
    setIsPrinting(true);
    
    try {
      const result = await sendToJavaPrinter(ticketData);
      return result;
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    printTicket,
    isPrinting,
  };
};

// Ejemplo de uso en un componente de pedido
export const OrderComponent: React.FC = () => {
  const [order, setOrder] = useState<TicketData>({
    items: [
      { quantity: 2, productName: 'Hamburguesa Clásica', unitPrice: 12.50, totalPrice: 25.00 },
      { quantity: 1, productName: 'Coca Cola 330ml', unitPrice: 2.50, totalPrice: 2.50 }
    ],
    tableNumber: 'MESA-12',
    customerName: 'MARÍA GARCÍA',
    restaurantName: 'RESTAURANTE EL BUENO'
  });

  const handlePrintSuccess = () => {
    // Mostrar notificación de éxito
    console.log('🎉 Ticket impreso correctamente');
    // Aquí podrías mostrar un toast o notificación
  };

  const handlePrintError = (error: string) => {
    // Mostrar notificación de error
    console.error('❌ Error al imprimir:', error);
    // Aquí podrías mostrar un toast o notificación de error
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Pedido Actual</h2>
      
      <div className="mb-4">
        <p><strong>Mesa:</strong> {order.tableNumber}</p>
        <p><strong>Cliente:</strong> {order.customerName}</p>
        <p><strong>Total:</strong> {order.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} EUR</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Items:</h3>
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>{item.quantity}x {item.productName}</span>
            <span>{item.totalPrice.toFixed(2)} EUR</span>
          </div>
        ))}
      </div>

      <PrintButton
        orderData={order}
        onPrintSuccess={handlePrintSuccess}
        onPrintError={handlePrintError}
      />
    </div>
  );
};

// Ejemplo de integración con el contexto de la aplicación
export const useOrderContext = () => {
  const { printTicket, isPrinting } = usePrintService();

  const handleOrderPrint = async (order: TicketData) => {
    try {
      const result = await printTicket(order);
      
      if (result.success) {
        // Actualizar estado del pedido
        console.log('✅ Pedido impreso y enviado a cocina');
        return { success: true, message: 'Pedido impreso correctamente' };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  };

  return {
    handleOrderPrint,
    isPrinting,
  };
};

// Configuración del servicio
export const PRINT_SERVICE_CONFIG = {
  host: 'localhost',
  port: 3002,
  timeout: 10000, // 10 segundos
};

// Función de utilidad para validar datos antes de imprimir
export const validateTicketData = (data: TicketData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.items || data.items.length === 0) {
    errors.push('El pedido debe tener al menos un item');
  }

  if (!data.tableNumber) {
    errors.push('Debe especificar el número de mesa');
  }

  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.productName) {
        errors.push(`Item ${index + 1}: Falta nombre del producto`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Precio unitario no puede ser negativo`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
