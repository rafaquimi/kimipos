import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          button: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
          border: 'border-red-200',
          bg: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: 'text-yellow-600',
          button: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
          border: 'border-yellow-200',
          bg: 'bg-yellow-50'
        };
      case 'info':
        return {
          icon: 'text-blue-600',
          button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        };
      default:
        return {
          icon: 'text-red-600',
          button: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
          border: 'border-red-200',
          bg: 'bg-red-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 transform transition-all">
        <div className={`relative bg-white rounded-2xl shadow-2xl border-2 ${styles.border} overflow-hidden`}>
          {/* Header */}
          <div className={`px-6 py-4 ${styles.bg} border-b ${styles.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${styles.bg}`}>
                  <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${styles.bg} flex-shrink-0`}>
                <Trash2 className={`w-6 h-6 ${styles.icon}`} />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-base leading-relaxed">
                  {message}
                </p>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium">
                    ⚠️ Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
