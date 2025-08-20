import React, { useState, useEffect } from 'react';
import { Settings, Building, Archive, Plus, Save, Trash2, Move, Flower, Coffee } from 'lucide-react';
import { useTables, SalonData } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import TableComponent from '../components/Table/TableComponent';
import DecorItem from '../components/Decor/DecorItem';
import toast from 'react-hot-toast';

const ConfigurationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
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

  const menuItems = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'salons', name: 'Salones y Mesas', icon: Building },
    { id: 'products', name: 'Productos', icon: Archive },
    { id: 'categories', name: 'Categorías', icon: Archive },
    { id: 'users', name: 'Usuarios', icon: Archive },
  ];

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
              onChange={(e) => setConfigValues({ ...configValues, taxRate: parseFloat(e.target.value) / 100 })}
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
        type: 'plant' as const,
        x: 150,
        y: 150
      };
      addDecor(newDecor);
      toast.success('Planta agregada');
    };

    const handleAddBar = () => {
      const newDecor = {
        id: `decor-${Date.now()}`,
        type: 'bar' as const,
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
              className="h-full bg-gray-100 relative overflow-auto"
              style={{ minHeight: '600px' }}
            >
              {tables.map(table => (
                <TableComponent
                  key={table.id}
                  table={table}
                  isDraggable={true}
                  onDragEnd={(x, y) => handleTableDragEnd(table.id, x, y)}
                  onDelete={() => handleDeleteTable(table.id)}
                  showDeleteButton={true}
                  scale={1}
                />
              ))}

              {decor.map(item => (
                <DecorItem
                  key={item.id}
                  item={item}
                  onDragEnd={(x, y) => updateDecorPosition(item.id, x, y)}
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
      <div className="h-full flex">
        <div className="w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
          </div>
          <nav className="px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeSection === 'general' && (
            <div className="h-full overflow-y-auto p-6">{renderGeneral()}</div>
          )}
          {activeSection === 'salons' && (
            <div className="h-full">{renderSalons()}</div>
          )}
          {!['general', 'salons'].includes(activeSection) && (
            <div className="h-full overflow-y-auto p-6">
              <div className="card p-6">Próximamente</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;

