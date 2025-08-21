// Tasa de IVA en España (21% para la mayoría de productos)
export const IVA_RATE = 0.21;

/**
 * Calcula el precio base (sin IVA) a partir del precio con IVA
 * @param priceWithVAT - Precio con IVA incluido
 * @returns Precio base sin IVA
 */
export const calculateBasePrice = (priceWithVAT: number): number => {
  return priceWithVAT / (1 + IVA_RATE);
};

/**
 * Calcula el IVA a partir del precio con IVA
 * @param priceWithVAT - Precio con IVA incluido
 * @returns Cantidad de IVA
 */
export const calculateVATAmount = (priceWithVAT: number): number => {
  return priceWithVAT - calculateBasePrice(priceWithVAT);
};

/**
 * Calcula el precio con IVA a partir del precio base
 * @param basePrice - Precio base sin IVA
 * @returns Precio con IVA incluido
 */
export const calculatePriceWithVAT = (basePrice: number): number => {
  return basePrice * (1 + IVA_RATE);
};

/**
 * Formatea un precio para mostrar con 2 decimales
 * @param price - Precio a formatear
 * @returns Precio formateado
 */
export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

/**
 * Calcula el total base (sin IVA) de una lista de productos
 * @param items - Lista de productos con precios con IVA
 * @returns Total base sin IVA
 */
export const calculateTotalBase = (items: Array<{ unitPrice: number; quantity: number }>): number => {
  return items.reduce((total, item) => {
    const basePrice = calculateBasePrice(item.unitPrice);
    return total + (basePrice * item.quantity);
  }, 0);
};

/**
 * Calcula el total de IVA de una lista de productos
 * @param items - Lista de productos con precios con IVA
 * @returns Total de IVA
 */
export const calculateTotalVAT = (items: Array<{ unitPrice: number; quantity: number }>): number => {
  return items.reduce((total, item) => {
    const vatAmount = calculateVATAmount(item.unitPrice);
    return total + (vatAmount * item.quantity);
  }, 0);
};

/**
 * Calcula el total con IVA de una lista de productos
 * @param items - Lista de productos con precios con IVA
 * @returns Total con IVA
 */
export const calculateTotalWithVAT = (items: Array<{ unitPrice: number; quantity: number }>): number => {
  return items.reduce((total, item) => {
    return total + (item.unitPrice * item.quantity);
  }, 0);
};

