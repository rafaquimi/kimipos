# 🚀 Guía para Crear el Instalador de KimiPOS

Esta guía te explica cómo crear un instalador profesional para KimiPOS que proteja tu código y sea fácil de distribuir.

## 📋 Requisitos Previos

### 1. **Node.js y npm**
- Instalar Node.js desde: https://nodejs.org/
- Verificar instalación: `node --version` y `npm --version`

### 2. **NSIS (Nullsoft Scriptable Install System)**
- Descargar desde: https://nsis.sourceforge.io/Download
- Instalar y añadir al PATH del sistema
- Verificar instalación: `makensis --version`

### 3. **Iconos de la aplicación**
Crear los siguientes archivos en la carpeta `public/`:
- `icon.ico` (Windows - 256x256px)
- `icon.icns` (macOS - 512x512px)
- `icon.png` (Linux - 512x512px)

## 🔧 Pasos para Crear el Instalador

### **Opción 1: Automática (Recomendada)**

1. **Ejecutar el script automático:**
   ```bash
   build-installer.bat
   ```

2. **El script hará automáticamente:**
   - Limpiar directorios anteriores
   - Instalar dependencias
   - Construir la aplicación
   - Empaquetar con Electron
   - Crear el instalador NSIS

### **Opción 2: Manual**

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Construir la aplicación:**
   ```bash
   npm run build
   ```

3. **Empaquetar con Electron:**
   ```bash
   npm run electron-pack-win
   ```

4. **Crear el instalador:**
   ```bash
   makensis installer.nsh
   ```

## 📦 Características del Instalador

### ✅ **Protección del Código**
- **Ofuscación**: Nombres de variables y funciones ofuscados
- **Minificación**: Código comprimido y optimizado
- **Sin Source Maps**: No se incluyen mapas de código fuente
- **Eliminación de logs**: Console.log removidos en producción

### ✅ **Características del Instalador**
- **Instalación personalizable**: El usuario puede elegir directorio
- **Accesos directos**: Escritorio y menú inicio
- **Registro en Windows**: Aparece en "Agregar o quitar programas"
- **Desinstalación limpia**: Elimina todos los archivos y registros
- **Interfaz en español**: Instalador completamente localizado

### ✅ **Estructura de Archivos**
```
KimiPOS-Setup.exe
├── KimiPOS.exe (Aplicación principal)
├── Acceso directo en escritorio
├── Acceso directo en menú inicio
└── Registro en Windows
```

## 🎯 Comandos Disponibles

### **Desarrollo**
```bash
npm run dev                    # Servidor de desarrollo
npm run electron-dev          # Electron en modo desarrollo
```

### **Construcción**
```bash
npm run build                 # Construir aplicación web
npm run electron-pack         # Empaquetar para todas las plataformas
npm run electron-pack-win     # Solo Windows
npm run electron-pack-mac     # Solo macOS
npm run electron-pack-linux   # Solo Linux
```

### **Distribución**
```bash
npm run dist                  # Construir y empaquetar
```

## 🔒 Seguridad y Protección

### **Nivel de Protección: ALTO**
- ✅ Código ofuscado y minificado
- ✅ Sin source maps
- ✅ Console.log eliminados
- ✅ Nombres de variables ofuscados
- ✅ Archivos empaquetados en binario

### **Limitaciones**
- ⚠️ El código JavaScript sigue siendo legible con herramientas avanzadas
- ⚠️ Para máxima protección, considera usar herramientas adicionales como:
  - **Webpack Obfuscator**
  - **JavaScript Obfuscator**
  - **Bytenode** (compilar a bytecode)

## 📁 Estructura del Proyecto

```
kimipos/
├── src/                      # Código fuente
├── electron/                 # Archivos de Electron
│   └── main.js              # Proceso principal
├── public/                   # Archivos públicos
│   ├── icon.ico             # Icono Windows
│   ├── icon.icns            # Icono macOS
│   └── icon.png             # Icono Linux
├── dist/                     # Aplicación construida
├── dist-electron/            # Aplicación empaquetada
├── installer.nsh             # Script NSIS
├── build-installer.bat       # Script automático
└── package.json              # Configuración del proyecto
```

## 🚨 Solución de Problemas

### **Error: NSIS no encontrado**
```bash
# Verificar si NSIS está instalado
makensis --version

# Si no está en el PATH, añadirlo manualmente
# Típicamente: C:\Program Files (x86)\NSIS
```

### **Error: Electron no se instala**
```bash
# Limpiar caché de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### **Error: Construcción falla**
```bash
# Verificar que todas las dependencias estén instaladas
npm install

# Limpiar y reconstruir
npm run build
```

## 📞 Soporte

Si tienes problemas con la creación del instalador:

1. **Verificar requisitos**: Asegúrate de tener Node.js y NSIS instalados
2. **Revisar logs**: Los errores aparecen en la consola
3. **Limpiar caché**: `npm cache clean --force`
4. **Reinstalar**: Eliminar `node_modules` y volver a instalar

## 🎉 ¡Listo!

Una vez completado el proceso, tendrás:
- ✅ `KimiPOS-Setup.exe` - Instalador profesional
- ✅ Código protegido y ofuscado
- ✅ Aplicación de escritorio nativa
- ✅ Instalador en español
- ✅ Desinstalación limpia

El instalador está listo para distribuir a tus clientes. ¡Disfruta de tu aplicación POS profesional! 🚀
