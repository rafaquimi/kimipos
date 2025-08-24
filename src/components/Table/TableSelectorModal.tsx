import React, { useState, useEffect } from 'react';
import { X, Search, Filter, MapPin, Receipt, User, DollarSign, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TableComponent, { TableData } from './TableComponent';
import DecorItem from '../Decor/DecorItem';
import TableConnections from './TableConnections';
import { useTables } from '../../contexts/TableContext';
import toast from 'react-hot-toast';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (table: TableData) => void;
  selectedTableId?: string;
  forceOpen?: boolean; // Si es true, no se puede cerrar
  onTicketWithoutTable?: () => void; // Callback para ticket sin mesa
}

const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectTable,
  selectedTableId,
  forceOpen = false,
  onTicketWithoutTable
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedTableForName, setSelectedTableForName] = useState<TableData | null>(null);
  const [temporaryName, setTemporaryName] = useState('');
  const [showCustomerNameModal, setShowCustomerNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  
  const { salons, activeSalonId, setActiveSalon, tables, decor, updateTableTemporaryName, updateTableStatus, addNamedAccount } = useTables();
  const navigate = useNavigate();

  // Limpiar estado del modal de nombre cuando se cierre el modal principal
  useEffect(() => {
    if (!isOpen) {
      setShowNameModal(false);
      setSelectedTableForName(null);
      setTemporaryName('');
    }
  }, [isOpen]);

  const filteredTables = tables.filter(table => {
    const matchesSearch = !searchTerm || 
      table.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.temporaryName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTableClick = (table: TableData) => {
    console.log('Click en mesa:', table.number, 'Estado:', table.status, 'Modal abierto:', showNameModal);
    
    // Asegurar que el modal de nombre temporal esté cerrado
    if (showNameModal) {
      setShowNameModal(false);
      setSelectedTableForName(null);
      setTemporaryName('');
      return;
    }
    
    if (table.status === 'available' || table.status === 'occupied' || table.status === 'reserved') {
      // Limpiar la búsqueda antes de seleccionar la mesa
      setSearchTerm('');
      onSelectTable(table);
      onClose();
    }
  };

  // Función para manejar la selección de salón
  const handleSalonSelect = (salonId: string) => {
    // Para todos los salones, cambiar normalmente
    setActiveSalon(salonId);
  };

  const handleTableLongPress = (table: TableData) => {
    console.log('Long press en mesa:', table.number, 'Estado:', table.status);
    setSelectedTableForName(table);
    setTemporaryName(table.temporaryName || '');
    setShowNameModal(true);
  };

  const handleSaveTemporaryName = () => {
    if (selectedTableForName) {
      const nameToSave = temporaryName.trim() || null;
      updateTableTemporaryName(selectedTableForName.id, nameToSave);
      setShowNameModal(false);
      setSelectedTableForName(null);
      setTemporaryName('');
      
      // Mostrar mensaje de confirmación
      if (nameToSave) {
        // Usar setTimeout para asegurar que el modal se cierre antes de mostrar el toast
        setTimeout(() => {
          // Aquí podrías usar toast si estuviera disponible
          console.log(`Nombre temporal "${nameToSave}" asignado a la Mesa ${selectedTableForName.number}`);
        }, 100);
      }
    }
  };

  const handleCancelNameModal = () => {
    setShowNameModal(false);
    setSelectedTableForName(null);
    setTemporaryName('');
  };

  // Funciones para cuentas por nombre
  const handleCustomerNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      toast.error('Por favor ingresa el nombre del cliente');
      return;
    }

    try {
      const accountId = addNamedAccount(customerName.trim());
      toast.success(`Cuenta creada para ${customerName.trim()}`);
      
      // Crear una mesa virtual para el dashboard
      const virtualTable: TableData = {
        id: accountId,
        number: customerName.trim(),
        name: customerName.trim(),
        status: 'occupied',
        x: 0,
        y: 0,
        capacity: 1,
        occupiedSince: new Date(),
        temporaryName: customerName.trim()
      };
      
      // Cerrar el modal y seleccionar la mesa virtual
      setShowCustomerNameModal(false);
      setCustomerName('');
      onSelectTable(virtualTable);
      onClose();
    } catch (error) {
      console.error('Error creating named account:', error);
      if (error instanceof Error && error.message.includes('Ya existe una cuenta')) {
        toast.error(error.message);
      } else {
        toast.error('Error al crear la cuenta');
      }
    }
  };

  const handleCancelCustomerNameModal = () => {
    setShowCustomerNameModal(false);
    setCustomerName('');
  };

  

  // Función para cambiar estado de mesa (solo para debugging)
  const handleChangeTableStatus = (table: TableData, newStatus: 'available' | 'occupied' | 'reserved') => {
    updateTableStatus(table.id, newStatus);
    console.log(`Mesa ${table.number} cambiada a estado: ${newStatus}`);
  };

  // Limpiar estado del modal de nombre cuando se cierre el modal principal
  const handleCloseMainModal = () => {
    setShowNameModal(false);
    setSelectedTableForName(null);
    setTemporaryName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={forceOpen ? undefined : handleCloseMainModal}
        />

        {/* Modal fullscreen */}
        <div className="inline-block w-full h-screen max-w-none my-0 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-none">
          {/* Header compacto */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            {/* Título, botón centrado y botones en la misma línea */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Seleccionar Mesa</h2>
              </div>
              
              {/* Botón Ticket sin Mesa centrado */}
              {onTicketWithoutTable && (
                <button
                  onClick={onTicketWithoutTable}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 text-base border-2 border-purple-400 ring-2 ring-purple-200"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Ticket sin Mesa</span>
                </button>
              )}
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/configuration');
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm"
                  title="Configuración"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración</span>
                </button>
                
                {!forceOpen && (
                  <button onClick={handleCloseMainModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {/* Salones - Botones verticales */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-2 font-medium">SELECCIONAR SALÓN</label>
              <div className="flex flex-wrap gap-2">
                {salons.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSalonSelect(s.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                      activeSalonId === s.id
                        ? s.id === 'named-accounts'
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg transform scale-105'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                        : s.id === 'named-accounts'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300 hover:border-yellow-400'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar mesa por número o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {/* Estado */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="available">Disponibles</option>
                  <option value="occupied">Ocupadas</option>
                  <option value="reserved">Reservadas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salón visual */}
          <div className="p-4 h-[calc(100vh-120px)]">
            <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100">
                <div className="salon-canvas relative w-full h-full">
                  {decor.map((item) => (
                    <DecorItem key={item.id} item={item} />
                  ))}
                  
                  {/* Conexiones entre mesas unidas */}
                  <TableConnections tables={filteredTables} scale={1} />
                  
                  {filteredTables.map((table) => (
                    <TableComponent
                      key={table.id}
                      table={table}
                      isSelected={selectedTableId === table.id}
                      onClick={handleTableClick}
                      onLongPress={handleTableLongPress}
                      scale={1}
                    />
                  ))}

                  {/* Mensaje cuando no hay cuentas en el salón "Cuentas por nombre" */}
                  {activeSalonId === 'named-accounts' && filteredTables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8 bg-white bg-opacity-90 rounded-xl shadow-lg max-w-md">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No hay cuentas creadas
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Haz clic en el botón flotante (+) para crear tu primera cuenta por nombre
                        </p>
                        <button
                          onClick={() => setShowCustomerNameModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 mx-auto"
                        >
                          <User className="w-5 h-5" />
                          <span>Crear Primera Cuenta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-green-500 rounded-full"></div><span>Disponible</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-red-500 rounded-full"></div><span>Ocupada</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-yellow-500 rounded-full"></div><span>Reservada</span></div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-purple-600"></div>
                <span>Mesas Unidas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">★</div>
                <span>Mesa Principal</span>
              </div>
            </div>

            {/* Botones de debug para cambiar estado de mesas */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Debug - Cambiar Estado de Mesas:</h4>
              <div className="flex flex-wrap gap-2">
                {filteredTables.map(table => (
                  <div key={table.id} className="flex items-center space-x-2">
                    <span className="text-xs font-medium">Mesa {table.number}:</span>
                    <button
                      onClick={() => handleChangeTableStatus(table, 'available')}
                      className={`px-2 py-1 text-xs rounded ${table.status === 'available' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    >
                      Disp
                    </button>
                    <button
                      onClick={() => handleChangeTableStatus(table, 'occupied')}
                      className={`px-2 py-1 text-xs rounded ${table.status === 'occupied' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                    >
                      Ocup
                    </button>
                    <button
                      onClick={() => handleChangeTableStatus(table, 'reserved')}
                      className={`px-2 py-1 text-xs rounded ${table.status === 'reserved' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
                    >
                      Res
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botón flotante para crear nueva cuenta (solo en salón "Cuentas por nombre") */}
          {activeSalonId === 'named-accounts' && (
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={() => setShowCustomerNameModal(true)}
                className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center space-x-2"
                title="Crear Nueva Cuenta"
              >
                <User className="w-6 h-6" />
                <span className="font-semibold text-sm">Nueva Cuenta</span>
              </button>
            </div>
          )}

          {/* Barra de herramientas para cuentas por nombre */}
          {activeSalonId === 'named-accounts' && (
            <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">📋 Salón de Cuentas por Nombre</p>
                  <p className="text-xs">Haz clic en el botón flotante (+) para crear una nueva cuenta</p>
                </div>
                <button
                  onClick={() => setShowCustomerNameModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Nueva Cuenta</span>
                </button>
              </div>
            </div>
          )}

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Haz clic en una mesa disponible u ocupada para seleccionarla</p>
                <p className="text-xs text-gray-500 mt-1">
                  💡 <strong>Pulsación sostenida (1s)</strong> o <strong>clic derecho</strong> para asignar nombre temporal
                </p>
              </div>
              <button onClick={handleCloseMainModal} className="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para nombre temporal */}
      {showNameModal && selectedTableForName && (
        <div className="fixed inset-0 z-[55] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCancelNameModal}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Nombre Temporal - Mesa {selectedTableForName.number}
                </h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del cliente (opcional)
                </label>
                <input
                  type="text"
                  value={temporaryName}
                  onChange={(e) => setTemporaryName(e.target.value)}
                  placeholder="Ej: Juanito, María, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTemporaryName();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Este nombre se mantendrá hasta que se cierre la cuenta de la mesa
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelNameModal}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemporaryName}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para nombre de cliente */}
      {showCustomerNameModal && (
        <div className="fixed inset-0 z-[55] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={handleCancelCustomerNameModal}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Nueva Cuenta por Nombre
                </h3>
              </div>
              
              <form onSubmit={handleCustomerNameSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Juan Pérez, María García..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    autoFocus
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelCustomerNameModal}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSelectorModal;
