@echo off
title KimiPOS Printer Service
color 0A

echo.
echo ========================================
echo    KIMIPOS PRINTER SERVICE
echo ========================================
echo.
echo Iniciando servicio de impresion...
echo.

REM Verificar si Java esta instalado
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java no esta instalado o no esta en el PATH
    echo Por favor, instala Java JDK 8 o superior
    pause
    exit /b 1
)

REM Verificar si Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado o no esta en el PATH
    echo Por favor, instala Node.js
    pause
    exit /b 1
)

echo Java y Node.js encontrados correctamente
echo.

REM Compilar la aplicacion Java si es necesario
if not exist "PrinterService.class" (
    echo Compilando aplicacion Java...
    javac PrinterService.java
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo compilar la aplicacion Java
        pause
        exit /b 1
    )
    echo Compilacion exitosa
    echo.
)

REM Iniciar el servidor Node.js
echo Iniciando servidor de impresion...
echo.
echo El servicio estara disponible en:
echo - Servidor Node.js: http://localhost:3000
echo - Servicio Java: puerto 3002
echo.
echo Para detener el servicio, presiona Ctrl+C
echo.

node server-java-integration.js

pause

