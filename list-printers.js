// Script para listar todas las impresoras del sistema
const { exec } = require('child_process');

async function listPrinters() {
  try {
    console.log('🔍 Listando todas las impresoras del sistema...');
    
    // Listar todas las impresoras
    const listCommand = `powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName, Default, PrinterStatus | Format-Table -AutoSize"`;
    
    exec(listCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error listando impresoras:', error.message);
        return;
      }
      
      console.log('📋 Impresoras disponibles:');
      console.log(stdout);
      
      // También obtener información específica de la POS-80C
      console.log('\n🔍 Buscando información específica de POS-80C...');
      const pos80cCommand = `powershell -Command "Get-Printer -Name 'POS-80C' | Select-Object Name, DriverName, PortName, Default, PrinterStatus | Format-Table -AutoSize"`;
      
      exec(pos80cCommand, (posError, posStdout, posStderr) => {
        if (posError) {
          console.error('❌ Error obteniendo información de POS-80C:', posError.message);
          console.log('💡 La POS-80C no está configurada como impresora del sistema');
        } else {
          console.log('📋 Información de POS-80C:');
          console.log(posStdout);
        }
        
        // Verificar si POS-80C es la predeterminada
        console.log('\n🔍 Verificando si POS-80C es la impresora predeterminada...');
        const defaultCommand = `powershell -Command "Get-Printer | Where-Object {$_.Default -eq $true} | Select-Object Name, DriverName, PortName"`;
        
        exec(defaultCommand, (defaultError, defaultStdout, defaultStderr) => {
          if (defaultError) {
            console.error('❌ Error obteniendo impresora predeterminada:', defaultError.message);
          } else {
            console.log('📋 Impresora predeterminada:');
            console.log(defaultStdout);
            
            if (defaultStdout.includes('POS-80C')) {
              console.log('✅ POS-80C es la impresora predeterminada');
            } else {
              console.log('⚠️ POS-80C NO es la impresora predeterminada');
              console.log('💡 Para configurar POS-80C como predeterminada:');
              console.log('   1. Ve a Configuración > Dispositivos > Impresoras y escáneres');
              console.log('   2. Haz clic en POS-80C');
              console.log('   3. Haz clic en "Administrar"');
              console.log('   4. Haz clic en "Establecer como predeterminada"');
            }
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
listPrinters();


