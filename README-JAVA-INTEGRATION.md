# Integración Java-Node.js para Impresión Térmica

Esta solución combina un servidor Node.js con una aplicación Java para manejar la impresión térmica de manera confiable.

## 🏗️ Arquitectura

```
┌─────────────────┐    HTTP    ┌─────────────────┐    Java Print API    ┌─────────────┐
│   KimiPOS App   │ ────────── │  Node.js Server │ ──────────────────── │ Java Service│
│   (Frontend)    │            │   (Port 3000)   │                      │ (Port 3002) │
└─────────────────┘            └─────────────────┘                      └─────────────┘
                                                                                │
                                                                                ▼
                                                                        ┌─────────────┐
                                                                        │ POS-80C     │
                                                                        │ Thermal     │
                                                                        │ Printer     │
                                                                        └─────────────┘
```

## 📋 Requisitos

- **Java JDK 8 o superior** instalado y configurado
- **Node.js** instalado
- **Impresora térmica POS-80C** conectada y configurada
- **Windows** (probado en Windows 10/11)

## 🚀 Instalación y Configuración

### 1. Verificar Java
```bash
java -version
javac -version
```

### 2. Instalar dependencias Node.js
```bash
npm install
```

### 3. Compilar la aplicación Java
```bash
javac PrinterService.java
```

## 🖨️ Uso

### Opción 1: Inicio Automático (Recomendado)

El servidor Node.js iniciará automáticamente el servicio Java:

```bash
node server-java-integration.js
```

### Opción 2: Inicio Manual

1. **Iniciar servicio Java primero:**
   ```bash
   java PrinterService
   ```

2. **Iniciar servidor Node.js:**
   ```bash
   node server-java-integration.js
   ```

### Opción 3: Usar script batch (Windows)

```bash
start-java-printer.bat
```

## 📡 Endpoints Disponibles

### Servidor Node.js (Puerto 3000)

- `POST /print-ticket` - Imprimir ticket
- `POST /test-print` - Probar impresión
- `GET /java-status` - Estado del servicio Java
- `GET /config` - Ver configuración
- `GET /status` - Estado del servidor

### Servicio Java (Puerto 3002)

- Escucha conexiones HTTP en puerto 3002
- Procesa datos JSON y los envía a la impresora
- Responde con estado de impresión

## 🧪 Pruebas

### Ejecutar pruebas de integración:
```bash
node test-java-integration.js
```

### Probar impresión manual:
```bash
curl -X POST http://localhost:3000/test-print
```

## ⚙️ Configuración

### Configuración del servidor Node.js (`server-java-integration.js`)

```javascript
const CONFIG = {
  javaServicePort: 3002,        // Puerto del servicio Java
  javaServiceHost: 'localhost', // Host del servicio Java
  restaurantName: 'RESTAURANTE EL BUENO',
  currency: 'EUR',
  autoStartJavaService: true    // Inicio automático del servicio Java
};
```

### Configuración del servicio Java (`PrinterService.java`)

```java
private static final int PORT = 3002;           // Puerto de escucha
private static final String PRINTER_NAME = "POS-80C"; // Nombre de la impresora
private static final int MAX_WIDTH = 80;        // Ancho máximo del ticket
```

## 🔧 Solución de Problemas

### Error: "No se encontró la impresora POS-80C"

1. Verificar que la impresora esté conectada y encendida
2. Verificar que el driver esté instalado correctamente
3. Comprobar el nombre exacto de la impresora en Windows

### Error: "Error al compilar PrinterService.java"

1. Verificar que Java JDK esté instalado
2. Verificar que `javac` esté en el PATH
3. Ejecutar: `java -version` y `javac -version`

### Error: "Error de conexión con servicio Java"

1. Verificar que el servicio Java esté ejecutándose en puerto 3002
2. Verificar que no haya firewall bloqueando el puerto
3. Reiniciar el servicio Java

### La impresión sigue con columna estrecha

1. Verificar que la aplicación Java esté usando la configuración correcta
2. Ajustar `MAX_WIDTH` en `PrinterService.java`
3. Verificar configuración de la impresora en Windows

## 📁 Estructura de Archivos

```
kimipos/
├── PrinterService.java              # Servicio Java de impresión
├── server-java-integration.js       # Servidor Node.js principal
├── test-java-integration.js         # Pruebas de integración
├── start-java-printer.bat           # Script de inicio (Windows)
├── README-JAVA-INTEGRATION.md       # Este archivo
└── temp/                            # Archivos temporales (se crea automáticamente)
```

## 🔄 Flujo de Datos

1. **KimiPOS** envía datos JSON al servidor Node.js
2. **Node.js** valida los datos y los reenvía al servicio Java
3. **Java** procesa los datos y genera el contenido del ticket
4. **Java** envía el contenido directamente a la impresora térmica
5. **Java** responde con el estado de la impresión
6. **Node.js** responde al cliente con el resultado

## 💡 Ventajas de esta Solución

- ✅ **Impresión confiable**: Java maneja directamente la impresora
- ✅ **Ancho completo**: Configuración específica para impresoras térmicas
- ✅ **Proceso oculto**: El servicio Java se ejecuta en segundo plano
- ✅ **Comunicación HTTP**: Fácil integración con aplicaciones web
- ✅ **Logs detallados**: Seguimiento completo del proceso de impresión
- ✅ **Configuración flexible**: Fácil ajuste de parámetros

## 🚨 Notas Importantes

- El servicio Java debe estar ejecutándose antes de usar el servidor Node.js
- La impresora POS-80C debe estar configurada como impresora predeterminada
- Los archivos temporales se limpian automáticamente
- El servicio Java se puede ejecutar como servicio de Windows para inicio automático

## 🔄 Actualizaciones

Para actualizar la configuración:

1. Modificar `CONFIG` en `server-java-integration.js`
2. Modificar constantes en `PrinterService.java`
3. Recompilar: `javac PrinterService.java`
4. Reiniciar ambos servicios

