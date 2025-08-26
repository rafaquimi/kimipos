import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Filter, MapPin, Receipt, User, DollarSign, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TableComponent, { TableData } from './TableComponent';
import DecorItem from '../Decor/DecorItem';
import TableConnections from './TableConnections';
import { useTables } from '../../contexts/TableContext';
import { useCustomers, Customer } from '../../contexts/CustomerContext';
import { useBalanceIncentives } from '../../contexts/BalanceIncentiveContext';
import CustomerSelector from '../CustomerSelector';
import CustomerModal from '../CustomerModal';
import BalanceRechargeModal from '../BalanceRechargeModal';
import PaymentModal from '../Payment/PaymentModal';
import toast from 'react-hot-toast';
import { useKeyboardEnabled } from '../../hooks/useKeyboardEnabled';
import MergeTablesWizard from './MergeTablesWizard';

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
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [balanceSearchTerm, setBalanceSearchTerm] = useState('');
  const [showBalanceSearchModal, setShowBalanceSearchModal] = useState(false);
  const [showBalanceRechargeModal, setShowBalanceRechargeModal] = useState(false);
  const [customerToRecharge, setCustomerToRecharge] = useState<Customer | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  
  // Estado para el wizard de unión de mesas
  const [showMergeWizard, setShowMergeWizard] = useState(false);
  const [mergeWizardStep, setMergeWizardStep] = useState(1);
  const [selectedTablesForMerge, setSelectedTablesForMerge] = useState<TableData[]>([]);
  const [isMergeSelectionMode, setIsMergeSelectionMode] = useState(false);
  
  const { salons, activeSalonId, setActiveSalon, tables, decor, updateTableTemporaryName, updateTableStatus, addNamedAccount, reorganizeNamedAccounts } = useTables();
  
  // Obtener solo las cuentas por nombre
  const namedAccountsSalon = salons.find(salon => salon.id === 'named-accounts');
  const namedAccounts = namedAccountsSalon?.tables || [];
  const { customers, getCustomerByCardCode, searchCustomers, updateCustomer, refreshCustomers } = useCustomers();
  const { incentives: allIncentives } = useBalanceIncentives();
  
  // Filtrar clientes basado en el término de búsqueda
  const filteredCustomers = customerSearchTerm ? searchCustomers(customerSearchTerm) : [];
  
  // Filtrar clientes para consulta de saldo
  const filteredBalanceCustomers = balanceSearchTerm ? searchCustomers(balanceSearchTerm) : [];
  const navigate = useNavigate();
  const isKeyboardEnabled = useKeyboardEnabled();

  // Función para ordenar los salones según el criterio especificado
  const getOrderedSalons = () => {
    const mainSalon = salons.find(s => s.id === 'main');
    const namedAccountsSalon = salons.find(s => s.id === 'named-accounts');
    const otherSalons = salons.filter(s => s.id !== 'main' && s.id !== 'named-accounts');
    
    const orderedSalons = [];
    
    // 1. Salón Principal (primero)
    if (mainSalon) {
      orderedSalons.push(mainSalon);
    }
    
    // 2. Otros salones creados (en el medio)
    orderedSalons.push(...otherSalons);
    
    // 3. Cuentas por Nombre (último)
    if (namedAccountsSalon) {
      orderedSalons.push(namedAccountsSalon);
    }
    
    return orderedSalons;
  };

  // Debug: mostrar estado del modo de selección
  useEffect(() => {
    console.log('🔄 Estado actual - isMergeSelectionMode:', isMergeSelectionMode, 'mergeWizardStep:', mergeWizardStep, 'selectedTablesForMerge:', selectedTablesForMerge.length);
  }, [isMergeSelectionMode, mergeWizardStep, selectedTablesForMerge]);

  // Limpiar estado del modal de nombre cuando se cierre el modal principal
  useEffect(() => {
    if (!isOpen) {
      setShowNameModal(false);
      setSelectedTableForName(null);
      setTemporaryName('');
    }
  }, [isOpen]);

  // Debug: mostrar información de clientes
  useEffect(() => {
    if (showCustomerNameModal) {
      console.log('Clientes disponibles:', customers.length);
      console.log('Clientes:', customers);
    }
  }, [showCustomerNameModal, customers]);

  // Asegurar que el foco vaya al campo de búsqueda cuando se abra el modal
  useEffect(() => {
    if (showCustomerNameModal) {
      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Buscar por nombre"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showCustomerNameModal]);

  const filteredTables = tables.filter(table => {
    const matchesSearch = !searchTerm || 
      table.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.temporaryName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

    const handleTableClick = useCallback((table: TableData) => {
    console.log('🔍 Click en mesa:', table.number, 'Estado:', table.status, 'Modal abierto:', showNameModal);
    console.log('🔍 isMergeSelectionMode:', isMergeSelectionMode, 'mergeWizardStep:', mergeWizardStep);
    console.log('🔍 selectedTablesForMerge:', selectedTablesForMerge.length);
    
    // Asegurar que el modal de nombre temporal esté cerrado
    if (showNameModal) {
      setShowNameModal(false);
      setSelectedTableForName(null);
      setTemporaryName('');
      return;
    }
    
    // Si el wizard de unión está en modo de selección, manejar la selección para unir
    if (isMergeSelectionMode) {
      console.log('🔍 ENTRANDO en modo de selección para unir mesas...');
      
      // Verificar si la mesa ya está seleccionada
      if (selectedTablesForMerge.some(t => t.id === table.id)) {
        toast.error('Esta mesa ya está seleccionada');
        return;
      }

      // Verificar si la mesa ya está unida
      if (table.mergedWith || table.mergeGroup) {
        toast.error('Esta mesa ya está unida con otra');
        return;
      }

      setSelectedTablesForMerge(prev => [...prev, table]);
      
      if (mergeWizardStep === 1) {
        console.log('🔍 Seleccionando mesa principal:', table.number);
        toast.success(`Mesa ${table.number} seleccionada como principal`);
      } else {
        console.log('🔍 Seleccionando mesa adicional:', table.number, 'Paso actual:', mergeWizardStep);
        toast.success(`Mesa ${table.number} agregada a la unión`);
      }
      
      // Desactivar modo de selección y volver a abrir el wizard
      console.log('🔍 Desactivando modo de selección y volviendo a abrir wizard...');
      setIsMergeSelectionMode(false);
      setShowMergeWizard(true);
      console.log('🔍 Estado después de desactivar - isMergeSelectionMode:', false, 'showMergeWizard:', true);
      return;
    }
    
    // Si no estamos en modo de selección para unir, continuar con la lógica normal
    console.log('🔍 NO está en modo de selección, continuando con lógica normal...');
    
    // Verificar si la mesa está unida y NO es la principal (es secundaria)
    if (table.mergedWith && table.mergeGroup && !table.isMaster) {
      // Buscar la mesa principal del grupo
      const masterTable = tables.find(t => t.id === table.mergedWith);
      if (masterTable) {
        // Contar cuántas mesas están en el grupo
        const groupTables = tables.filter(t => t.mergeGroup === table.mergeGroup);
        const tableCount = groupTables.length;
        
        toast.error(`🔗 Esta mesa está unida con ${tableCount} mesa${tableCount > 1 ? 's' : ''}. Selecciona la mesa principal (${masterTable.number}) para realizar pedidos.`, {
          duration: 5000,
          icon: '🔗'
        });
        return;
      }
    }
    
    if (table.status === 'available' || table.status === 'occupied' || table.status === 'reserved') {
      // Verificar que la mesa principal no esté unida con otra (para evitar conflictos)
      if (table.mergeGroup && table.mergeGroup.length > 1) {
        // Esta es una mesa principal que tiene mesas unidas
        console.log('🔍 Seleccionando mesa principal con mesas unidas:', table.number);
      }
      
      // Limpiar la búsqueda antes de seleccionar la mesa
      setSearchTerm('');
      onSelectTable(table);
      onClose();
    }
  }, [isMergeSelectionMode, mergeWizardStep, selectedTablesForMerge, showNameModal, onSelectTable, onClose]);

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
      updateTableTemporaryName(selectedTableForName.id, temporaryName.trim() || null);
      setShowNameModal(false);
      setSelectedTableForName(null);
      setTemporaryName('');
      toast.success(`Nombre temporal guardado para mesa ${selectedTableForName.number}`);
    }
  };

  const handleCancelNameModal = () => {
    setShowNameModal(false);
    setSelectedTableForName(null);
    setTemporaryName('');
  };

  const handleCreateNamedAccount = async () => {
    try {
      let accountName: string;
      let customerData: any = null;

      if (selectedCustomer) {
        // Usar cliente existente
        accountName = `${selectedCustomer.name} ${selectedCustomer.lastName}`;
        customerData = selectedCustomer;
      } else {
        // Usar nombre nuevo
        accountName = customerName.trim();
      }
      
      const accountId = addNamedAccount(accountName, customerData);
      toast.success(`Cuenta creada para ${accountName}`);
      
      // Crear una mesa virtual para el dashboard
      const virtualTable: TableData = {
        id: accountId,
        number: accountName,
        name: accountName,
        status: 'occupied',
        x: 0,
        y: 0,
        capacity: 1,
        occupiedSince: new Date(),
        temporaryName: accountName,
        assignedCustomer: customerData
      };
      
      // Cerrar el modal y seleccionar la mesa virtual
      setShowCustomerNameModal(false);
      setCustomerName('');
      setSelectedCustomer(null);
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
    setSelectedCustomer(null);
  };



  // Función para cambiar estado de mesa (solo para debugging)
  const handleChangeTableStatus = (table: TableData, newStatus: 'available' | 'occupied' | 'reserved') => {
    updateTableStatus(table.id, newStatus);
    console.log(`Mesa ${table.number} cambiada a estado: ${newStatus}`);
  };

  // Funciones para manejar recarga de saldo
  const handleRechargeComplete = () => {
    // Si hay un cliente para recargar, actualizar su saldo
    if (customerToRecharge) {
      try {
        // Obtener los datos de recarga del localStorage
        const rechargeData = localStorage.getItem('rechargeData');
        if (rechargeData) {
          const parsedData = JSON.parse(rechargeData);
          const rechargeAmount = parsedData.amount;
          const newBalance = customerToRecharge.balance + rechargeAmount;
          
          // Actualizar el cliente en la base de datos
          updateCustomer(customerToRecharge.id, {
            ...customerToRecharge,
            balance: newBalance
          });
          
          console.log(`Recarga completada para ${customerToRecharge.name}: ${customerToRecharge.balance} -> ${newBalance}`);
        }
      } catch (error) {
        console.error('Error actualizando saldo del cliente:', error);
        toast.error('Error al actualizar el saldo del cliente');
      }
    }
    
    setShowBalanceRechargeModal(false);
    setShowRechargeModal(false);
    setCustomerToRecharge(null);
    // Limpiar datos de recarga
    localStorage.removeItem('rechargeData');
    // Refrescar la lista de clientes para obtener el saldo actualizado
    refreshCustomers();
    toast.success(`Recarga completada exitosamente`);
  };

  const handleOpenPaymentModal = (amount: number, bonus: number) => {
    if (!customerToRecharge) return;
    
    // Generar ID para la recarga
    const rechargeId = `RECHARGE-${Date.now()}`;
    
    // Crear datos de recarga para el PaymentModal
    const rechargeOrderItems = [{
      productId: 'recharge',
      productName: `Recarga de Saldo${bonus > 0 ? ` + €${bonus.toFixed(2)} regalo` : ''}`,
      quantity: 1,
      unitPrice: amount,
      totalPrice: amount,
      status: 'pending'
    }];

    // Guardar datos de recarga para usar en el PaymentModal
    localStorage.setItem('rechargeData', JSON.stringify({
      customer: customerToRecharge,
      amount,
      bonus,
      orderItems: rechargeOrderItems,
      subtotal: amount,
      tax: 0,
      total: amount,
      ticketId: rechargeId
    }));

    // Cerrar modal de incentivos y abrir modal de cobro
    setShowBalanceRechargeModal(false);
    setShowRechargeModal(true);
  };

  // Limpiar estado del modal de nombre cuando se cierre el modal principal
  const handleCloseMainModal = () => {
    setShowNameModal(false);
    setSelectedTableForName(null);
    setTemporaryName('');
    onClose();
  };

  if (!isOpen) return null;

  // Debug: log en cada render
  console.log('🎨 RENDERIZANDO TableSelectorModal - isMergeSelectionMode:', isMergeSelectionMode, 'showMergeWizard:', showMergeWizard);

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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Seleccionar Mesa</h2>
                  {isMergeSelectionMode && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {mergeWizardStep === 1 ? '🔗 Selecciona la mesa principal para unir' : '🔗 Selecciona mesas adicionales para unir'}
                    </p>
                  )}
                  


                </div>
              </div>
              
              {/* Botones de acción centrados */}
              <div className="flex items-center space-x-3">
                {/* Botón Reorganizar (solo para cuentas por nombre) */}
                {activeSalonId === 'named-accounts' && (
                  <button
                    onClick={() => {
                      reorganizeNamedAccounts();
                      toast.success('Cuentas por nombre reorganizadas');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 text-base border-2 border-blue-400 ring-2 ring-blue-200"
                    title="Reorganizar cuentas superpuestas"
                  >
                    <span className="text-lg">🔧</span>
                    <span>Reorganizar</span>
                  </button>
                )}
                
                {/* Botón Ticket sin Mesa */}
                {onTicketWithoutTable && (
                  <button
                    onClick={onTicketWithoutTable}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 text-base border-2 border-purple-400 ring-2 ring-purple-200"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Ticket sin Mesa</span>
                  </button>
                )}
                
                {/* Botón Unir Mesas */}
                {activeSalonId && (
                  <button
                    onClick={() => setShowMergeWizard(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 text-base border-2 border-green-400 ring-2 ring-green-200"
                  >
                    <span className="text-lg">🔗</span>
                    <span>Unir Mesas</span>
                  </button>
                )}

                {/* Campo de búsqueda de tarjeta */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={balanceSearchTerm}
                    onChange={(e) => {
                      setBalanceSearchTerm(e.target.value);
                      if (e.target.value.trim()) {
                        setShowBalanceSearchModal(true);
                      }
                    }}
                    placeholder="Pasar tarjeta o buscar cliente..."
                    className="w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    autoFocus={true}
                    data-osk={isKeyboardEnabled ? undefined : "false"}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/configuration')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Configuración"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Selector de salón y filtros en la misma línea */}
            <div className="flex items-center justify-between">
              {/* Selector de salón (izquierda) */}
              <div className="flex items-center space-x-4">
                {getOrderedSalons().map((salon) => (
                  <button
                    key={salon.id}
                    onClick={() => handleSalonSelect(salon.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeSalonId === salon.id
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {salon.name}
                  </button>
                ))}
              </div>

              {/* Búsqueda y filtros (derecha) */}
              <div className="flex items-center space-x-4">
                {/* Búsqueda */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar mesa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    data-osk={isKeyboardEnabled ? undefined : "false"}
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





          {/* Salón visual */}
          <div className="p-4 h-[calc(100vh-200px)]">
            <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-full overflow-y-auto">
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
                      isMergeSelectionMode={isMergeSelectionMode}
                      isSelectedForMerge={selectedTablesForMerge.some(t => t.id === table.id)}
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

            {/* Indicador de scroll para cuentas por nombre */}
            {activeSalonId === 'named-accounts' && filteredTables.length > 8 && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
                  <span>📜</span>
                  <span>Usa el scroll para ver todas las cuentas ({filteredTables.length} cuentas)</span>
                </div>
              </div>
            )}

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

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p>Haz clic en una mesa disponible u ocupada para seleccionarla</p>
              <p className="text-xs text-gray-500 mt-1">
                💡 <strong>Pulsación sostenida (1s)</strong> o <strong>clic derecho</strong> para asignar nombre temporal
              </p>
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
                  data-osk={isKeyboardEnabled ? undefined : "false"}
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
            <div className="inline-block w-full max-w-2xl p-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">
                  Nueva Cuenta por Nombre
                </h3>
                <button
                  onClick={handleCancelCustomerNameModal}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Información rápida */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">
                    📋 {customers.length} clientes disponibles
                  </span>
                  <span className="text-blue-600 text-xs">
                    Selecciona existente o crea nuevo
                  </span>
                </div>
              </div>
              
              {/* Búsqueda directa de cliente */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar Cliente Existente
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, email, teléfono, código de barras o NFC..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      autoFocus={true}
                      data-osk={isKeyboardEnabled ? undefined : "false"}
                    />
                  </div>
                  <button
                    onClick={() => setShowCustomerSelector(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
                  >
                    <User className="w-4 h-4" />
                    <span>Mostrar Clientes</span>
                  </button>
                </div>
                
                {/* Resultado de búsqueda */}
                {customerSearchTerm && (
                  <div className="mt-2">
                    {filteredCustomers.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredCustomers.slice(0, 5).map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearchTerm('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                          >
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {customer.name} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {customer.email || customer.phone || customer.cardCode}
                              </div>
                            </div>
                          </button>
                        ))}
                        {filteredCustomers.length > 5 && (
                          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                            ... y {filteredCustomers.length - 5} más. Usa "Mostrar Clientes" para ver todos.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No se encontraron clientes con "{customerSearchTerm}"
                      </div>
                    )}
                  </div>
                )}

                {/* Cliente seleccionado */}
                {selectedCustomer && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-green-800 text-sm">
                            Cliente Seleccionado:
                          </div>
                          <div className="font-medium text-gray-900 text-sm">
                            {selectedCustomer.name} {selectedCustomer.lastName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.cardCode}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearchTerm('');
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Cambiar cliente"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Separador */}
              <div className="flex items-center mb-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-sm text-gray-500 font-medium">O</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
                              {/* Campo de nombre temporal */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente Temporal
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre temporal del cliente (ej: Juan Pérez)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    autoFocus={false}
                    data-osk={isKeyboardEnabled ? undefined : "false"}
                  />
                </div>
              
              {/* Botones */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleCancelCustomerNameModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNamedAccount}
                  disabled={!selectedCustomer && !customerName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedCustomer ? `Crear Cuenta para ${selectedCustomer.name}` : 'Crear Cuenta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar cliente existente */}
      {showCustomerSelector && (
        <div className="fixed inset-0 z-[55] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowCustomerSelector(false)}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl" style={{ maxHeight: '90vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Seleccionar Cliente Existente
                </h3>
                <button
                  onClick={() => setShowCustomerSelector(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800 font-medium">
                      📋 {customers.length} clientes disponibles
                    </span>
                    <span className="text-blue-600 text-xs">
                      Busca por nombre, email, teléfono o código de tarjeta
                    </span>
                  </div>
                </div>
                
                <div style={{ height: '500px', overflow: 'hidden' }}>
                  <CustomerSelector
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={(customer) => {
                      setSelectedCustomer(customer);
                      setShowCustomerSelector(false);
                    }}
                    placeholder="Buscar cliente por nombre, email, teléfono o código de tarjeta..."
                    inModal={true}
                  />
                </div>
                
                {customers.length === 0 && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No hay clientes registrados. Puedes crear una cuenta con nombre personalizado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal de incentivos de recarga */}
      {showBalanceRechargeModal && customerToRecharge && (
        <BalanceRechargeModal
          isOpen={showBalanceRechargeModal}
          onClose={() => setShowBalanceRechargeModal(false)}
          customer={customerToRecharge}
          incentives={allIncentives}
          onRecharge={handleRechargeComplete}
          onOpenPaymentModal={handleOpenPaymentModal}
        />
      )}

      {/* Modal de recarga de saldo */}
      {showRechargeModal && customerToRecharge && (
        <PaymentModal
          isOpen={showRechargeModal}
          onClose={() => {
            setShowRechargeModal(false);
            setCustomerToRecharge(null);
            localStorage.removeItem('rechargeData');
          }}
          onPaymentComplete={handleRechargeComplete}
          orderItems={[]}
          tableNumber=""
          customerName={customerToRecharge.name + ' ' + customerToRecharge.lastName}
          subtotal={0}
          tax={0}
          total={0}
          selectedCustomer={customerToRecharge}
          isTicketWithoutTable={true}
        />
      )}

      {/* Modal de búsqueda de tarjeta */}
      {showBalanceSearchModal && (
        <div className="fixed inset-0 z-[55] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => {
                setShowBalanceSearchModal(false);
                setBalanceSearchTerm('');
              }}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Búsqueda de Cliente
                </h3>
                <button
                  onClick={() => {
                    setShowBalanceSearchModal(false);
                    setBalanceSearchTerm('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Campo de búsqueda */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar Cliente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={balanceSearchTerm}
                    onChange={(e) => setBalanceSearchTerm(e.target.value)}
                    placeholder="Pasar tarjeta o buscar por nombre, email, teléfono..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    autoFocus={true}
                    data-osk={isKeyboardEnabled ? undefined : "false"}
                  />
                </div>
              </div>

              {/* Resultados de búsqueda */}
              {balanceSearchTerm && (
                <div className="mb-4">
                  {filteredBalanceCustomers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredBalanceCustomers.slice(0, 5).map((customer) => (
                        <div key={customer.id} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900">
                                  {customer.name} {customer.lastName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {customer.email || customer.phone || customer.cardCode}
                                </div>
                                <div className="text-xl font-bold text-indigo-600">
                                  Saldo: €{customer.balance?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setShowBalanceSearchModal(false);
                                  setBalanceSearchTerm('');
                                  setCustomerToRecharge(customer);
                                  setShowBalanceRechargeModal(true);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                              >
                                <span className="text-sm">💳</span>
                                <span>Recarga</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowBalanceSearchModal(false);
                                  setBalanceSearchTerm('');
                                  
                                  // Buscar o crear cuenta por nombre para el cliente
                                  let accountId: string;
                                  const customerAccountName = `${customer.name} ${customer.lastName}`;
                                  
                                  // Primero buscar si ya existe una cuenta por nombre para este cliente
                                  const existingAccount = namedAccounts.find(table => 
                                    table.name === customerAccountName
                                  );
                                  
                                  if (existingAccount) {
                                    // Usar la cuenta existente
                                    accountId = existingAccount.id;
                                    console.log('Usando cuenta existente:', accountId);
                                  } else {
                                    // Crear nueva cuenta por nombre
                                    try {
                                      accountId = addNamedAccount(customerAccountName, customer);
                                      console.log('Nueva cuenta por nombre creada:', accountId);
                                    } catch (error) {
                                      console.error('Error al crear cuenta por nombre:', error);
                                      toast.error('Error al crear la cuenta por nombre');
                                      return;
                                    }
                                  }
                                  
                                  // Crear mesa virtual con la cuenta por nombre
                                  const virtualTable: TableData = {
                                    id: accountId,
                                    number: customerAccountName,
                                    name: customerAccountName,
                                    status: 'occupied',
                                    x: 0,
                                    y: 0,
                                    capacity: 1,
                                    occupiedSince: new Date(),
                                    temporaryName: customerAccountName,
                                    assignedCustomer: customer
                                  };
                                  
                                  onSelectTable(virtualTable);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                              >
                                <span className="text-sm">🛒</span>
                                <span>Pedir</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredBalanceCustomers.length > 5 && (
                        <div className="text-xs text-gray-500 text-center pt-2 border-t border-indigo-100">
                          ... y {filteredBalanceCustomers.length - 5} más. Refina tu búsqueda.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-800 mb-2">
                          Cliente no encontrado
                        </div>
                        <div className="text-sm text-yellow-700 mb-4">
                          No se encontró ningún cliente con "{balanceSearchTerm}"
                        </div>
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => {
                              setShowBalanceSearchModal(false);
                              setShowCustomerNameModal(true);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                          >
                            <span className="text-sm">👤</span>
                            <span>Crear Cuenta</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowBalanceSearchModal(false);
                              setBalanceSearchTerm('');
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowBalanceSearchModal(false);
                    setBalanceSearchTerm('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard de unión de mesas */}
      <MergeTablesWizard
        isOpen={showMergeWizard}
        onClose={() => {
          console.log('🔧 MODAL: onClose del wizard llamado');
          setShowMergeWizard(false);
          // NO resetear isMergeSelectionMode aquí, solo cuando se complete la selección
          // setIsMergeSelectionMode(false);
          // setSelectedTablesForMerge([]);
          // setMergeWizardStep(1);
        }}
        step={mergeWizardStep}
        selectedTables={selectedTablesForMerge}
        onStepChange={setMergeWizardStep}
        onTablesChange={(tables) => {
          console.log('Actualizando mesas seleccionadas:', tables.length);
          setSelectedTablesForMerge(tables);
        }}
        isSelectionMode={isMergeSelectionMode}
        onSelectionModeChange={(isSelectionMode) => {
          console.log('🔧 CALLBACK: Cambiando modo de selección a:', isSelectionMode);
          setIsMergeSelectionMode(isSelectionMode);
          console.log('🔧 Estado actualizado, isMergeSelectionMode ahora es:', isSelectionMode);
          // Verificar que el estado se haya actualizado correctamente
          setTimeout(() => {
            console.log('🔧 VERIFICACIÓN: isMergeSelectionMode después de 100ms:', isSelectionMode);
          }, 100);
        }}
      />
    </div>
  );
};

export default TableSelectorModal;
