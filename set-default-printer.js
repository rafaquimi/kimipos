// Script para configurar POS-80C como impresora predeterminada
const { exec } = require('child_process');

async function setDefaultPrinter() {
  try {
    console.log('🔧 Configurando POS-80C como impresora predeterminada...');
    
    // Configurar POS-80C como impresora predeterminada
    const setDefaultCommand = `powershell -Command "Set-Printer -Name 'POS-80C' -Default"`;
    
    exec(setDefaultCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error configurando impresora predeterminada:', error.message);
        return;
      }
      
      console.log('✅ POS-80C configurada como impresora predeterminada');
      
      // Verificar que se configuró correctamente
      console.log('\n🔍 Verificando configuración...');
      const verifyCommand = `powershell -Command "Get-Printer | Where-Object {$_.Default -eq $true} | Select-Object Name, DriverName, PortName"`;
      
      exec(verifyCommand, (verifyError, verifyStdout, verifyStderr) => {
        if (verifyError) {
          console.error('❌ Error verificando configuración:', verifyError.message);
        } else {
          console.log('📋 Impresora predeterminada actual:');
          console.log(verifyStdout);
          
          if (verifyStdout.includes('POS-80C')) {
            console.log('✅ POS-80C es ahora la impresora predeterminada');
            console.log('🎯 Ahora puedes probar a imprimir desde la aplicación');
          } else {
            console.log('⚠️ POS-80C no se configuró como predeterminada');
            console.log('💡 Intenta configurarla manualmente desde Windows');
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
setDefaultPrinter();


