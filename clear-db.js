// Script para limpiar la base de datos y forzar la actualización
console.log('Limpiando base de datos...');

// Eliminar la base de datos existente
const deleteDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('KimiPOSDatabase');
    
    request.onsuccess = () => {
      console.log('Base de datos eliminada exitosamente');
      resolve();
    };
    
    request.onerror = () => {
      console.error('Error al eliminar la base de datos');
      reject();
    };
  });
};

// Ejecutar la limpieza
deleteDB().then(() => {
  console.log('Base de datos limpiada. Recarga la página para recrear la base de datos con la nueva versión.');
}).catch((error) => {
  console.error('Error:', error);
});
