@echo off
echo ========================================
echo    COMPILANDO Y EJECUTANDO JAVA SERVICE
echo ========================================
echo.

echo 🧹 Limpiando archivos anteriores...
if exist *.class del *.class
echo.

echo 🔨 Compilando PrinterServiceDev.java...
javac PrinterServiceDev.java
if %errorlevel% neq 0 (
    echo ❌ Error al compilar
    pause
    exit /b 1
)
echo ✅ Compilación exitosa
echo.

echo 🚀 Ejecutando servicio en modo DESARROLLO...
echo 💡 Para modo producción: java PrinterServiceDev --production
echo.

java PrinterServiceDev
pause
