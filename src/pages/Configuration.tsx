import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings, Building, Archive, Plus, Save, Trash2, Move, Flower, Coffee, SlidersHorizontal, Users, Search, Edit, CreditCard, Mail, Phone, MapPin } from 'lucide-react';
import { useTables, SalonData } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';
import { useCustomers, Customer } from '../contexts/CustomerContext';
import TableComponent from '../components/Table/TableComponent';
import DecorItem from '../components/Decor/DecorItem';
import CustomerModal from '../components/CustomerModal';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

const ConfigurationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const location = useLocation();
  
  // Estados para gestión de clientes
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const { customers, addCustomer, updateCustomer, deleteCustomer, searchCustomers } = useCustomers();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);

  useEffect(() => {
    if (location.pathname.includes('/configuration/salons') || location.pathname.includes('/tables')) {
      setActiveSection('salons');
    } else if (location.pathname.includes('/configuration/modifiers') || location.pathname.includes('/modifiers')) {
      setActiveSection('modifiers');
    } else if (location.pathname.includes('/customers')) {
      setActiveSection('customers');
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

  // Funciones para gestión de clientes
  const handleSaveCustomer = async (customerData: any) => {
    try {
      if (customerData.id) {
        // Actualizar cliente existente
        await updateCustomer(customerData.id, customerData);
      } else {
        // Crear nuevo cliente
        await addCustomer(customerData);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (customerToDelete) {
      try {
        await deleteCustomer(customerToDelete.id);
        setCustomerToDelete(null);
        setShowConfirmModal(false);
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = searchCustomers(customerSearchTerm);



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

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Clientes</h3>
            <p className="text-sm text-gray-600 mt-1">Administra la información de tus clientes</p>
          </div>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono o código de tarjeta..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de clientes */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay clientes registrados</h4>
            <p className="text-gray-600 mb-4">Comienza agregando tu primer cliente</p>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cliente</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
              {customerSearchTerm && customers.length !== filteredCustomers.length && (
                <span className="text-blue-600"> de {customers.length} total</span>
              )}
            </div>
            
            <div className="grid gap-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {customer.name} {customer.lastName}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            {customer.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.cardCode && (
                              <div className="flex items-center space-x-1">
                                <CreditCard className="w-3 h-3" />
                                <span>{customer.cardCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Saldo */}
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Saldo</div>
                        <div className={`font-semibold ${customer.balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          €{customer.balance.toFixed(2)}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar cliente"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToDelete(customer);
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Notas:</strong> {customer.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
    <div className="h-full bg-gray-50">
      <div className="h-full overflow-hidden">
        {activeSection === 'general' && (
          <div className="h-full overflow-y-auto p-6">{renderGeneral()}</div>
        )}
        {activeSection === 'modifiers' && (
          <div className="h-full overflow-y-auto p-6">{renderModifiers()}</div>
        )}
        {activeSection === 'customers' && (
          <div className="h-full overflow-y-auto p-6">{renderCustomers()}</div>
        )}
        {activeSection === 'salons' && (
          <div className="h-full">{renderSalons()}</div>
        )}
      </div>

      {/* Modales */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteCustomer}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar al cliente "${customerToDelete?.name} ${customerToDelete?.lastName}"? Esta acción no se puede deshacer.`}
        type="danger"
      />
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


