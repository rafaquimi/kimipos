# 🍽️ Ticket de Comanda de Cocina - KimiPOS

## 🎯 **¿Qué es el Ticket de Comanda?**

El **ticket de comanda** es un documento simple que se imprime en la cocina cuando se procesa un pedido. Es diferente del ticket de cobro que se entrega al cliente.

## 📋 **Contenido del Ticket de Comanda**

### ✅ **Información Incluida:**
- **Nombre del restaurante** (en mayúsculas)
- **Título**: "COMANDA DE COCINA"
- **Mesa**: Número de mesa
- **Cliente**: Nombre del cliente (si está registrado)
- **Hora**: Fecha y hora del pedido
- **Productos**: Lista de productos con cantidades
- **Sin precios ni totales**

### ❌ **Información NO Incluida:**
- Precios individuales
- Total del pedido
- Información de pago
- Descuentos
- Impuestos

## 🖨️ **Formato del Ticket**

```
RESTAURANTE KIMIPOS
COMANDA DE COCINA

MESA: 5
CLIENTE: JUAN PÉREZ
HORA: 27/08/2025, 00:25

PEDIDO
2x HAMBURGUESA CLÁSICA
1x PIZZA MARGARITA
3x COCA COLA 500ML

27/08/2025, 00:25
```

## 🚀 **Cómo Funciona**

### **1. Procesamiento del Pedido:**
- El usuario agrega productos al carrito
- Selecciona mesa y cliente
- Presiona "Procesar Pedido"

### **2. Generación Automática:**
- Se agrupan productos por impresora
- Se genera ticket de comanda para cada grupo
- Se imprime automáticamente

### **3. Impresión:**
- **PDF24**: Se genera PDF y se abre
- **Otras impresoras**: Se envía directamente
- **Sin abrir navegador ni HTML**

## 🎯 **Ventajas del Formato**

### **Para la Cocina:**
- ✅ **Fácil de leer** en ambiente de cocina
- ✅ **Solo información necesaria**
- ✅ **Sin distracciones** (precios, totales)
- ✅ **Formato claro** y directo
- ✅ **Productos en mayúsculas** para mejor visibilidad

### **Para el Sistema:**
- ✅ **Impresión automática** sin intervención
- ✅ **Múltiples impresoras** por tipo de producto
- ✅ **Proceso invisible** para el usuario
- ✅ **Formato optimizado** para impresoras térmicas

## 🔧 **Configuración**

### **Configurar Impresoras:**
1. Ve a **Configuración** → **Impresión**
2. Haz clic en **"Configurar PDF24 para Todo"**
3. O configura impresoras específicas por producto

### **Procesar Pedido:**
1. Ve al **Dashboard**
2. Agrega productos al carrito
3. Selecciona mesa y cliente
4. Presiona **"Procesar Pedido"**
5. Se imprimirá automáticamente

## 📊 **Ejemplo de Uso**

### **Escenario:**
- **Mesa**: 5
- **Cliente**: Juan Pérez
- **Productos**: 
  - 2x Hamburguesa Clásica
  - 1x Pizza Margarita
  - 3x Coca Cola 500ml

### **Resultado:**
Se imprime automáticamente un ticket con:
- Solo los productos y cantidades
- Mesa y cliente
- Hora del pedido
- Sin precios ni totales

## 💡 **Recomendaciones**

### **Para Impresoras Térmicas:**
- ✅ Usar papel de 80mm
- ✅ Configurar margen mínimo
- ✅ Verificar calidad de impresión

### **Para PDF24:**
- ✅ Configurar como impresora por defecto
- ✅ Verificar que se abra automáticamente
- ✅ Revisar carpeta de descargas

---

**Estado**: ✅ **IMPLEMENTADO Y FUNCIONANDO**
**Fecha**: 27 de Agosto, 2025
**Versión**: KimiPOS 1.0.0
