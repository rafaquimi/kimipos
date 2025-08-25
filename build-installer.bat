@echo off
echo ========================================
echo    CONSTRUYENDO INSTALADOR KIMIPOS
echo ========================================
echo.

echo [1/5] Limpiando directorios anteriores...
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"
echo ✓ Limpieza completada
echo.

echo [2/5] Instalando dependencias...
call npm install
echo ✓ Dependencias instaladas
echo.

echo [3/5] Construyendo aplicación...
call npm run build
echo ✓ Aplicación construida
echo.

echo [4/5] Empaquetando con Electron...
call npm run electron-pack-win
echo ✓ Aplicación empaquetada
echo.

echo [5/5] Creando instalador...
if exist "KimiPOS-Setup.exe" del "KimiPOS-Setup.exe"

REM Verificar si NSIS está instalado
where makensis >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: NSIS no está instalado o no está en el PATH
    echo Por favor instala NSIS desde: https://nsis.sourceforge.io/Download
    pause
    exit /b 1
)

makensis installer.nsh
if %errorlevel% equ 0 (
    echo ✓ Instalador creado exitosamente: KimiPOS-Setup.exe
) else (
    echo ❌ ERROR: Fallo al crear el instalador
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ¡INSTALADOR CREADO EXITOSAMENTE!
echo ========================================
echo.
echo Archivo: KimiPOS-Setup.exe
echo Tamaño: 
for %%A in (KimiPOS-Setup.exe) do echo %%~zA bytes
echo.
echo El instalador está listo para distribuir.
pause
