!include "MUI2.nsh"
!include "FileFunc.nsh"

; Información básica
Name "KimiPOS"
OutFile "KimiPOS-Setup.exe"
InstallDir "$PROGRAMFILES\KimiPOS"
InstallDirRegKey HKCU "Software\KimiPOS" ""

; Solicitar privilegios de administrador
RequestExecutionLevel admin

; Variables
Var StartMenuFolder

; Interfaz
!define MUI_ABORTWARNING
!define MUI_ICON "public\icon.ico"
!define MUI_UNICON "public\icon.ico"

; Páginas del instalador
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Páginas del desinstalador
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Idiomas
!insertmacro MUI_LANGUAGE "Spanish"

; Sección de instalación
Section "KimiPOS" SecMain
  SetOutPath "$INSTDIR"
  
  ; Archivos principales
  File /r "dist-electron\win-unpacked\*.*"
  
  ; Crear directorio de datos
  CreateDirectory "$LOCALAPPDATA\KimiPOS"
  CreateDirectory "$LOCALAPPDATA\KimiPOS\Data"
  
  ; Crear acceso directo en el escritorio
  CreateShortCut "$DESKTOP\KimiPOS.lnk" "$INSTDIR\KimiPOS.exe"
  
  ; Crear acceso directo en el menú inicio
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\KimiPOS.lnk" "$INSTDIR\KimiPOS.exe"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Desinstalar KimiPOS.lnk" "$INSTDIR\Uninstall.exe"
  !insertmacro MUI_STARTMENU_WRITE_END
  
  ; Registrar la aplicación
  WriteRegStr HKCU "Software\KimiPOS" "" $INSTDIR
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KimiPOS" \
                   "DisplayName" "KimiPOS"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KimiPOS" \
                   "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KimiPOS" \
                   "DisplayIcon" "$INSTDIR\KimiPOS.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KimiPOS" \
                   "Publisher" "KimiPOS"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KimiPOS" \
                   "DisplayVersion" "1.0.0"
  
  ; Crear desinstalador
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; Sección de desinstalación
Section "Uninstall"
  ; Eliminar archivos
  RMDir /r "$INSTDIR"
  
  ; Eliminar accesos directos
  Delete "$DESKTOP\KimiPOS.lnk"
  
  ; Eliminar menú inicio
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder
  RMDir /r "$SMPROGRAMS\$StartMenuFolder"
  
  ; Eliminar datos de la aplicación
  RMDir /r "$LOCALAPPDATA\KimiPOS"
  
  ; Eliminar registro
  DeleteRegKey HKCU "Software\KimiPOS"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KimiPOS"
SectionEnd
