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

  const numbers = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.', 'C']
  ];

  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
      {/* Display */}
      <div className="mb-4">
                 <div className="relative">
           <div className="w-full px-4 py-3 text-right text-2xl font-bold bg-white border-2 border-gray-200 rounded-lg min-h-[60px] flex items-center justify-end pr-12">
             <span className="text-gray-900">{value || placeholder}</span>
           </div>
           <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
             {currencySymbol}
           </span>
         </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {numbers.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (num === 'C') {
                    handleClear();
                  } else if (num === '.') {
                    handleDecimalClick();
                  } else {
                    handleNumberClick(num);
                  }
                }}
                className="aspect-square bg-white border-2 border-gray-200 rounded-lg text-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {num}
              </button>
            ))}
          </React.Fragment>
        ))}
        
        {/* Backspace button */}
        <button
          onClick={handleBackspace}
          className="aspect-square bg-red-50 border-2 border-red-200 rounded-lg text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          ←
        </button>
      </div>
    </div>
  );
};

export default IntegratedNumericKeypad;
