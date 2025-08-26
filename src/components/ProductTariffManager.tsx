import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { ProductTariff } from '../types/product';

interface ProductTariffManagerProps {
  tariffs: ProductTariff[];
  onChange: (tariffs: ProductTariff[]) => void;
}

const ProductTariffManager: React.FC<ProductTariffManagerProps> = ({ tariffs, onChange }) => {
  const [editingTariff, setEditingTariff] = useState<string | null>(null);
  const [newTariff, setNewTariff] = useState({ name: '', price: 0 });

  const addTariff = () => {
    if (tariffs.length >= 4) {
      alert('No puedes agregar más de 4 tarifas por producto');
      return;
    }

    if (!newTariff.name.trim() || newTariff.price <= 0) {
      alert('Por favor completa el nombre y precio de la tarifa');
      return;
    }

    const tariff: ProductTariff = {
      id: `tariff-${Date.now()}`,
      name: newTariff.name.trim(),
      price: newTariff.price,
      isDefault: tariffs.length === 0 // La primera tarifa será por defecto
    };

    onChange([...tariffs, tariff]);
    setNewTariff({ name: '', price: 0 });
  };

  const updateTariff = (id: string, updates: Partial<ProductTariff>) => {
    const updatedTariffs = tariffs.map(tariff => 
      tariff.id === id ? { ...tariff, ...updates } : tariff
    );
    onChange(updatedTariffs);
    setEditingTariff(null);
  };

  const deleteTariff = (id: string) => {
    const tariffToDelete = tariffs.find(t => t.id === id);
    if (tariffToDelete?.isDefault && tariffs.length > 1) {
      // Si es la tarifa por defecto, hacer la siguiente por defecto
      const updatedTariffs = tariffs
        .filter(t => t.id !== id)
        .map((t, index) => ({ ...t, isDefault: index === 0 }));
      onChange(updatedTariffs);
    } else {
      onChange(tariffs.filter(t => t.id !== id));
    }
  };

  const setDefaultTariff = (id: string) => {
    const updatedTariffs = tariffs.map(tariff => ({
      ...tariff,
      isDefault: tariff.id === id
    }));
    onChange(updatedTariffs);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Tarifas del Producto</h4>
        <span className="text-xs text-gray-500">
          {tariffs.length}/4 tarifas
        </span>
      </div>

      {/* Lista de tarifas existentes */}
      <div className="space-y-2">
        {tariffs.map((tariff) => (
          <div key={tariff.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            {editingTariff === tariff.id ? (
              // Modo edición
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={tariff.name}
                  onChange={(e) => updateTariff(tariff.id, { name: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  placeholder="Nombre de la tarifa"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tariff.price}
                  onChange={(e) => updateTariff(tariff.id, { price: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  placeholder="Precio"
                />
                <button
                  onClick={() => setEditingTariff(null)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Modo visualización
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${tariff.isDefault ? 'text-blue-600' : 'text-gray-700'}`}>
                    {tariff.name}
                    {tariff.isDefault && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">Por defecto</span>}
                  </span>
                  <span className="text-sm text-gray-600">€{tariff.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {!tariff.isDefault && (
                    <button
                      onClick={() => setDefaultTariff(tariff.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                      title="Establecer como predeterminada"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    onClick={() => setEditingTariff(tariff.id)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="Editar tarifa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {tariffs.length > 1 && (
                    <button
                      onClick={() => deleteTariff(tariff.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar tarifa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formulario para agregar nueva tarifa */}
      {tariffs.length < 4 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Plus className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Agregar Nueva Tarifa</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTariff.name}
              onChange={(e) => setNewTariff({ ...newTariff, name: e.target.value })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre (ej: Tapa, Ración, Media Ración)"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={newTariff.price}
              onChange={(e) => setNewTariff({ ...newTariff, price: parseFloat(e.target.value) || 0 })}
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Precio"
            />
            <button
              onClick={addTariff}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Información adicional */}
      {tariffs.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>No hay tarifas configuradas.</p>
          <p className="mt-1">Agrega al menos una tarifa para que el producto sea visible en el dashboard.</p>
        </div>
      )}

      {tariffs.length > 0 && (
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p><strong>Información:</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• La primera tarifa será la predeterminada</li>
            <li>• Puedes cambiar la tarifa predeterminada haciendo clic en ⭐</li>
            <li>• En el dashboard, si hay múltiples tarifas, se mostrará un selector</li>
            <li>• Si solo hay una tarifa, se agregará directamente al pedido</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductTariffManager;


