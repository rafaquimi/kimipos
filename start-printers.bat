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
echo 📖 Para detener: Ctrl+C en cada ventana
echo.

pause

