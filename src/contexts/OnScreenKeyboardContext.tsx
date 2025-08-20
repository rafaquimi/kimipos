import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type EditableElement = HTMLInputElement | HTMLTextAreaElement;

interface OnScreenKeyboardContextValue {
  isOpen: boolean;
  currentValue: string;
  openForElement: (element: EditableElement) => void;
  close: () => void;
  setValue: (value: string) => void;
  commit: () => void;
  cancel: () => void;
  moveCaret: (delta: number) => void;
  backspace: () => void;
  insertText: (text: string) => void;
}

const OnScreenKeyboardContext = createContext<OnScreenKeyboardContextValue | null>(null);

export const useOnScreenKeyboard = () => {
  const ctx = useContext(OnScreenKeyboardContext);
  if (!ctx) throw new Error('useOnScreenKeyboard debe usarse dentro de OnScreenKeyboardProvider');
  return ctx;
};

function setElementNativeValue(element: EditableElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    (element as any).value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

export const OnScreenKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState('');
  const targetRef = useRef<EditableElement | null>(null);
  const caretRef = useRef<number>(0);
  const ignoreNextFocusRef = useRef<boolean>(false);

  const openForElement = useCallback((element: EditableElement) => {
    targetRef.current = element;
    const value = element.value ?? '';
    setCurrentValue(value);
    try {
      caretRef.current = element.selectionStart ?? value.length;
    } catch {
      caretRef.current = value.length;
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    targetRef.current = null;
  }, []);

  const commit = useCallback(() => {
    const el = targetRef.current;
    if (el) {
      setElementNativeValue(el, currentValue);
      try {
        el.selectionStart = el.selectionEnd = caretRef.current;
      } catch {}
      ignoreNextFocusRef.current = true;
      el.focus();
    }
    close();
  }, [currentValue, close]);

  const cancel = useCallback(() => {
    close();
  }, [close]);

  const setValue = useCallback((value: string) => {
    setCurrentValue(value);
    const el = targetRef.current;
    if (el) {
      setElementNativeValue(el, value);
      try {
        el.selectionStart = el.selectionEnd = caretRef.current;
      } catch {}
    }
  }, []);

  const moveCaret = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(currentValue.length, (caretRef.current ?? 0) + delta));
    caretRef.current = next;
  }, [currentValue.length]);

  const backspace = useCallback(() => {
    const pos = caretRef.current ?? 0;
    if (pos <= 0) return;
    const next = currentValue.slice(0, pos - 1) + currentValue.slice(pos);
    caretRef.current = pos - 1;
    setValue(next);
  }, [currentValue, setValue]);

  const insertText = useCallback((text: string) => {
    const pos = caretRef.current ?? 0;
    const next = currentValue.slice(0, pos) + text + currentValue.slice(pos);
    caretRef.current = pos + text.length;
    setValue(next);
  }, [currentValue, setValue]);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (ignoreNextFocusRef.current) {
        ignoreNextFocusRef.current = false;
        return;
      }
      if (target.getAttribute('data-osk') === 'false') return;
      if (target instanceof HTMLInputElement) {
        const type = (target.type || 'text').toLowerCase();
        const allow = ['text', 'search', 'email', 'password', 'tel', 'url', 'number'];
        if (allow.includes(type)) {
          openForElement(target);
        }
      } else if (target instanceof HTMLTextAreaElement) {
        openForElement(target);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [openForElement]);

  const value = useMemo<OnScreenKeyboardContextValue>(() => ({
    isOpen,
    currentValue,
    openForElement,
    close,
    setValue,
    commit,
    cancel,
    moveCaret,
    backspace,
    insertText,
  }), [isOpen, currentValue, openForElement, close, setValue, commit, cancel, moveCaret, backspace, insertText]);

  return (
    <OnScreenKeyboardContext.Provider value={value}>
      {children}
    </OnScreenKeyboardContext.Provider>
  );
};


