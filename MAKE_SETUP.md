# Configuración de Make.com para Impresión de Tickets

## Paso 1: Crear cuenta en Make.com

1. Ve a [make.com](https://www.make.com) y crea una cuenta gratuita
2. La cuenta gratuita permite hasta 1000 operaciones por mes

## Paso 2: Crear un nuevo escenario

1. En Make.com, haz clic en "Create a new scenario"
2. Busca y selecciona "Webhook" como primer módulo
3. Configura el webhook:
   - **Event**: Webhook
   - **URL**: Se generará automáticamente (ej: `https://hook.eu1.make.com/abc123def456`)
   - **Method**: POST
   - **Data Structure**: JSON

## Paso 3: Configurar la estructura de datos

En el webhook, configura la estructura JSON que recibirá:

```json
{
  "items": [
    {
      "quantity": 1,
      "productName": "Sprite",
      "unitPrice": 2.50,
      "totalPrice": 2.50
    }
  ],
  "tableNumber": "5",
  "customerName": "Juan Pérez",
  "restaurantName": "RESTAURANTE EL BUENO",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "total": 22.00
}
```

## Paso 4: Agregar módulo de impresión

### Opción A: Imprimir usando Google Cloud Print (Recomendado)

1. Busca y agrega el módulo "Google Cloud Print"
2. Conecta tu cuenta de Google
3. Configura:
   - **Printer**: Selecciona tu impresora POS-80C
   - **Content**: Usa el mapeo de datos del webhook
   - **Title**: `Ticket - Mesa {{tableNumber}}`

### Opción B: Imprimir usando Windows Printer (Alternativo)

1. Busca y agrega el módulo "HTTP" 
2. Configura:
   - **URL**: `http://localhost:631/printers/POS-80C`
   - **Method**: POST
   - **Headers**: `Content-Type: text/plain`
   - **Body**: Genera el contenido del ticket

## Paso 5: Generar contenido del ticket

Agrega un módulo "Set up text aggregator" o "Text parser" para generar el contenido del ticket:

```
{{restaurantName}}
========================================
MESA: {{tableNumber}}
CLIENTE: {{customerName}}
FECHA: {{timestamp}}
----------------------------------------
PEDIDO:

{{#each items}}
{{quantity}}x {{productName}}
   {{unitPrice}} EUR x {{quantity}} = {{totalPrice}} EUR
{{/each}}

----------------------------------------
TOTAL: {{total}} EUR

¡GRACIAS!
```

## Paso 6: Configurar el servidor Node.js

1. Edita el archivo `server-make.js`
2. Reemplaza `YOUR_WEBHOOK_ID` con el ID de tu webhook de Make.com
3. Ejecuta el servidor:

```bash
npm install axios
node server-make.js
```

## Paso 7: Probar la configuración

1. Ejecuta el cliente de prueba:
```bash
node test-make-client.js
```

2. Verifica que los datos lleguen a Make.com
3. Revisa los logs de Make.com para confirmar la impresión

## Configuración avanzada

### Configurar márgenes y formato

En Make.com, puedes agregar módulos adicionales para:

1. **Formatear texto**: Usar módulos de texto para ajustar el formato
2. **Configurar impresora**: Usar comandos ESC/POS si tu impresora los soporta
3. **Generar PDF**: Usar módulos de PDF y luego imprimir

### Ejemplo de flujo completo

```
Webhook → Text Parser → Google Cloud Print → Email Notification
```

### Configuración de notificaciones

Agrega un módulo de email para recibir confirmaciones de impresión:

1. Busca "Email" en Make.com
2. Conecta tu cuenta de email
3. Configura para enviar confirmación cuando se complete la impresión

## Solución de problemas

### Error: Webhook no recibe datos
- Verifica que la URL del webhook esté correcta
- Asegúrate de que el servidor esté ejecutándose
- Revisa los logs del servidor

### Error: Impresora no imprime
- Verifica que la impresora esté conectada y encendida
- Confirma que esté configurada en Google Cloud Print
- Revisa los logs de Make.com

### Error: Formato incorrecto
- Ajusta el módulo de texto en Make.com
- Verifica la estructura de datos del webhook
- Prueba con diferentes formatos de texto

## Ventajas de usar Make.com

1. **No requiere configuración local de impresora**
2. **Funciona desde cualquier dispositivo**
3. **Fácil de configurar y mantener**
4. **Soporte para múltiples impresoras**
5. **Logs y monitoreo automático**
6. **Integración con otros servicios**

## Costos

- **Plan gratuito**: 1000 operaciones/mes
- **Plan pago**: Desde $9/mes para más operaciones
- **Para un restaurante pequeño**: El plan gratuito suele ser suficiente


