import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  value, 
  onChange, 
  label = "Color de fondo",
  className = "" 
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Colores predefinidos populares
  const predefinedColors = [
    '#dc2626', // Rojo
    '#ea580c', // Naranja
    '#d97706', // Ámbar
    '#ca8a04', // Amarillo
    '#65a30d', // Verde lima
    '#16a34a', // Verde
    '#0d9488', // Verde azulado
    '#0891b2', // Cian
    '#0284c7', // Azul claro
    '#2563eb', // Azul
    '#4f46e5', // Índigo
    '#7c3aed', // Violeta
    '#9333ea', // Púrpura
    '#c026d3', // Fucsia
    '#ec4899', // Rosa
    '#be123c', // Rosa oscuro
    '#92400e', // Marrón
    '#78716c', // Gris
    '#52525b', // Gris oscuro
    '#18181b', // Negro
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* Color actual */}
      <div className="flex items-center space-x-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: value }}
          title={value}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          placeholder="#3b82f6"
        />
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Selector de color personalizado"
        >
          <Palette className="w-5 h-5" />
        </button>
      </div>

      {/* Selector de color personalizado */}
      {showCustomPicker && (
        <div className="space-y-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
          
          {/* Colores predefinidos */}
          <div>
            <p className="text-xs text-gray-600 mb-2">Colores sugeridos:</p>
            <div className="grid grid-cols-10 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    value === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Este color se mostrará en el botón del producto en el dashboard
      </p>
    </div>
  );
};

export default ColorPicker;


