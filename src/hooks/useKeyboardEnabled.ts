import { useConfig } from '../contexts/ConfigContext';

export const useKeyboardEnabled = () => {
  const { config } = useConfig();
  return config.enableOnScreenKeyboard ?? true;
};
