import React from 'react';
import { X, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface PendingChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  title?: string;
  message?: string;
}

const PendingChangesModal: React.FC<PendingChangesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  title = 'Cambios pendientes',
  message = 'Hay cambios pendientes en el ticket actual. ¿Qué deseas hacer?'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-yellow-50 border-b border-yellow-200 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
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
        <div className="flex flex-col space-y-3 p-6 border-t border-gray-200">
          {/* Botón Guardar */}
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Save className="w-4 h-4" />
            <span>Guardar cambios</span>
          </button>

          {/* Botón Descartar */}
          <button
            onClick={() => {
              onDiscard();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Descartar cambios</span>
          </button>

          {/* Botón Cancelar */}
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingChangesModal;
