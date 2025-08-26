export interface ProductTariff {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean; // La tarifa por defecto
}

export interface ProductCombination {
  id: string;
  productId?: string; // ID del producto específico (opcional)
  categoryId?: string; // ID de la categoría (opcional, para combinaciones por categoría)
  additionalPrice: number; // Precio adicional por la combinación (puede ser negativo)
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Precio por defecto (para compatibilidad)
  categoryId: string;
  description?: string;
  image?: string;
  backgroundColor?: string;
  taxId?: string; // ID del impuesto aplicado al producto
  tariffs?: ProductTariff[]; // Array de tarifas disponibles (opcional para compatibilidad)
  combinations?: ProductCombination[]; // Combinaciones disponibles (opcional para compatibilidad)
  isActive: boolean;
  askForPrice?: boolean; // Si es true, pedir precio al usuario en el dashboard
  // Configuración de impresión
  printerName?: string; // Nombre de la impresora específica para este producto
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  // Configuración de impresión por categoría
  printerName?: string; // Nombre de la impresora específica para esta categoría
  createdAt: Date;
  updatedAt: Date;
}
