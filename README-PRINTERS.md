# 🖨️ Sistema de Impresoras - KimiPOS

## 📋 Descripción

Este proyecto incluye un sistema completo de detección de impresoras que funciona tanto en el navegador como con un backend Node.js que detecta las impresoras reales del sistema operativo.

## 🚀 Instalación y Uso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar el servidor de impresoras (Backend)

```bash
# Opción 1: Solo el servidor de impresoras
npm run server

# Opción 2: Servidor + Frontend juntos
npm run dev:full
```

### 3. Ejecutar el frontend (React)

```bash
# Si ejecutas el servidor por separado
npm run dev

# O usa la opción completa
npm run dev:full
```

## 🏗️ Arquitectura

### Backend (Node.js + Express + systeminformation)

**Archivo:** `server.js`

**Endpoints:**
- `GET /printers` - Lista todas las impresoras del sistema
- `GET /printers/default` - Obtiene la impresora predeterminada
- `GET /health` - Verifica que el servidor esté funcionando

**Funciones:**
- ✅ Detecta impresoras reales del sistema operativo
- ✅ Compatible con Windows, macOS y Linux
- ✅ Muestra estado de las impresoras
- ✅ Identifica impresora predeterminada

### Frontend (React)

**Archivos principales:**
- `src/services/printerService.ts` - Servicio para consumir la API
- `src/hooks/useSystemPrinters.ts` - Hook para gestionar impresoras
- `src/pages/Configuration.tsx` - Interfaz de configuración

**Funciones:**
- ✅ Consume la API del backend
- ✅ Fallback automático si el servidor no está disponible
- ✅ Lista combinada de impresoras del sistema + comunes
- ✅ Interfaz intuitiva para seleccionar impresoras

## 🔧 Configuración

### Puerto del servidor
El servidor de impresoras corre en el puerto **3001** por defecto. Si necesitas cambiarlo:

```javascript
// En server.js
const PORT = 3001; // Cambia este valor
```

### Configuración del frontend
El frontend intenta conectarse automáticamente al servidor en `http://localhost:3001`. Si cambias el puerto, actualiza:

```typescript
// En src/services/printerService.ts
const response = await fetch('http://localhost:3001/printers');
```

## 📖 Uso

### 1. Iniciar el sistema completo

```bash
npm run dev:full
```

Esto iniciará:
- ✅ Servidor de impresoras (puerto 3001)
- ✅ Frontend React (puerto 5173)

### 2. Acceder a la configuración

1. Abre el navegador en `http://localhost:5173`
2. Ve a **Configuración** → **Impresión**
3. Verás la lista de impresoras detectadas automáticamente

### 3. Funciones disponibles

- **Seleccionar impresora principal**: Para tickets de cobro y recibos
- **Seleccionar impresora de comandas**: Para comandas de cocina/bar
- **Botón Refrescar**: Actualiza la lista de impresoras
- **Botón Info**: Muestra información detallada en consola

## 🔍 Verificación

### Ver impresoras detectadas

```bash
# En PowerShell (Windows)
Get-Printer | Select-Object Name

# En CMD (Windows)
wmic printer get name
```

### Ver logs del servidor

```bash
# Los logs aparecerán en la consola donde ejecutas:
npm run server

# Ejemplo de salida:
🚀 Servidor de impresoras iniciado en http://localhost:3001
🔍 Detectando impresoras del sistema...
✅ Se detectaron 3 impresoras:
  1. HP LaserJet Pro M404n (Ready)
  2. Microsoft Print to PDF (Ready)
  3. Canon PIXMA TS8320 (Ready)
```

## 🐛 Solución de problemas

### Error: "Servidor de impresoras no disponible"

**Solución:**
```bash
# Inicia el servidor de impresoras
npm run server

# O inicia todo junto
npm run dev:full
```

### Error: "No se detectan impresoras"

**Posibles causas:**
1. El servidor no está corriendo
2. Problemas de permisos en el sistema operativo
3. CUPS no está instalado (Linux/macOS)

**Soluciones:**
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3001/health

# En Linux/macOS, instalar CUPS
sudo apt-get install cups  # Ubuntu/Debian
# o
brew install cups          # macOS
```

### Error: "CORS error"

**Solución:** El servidor ya incluye configuración CORS, pero si hay problemas:

```javascript
// En server.js, verifica esta línea:
app.use(cors({
  origin: 'http://localhost:5173', // Puerto del frontend
  credentials: true
}));
```

## 📋 API Reference

### GET /printers
```json
{
  "success": true,
  "printers": [
    {
      "name": "HP LaserJet Pro M404n",
      "status": "Ready",
      "default": true,
      "id": "printer_1"
    }
  ],
  "count": 1
}
```

### GET /printers/default
```json
{
  "success": true,
  "printer": {
    "name": "HP LaserJet Pro M404n",
    "status": "Ready",
    "default": true
  }
}
```

### GET /health
```json
{
  "status": "OK",
  "message": "Servidor de impresoras funcionando",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🎯 Próximos pasos

- [ ] Integración con sistema de impresión real
- [ ] Configuración de formatos de papel
- [ ] Impresión de tickets y comandas
- [ ] Configuración por usuario
- [ ] Testing en diferentes sistemas operativos

## 📞 Soporte

Si tienes problemas:

1. Verifica que el servidor esté corriendo: `npm run server`
2. Revisa los logs en la consola
3. Verifica la configuración de CORS
4. Comprueba los permisos del sistema operativo

¡El sistema está diseñado para ser robusto y detectar automáticamente todas las impresoras de tu sistema! 🖨️✨

