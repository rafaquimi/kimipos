const { exec } = require('child_process');

console.log('🖨️ PRUEBA DIRECTA - IMPRESORA POS-80C');
console.log('='.repeat(50));
console.log();

// Contenido del ticket de prueba
const ticketContent = `                  RESTAURANTE EL BUENO
================================================
MESA: MESA-12
CLIENTE: MARÍA GARCÍA
FECHA: ${new Date().toLocaleString()}
------------------------------------------------
2x Hamburguesa Clásica
   12.50 EUR x 2 = 25.00 EUR
1x Coca Cola 330ml
   2.50 EUR x 1 = 2.50 EUR
1x Patatas Fritas
   4.00 EUR x 1 = 4.00 EUR
------------------------------------------------
                TOTAL: 31.50 EUR

                   ¡GRACIAS!

`;

// Guardar contenido en archivo temporal
const fs = require('fs');
const tempFile = 'test_ticket.txt';

fs.writeFileSync(tempFile, ticketContent, 'utf8');

console.log('📄 Contenido del ticket:');
console.log('-'.repeat(40));
console.log(ticketContent);
console.log('-'.repeat(40));
console.log();

console.log('🖨️ Imprimiendo directamente a POS-80C...');

// Comando para imprimir directamente a POS-80C
const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'POS-80C'"`;

exec(printCommand, (error, stdout, stderr) => {
  // Limpiar archivo temporal
  fs.unlinkSync(tempFile);
  
  if (error) {
    console.log('❌ Error al imprimir:');
    console.log(`   ${error.message}`);
    console.log();
    console.log('🔧 Solución de problemas:');
    console.log('   1. Verifica que la impresora POS-80C esté conectada');
    console.log('   2. Verifica que esté encendida');
    console.log('   3. Verifica que tenga papel');
    console.log('   4. Verifica que el driver esté instalado correctamente');
  } else {
    console.log('✅ Comando de impresión ejecutado');
    console.log('📋 Verifica que:');
    console.log('   1. Se imprimió el ticket en POS-80C');
    console.log('   2. El formato es correcto');
    console.log('   3. Los datos son correctos');
    console.log();
    console.log('💡 Si no se imprimió, prueba estos comandos:');
    console.log('   - Verificar estado: Get-Printer -Name "POS-80C"');
    console.log('   - Imprimir test: Get-Printer -Name "POS-80C" | Test-Printer');
  }
  
  console.log();
  console.log('='.repeat(50));
  console.log('🏁 Prueba completada');
});
