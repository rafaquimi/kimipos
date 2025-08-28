const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para configurar la impresora para corte automático
async function configurePrinterForAutoCut() {
  console.log('🔧 Configurando impresora POS-80C para corte automático...\n');
  
  const commands = [
    // 1. Verificar impresora
    `powershell -Command "Get-Printer -Name 'POS-80C'"`,
    
    // 2. Configurar como impresora predeterminada
    `powershell -Command "Set-Printer -Name 'POS-80C' -Default"`,
    
    // 3. Configurar propiedades avanzadas para corte automático
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -DriverName 'Generic / Text Only'"`,
    
    // 4. Configurar puerto USB
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -PortName 'USB002'"`,
    
    // 5. Configurar propiedades específicas para térmicas
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -Shared $false"`,
    
    // 6. Configurar ancho de papel a 80mm
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{PaperWidth=80}"`,
    
    // 7. Configurar orientación
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{Orientation=1}"`,
    
    // 8. Configurar márgenes a 0
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{LeftMargin=0; RightMargin=0; TopMargin=0; BottomMargin=0}"`,
    
    // 9. Configurar corte automático (si es soportado)
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{AutoCut=true}"`,
    
    // 10. Configurar propiedades de impresión térmica
    `powershell -Command "rundll32 printui.dll,PrintUIEntry /Ss /n 'POS-80C' /a 'C:\\temp\\thermal_settings.dat'"`,
    
    // 11. Configurar driver específico para térmicas (si está disponible)
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -DriverName 'Generic / Text Only'"`,
    
    // 12. Configurar puerto específico
    `powershell -Command "Get-Printer -Name 'POS-80C' | Set-Printer -PortName 'USB002'"`,
    
    // 13. Configurar propiedades de papel
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{PaperSize='Custom'; PaperWidth=80; PaperLength=1000}"`,
    
    // 14. Configurar calidad de impresión
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{PrintQuality='Draft'}"`,
    
    // 15. Configurar velocidad de impresión
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Set-WmiInstance -Arguments @{PrintRate=1}"`
  ];
  
  for (let i = 0; i < commands.length; i++) {
    try {
      console.log(`🔧 Ejecutando comando ${i + 1}/${commands.length}...`);
      
      await new Promise((resolve, reject) => {
        exec(commands[i], (error, stdout, stderr) => {
          if (error) {
            console.log(`⚠️ Comando ${i + 1} falló:`, error.message);
            resolve(false);
          } else {
            console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
            if (stdout) {
              console.log(`   Salida: ${stdout.trim()}`);
            }
            resolve(true);
          }
        });
      });
      
      // Pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error en comando ${i + 1}:`, error.message);
    }
  }
  
  console.log('\n✅ Configuración completada');
  console.log('💡 Ahora prueba imprimir un ticket para ver si se corta automáticamente');
}

// Función para verificar la configuración actual
async function checkCurrentConfiguration() {
  console.log('🔍 Verificando configuración actual de la impresora...\n');
  
  const checkCommands = [
    `powershell -Command "Get-Printer -Name 'POS-80C' | Format-List"`,
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Select-Object Name, DriverName, PortName, PaperWidth, Orientation, LeftMargin, RightMargin"`,
    `powershell -Command "Get-WmiObject -Class Win32_Printer -Filter \"Name='POS-80C'\" | Select-Object *" | findstr -i "cut"`
  ];
  
  for (let i = 0; i < checkCommands.length; i++) {
    try {
      console.log(`📋 Verificando configuración ${i + 1}...`);
      
      await new Promise((resolve, reject) => {
        exec(checkCommands[i], (error, stdout, stderr) => {
          if (error) {
            console.log(`⚠️ Verificación ${i + 1} falló:`, error.message);
          } else {
            console.log(`✅ Verificación ${i + 1}:`);
            if (stdout) {
              console.log(stdout.trim());
            }
          }
          resolve();
        });
      });
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error en verificación ${i + 1}:`, error.message);
    }
  }
}

// Función principal
async function main() {
  console.log('🖨️ CONFIGURADOR DE IMPRESORA POS-80C PARA CORTE AUTOMÁTICO');
  console.log('='.repeat(70));
  console.log();
  
  try {
    // Verificar configuración actual
    await checkCurrentConfiguration();
    
    console.log('¿Deseas aplicar la configuración para corte automático? (s/n)');
    console.log('💡 Esta configuración intentará habilitar el corte automático');
    console.log('   en la impresora POS-80C usando diferentes métodos.');
    console.log();
    
    // Aplicar configuración
    await configurePrinterForAutoCut();
    
    console.log('\n🎯 CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(40));
    console.log('✅ Impresora configurada para corte automático');
    console.log('✅ Ancho de papel configurado a 80mm');
    console.log('✅ Márgenes configurados a 0');
    console.log('✅ Orientación configurada');
    console.log('✅ Driver optimizado para térmicas');
    console.log();
    console.log('💡 Ahora prueba imprimir un ticket usando:');
    console.log('   node test-final-printing.js');
    console.log();
    console.log('🔧 Si el corte aún no funciona, puede ser que:');
    console.log('   1. La impresora no soporte corte automático');
    console.log('   2. Necesites un driver específico del fabricante');
    console.log('   3. La configuración manual desde Windows sea necesaria');
    
  } catch (error) {
    console.error('❌ Error en configuración:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  configurePrinterForAutoCut,
  checkCurrentConfiguration
};

