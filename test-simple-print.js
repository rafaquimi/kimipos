const { exec } = require('child_process');
const fs = require('fs');

console.log('🖨️ PRUEBA MUY SIMPLE - IMPRESORA POS-80C');
console.log('='.repeat(50));
console.log();

// Contenido muy simple
const simpleContent = `TEST IMPRESORA POS-80C
${new Date().toLocaleString()}
ESTE ES UN TEST SIMPLE
`;

// Guardar en archivo
const testFile = 'test_simple.txt';
fs.writeFileSync(testFile, simpleContent, 'utf8');

console.log('📄 Contenido de prueba:');
console.log('-'.repeat(30));
console.log(simpleContent);
console.log('-'.repeat(30));
console.log();

console.log('🖨️ Probando impresión simple...');

// Método 1: PowerShell directo
const psCommand = `powershell -Command "Get-Content '${testFile}' | Out-Printer -Name 'POS-80C'"`;

exec(psCommand, (error, stdout, stderr) => {
  console.log('📋 Resultado PowerShell:');
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Comando ejecutado sin errores');
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
    }
    console.log();
    
    // Limpiar archivo
    fs.unlinkSync(testFile);
    
    console.log('🔍 VERIFICACIONES:');
    console.log('   1. ¿Se imprimió algo en POS-80C?');
    console.log('   2. ¿La impresora está encendida?');
    console.log('   3. ¿Tiene papel?');
    console.log('   4. ¿Está conectada por USB?');
    console.log();
    console.log('💡 Si no se imprimió, el problema puede ser:');
    console.log('   - Impresora apagada');
    console.log('   - Sin papel');
    console.log('   - No conectada físicamente');
    console.log('   - Driver no funciona');
    console.log();
    console.log('='.repeat(50));
    console.log('🏁 Prueba completada');
  });
});
