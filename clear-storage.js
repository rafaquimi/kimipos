// Script temporal para limpiar localStorage y cargar nuevos productos
console.log('Limpiando localStorage...');

// Limpiar productos y categorías existentes
localStorage.removeItem('kimipos_products');
localStorage.removeItem('kimipos_categories');

console.log('localStorage limpiado. Recarga la página para ver los nuevos productos.');
console.log('Después de recargar, puedes eliminar este archivo.');

// Mostrar confirmación
alert('localStorage limpiado. Recarga la página para ver los nuevos productos.');

