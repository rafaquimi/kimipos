@echo off
echo 🚀 Compilando y ejecutando servicio de impresión Java...
echo.

REM Compilar el archivo Java
echo 📦 Compilando PrinterService.java...
javac PrinterService.java
if %errorlevel% neq 0 (
    echo ❌ Error al compilar. Asegúrate de tener Java instalado.
    pause
    exit /b 1
)

echo ✅ Compilación exitosa
echo.

REM Ejecutar la aplicación Java
echo 🖨️ Iniciando servicio de impresión...
echo 📡 El servicio estará disponible en puerto 3002
echo 🖨️ Impresora: POS-80C
echo.
echo 💡 Para detener el servicio, presiona Ctrl+C
echo.

java PrinterService

pause

