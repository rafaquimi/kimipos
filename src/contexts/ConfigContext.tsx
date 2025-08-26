import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  description?: string;
}

interface RestaurantConfig {
  restaurantName: string;
  currency: string;
  taxRate: number; // Mantener para compatibilidad
  // Sistema de impuestos
  taxes: TaxRate[];
  defaultTaxId: string;
  // Datos del negocio
  businessData: {
    fiscalName: string;
    taxId: string;
    commercialName: string;
    address: string;
    phone: string;
    email: string;
    city: string;
  };
  modifiers?: {
    global: string[];
    byCategory: Record<string, string[]>; // categoryId -> modifiers
  };
  // Configuración de interfaz
  enableOnScreenKeyboard?: boolean;
  // Configuración de impresión
  printing?: {
    mainPrinter: string;
    mainPrinterAutoPrint: boolean;
    mainPrinterShowPreview: boolean;
    orderPrinter: string;
    orderPrinterAutoPrint: boolean;
    orderPrinterShowPreview: boolean;
    paperFormat: string;
    orientation: string;
    fontSize: string;
  };
}

interface ConfigContextType {
  config: RestaurantConfig;
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  getCurrencySymbol: () => string;
  getTaxRate: () => number;
  getModifiersForCategory: (categoryId?: string) => string[];
  updateCategoryModifiers: (categoryId: string, modifiers: string[]) => void;
  // Funciones para gestión de impuestos
  addTax: (tax: Omit<TaxRate, 'id'>) => void;
  updateTax: (id: string, tax: Partial<TaxRate>) => void;
  deleteTax: (id: string) => void;
  setDefaultTax: (id: string) => void;
  getTaxById: (id: string) => TaxRate | undefined;
  getDefaultTax: () => TaxRate | undefined;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    const savedConfig = localStorage.getItem('restaurantConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      
      // Migrar impuestos existentes si no existen
      let taxes = parsed.taxes || [];
      if (taxes.length === 0 && parsed.taxRate) {
        // Crear impuesto por defecto basado en el taxRate existente
        const defaultTax: TaxRate = {
          id: 'default-tax',
          name: 'IVA General',
          rate: parsed.taxRate,
          isDefault: true,
          description: 'Impuesto al Valor Agregado'
        };
        taxes = [defaultTax];
      }
      
      return {
        restaurantName: parsed.restaurantName ?? 'Mi Restaurante',
        currency: parsed.currency ?? 'MXN',
        taxRate: parsed.taxRate ?? 0.16,
        taxes: taxes,
        defaultTaxId: parsed.defaultTaxId ?? (taxes.find(t => t.isDefault)?.id || ''),
        businessData: parsed.businessData ?? {
          fiscalName: '',
          taxId: '',
          commercialName: '',
          address: '',
          phone: '',
          email: '',
          city: '',
        },
        modifiers: parsed.modifiers ?? { global: [], byCategory: {} },
        enableOnScreenKeyboard: parsed.enableOnScreenKeyboard ?? true,
        printing: parsed.printing ?? {
          mainPrinter: '',
          mainPrinterAutoPrint: false,
          mainPrinterShowPreview: true,
          orderPrinter: '',
          orderPrinterAutoPrint: true,
          orderPrinterShowPreview: false,
          paperFormat: '80mm',
          orientation: 'portrait',
          fontSize: 'normal'
        }
      } as RestaurantConfig;
    }
    
    // Configuración por defecto con impuesto inicial
    const defaultTax: TaxRate = {
      id: 'default-tax',
      name: 'IVA General',
      rate: 0.16,
      isDefault: true,
      description: 'Impuesto al Valor Agregado'
    };
    
