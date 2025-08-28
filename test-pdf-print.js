// Script para generar PDF optimizado para impresoras térmicas
const { exec } = require('child_process');

console.log('🖨️ PRUEBA CON MICROSOFT PRINT TO PDF');
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
const tempFile = 'test_ticket_pdf.txt';
const pdfFile = 'ticket_test.pdf';

fs.writeFileSync(tempFile, ticketContent, 'utf8');

console.log('📄 Contenido del ticket:');
console.log('-'.repeat(40));
console.log(ticketContent);
console.log('-'.repeat(40));
console.log();

console.log('🖨️ Imprimiendo a Microsoft Print to PDF...');

// Comando para imprimir a PDF
const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name 'Microsoft Print to PDF' -OutputFileName '${pdfFile}'"`;

exec(printCommand, (error, stdout, stderr) => {
  // Limpiar archivo temporal
  fs.unlinkSync(tempFile);
  
  if (error) {
    console.log('❌ Error al imprimir a PDF:');
    console.log(`   ${error.message}`);
  } else {
    console.log('✅ PDF generado correctamente');
    console.log(`📄 Archivo: ${pdfFile}`);
    console.log();
    console.log('💡 Esto confirma que el sistema de impresión funciona');
    console.log('   El problema está en la impresora POS-80C específicamente');
  }
  
  console.log();
  console.log('='.repeat(50));
  console.log('🏁 Prueba completada');
});


