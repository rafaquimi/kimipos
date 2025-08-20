import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings, Building, Archive, Plus, Save, Trash2, Move, Flower, Coffee } from 'lucide-react';
import { useTables, SalonData } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import TableComponent from '../components/Table/TableComponent';
import DecorItem from '../components/Decor/DecorItem';
import toast from 'react-hot-toast';

const ConfigurationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/configuration/salons')) {
      setActiveSection('salons');
    }
  }, [location.pathname]);
  const { 
    salons, 
    activeSalonId, 
    setActiveSalon, 
    addSalon, 
    removeSalon, 
    renameSalon,
    tables,
    decor,
    addTable,
    removeTable,
    updateTablePosition,
    addDecor,
    updateDecorPosition
  } = useTables();
  
  const { config, updateConfig } = useConfig();
  const [configValues, setConfigValues] = useState(config);

  useEffect(() => {
    setConfigValues(config);
  }, [config]);

  const handleSave = () => {
    updateConfig(configValues);
    toast.success('Configuración guardada exitosamente');
  };

  // Menú interno eliminado: el contenido se controla por la ruta

  const renderGeneral = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Restaurante</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Restaurante
            </label>
            <input
              type="text"
              value={configValues.restaurantName}
              onChange={(e) => setConfigValues({ ...configValues, restaurantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              value={configValues.currency}
              onChange={(e) => setConfigValues({ ...configValues, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="MXN">Peso Mexicano (MXN)</option>
              <option value="USD">Dólar Americano (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de IVA (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={configValues.taxRate * 100}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, parseFloat(e.target.value)));
                setConfigValues({ ...configValues, taxRate: value / 100 });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6">
          <button onClick={handleSave} className="btn btn-primary flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSalons = () => {
    const activeSalon = salons.find(s => s.id === activeSalonId);

    const handleAddTable = () => {
      const newTable = {
        id: `table-${Date.now()}`,
        number: '1',
        name: '',
        status: 'available' as const,
        x: 100,
        y: 100,
        capacity: 4
      };
      addTable(newTable);
      toast.success('Mesa agregada');
    };

    const handleDeleteTable = (tableId: string) => {
      const success = removeTable(tableId);
      if (success) {
        toast.success('Mesa eliminada');
      } else {
        toast.error('No se puede eliminar una mesa ocupada');
      }
    };

    const handleTableDragEnd = (tableId: string, x: number, y: number) => {
      updateTablePosition(tableId, x, y);
    };

    const handleAddPlant = () => {
      const newDecor = {
        id: `decor-${Date.now()}`,
        kind: 'plant' as const,
        x: 150,
        y: 150
      };
      addDecor(newDecor);
      toast.success('Planta agregada');
    };

    const handleAddBar = () => {
      const newDecor = {
        id: `decor-${Date.now()}`,
        kind: 'bar' as const,
        x: 200,
        y: 200
      };
      addDecor(newDecor);
      toast.success('Barra agregada');
    };

    const handleNewSalon = () => {
      const name = prompt('Nombre del nuevo salón:');
      if (name?.trim()) {
        addSalon(name.trim());
        toast.success(`Salón "${name}" creado`);
      }
    };

    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Editor de Salones</h3>
            <button onClick={handleNewSalon} className="btn btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Salón</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={activeSalonId}
              onChange={(e) => setActiveSalon(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {salons.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>

            <div className="flex space-x-2">
              <button onClick={handleAddTable} className="btn btn-secondary flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Mesa</span>
              </button>
              <button onClick={handleAddPlant} className="btn btn-secondary flex items-center space-x-1">
                <Flower className="w-4 h-4" />
                <span>Planta</span>
              </button>
              <button onClick={handleAddBar} className="btn btn-secondary flex items-center space-x-1">
                <Coffee className="w-4 h-4" />
                <span>Barra</span>
              </button>
            </div>
          </div>
        </div>

        {activeSalon && (
          <div className="flex-1 overflow-hidden">
            <div
              className="salon-canvas h-full bg-gray-100 relative overflow-auto"
              style={{ minHeight: '600px' }}
            >
              {tables.map(table => (
                <TableComponent
                  key={table.id}
                  table={table}
                  isDraggable={true}
                  onDragEnd={(table, x, y) => handleTableDragEnd(table.id, x, y)}
                  onDelete={() => handleDeleteTable(table.id)}
                  showDeleteButton={true}
                  scale={1}
                />
              ))}

              {decor.map(item => (
                <DecorItem
                  key={item.id}
                  item={item}
                  isDraggable={true}
                  onDragEnd={(/* d */ _item, x, y) => updateDecorPosition(item.id, x, y)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full overflow-hidden">
        {activeSection === 'general' && (
          <div className="h-full overflow-y-auto p-6">{renderGeneral()}</div>
        )}
        {activeSection === 'salons' && (
          <div className="h-full">{renderSalons()}</div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;

