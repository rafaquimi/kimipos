const { exec } = require('child_process');
const fs = require('fs');

console.log('🖨️ PRUEBA DIRECTA CON POWERSHELL');
console.log('='.repeat(50));
console.log();

// Contenido de prueba
const testContent = `TEST IMPRESIÓN DIRECTA
${new Date().toLocaleString()}
IMPRESORA: POS-80C
PUERTO: USB002
ESTADO: NORMAL
`;

// Guardar en archivo
const testFile = 'test_direct.txt';
fs.writeFileSync(testFile, testContent, 'utf8');

console.log('📄 Contenido de prueba:');
console.log('-'.repeat(30));
console.log(testContent);
console.log('-'.repeat(30));
console.log();

console.log('🖨️ Probando impresión directa con PowerShell...');

// Método 1: PowerShell Out-Printer
const psCommand = `powershell -Command "Get-Content '${testFile}' | Out-Printer -Name 'POS-80C'"`;

exec(psCommand, (error, stdout, stderr) => {
  console.log('📋 Resultado PowerShell Out-Printer:');
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Comando ejecutado sin errores');
    if (stdout) console.log('Output:', stdout);
    if (stderr) console.log('Error:', stderr);
  }
  console.log();

  // Método 2: Comando print de Windows
  console.log('🖨️ Probando comando print de Windows...');
  const printCommand = `print ${testFile}`;
  
  exec(printCommand, (error2, stdout2, stderr2) => {
    console.log('📋 Resultado comando print:');
    if (error2) {
      console.log('❌ Error:', error2.message);
    } else {
      console.log('✅ Comando ejecutado sin errores');
      if (stdout2) console.log('Output:', stdout2);
      if (stderr2) console.log('Error:', stderr2);
    }
    console.log();

    // Verificar trabajos en cola
    console.log('📋 Verificando trabajos en cola de impresión...');
    const queueCommand = `powershell -Command "Get-PrintJob -PrinterName 'POS-80C'"`;
    
    exec(queueCommand, (error3, stdout3, stderr3) => {
      console.log('📋 Trabajos en cola:');
      if (error3) {
        console.log('❌ Error:', error3.message);
      } else {
        if (stdout3.trim()) {
          console.log(stdout3);
        } else {
          console.log('✅ No hay trabajos en cola (posiblemente ya se imprimió)');
        }
      }
      console.log();

      console.log('✅ VERIFICACIONES:');
      console.log('   1. ¿Se imprimió físicamente el ticket?');
      console.log('   2. ¿Apareció algún error en la impresora?');
      console.log('   3. ¿La impresora está encendida y con papel?');
      console.log();
      console.log('💡 Si no se imprimió, el problema puede ser:');
      console.log('   - Impresora apagada o sin papel');
      console.log('   - Driver de impresora no funciona');
      console.log('   - Puerto USB no funciona');
      console.log('   - Impresora en modo offline');
    });
  });
});
