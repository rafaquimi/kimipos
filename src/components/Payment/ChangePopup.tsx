import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ChangePopupProps {
  isOpen: boolean;
  onClose: () => void;
  changeAmount: number;
  currencySymbol: string;
}

const ChangePopup: React.FC<ChangePopupProps> = ({
  isOpen,
  onClose,
  changeAmount,
  currencySymbol
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-2xl mx-4 relative">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
        <div className="text-8xl font-bold text-green-600 mb-6">
          💰
        </div>
        <h2 className="text-4xl font-bold text-gray-800 mb-8">
          CAMBIO A DEVOLVER
        </h2>
        <div className="text-6xl font-bold text-green-600 mb-8">
          {currencySymbol}{changeAmount.toFixed(2)}
        </div>
        <p className="text-2xl text-gray-600">
          Entregar al cliente
        </p>
      </div>
    </div>
  );
};

export default ChangePopup;
