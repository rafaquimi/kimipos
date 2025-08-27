@echo off
echo ============================================
echo 🖨️  SISTEMA DE IMPRESORAS - KimiPOS
echo ============================================
echo.

echo 🚀 Iniciando servidor de impresoras...
start /B npm run server

echo ⏳ Esperando que el servidor inicie...
timeout /t 3 /nobreak >nul

echo 🌐 Iniciando frontend...
start /B npm run dev

echo.
echo ✅ Sistema iniciado correctamente!
echo.
echo 📋 URLs disponibles:
echo    • Servidor de impresoras: http://localhost:3001
echo    • Aplicación principal: http://localhost:5173
echo.
echo 🛠️  Utilidades:
echo    • Lista de impresoras: http://localhost:3001/printers
echo    • Estado del servidor: http://localhost:3001/health
echo.
echo ⚠️  IMPORTANTE - Cierre de Servidores:
echo    • Al cerrar la aplicación web (localhost:5173), el servidor de desarrollo se detiene automáticamente
echo    • El servidor de impresoras (puerto 3001) SEGUIRÁ CORRIENDO en segundo plano
echo    • Para detener completamente: Ctrl+C en cada ventana de terminal
echo.
echo 🛑 Para detener todo el sistema:
echo    1. Cerrar la aplicación web (se detiene automáticamente)
echo    2. En la terminal del servidor de impresoras: Ctrl+C
echo.

pause

