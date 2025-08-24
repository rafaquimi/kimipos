import React from 'react';
import { X, Check } from 'lucide-react';
import { ProductTariff } from '../types/product';

interface TariffSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  tariffs: ProductTariff[];
  onSelectTariff: (tariff: ProductTariff) => void;
  currencySymbol?: string;
}

const TariffSelectorModal: React.FC<TariffSelectorModalProps> = ({
  isOpen,
  onClose,
  productName,
  tariffs,
  onSelectTariff,
  currencySymbol = '€'
}) => {
  if (!isOpen) return null;

  const handleSelectTariff = (tariff: ProductTariff) => {
    onSelectTariff(tariff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Seleccionar Tarifa
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              {productName}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-3">
              {tariffs.map((tariff) => (
                <button
                  key={tariff.id}
                  onClick={() => handleSelectTariff(tariff)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {tariff.name}
                        </span>
                        {tariff.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {productName} - {tariff.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900">
                        {currencySymbol}{tariff.price.toFixed(2)}
                      </span>
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full group-hover:border-blue-500 transition-colors flex items-center justify-center">
                        <Check className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TariffSelectorModal;


