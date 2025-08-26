import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PartialPaymentConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tableNumber: string;
  amountCollected: number;
  pendingAmount: number;
  currencySymbol: string;
}

const PartialPaymentConfirmationModal: React.FC<PartialPaymentConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  tableNumber,
  amountCollected,
  pendingAmount,
  currencySymbol
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="w-8 h-8 mr-3" />
            <h2 className="text-2xl font-bold">Confirmar Cobro Parcial</h2>
          </div>
          <p className="text-blue-100 text-lg">¿Deseas procesar este pago parcial?</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mesa */}
          <div className="mb-6 text-center">
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="text-gray-600 text-sm font-medium mb-1">MESA</div>
              <div className="text-3xl font-bold text-gray-800">{tableNumber}</div>
            </div>
          </div>

          {/* Montos */}
          <div className="space-y-4 mb-6">
            {/* Monto cobrado */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-600 text-sm font-medium mb-1">MONTO COBRADO</div>
                  <div className="text-2xl font-bold text-green-700">
                    {currencySymbol}{amountCollected.toFixed(2)}
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Monto pendiente */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-orange-600 text-sm font-medium mb-1">MONTO PENDIENTE</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {currencySymbol}{pendingAmount.toFixed(2)}
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="text-blue-800 text-center">
              <div className="font-semibold text-lg mb-1">⚠️ Cuenta Abierta</div>
              <div className="text-sm">
                La cuenta quedará abierta con <span className="font-bold">{currencySymbol}{pendingAmount.toFixed(2)}</span> pendientes por pagar.
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartialPaymentConfirmationModal;
