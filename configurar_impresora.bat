
@echo off
echo Configurando impresora POS-80C...
echo.

REM Configurar impresora para texto plano sin márgenes
rundll32 printui.dll,PrintUIEntry /Xs /n "POS-80C" /a "Generic / Text Only"

echo.
echo Configuración completada.
echo Por favor, prueba a imprimir ahora.
pause