    return {
      restaurantName: 'Mi Restaurante',
      currency: 'MXN',
      taxRate: 0.16,
      taxes: [defaultTax],
      defaultTaxId: 'default-tax',
      businessData: {
        fiscalName: '',
        taxId: '',
        commercialName: '',
        address: '',
        phone: '',
        email: '',
        city: '',
      },
      modifiers: { global: [], byCategory: {} },
      enableOnScreenKeyboard: true,
      printing: {
        mainPrinter: '',
        mainPrinterAutoPrint: false,
        mainPrinterShowPreview: true,
        orderPrinter: '',
        orderPrinterAutoPrint: true,
        orderPrinterShowPreview: false,
        paperFormat: '80mm',
        orientation: 'portrait',
        fontSize: 'normal'
      }
    };
  });

  const updateConfig = (newConfig: Partial<RestaurantConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('restaurantConfig', JSON.stringify(updatedConfig));
  };

  const getCurrencySymbol = () => {
    switch (config.currency) {
      case 'MXN': return '$';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const getTaxRate = () => {
    return config.taxRate;
  };

  const getModifiersForCategory = (categoryId?: string): string[] => {
    if (!config.modifiers) return [];
    const fromCategory = (categoryId && config.modifiers.byCategory[categoryId]) || [];
    const globals = config.modifiers.global || [];
    return Array.from(new Set([...
      globals,
      ...fromCategory
    ]));
  };

  const updateCategoryModifiers = (categoryId: string, modifiers: string[]) => {
    const next = {
      ...config,
      modifiers: {
        global: config.modifiers?.global || [],
        byCategory: {
          ...(config.modifiers?.byCategory || {}),
          [categoryId]: modifiers
        }
      }
    } as RestaurantConfig;
    setConfig(next);
    localStorage.setItem('restaurantConfig', JSON.stringify(next));
  };

  // Funciones para gestión de impuestos
  const addTax = (tax: Omit<TaxRate, 'id'>) => {
    const newTax: TaxRate = {
      ...tax,
      id: `tax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedTaxes = [...config.taxes, newTax];
    const updatedConfig = { ...config, taxes: updatedTaxes };
    
    // Si es el primer impuesto, establecerlo como por defecto
    if (updatedTaxes.length === 1) {
      updatedConfig.defaultTaxId = newTax.id;
    }
    
    setConfig(updatedConfig);
    localStorage.setItem('restaurantConfig', JSON.stringify(updatedConfig));
  };

  const updateTax = (id: string, tax: Partial<TaxRate>) => {
    const updatedTaxes = config.taxes.map(t => 
      t.id === id ? { ...t, ...tax } : t
    );
    const updatedConfig = { ...config, taxes: updatedTaxes };
    setConfig(updatedConfig);
    localStorage.setItem('restaurantConfig', JSON.stringify(updatedConfig));
  };

  const deleteTax = (id: string) => {
    const updatedTaxes = config.taxes.filter(t => t.id !== id);
    
    // Si se elimina el impuesto por defecto, establecer el primero como por defecto
    let updatedConfig = { ...config, taxes: updatedTaxes };
    if (id === config.defaultTaxId && updatedTaxes.length > 0) {
      updatedConfig.defaultTaxId = updatedTaxes[0].id;
    }
    
    setConfig(updatedConfig);
    localStorage.setItem('restaurantConfig', JSON.stringify(updatedConfig));
  };

  const setDefaultTax = (id: string) => {
    const updatedTaxes = config.taxes.map(t => ({
      ...t,
      isDefault: t.id === id
    }));
    const updatedConfig = { 
      ...config, 
      taxes: updatedTaxes,
      defaultTaxId: id
    };
    setConfig(updatedConfig);
    localStorage.setItem('restaurantConfig', JSON.stringify(updatedConfig));
  };

  const getTaxById = (id: string): TaxRate | undefined => {
    return config.taxes.find(t => t.id === id);
  };

  const getDefaultTax = (): TaxRate | undefined => {
    return config.taxes.find(t => t.id === config.defaultTaxId);
  };

  const value: ConfigContextType = {
    config,
    updateConfig,
    getCurrencySymbol,
    getTaxRate,
    getModifiersForCategory,
    updateCategoryModifiers,
    addTax,
    updateTax,
    deleteTax,
    setDefaultTax,
    getTaxById,
    getDefaultTax
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};



