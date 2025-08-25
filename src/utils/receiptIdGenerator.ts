// Generador de IDs para recibos (separado de tickets)
export const getNextReceiptId = (): number => {
  const lastReceiptId = localStorage.getItem('lastReceiptId');
  const nextId = lastReceiptId ? parseInt(lastReceiptId) + 1 : 1;
  localStorage.setItem('lastReceiptId', nextId.toString());
  return nextId;
};

export const getCurrentReceiptId = (): number => {
  const lastReceiptId = localStorage.getItem('lastReceiptId');
  return lastReceiptId ? parseInt(lastReceiptId) : 0;
};

export const resetReceiptId = (): void => {
  localStorage.removeItem('lastReceiptId');
};

export const formatReceiptId = (id: number): string => {
  return `R${id.toString().padStart(6, '0')}`;
};
