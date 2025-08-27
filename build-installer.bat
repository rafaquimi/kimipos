@echo off
echo ============================================
echo 🚀 CREACIÓN DE INSTALADOR - KimiPOS
echo ============================================
echo.

echo 🔧 Limpiando builds anteriores...
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"

echo.
echo 📦 Construyendo aplicación...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Error en la construcción de la aplicación
    pause
    exit /b 1
)

echo.
echo 🎯 Creando instalador Electron...
npm run electron-pack-win

if %errorlevel% neq 0 (
    echo ❌ Error en la creación del instalador
    pause
    exit /b 1
)

echo.
echo ✅ ¡Instalador creado exitosamente!
echo.
echo 📁 Archivos generados:
echo    • Instalador: dist-electron\KimiPOS Setup 1.0.0.exe
echo    • Aplicación: dist-electron\win-unpacked\KimiPOS.exe
echo.
echo 📋 Información del instalador:
echo    • Tamaño: 88 MB aproximadamente
echo    • Tipo: Instalador NSIS para Windows
echo    • Arquitectura: x64
echo    • Versión: 1.0.0
echo.
echo 🧪 Para probar el instalador:
echo    1. Ejecutar: dist-electron\KimiPOS Setup 1.0.0.exe
echo    2. Seguir el asistente de instalación
echo    3. La aplicación se instalará en Program Files
echo    4. Se creará acceso directo en escritorio y menú inicio
echo.
echo ⚠️  Notas importantes:
echo    • El instalador incluye todas las dependencias
echo    • No requiere servidores externos (funciona offline)
echo    • La base de datos se crea localmente
echo    • Las impresoras se detectan automáticamente
echo.

pause
