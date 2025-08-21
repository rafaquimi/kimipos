import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings, Building, Archive, Plus, Save, Trash2, Move, Flower, Coffee, SlidersHorizontal } from 'lucide-react';
import { useTables, SalonData } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';
import TableComponent from '../components/Table/TableComponent';
import DecorItem from '../components/Decor/DecorItem';
import toast from 'react-hot-toast';

const ConfigurationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/configuration/salons')) {
      setActiveSection('salons');
    } else if (location.pathname.includes('/configuration/modifiers')) {
      setActiveSection('modifiers');
    } else {
      setActiveSection('general');
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
    updateTableRotation,
    addDecor,
    updateDecorPosition,
    updateDecorRotation
  } = useTables();
  const { categories } = useProducts();
  
  const { config, updateConfig, getModifiersForCategory, updateCategoryModifiers } = useConfig();
  const [configValues, setConfigValues] = useState(config);

  useEffect(() => {
    setConfigValues(config);
  }, [config]);

  const handleSave = () => {
    updateConfig(configValues);
    toast.success('Configuración guardada exitosamente');
  };

  const LeftMenu = () => (
    <div className="w-64 border-r border-gray-200 bg-white h-full">
      <div className="p-4 font-semibold text-gray-800">Configuración</div>
      <nav className="space-y-1 px-2">
        <button onClick={() => setActiveSection('general')} className={`w-full text-left flex items-center px-3 py-2 rounded-lg ${activeSection==='general' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
          <Settings className="w-4 h-4 mr-2" /> General
        </button>
        <button onClick={() => setActiveSection('modifiers')} className={`w-full text-left flex items-center px-3 py-2 rounded-lg ${activeSection==='modifiers' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Modificadores
        </button>
        <button onClick={() => setActiveSection('salons')} className={`w-full text-left flex items-center px-3 py-2 rounded-lg ${activeSection==='salons' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
          <Building className="w-4 h-4 mr-2" /> Salones
        </button>
      </nav>
    </div>
  );

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

      {/* Acceso rápido a modificadores */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modificadores</h3>
        <p className="text-sm text-gray-600 mb-4">Gestiona los modificadores globales y por categoría.</p>
        <a href="#/configuration/modifiers" className="btn btn-primary inline-flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Abrir gestión de modificadores</span>
        </a>
      </div>
    </div>
  );

  const renderModifiers = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modificadores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modificadores globales</label>
            <TagInput
              value={configValues.modifiers?.global || []}
              onChange={(tags) => setConfigValues({
                ...configValues,
                modifiers: {
                  global: tags,
                  byCategory: configValues.modifiers?.byCategory || {}
                }
              })}
              placeholder="Escribe y presiona Enter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modificadores por categoría</label>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {categories.map(cat => (
                <div key={cat.id} className="border rounded-lg p-3">
                  <div className="text-sm font-medium mb-2" style={{ color: cat.color }}>{cat.name}</div>
                  <TagInput
                    value={configValues.modifiers?.byCategory?.[cat.id] || []}
                    onChange={(tags) => setConfigValues({
                      ...configValues,
                      modifiers: {
                        global: configValues.modifiers?.global || [],
                        byCategory: {
                          ...(configValues.modifiers?.byCategory || {}),
                          [cat.id]: tags
                        }
                      }
                    })}
                    placeholder={`Añadir modificadores para ${cat.name}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => {
              updateConfig({ modifiers: configValues.modifiers });
              toast.success('Modificadores guardados');
            }}
            className="btn btn-primary"
          >
            Guardar Modificadores
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

    const handleTableRotationChange = (table: any, rotation: number) => {
      updateTableRotation(table.id, rotation);
    };

    const handleDecorRotationChange = (item: any, rotation: number) => {
      updateDecorRotation(item.id, rotation);
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
                  onRotationChange={handleTableRotationChange}
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
                  onRotationChange={handleDecorRotationChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 flex">
      <LeftMenu />
      <div className="flex-1 h-full overflow-hidden">
        {activeSection === 'general' && (
          <div className="h-full overflow-y-auto p-6">{renderGeneral()}</div>
        )}
        {activeSection === 'modifiers' && (
          <div className="h-full overflow-y-auto p-6">{renderModifiers()}</div>
        )}
        {activeSection === 'salons' && (
          <div className="h-full">{renderSalons()}</div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;

// Componente simple para entrada de tags
const TagInput: React.FC<{ value: string[]; onChange: (tags: string[]) => void; placeholder?: string }>= ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    const next = Array.from(new Set([...value, t]));
    onChange(next);
    setInput('');
  };
  const removeTag = (tag: string) => {
    onChange(value.filter(v => v !== tag));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-1 text-blue-500 hover:text-blue-700">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag(input);
          }
        }}
        placeholder={placeholder || 'Añadir...'}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <div className="text-xs text-gray-500 mt-1">Pulsa Enter para agregar</div>
    </div>
  );
};


