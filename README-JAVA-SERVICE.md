# 🖨️ Servicio de Impresión Java para KimiPOS

Este servicio Java maneja la impresión de tickets térmicos con soporte completo para comandos ESC/POS y corte automático.

## 🚀 Características

- ✅ **Comunicación HTTP** con Node.js
- ✅ **Formato optimizado** para impresoras térmicas de 80mm (48 caracteres)
- ✅ **Corte automático** del ticket
- ✅ **Múltiples métodos** de impresión (Windows Print, Java Print API, ESC/POS)
- ✅ **Modo desarrollo** (visible) y **modo producción** (invisible)
- ✅ **Manejo de errores** robusto
- ✅ **Logs detallados** en modo desarrollo

## 📁 Archivos

- `PrinterServiceDev.java` - Servicio principal (modo desarrollo)
- `PrinterService.java` - Servicio original
- `compile-and-run-java.bat` - Script de compilación y ejecución
- `test-java-communication.js` - Prueba de comunicación

## 🔧 Instalación y Uso

### 1. Compilar y Ejecutar

#### Opción A: Script Automático
```bash
compile-and-run-java.bat
```

#### Opción B: Manual
```bash
# Compilar
javac PrinterServiceDev.java

# Ejecutar en modo desarrollo (visible)
java PrinterServiceDev

# Ejecutar en modo producción (invisible)
java PrinterServiceDev --production
```

### 2. Probar Comunicación

```bash
node test-java-communication.js
```

### 3. Integrar con tu Aplicación

El servicio Java escucha en `http://localhost:3002` y acepta datos JSON:

```javascript
// Ejemplo de integración desde Node.js
const http = require('http');

function sendToJavaPrinter(ticketData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(ticketData);
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonStart = responseData.indexOf('{');
          const jsonEnd = responseData.lastIndexOf('}') + 1;
          const jsonResponse = responseData.substring(jsonStart, jsonEnd);
          
          const response = JSON.parse(jsonResponse);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Uso
const ticketData = {
  items: [
    { quantity: 2, productName: 'Hamburguesa', unitPrice: 12.50, totalPrice: 25.00 },
    { quantity: 1, productName: 'Coca Cola', unitPrice: 2.50, totalPrice: 2.50 }
  ],
  tableNumber: 'MESA-12',
  customerName: 'MARÍA GARCÍA',
  restaurantName: 'RESTAURANTE EL BUENO'
};

sendToJavaPrinter(ticketData)
  .then(result => {
    if (result.success) {
      console.log('✅ Ticket impreso:', result.message);
      console.log('🖨️ Método:', result.method);
    } else {
      console.log('❌ Error:', result.message);
    }
  })
  .catch(error => {
    console.log('❌ Error de comunicación:', error.message);
  });
```

## 📋 Formato de Datos

El servicio espera un JSON con la siguiente estructura:

```json
{
  "items": [
    {
      "quantity": 2,
      "productName": "Hamburguesa Clásica",
      "unitPrice": 12.50,
      "totalPrice": 25.00
    }
  ],
  "tableNumber": "MESA-12",
  "customerName": "MARÍA GARCÍA",
  "restaurantName": "RESTAURANTE EL BUENO"
}
```

## 🎯 Formato del Ticket

El ticket se genera con:
- **Ancho**: 48 caracteres (óptimo para 80mm)
- **Texto centrado** correctamente
- **Líneas de separación** completas
- **Formato compacto** y legible
- **Corte automático** al final

### Ejemplo de Salida:
```
              RESTAURANTE EL BUENO
================================================
MESA: MESA-12
CLIENTE: MARÍA GARCÍA
FECHA: 2024-01-15 14:30:00
------------------------------------------------
                    PEDIDO:
2x Hamburguesa Clásica
   12.50 EUR x 2 = 25.00 EUR
1x Coca Cola 330ml
   2.50 EUR x 1 = 2.50 EUR
------------------------------------------------
                TOTAL: 27.50 EUR

                   ¡GRACIAS!
```

## 🔧 Configuración

### Cambiar Impresora
Edita `PrinterServiceDev.java` y modifica:
```java
private static final String PRINTER_NAME = "TU_IMPRESORA";
```

### Cambiar Ancho
Edita `PrinterServiceDev.java` y modifica:
```java
private static final int MAX_WIDTH = 48; // Para 80mm
// private static final int MAX_WIDTH = 32; // Para 58mm
```

### Cambiar Puerto
Edita `PrinterServiceDev.java` y modifica:
```java
private static final int PORT = 3002;
```

## 🚀 Modos de Ejecución

### Modo Desarrollo (Visible)
```bash
java PrinterServiceDev
```
- ✅ Ventana visible
- ✅ Logs detallados
- ✅ Preview del contenido
- ✅ Información de depuración

### Modo Producción (Invisible)
```bash
java PrinterServiceDev --production
```
- ✅ Ventana oculta
- ✅ Logs mínimos
- ✅ Optimizado para producción

## 🛠️ Métodos de Impresión

El servicio intenta los siguientes métodos en orden:

1. **Windows Print Command** - Mejor soporte para corte
2. **Java Print API** - Con comandos ESC/POS
3. **File Output** - Para debugging

## 🔍 Solución de Problemas

### El servicio no inicia
- Verifica que Java esté instalado: `java -version`
- Verifica que el puerto 3002 esté libre
- Revisa los permisos de escritura

### No se imprime
- Verifica que la impresora POS-80C esté conectada
- Verifica que sea la impresora predeterminada
- Revisa los logs del servicio Java

### Formato incorrecto
- Ajusta `MAX_WIDTH` según tu impresora
- Verifica que la impresora soporte 80mm
- Revisa el preview en modo desarrollo

### Error de comunicación
- Verifica que el servicio esté ejecutándose en puerto 3002
- Verifica que no haya firewall bloqueando
- Revisa los logs de Node.js

## 📞 Soporte

Para problemas o mejoras:
1. Revisa los logs del servicio Java
2. Ejecuta en modo desarrollo para más información
3. Verifica la configuración de la impresora
4. Prueba con diferentes métodos de impresión

## 🎉 ¡Listo!

Tu servicio Java está configurado y listo para manejar la impresión de tickets térmicos con formato profesional y corte automático.
