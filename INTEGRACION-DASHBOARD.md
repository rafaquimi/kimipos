# 🎯 Integración del Servicio Java con el Dashboard KimiPOS

## ✅ **RESULTADO DE LAS PRUEBAS**

La integración ha sido **completamente exitosa**:
- ✅ **3 escenarios probados** con diferentes tipos de pedidos
- ✅ **Comunicación dashboard → Java** funcionando perfectamente
- ✅ **Impresión exitosa** en todos los casos
- ✅ **Formato correcto** (48 caracteres para 80mm)
- ✅ **Corte automático** funcionando

## 🚀 **CÓMO INTEGRAR EN TU DASHBOARD**

### 1. **Preparar el Servicio Java**

```bash
# Compilar y ejecutar el servicio Java
.\compile-and-run-java.bat

# O manualmente:
javac PrinterServiceDev.java
java PrinterServiceDev
```

### 2. **Función de Comunicación en tu Dashboard**

```typescript
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
```

### 3. **Componente de Botón de Impresión**

```typescript
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
      const result = await sendToJavaPrinter(orderData);
      
      if (result.success) {
        setPrintStatus('success');
        onPrintSuccess?.();
        
        setTimeout(() => {
          setPrintStatus('idle');
        }, 3000);
      } else {
        setPrintStatus('error');
        onPrintError?.(result.message);
      }
    } catch (error) {
      setPrintStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onPrintError?.(errorMessage);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`px-6 py-3 text-white font-semibold rounded-lg transition-colors duration-200 ${
        printStatus === 'success' ? 'bg-green-500' : 
        printStatus === 'error' ? 'bg-red-500' : 
        'bg-blue-500 hover:bg-blue-600'
      }`}
    >
      {printStatus === 'printing' ? '🖨️ Imprimiendo...' :
       printStatus === 'success' ? '✅ ¡Impreso!' :
       printStatus === 'error' ? '❌ Error' :
       '🖨️ Imprimir Ticket'}
    </button>
  );
};
```

### 4. **Uso en tu Componente de Pedido**

```typescript
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

      <PrintButton
        orderData={order}
        onPrintSuccess={handlePrintSuccess}
        onPrintError={handlePrintError}
      />
    </div>
  );
};
```

## 📋 **Formato de Datos Requerido**

El servicio Java espera un JSON con esta estructura:

```typescript
interface TicketData {
  items: {
    quantity: number;
    productName: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  tableNumber: string;
  customerName?: string;
  restaurantName?: string;
}
```

### Ejemplo de Datos:

```json
{
  "items": [
    {
      "quantity": 2,
      "productName": "Hamburguesa Clásica",
      "unitPrice": 12.50,
      "totalPrice": 25.00
    },
    {
      "quantity": 1,
      "productName": "Coca Cola 330ml",
      "unitPrice": 2.50,
      "totalPrice": 2.50
    }
  ],
  "tableNumber": "MESA-12",
  "customerName": "MARÍA GARCÍA",
  "restaurantName": "RESTAURANTE EL BUENO"
}
```

## 🎯 **Flujo Completo de Integración**

1. **Usuario hace clic en "Imprimir"** en el dashboard
2. **Dashboard envía datos** al servicio Java (puerto 3002)
3. **Servicio Java procesa** y formatea el ticket
4. **Java imprime** en la impresora POS-80C
5. **Java responde** con éxito/error
6. **Dashboard muestra feedback** al usuario

## 🔧 **Configuración del Servicio**

### Puerto
```java
private static final int PORT = 3002;
```

### Impresora
```java
private static final String PRINTER_NAME = "POS-80C";
```

### Ancho del Ticket
```java
private static final int MAX_WIDTH = 48; // Para 80mm
```

## 🚀 **Modos de Ejecución**

### Desarrollo (Visible)
```bash
java PrinterServiceDev
```

### Producción (Invisible)
```bash
java PrinterServiceDev --production
```

## 🔍 **Solución de Problemas**

### El servicio no responde
- Verifica que esté ejecutándose: `netstat -an | findstr :3002`
- Reinicia el servicio: `.\compile-and-run-java.bat`

### Error de comunicación
- Verifica que el puerto 3002 esté libre
- Revisa los logs del servicio Java
- Verifica que no haya firewall bloqueando

### No se imprime
- Verifica que la impresora POS-80C esté conectada
- Verifica que sea la impresora predeterminada
- Revisa los logs del servicio Java

## 📞 **Archivos de Referencia**

- `PrinterServiceDev.java` - Servicio principal
- `test-dashboard-integration.js` - Prueba de integración
- `dashboard-integration-example.tsx` - Ejemplo de código React
- `compile-and-run-java.bat` - Script de ejecución

## 🎉 **¡LISTO PARA PRODUCCIÓN!**

Tu integración está **completamente funcional** y lista para usar en producción. El servicio Java maneja:

- ✅ **Comunicación HTTP** robusta
- ✅ **Formato optimizado** para impresoras térmicas
- ✅ **Corte automático** del ticket
- ✅ **Manejo de errores** completo
- ✅ **Logs detallados** para debugging
- ✅ **Modo invisible** para producción

**¡Ya puedes integrar el botón de impresión en tu dashboard KimiPOS!** 🚀
