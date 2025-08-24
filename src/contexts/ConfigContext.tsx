import React, { createContext, useContext, useState, useEffect } from 'react';

interface RestaurantConfig {
  restaurantName: string;
  currency: string;
  taxRate: number;
  modifiers?: {
    global: string[];
    byCategory: Record<string, string[]>; // categoryId -> modifiers
  };
}

interface ConfigContextType {
  config: RestaurantConfig;
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  getCurrencySymbol: () => string;
  getTaxRate: () => number;
  getModifiersForCategory: (categoryId?: string) => string[];
  updateCategoryModifiers: (categoryId: string, modifiers: string[]) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    const savedConfig = localStorage.getItem('restaurantConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return {
        restaurantName: parsed.restaurantName ?? 'Mi Restaurante',
        currency: parsed.currency ?? 'MXN',
        taxRate: parsed.taxRate ?? 0.16,
        modifiers: parsed.modifiers ?? { global: [], byCategory: {} }
      } as RestaurantConfig;
    }
    return {
      restaurantName: 'Mi Restaurante',
      currency: 'MXN',
      taxRate: 0.16,
      modifiers: { global: [], byCategory: {} }
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

  const value: ConfigContextType = {
    config,
    updateConfig,
    getCurrencySymbol,
    getTaxRate,
    getModifiersForCategory,
    updateCategoryModifiers
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



