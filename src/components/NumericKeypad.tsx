import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface NumericKeypadProps {
  value: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
  currencySymbol?: string;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ 
  value, 
  onConfirm, 
  onCancel, 
  currencySymbol = '$' 
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());

  // Sincronizar displayValue con el prop value cuando cambie
  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleNumberClick = (num: string) => {
    // Si el valor actual es 0 o es el valor inicial, reemplazar en lugar de concatenar
    if (displayValue === '0' || displayValue === value.toString()) {
      if (num === '.') {
        setDisplayValue('0.');
      } else {
        setDisplayValue(num);
      }
    } else if (num === '.' && displayValue.includes('.')) {
      // No permitir múltiples puntos decimales
      return;
    } else if (displayValue.length >= 10) {
      // Limitar la longitud
      return;
    } else {
      setDisplayValue(displayValue + num);
    }
  };

  const handleDelete = () => {
    if (displayValue.length === 1) {
      setDisplayValue('0');
    } else {
      setDisplayValue(displayValue.slice(0, -1));
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
  };

  const handleConfirm = () => {
    const numValue = parseFloat(displayValue) || 0;
    onConfirm(numValue);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <div className="flex items-center justify-between">
                         <h3 className="text-white font-semibold text-lg">Editar Precio (IVA incl.)</h3>
            <button
              onClick={handleCancel}
              className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Display */}
        <div className="p-6 bg-gray-50">
                     <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
             <div className="text-right">
               <div className="text-sm text-gray-500 mb-1">Precio por unidad (IVA incluido)</div>
               <div className="text-3xl font-bold text-gray-900">
                 {currencySymbol}{displayValue}
               </div>
             </div>
           </div>
        </div>

        {/* Keypad */}
        <div className="p-4 bg-gray-100">
          <div className="grid grid-cols-3 gap-3">
            {/* Primera fila */}
            <button
              onClick={() => handleNumberClick('7')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              7
            </button>
            <button
              onClick={() => handleNumberClick('8')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              8
            </button>
            <button
              onClick={() => handleNumberClick('9')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              9
            </button>

            {/* Segunda fila */}
            <button
              onClick={() => handleNumberClick('4')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              4
            </button>
            <button
              onClick={() => handleNumberClick('5')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              5
            </button>
            <button
              onClick={() => handleNumberClick('6')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              6
            </button>

            {/* Tercera fila */}
            <button
              onClick={() => handleNumberClick('1')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              1
            </button>
            <button
              onClick={() => handleNumberClick('2')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              2
            </button>
            <button
              onClick={() => handleNumberClick('3')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              3
            </button>

            {/* Cuarta fila */}
            <button
              onClick={() => handleNumberClick('0')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              0
            </button>
            <button
              onClick={() => handleNumberClick('.')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              .
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-xl py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              ←
            </button>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={handleClear}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Limpiar</span>
            </button>
            <button
              onClick={handleConfirm}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumericKeypad;
