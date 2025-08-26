import React, { createContext, useContext, useState } from 'react';
import { useConfig } from './ConfigContext';

interface OnScreenKeyboardContextType {
  isEnabled: boolean;
  isOpen: boolean;
  currentValue: string;
  insertText: (text: string) => void;
  backspace: () => void;
  moveCaret: (direction: 'left' | 'right') => void;
  commit: () => void;
  cancel: () => void;
  openKeyboard: (initialValue?: string) => void;
  closeKeyboard: () => void;
}

const OnScreenKeyboardContext = createContext<OnScreenKeyboardContextType | undefined>(undefined);

export const OnScreenKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState('');
  const [caretPosition, setCaretPosition] = useState(0);
  const [resolveCallback, setResolveCallback] = useState<((value: string) => void) | null>(null);

  const insertText = (text: string) => {
    const newValue = currentValue.slice(0, caretPosition) + text + currentValue.slice(caretPosition);
    setCurrentValue(newValue);
    setCaretPosition(caretPosition + text.length);
  };

  const backspace = () => {
    if (caretPosition > 0) {
      const newValue = currentValue.slice(0, caretPosition - 1) + currentValue.slice(caretPosition);
      setCurrentValue(newValue);
      setCaretPosition(caretPosition - 1);
    }
  };

  const moveCaret = (direction: 'left' | 'right') => {
    if (direction === 'left' && caretPosition > 0) {
      setCaretPosition(caretPosition - 1);
    } else if (direction === 'right' && caretPosition < currentValue.length) {
      setCaretPosition(caretPosition + 1);
    }
  };

  const commit = () => {
    if (resolveCallback) {
      resolveCallback(currentValue);
      setIsOpen(false);
      setResolveCallback(null);
    }
  };

  const cancel = () => {
    if (resolveCallback) {
      resolveCallback('');
      setIsOpen(false);
      setResolveCallback(null);
    }
  };

  const openKeyboard = (initialValue: string = '') => {
    setCurrentValue(initialValue);
    setCaretPosition(initialValue.length);
    setIsOpen(true);
    return new Promise<string>((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const closeKeyboard = () => {
    setIsOpen(false);
    setResolveCallback(null);
  };
  
  const value: OnScreenKeyboardContextType = {
    isEnabled: config.enableOnScreenKeyboard ?? true,
    isOpen,
    currentValue,
    insertText,
    backspace,
    moveCaret,
    commit,
    cancel,
    openKeyboard,
    closeKeyboard
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


