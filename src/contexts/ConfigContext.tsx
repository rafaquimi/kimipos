import React, { createContext, useContext, useState, useEffect } from 'react';

interface RestaurantConfig {
  restaurantName: string;
  currency: string;
  taxRate: number;
}

interface ConfigContextType {
  config: RestaurantConfig;
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  getCurrencySymbol: () => string;
  getTaxRate: () => number;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    const savedConfig = localStorage.getItem('restaurantConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    return {
      restaurantName: 'Mi Restaurante',
      currency: 'MXN',
      taxRate: 0.16,
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

  const value: ConfigContextType = {
    config,
    updateConfig,
    getCurrencySymbol,
    getTaxRate
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


