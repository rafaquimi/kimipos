import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings, Building, Archive, Plus, Save, Trash2, Move, Flower, Coffee, SlidersHorizontal, Users, Search, Edit, CreditCard, Mail, Phone, MapPin, Gift, X } from 'lucide-react';
import { useTables, SalonData } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';
import { useCustomers, Customer } from '../contexts/CustomerContext';
import { useBalanceIncentives } from '../contexts/BalanceIncentiveContext';
import { BalanceIncentive } from '../database/db';
import TableComponent from '../components/Table/TableComponent';
import DecorItem from '../components/Decor/DecorItem';
import CustomerModal from '../components/CustomerModal';
import ConfirmationModal from '../components/ConfirmationModal';
import BalanceIncentiveModal from '../components/BalanceIncentiveModal';
import ClosedTicketsManager from '../components/ClosedTicketsManager';
import { useSystemPrinters } from '../hooks/useSystemPrinters';
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

  // Estados para gestión de incentivos de saldo
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<BalanceIncentive | null>(null);
  const { allIncentives, addIncentive, updateIncentive, deleteIncentive } = useBalanceIncentives();

  // Estados para gestión de impuestos
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<any>(null);
  const [taxFormData, setTaxFormData] = useState({
    name: '',
    rate: 0,
    description: ''
  });

  useEffect(() => {
    if (location.pathname.includes('/configuration/salons') || location.pathname.includes('/tables')) {
      setActiveSection('salons');
    } else if (location.pathname.includes('/configuration/modifiers') || location.pathname.includes('/modifiers')) {
      setActiveSection('modifiers');
    } else if (location.pathname.includes('/customers')) {
      setActiveSection('customers');
    } else if (location.pathname.includes('/configuration/incentives')) {
      setActiveSection('incentives');
    } else if (location.pathname.includes('/configuration/tickets')) {
      setActiveSection('tickets');
    } else if (location.pathname.includes('/configuration/printing')) {
      setActiveSection('printing');
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
  const { categories, configureDefaultPrinters } = useProducts();
  
  const { 
    config, 
    updateConfig, 
    getModifiersForCategory, 
    updateCategoryModifiers,
    addTax,
    updateTax,
    deleteTax,
    setDefaultTax,
    getTaxById,
    getDefaultTax
  } = useConfig();
  
  const { printers: systemPrinters, isLoading: isLoadingPrinters, error: printerError, refreshPrinters } = useSystemPrinters();
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

  // Funciones para gestión de incentivos de saldo
  const handleSaveIncentive = async (incentiveData: Omit<BalanceIncentive, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    try {
      if (selectedIncentive) {
        // Actualizar incentivo existente
        await updateIncentive(selectedIncentive.id!, incentiveData);
      } else {
        // Crear nuevo incentivo
        await addIncentive(incentiveData);
      }
    } catch (error) {
      console.error('Error saving incentive:', error);
    }
  };

  const handleEditIncentive = (incentive: BalanceIncentive) => {
    setSelectedIncentive(incentive);
    setIsIncentiveModalOpen(true);
  };

  const handleDeleteIncentive = async (incentive: BalanceIncentive) => {
    try {
      await deleteIncentive(incentive.id!);
    } catch (error) {
      console.error('Error deleting incentive:', error);
    }
  };

  const handleAddIncentive = () => {
    setSelectedIncentive(null);
    setIsIncentiveModalOpen(true);
  };



  const renderGeneral = () => (
    <div className="space-y-6">
      {/* Layout de dos columnas para Datos del Negocio e Impuestos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos del Negocio */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Negocio</h3>
          <p className="text-sm text-gray-600 mb-4">Esta información aparecerá en los tickets PDF generados</p>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Fiscal
              </label>
              <input
                type="text"
                value={configValues.businessData?.fiscalName || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    fiscalName: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nombre fiscal completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CIF/NIF
              </label>
              <input
                type="text"
                value={configValues.businessData?.taxId || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    taxId: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="CIF o NIF del negocio"
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
                Nombre Comercial
              </label>
              <input
                type="text"
                value={configValues.businessData?.commercialName || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    commercialName: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nombre comercial"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={configValues.businessData?.phone || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    phone: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Teléfono del negocio"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={configValues.businessData?.address || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    address: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Dirección completa del negocio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={configValues.businessData?.email || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    email: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Email del negocio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Población
              </label>
              <input
                type="text"
                value={configValues.businessData?.city || ''}
                onChange={(e) => setConfigValues({
                  ...configValues,
                  businessData: {
                    ...configValues.businessData,
                    city: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ciudad o población"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button onClick={handleSave} className="btn btn-primary flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Guardar Datos del Negocio</span>
            </button>
          </div>
        </div>

        {/* Gestión de Impuestos */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Impuestos</h3>
              <p className="text-sm text-gray-600 mt-1">Administra los diferentes tipos de impuestos para productos y recargas</p>
            </div>
            <button
              onClick={() => {
                setSelectedTax(null);
                setTaxFormData({ name: '', rate: 0, description: '' });
                setIsTaxModalOpen(true);
              }}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Impuesto</span>
            </button>
          </div>

          {/* Lista de impuestos */}
          <div className="space-y-4">
            {config.taxes.map((tax) => (
              <div key={tax.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${tax.isDefault ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{tax.name}</h4>
                        <p className="text-sm text-gray-600">
                          {tax.rate * 100}% {tax.description && `- ${tax.description}`}
                        </p>
                      </div>
                    </div>
                    {tax.isDefault && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Por defecto
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!tax.isDefault && (
                      <button
                        onClick={() => setDefaultTax(tax.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Establecer por defecto
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTax(tax);
                        setTaxFormData({
                          name: tax.name,
                          rate: tax.rate * 100,
                          description: tax.description || ''
                        });
                        setIsTaxModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!tax.isDefault && (
                      <button
                        onClick={() => {
                          if (config.taxes.length > 1) {
                            deleteTax(tax.id);
                            toast.success('Impuesto eliminado');
                          } else {
                            toast.error('No se puede eliminar el último impuesto');
                          }
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal para agregar/editar impuesto */}
          {isTaxModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsTaxModalOpen(false)} />
                
                <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTax ? 'Editar Impuesto' : 'Nuevo Impuesto'}
                    </h3>
                    <button
                      onClick={() => setIsTaxModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Impuesto
                      </label>
                      <input
                        type="text"
                        value={taxFormData.name}
                        onChange={(e) => setTaxFormData({ ...taxFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ej: IVA General"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tasa (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={taxFormData.rate}
                        onChange={(e) => setTaxFormData({ ...taxFormData, rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="21"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción (opcional)
                      </label>
                      <input
                        type="text"
                        value={taxFormData.description}
                        onChange={(e) => setTaxFormData({ ...taxFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Descripción del impuesto"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                    <button
                      onClick={() => setIsTaxModalOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!taxFormData.name.trim()) {
                          toast.error('El nombre del impuesto es obligatorio');
                          return;
                        }
                        
                        if (selectedTax) {
                          updateTax(selectedTax.id, {
                            name: taxFormData.name,
                            rate: taxFormData.rate / 100,
                            description: taxFormData.description
                          });
                          toast.success('Impuesto actualizado');
                                                 } else {
                           addTax({
                             name: taxFormData.name,
                             rate: taxFormData.rate / 100,
                             description: taxFormData.description,
                             isDefault: false
                           });
                           toast.success('Impuesto agregado');
                         }
                        setIsTaxModalOpen(false);
                      }}
                      className="btn btn-primary"
                    >
                      {selectedTax ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de Interfaz */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Interfaz</h3>
        <p className="text-sm text-gray-600 mb-4">Personaliza la experiencia de usuario de la aplicación</p>
        
        <div className="space-y-4">
          {/* Teclado en pantalla */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Teclado en Pantalla</h4>
                <p className="text-sm text-gray-600">
                  Activa o desactiva los teclados en pantalla (excepto los numéricos)
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={configValues.enableOnScreenKeyboard ?? true}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    enableOnScreenKeyboard: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            onClick={() => {
              updateConfig({ enableOnScreenKeyboard: configValues.enableOnScreenKeyboard });
              toast.success('Configuración de interfaz guardada');
            }} 
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración de Interfaz</span>
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

  const renderIncentives = () => {
    const { getCurrencySymbol } = useConfig();
    const currencySymbol = getCurrencySymbol();

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Incentivos de Saldo</h2>
              <p className="text-gray-600 mt-1">Configura los incentivos que ofreces al recargar saldo</p>
            </div>
            <button
              onClick={handleAddIncentive}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Incentivo</span>
            </button>
          </div>

          {allIncentives.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Gift className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay incentivos configurados</h3>
              <p className="text-gray-600 mb-4">Crea tu primer incentivo para ofrecer regalos al recargar saldo</p>
              <button
                onClick={handleAddIncentive}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Crear Primer Incentivo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paga Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibe Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Regalo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allIncentives.map((incentive: BalanceIncentive) => (
                    <tr key={incentive.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {currencySymbol}{incentive.customerPayment.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currencySymbol}{incentive.totalBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        +{currencySymbol}{incentive.bonusAmount.toFixed(2)} ({((incentive.bonusAmount / incentive.customerPayment) * 100).toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          incentive.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {incentive.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditIncentive(incentive)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIncentive(incentive)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTickets = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Tickets Cerrados</h2>
            <p className="text-gray-600 mt-1">Historial de todos los tickets cobrados</p>
          </div>
          <ClosedTicketsManager />
        </div>
      </div>
    );
  };

  const renderPrinting = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Configuración de Impresión</h2>
            <p className="text-gray-600 mt-1">Configura las impresoras para tickets y comandas</p>
          </div>
          
          {/* Impresora Principal */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Impresora Principal</h3>
                <p className="text-sm text-gray-600 mt-1">Esta impresora se usará para imprimir tickets de cobro y recibos</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={refreshPrinters}
                  disabled={isLoadingPrinters}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  title="Refrescar lista de impresoras"
                >
                  <span className="text-xs">🔄</span>
                  <span>Refrescar</span>
                </button>
                <button
                  onClick={() => {
                    console.log('=== DETECCIÓN DE IMPRESORAS ===');
                    console.log('Impresoras disponibles:', systemPrinters);
                    console.log('Estado de carga:', isLoadingPrinters);
                    console.log('Error:', printerError);
                    toast.success('Información de impresoras mostrada en consola');
                  }}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center space-x-1"
                  title="Ver información detallada"
                >
                  <span className="text-xs">ℹ️</span>
                  <span>Info</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Impresora
                </label>
                <select
                  value={configValues.printing?.mainPrinter || ''}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    printing: {
                      ...configValues.printing,
                      mainPrinter: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isLoadingPrinters}
                >
                  <option value="">
                    {isLoadingPrinters ? 'Detectando impresoras...' : 'Seleccionar impresora...'}
                  </option>
                  {systemPrinters.map((printer, index) => (
                    <option key={index} value={printer}>
                      {printer}
                    </option>
                  ))}
                  <option value="thermal">Impresora térmica (genérica)</option>
                  <option value="pdf">Guardar como PDF</option>
                </select>
                {systemPrinters.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center">
                        🖨️ {systemPrinters.length} impresora{systemPrinters.length !== 1 ? 's' : ''} disponible{systemPrinters.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-green-500">●</span>
                      <span className="text-xs text-green-600">Servidor activo</span>
                    </div>
                    <button
                      onClick={() => {
                        console.log('=== IMPRESORAS DEL SISTEMA ===');
                        console.log('Total detectadas:', systemPrinters.length);
                        systemPrinters.forEach((printer, index) => {
                          console.log(`${index + 1}. ${printer}`);
                        });
                        toast.success(`Lista de ${systemPrinters.length} impresoras mostrada en consola`);
                      }}
                      className="text-blue-500 hover:text-blue-700 underline mt-1"
                    >
                      📋 Ver lista completa en consola
                    </button>
                  </div>
                )}
                {printerError && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ {printerError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuración Adicional
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configValues.printing?.mainPrinterAutoPrint || false}
                      onChange={(e) => setConfigValues({
                        ...configValues,
                        printing: {
                          ...configValues.printing,
                          mainPrinterAutoPrint: e.target.checked
                        }
                      })}
                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Imprimir automáticamente al completar cobro</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configValues.printing?.mainPrinterShowPreview || true}
                      onChange={(e) => setConfigValues({
                        ...configValues,
                        printing: {
                          ...configValues.printing,
                          mainPrinterShowPreview: e.target.checked
                        }
                      })}
                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Mostrar vista previa antes de imprimir</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Impresora de Comandas */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impresora de Comandas</h3>
            <p className="text-sm text-gray-600 mb-4">Esta impresora se usará para imprimir comandas de cocina y bar</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Impresora
                </label>
                <select
                  value={configValues.printing?.orderPrinter || ''}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    printing: {
                      ...configValues.printing,
                      orderPrinter: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isLoadingPrinters}
                >
                  <option value="">
                    {isLoadingPrinters ? 'Detectando impresoras...' : 'Seleccionar impresora...'}
                  </option>
                  {systemPrinters.map((printer, index) => (
                    <option key={index} value={printer}>
                      {printer}
                    </option>
                  ))}
                  <option value="thermal">Impresora térmica (genérica)</option>
                  <option value="kitchen">Impresora de cocina (genérica)</option>
                  <option value="bar">Impresora de bar (genérica)</option>
                  <option value="pdf">Guardar como PDF</option>
                </select>
                {systemPrinters.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center">
                        🖨️ {systemPrinters.length} impresora{systemPrinters.length !== 1 ? 's' : ''} disponible{systemPrinters.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-green-500">●</span>
                      <span className="text-xs text-green-600">Servidor activo</span>
                    </div>
                    <button
                      onClick={() => {
                        console.log('=== IMPRESORAS DEL SISTEMA ===');
                        console.log('Total detectadas:', systemPrinters.length);
                        systemPrinters.forEach((printer, index) => {
                          console.log(`${index + 1}. ${printer}`);
                        });
                        toast.success(`Lista de ${systemPrinters.length} impresoras mostrada en consola`);
                      }}
                      className="text-blue-500 hover:text-blue-700 underline mt-1"
                    >
                      📋 Ver lista completa en consola
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuración Adicional
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configValues.printing?.orderPrinterAutoPrint || true}
                      onChange={(e) => setConfigValues({
                        ...configValues,
                        printing: {
                          ...configValues.printing,
                          orderPrinterAutoPrint: e.target.checked
                        }
                      })}
                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Imprimir automáticamente al crear pedido</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configValues.printing?.orderPrinterShowPreview || false}
                      onChange={(e) => setConfigValues({
                        ...configValues,
                        printing: {
                          ...configValues.printing,
                          orderPrinterShowPreview: e.target.checked
                        }
                      })}
                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Mostrar vista previa antes de imprimir</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Configuración General de Impresión */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de Papel
                </label>
                <select
                  value={configValues.printing?.paperFormat || '80mm'}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    printing: {
                      ...configValues.printing,
                      paperFormat: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="80mm">80mm (Térmica estándar)</option>
                  <option value="58mm">58mm (Térmica pequeña)</option>
                  <option value="A4">A4 (Papel normal)</option>
                  <option value="letter">Letter (Papel carta)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientación
                </label>
                <select
                  value={configValues.printing?.orientation || 'portrait'}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    printing: {
                      ...configValues.printing,
                      orientation: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño de Fuente
                </label>
                <select
                  value={configValues.printing?.fontSize || 'normal'}
                  onChange={(e) => setConfigValues({
                    ...configValues,
                    printing: {
                      ...configValues.printing,
                      fontSize: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="small">Pequeña</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Configuración Automática de Impresoras */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">⚡ Configuración Automática</h3>
            <p className="text-sm text-blue-700 mb-4">
              Configura automáticamente todas las impresoras para que funcionen correctamente con el sistema de comandas.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    configureDefaultPrinters('PDF24');
                    toast.success('Impresora PDF24 configurada para todos los productos y categorías');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>🖨️</span>
                  <span>Configurar PDF24 para Todo</span>
                </button>
                
                <button
                  onClick={() => {
                    configureDefaultPrinters('Microsoft Print to PDF');
                    toast.success('Impresora Microsoft Print to PDF configurada para todos los productos y categorías');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>🖨️</span>
                  <span>Configurar Microsoft PDF</span>
                </button>
              </div>
              
              <div className="text-xs text-blue-600">
                💡 <strong>Recomendado:</strong> Usa PDF24 para pruebas. Esto configurará automáticamente todos los productos y categorías 
                para que se impriman correctamente cuando proceses un pedido.
              </div>
            </div>
          </div>
          
          {/* Botón de Guardar */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                updateConfig({ printing: configValues.printing });
                toast.success('Configuración de impresión guardada');
              }}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración de Impresión</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

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
        {activeSection === 'incentives' && (
          <div className="h-full overflow-y-auto p-6">{renderIncentives()}</div>
        )}
        {activeSection === 'tickets' && (
          <div className="h-full overflow-y-auto p-6">{renderTickets()}</div>
        )}
        {activeSection === 'salons' && (
          <div className="h-full">{renderSalons()}</div>
        )}
        {activeSection === 'printing' && (
          <div className="h-full overflow-y-auto p-6">{renderPrinting()}</div>
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

      <BalanceIncentiveModal
        isOpen={isIncentiveModalOpen}
        onClose={() => setIsIncentiveModalOpen(false)}
        onSave={handleSaveIncentive}
        incentive={selectedIncentive}
        title={selectedIncentive ? 'Editar Incentivo de Saldo' : 'Agregar Incentivo de Saldo'}
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


