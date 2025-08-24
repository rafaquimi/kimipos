import React, { useState } from 'react';
import { X, DollarSign, Gift, Plus } from 'lucide-react';
import { Customer } from '../contexts/CustomerContext';
import { BalanceIncentive } from '../database/db';
import { useConfig } from '../contexts/ConfigContext';

interface BalanceRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  incentives: BalanceIncentive[];
  onRecharge: (customer: Customer, amount: number, bonus: number) => void;
  onOpenPaymentModal: (amount: number, bonus: number) => void;
}

const BalanceRechargeModal: React.FC<BalanceRechargeModalProps> = ({
  isOpen,
  onClose,
  customer,
  incentives,
  onRecharge,
  onOpenPaymentModal
}) => {
  const { getCurrencySymbol } = useConfig();
  const currencySymbol = getCurrencySymbol();
  const [customAmount, setCustomAmount] = useState('');

  const handleIncentiveRecharge = (incentive: BalanceIncentive) => {
    onOpenPaymentModal(incentive.customerPayment, incentive.bonusAmount);
    onClose();
  };

  const handleCustomRecharge = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      onOpenPaymentModal(amount, 0); // Sin bonus para recarga personalizada
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Recargar Saldo
                </h2>
                <p className="text-sm text-gray-600">
                  {customer.name} {customer.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Saldo actual */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Saldo actual:</span>
                <span className="text-lg font-bold text-blue-900">
                  {currencySymbol}{customer.balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Incentivos disponibles */}
            {incentives.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Gift className="w-5 h-5 text-green-600 mr-2" />
                  Incentivos Disponibles
                </h3>
                <div className="space-y-3">
                  {incentives.map((incentive) => (
                    <button
                      key={incentive.id}
                      onClick={() => handleIncentiveRecharge(incentive)}
                      className="w-full p-4 border border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">
                            Paga {currencySymbol}{incentive.customerPayment.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Recibe {currencySymbol}{incentive.totalBalance.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-bold">
                            +{currencySymbol}{incentive.bonusAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600">
                            Regalo
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recarga personalizada */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 text-blue-600 mr-2" />
                Recarga Personalizada
              </h3>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleCustomRecharge}
                  disabled={!customAmount || parseFloat(customAmount) <= 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Recargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceRechargeModal;
