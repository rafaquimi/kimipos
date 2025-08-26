import React from 'react';
import { Calculator } from 'lucide-react';

interface IntegratedNumericKeypadProps {
  value: string;
  onValueChange: (value: string) => void;
  currencySymbol: string;
  placeholder?: string;
  className?: string;
}

const IntegratedNumericKeypad: React.FC<IntegratedNumericKeypadProps> = ({
  value,
  onValueChange,
  currencySymbol,
  placeholder = "0.00",
  className = ""
}) => {
  const initialValueRef = React.useRef(value);
  const [hasStartedTyping, setHasStartedTyping] = React.useState(false);
  
  // Actualizar el valor inicial solo cuando cambia externamente (no cuando el usuario está escribiendo)
  React.useEffect(() => {
    if (!hasStartedTyping) {
      initialValueRef.current = value;
    }
  }, [value, hasStartedTyping]);
  
  const handleNumberClick = (num: string) => {
    // Si el usuario no ha empezado a escribir, comenzar de nuevo
    if (!hasStartedTyping) {
      onValueChange(num);
      setHasStartedTyping(true);
    } else {
      // Si ya ha empezado a escribir, concatenar
      onValueChange(value + num);
    }
  };

  const handleDecimalClick = () => {
    // Si el usuario no ha empezado a escribir, comenzar con '0.'
    if (!hasStartedTyping) {
      onValueChange('0.');
      setHasStartedTyping(true);
    } else if (!value.includes('.')) {
      // Si ya ha empezado a escribir y no tiene decimal, agregar el punto
      onValueChange(value + '.');
    }
  };

  const handleClear = () => {
    onValueChange('0');
    setHasStartedTyping(false);
  };

  const handleBackspace = () => {
    if (value.length > 1) {
      onValueChange(value.slice(0, -1));
    } else {
      onValueChange('0');
    }
  };

  return (
    <div className={`bg-gray-100 rounded-lg p-3 ${className}`}>
      {/* Display */}
      <div className="mb-3">
        <div className="relative">
          <div className="w-full px-3 py-2 text-right text-sm font-bold bg-white border border-gray-300 rounded-md flex items-center justify-end pr-8">
            <span className="text-gray-900">{value || placeholder}</span>
          </div>
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
            {currencySymbol}
          </span>
        </div>
      </div>

      {/* Keypad */}
      <div className="space-y-1">
        {/* Row 1: 7, 8, 9 */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleNumberClick('7')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            7
          </button>
          <button
            onClick={() => handleNumberClick('8')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            8
          </button>
          <button
            onClick={() => handleNumberClick('9')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            9
          </button>
        </div>

        {/* Row 2: 4, 5, 6 */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleNumberClick('4')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            4
          </button>
          <button
            onClick={() => handleNumberClick('5')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            5
          </button>
          <button
            onClick={() => handleNumberClick('6')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            6
          </button>
        </div>

        {/* Row 3: 1, 2, 3 */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleNumberClick('1')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            1
          </button>
          <button
            onClick={() => handleNumberClick('2')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            2
          </button>
          <button
            onClick={() => handleNumberClick('3')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            3
          </button>
        </div>

        {/* Row 4: 0, ., C */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleNumberClick('0')}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            0
          </button>
          <button
            onClick={handleDecimalClick}
            className="flex-1 h-12 bg-white border border-gray-300 rounded-md text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            .
          </button>
          <button
            onClick={handleClear}
            className="flex-1 h-12 bg-red-50 border border-red-300 rounded-md text-lg font-semibold text-red-600 hover:bg-red-100 hover:border-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            C
          </button>
        </div>

        {/* Backspace button */}
        <div className="flex space-x-1">
          <button
            onClick={handleBackspace}
            className="w-full h-12 bg-orange-50 border border-orange-300 rounded-md text-lg font-semibold text-orange-600 hover:bg-orange-100 hover:border-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            ← Borrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegratedNumericKeypad;
