@echo off
echo ============================================
echo 🛑 DETENCIÓN DE SERVIDORES - KimiPOS
echo ============================================
echo.

echo 🔍 Buscando procesos de servidores...

echo 📋 Procesos encontrados en puertos 3001 y 5173:
netstat -ano | findstr ":3001\|:5173"

echo.
echo 🚫 Deteniendo procesos...

REM Detener procesos en puerto 3001 (servidor de impresoras)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    echo Deteniendo proceso %%a (puerto 3001)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Detener procesos en puerto 5173 (servidor de desarrollo)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    echo Deteniendo proceso %%a (puerto 5173)...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ✅ Verificación final:
netstat -ano | findstr ":3001\|:5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Algunos procesos pueden seguir activos
    echo    Revisa manualmente las terminales abiertas
) else (
    echo ✅ Todos los servidores han sido detenidos
)

echo.
echo 📋 Estado de puertos:
echo    • Puerto 3001 (impresoras): 
netstat -ano | findstr ":3001" >nul 2>&1 && echo "    ACTIVO" || echo "    INACTIVO"
echo    • Puerto 5173 (desarrollo): 
netstat -ano | findstr ":5173" >nul 2>&1 && echo "    ACTIVO" || echo "    INACTIVO"

echo.
pause





