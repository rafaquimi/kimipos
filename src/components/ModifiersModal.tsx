import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ModifiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: string[];
  selected: string[];
  onSave: (selected: string[]) => void;
  allowCustomText?: boolean;
}

const ModifiersModal: React.FC<ModifiersModalProps> = ({
  isOpen,
  onClose,
  title = 'Seleccionar modificadores',
  options,
  selected,
  onSave,
  allowCustomText = true
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    setLocalSelected(selected);
  }, [selected, isOpen]);

  if (!isOpen) return null;

  const toggleOption = (opt: string) => {
    setLocalSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  const handleSave = () => {
    const finalSelection = customText.trim() ? Array.from(new Set([...localSelected, customText.trim()])) : localSelected;
    onSave(finalSelection);
    onClose();
  };

  const handleClear = () => {
    setLocalSelected([]);
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
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Selecciona las opciones que apliquen. No alteran el precio.
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {options.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay modificadores disponibles para este producto.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map(opt => {
                  const active = localSelected.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                        active 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{opt}</span>
                      {active && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
            {allowCustomText && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Añadir nota/modificador específico</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Escribe algo como: Sin pepinillos, punto de la carne, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Limpiar
            </button>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifiersModal;


