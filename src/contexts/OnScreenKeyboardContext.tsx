import React, { createContext, useContext } from 'react';
import { useConfig } from './ConfigContext';

interface OnScreenKeyboardContextType {
  isEnabled: boolean;
}

const OnScreenKeyboardContext = createContext<OnScreenKeyboardContextType | undefined>(undefined);

export const OnScreenKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  
  const value: OnScreenKeyboardContextType = {
    isEnabled: config.enableOnScreenKeyboard ?? true
  };

  return (
    <OnScreenKeyboardContext.Provider value={value}>
      {children}
    </OnScreenKeyboardContext.Provider>
  );
};

export const useOnScreenKeyboard = () => {
  const context = useContext(OnScreenKeyboardContext);
  if (context === undefined) {
    throw new Error('useOnScreenKeyboard must be used within an OnScreenKeyboardProvider');
  }
  return context;
};


