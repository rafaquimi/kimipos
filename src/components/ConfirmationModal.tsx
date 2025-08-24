import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${styles.bgColor} ${styles.borderColor} border-b rounded-t-xl`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${styles.bgColor} rounded-full flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${styles.iconColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
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
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 ${styles.buttonColor}`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
