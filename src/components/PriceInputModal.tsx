import React, { useState } from 'react';
import { X } from 'lucide-react';
import IntegratedNumericKeypad from './Payment/IntegratedNumericKeypad';

interface PriceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
  productName: string;
  currencySymbol: string;
}

const PriceInputModal: React.FC<PriceInputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  currencySymbol
}) => {
  const [price, setPrice] = useState('0');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const numericPrice = parseFloat(price);
    if (numericPrice > 0) {
      onConfirm(numericPrice);
      setPrice('0');
      onClose();
    }
  };

  const handleCancel = () => {
    setPrice('0');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white text-center">
          <div className="flex items-center justify-center mb-2">
            <h2 className="text-xl font-bold">Precio Específico</h2>
          </div>
          <p className="text-blue-100 text-sm">{productName}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="text-gray-600 text-sm font-medium mb-1">INTRODUCE EL PRECIO</div>
              <div className="text-2xl font-bold text-gray-800">
                {currencySymbol}{parseFloat(price).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Teclado numérico */}
          <div className="mb-6">
            <IntegratedNumericKeypad
              value={price}
              onValueChange={setPrice}
              currencySymbol={currencySymbol}
              placeholder="0.00"
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={parseFloat(price) <= 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceInputModal;
