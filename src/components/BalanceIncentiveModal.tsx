import React, { useState, useEffect } from 'react';
import { X, Save, Plus, DollarSign, Gift } from 'lucide-react';
import { BalanceIncentive } from '../database/db';
import { useConfig } from '../contexts/ConfigContext';

interface BalanceIncentiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incentive: Omit<BalanceIncentive, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => void;
  incentive?: BalanceIncentive | null;
  title?: string;
}

const BalanceIncentiveModal: React.FC<BalanceIncentiveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  incentive = null,
  title = 'Agregar Incentivo de Saldo'
}) => {
  const { getCurrencySymbol } = useConfig();
  const currencySymbol = getCurrencySymbol();

  const [formData, setFormData] = useState({
    customerPayment: '',
    totalBalance: '',
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (incentive) {
      setFormData({
        customerPayment: incentive.customerPayment.toString(),
        totalBalance: incentive.totalBalance.toString(),
        isActive: incentive.isActive
      });
    } else {
      setFormData({
        customerPayment: '',
        totalBalance: '',
        isActive: true
      });
    }
    setErrors({});
  }, [incentive, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.customerPayment || parseFloat(formData.customerPayment) <= 0) {
      newErrors.customerPayment = 'El monto que paga el cliente debe ser mayor a 0';
    }

    if (!formData.totalBalance || parseFloat(formData.totalBalance) <= 0) {
      newErrors.totalBalance = 'El saldo total debe ser mayor a 0';
    }

    if (parseFloat(formData.totalBalance) <= parseFloat(formData.customerPayment)) {
      newErrors.totalBalance = 'El saldo total debe ser mayor al monto pagado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const incentiveData: Omit<BalanceIncentive, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
      customerPayment: parseFloat(formData.customerPayment),
      totalBalance: parseFloat(formData.totalBalance),
      bonusAmount: parseFloat(formData.totalBalance) - parseFloat(formData.customerPayment),
      isActive: formData.isActive
    };

    onSave(incentiveData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const bonusAmount = formData.customerPayment && formData.totalBalance 
    ? parseFloat(formData.totalBalance) - parseFloat(formData.customerPayment)
    : 0;

  const bonusPercentage = formData.customerPayment && bonusAmount > 0
    ? ((bonusAmount / parseFloat(formData.customerPayment)) * 100).toFixed(1)
    : '0';

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
              <Gift className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Monto que paga el cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto que paga el cliente
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.customerPayment}
                  onChange={(e) => handleInputChange('customerPayment', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.customerPayment ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.customerPayment && (
                <p className="mt-1 text-sm text-red-600">{errors.customerPayment}</p>
              )}
            </div>

            {/* Saldo total que recibe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo total que recibe
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalBalance}
                  onChange={(e) => handleInputChange('totalBalance', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.totalBalance ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.totalBalance && (
                <p className="mt-1 text-sm text-red-600">{errors.totalBalance}</p>
              )}
            </div>

            {/* Resumen del incentivo */}
            {formData.customerPayment && formData.totalBalance && bonusAmount > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Resumen del Incentivo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paga el cliente:</span>
                    <span className="font-medium">{currencySymbol}{parseFloat(formData.customerPayment).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recibe como saldo:</span>
                    <span className="font-medium">{currencySymbol}{parseFloat(formData.totalBalance).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-2">
                    <span className="text-green-700 font-medium">Regalo:</span>
                    <span className="text-green-700 font-bold">{currencySymbol}{bonusAmount.toFixed(2)} ({bonusPercentage}%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Incentivo activo
              </label>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BalanceIncentiveModal;
