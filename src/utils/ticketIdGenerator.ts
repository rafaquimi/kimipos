// Función para obtener el siguiente ID de ticket
export const getNextTicketId = (): number => {
  const currentId = localStorage.getItem('lastTicketId');
  const nextId = currentId ? parseInt(currentId) + 1 : 1;
  localStorage.setItem('lastTicketId', nextId.toString());
  return nextId;
};

// Función para obtener el ID actual (sin incrementar)
export const getCurrentTicketId = (): number => {
  const currentId = localStorage.getItem('lastTicketId');
  return currentId ? parseInt(currentId) : 0;
};

// Función para resetear el contador (útil para pruebas o cambio de ejercicio)
export const resetTicketId = (): void => {
  localStorage.removeItem('lastTicketId');
};

// Función para formatear el ID con ceros a la izquierda
export const formatTicketId = (id: number): string => {
  return id.toString().padStart(6, '0');
};
