import React, { useState, useEffect } from 'react';
import { X, Search, User, DollarSign, CreditCard } from 'lucide-react';
import { useCustomers } from '../contexts/CustomerContext';
import { useConfig } from '../contexts/ConfigContext';
import { useBalanceIncentives } from '../contexts/BalanceIncentiveContext';
import { Customer } from '../contexts/CustomerContext';
import BalanceRechargeModal from './BalanceRechargeModal';
import PaymentModal from './Payment/PaymentModal';
import { getNextTicketId, formatTicketId } from '../utils/ticketIdGenerator';
import toast from 'react-hot-toast';

interface CustomerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer?: Customer | null;
}

const CustomerSelectorModal: React.FC<CustomerSelectorModalProps> = ({
  isOpen,
  onClose,
  onCustomerSelect,
  selectedCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showBalanceRechargeModal, setShowBalanceRechargeModal] = useState(false);
  const [customerToRecharge, setCustomerToRecharge] = useState<Customer | null>(null);
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  
  const { customers, searchCustomers, getCustomerByCardCode } = useCustomers();
  const { getCurrencySymbol } = useConfig();
  const { allIncentives } = useBalanceIncentives();

  // Filtrar clientes basado en el método de búsqueda
  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm.trim()) return customers;

    // Búsqueda universal: intentar todos los métodos
    const results = new Set<Customer>();
    
    // 1. Buscar por nombre, email o teléfono
    const nameResults = searchCustomers(searchTerm);
    nameResults.forEach(customer => results.add(customer));
    
    // 2. Buscar por código de barras/NFC
    const codeResults = getCustomerByCardCode(searchTerm);
    if (codeResults) {
      results.add(codeResults);
    }
    
    return Array.from(results);
  }, [searchTerm, customers, searchCustomers, getCustomerByCardCode]);

  // Limpiar búsqueda al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Obtener el placeholder universal
  const getSearchPlaceholder = () => {
    return 'Buscar por nombre, email, teléfono, código de barras o NFC...';
  };

  const handleCustomerSelect = (customer: Customer) => {
    console.log('Cliente seleccionado:', customer);
    setSelectedCustomerForDetails(customer);
    setShowCustomerDetailsModal(true);
    console.log('Modal de detalles abierto');
  };

  const handleConfirmCustomerSelection = () => {
    if (selectedCustomerForDetails) {
      onCustomerSelect(selectedCustomerForDetails);
      setShowCustomerDetailsModal(false);
      setSelectedCustomerForDetails(null);
      onClose();
      toast.success(`Cliente ${selectedCustomerForDetails.name} ${selectedCustomerForDetails.lastName} seleccionado`);
    }
  };

  const handleRechargeFromDetails = (customer: Customer) => {
    setCustomerToRecharge(customer);
    setShowBalanceRechargeModal(true);
    setShowCustomerDetailsModal(false);
  };

  const handleRechargeBalance = (customer: Customer) => {
    setCustomerToRecharge(customer);
    setShowBalanceRechargeModal(true);
  };

  const handleRechargeComplete = () => {
    setShowRechargeModal(false);
    setShowBalanceRechargeModal(false);
    setCustomerToRecharge(null);
    // Limpiar datos de recarga
    localStorage.removeItem('rechargeData');
    toast.success(`Recarga completada exitosamente`);
  };

  const handleOpenPaymentModal = (amount: number, bonus: number) => {
    if (!customerToRecharge) return;
    
    // Generar ID para la recarga
    const rechargeId = formatTicketId(getNextTicketId());
    
    // Crear datos de recarga para el PaymentModal
    const rechargeOrderItems = [{
      productId: 'recharge',
      productName: `Recarga de Saldo${bonus > 0 ? ` + ${getCurrencySymbol()}${bonus.toFixed(2)} regalo` : ''}`,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredCustomers.length === 1) {
      handleCustomerSelect(filteredCustomers[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <div 
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Seleccionar Cliente
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Campo de búsqueda universal */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Busca por nombre, email, teléfono, código de barras o NFC
                </p>
              </div>

              {/* Lista de clientes */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Intenta con otros términos de búsqueda' 
                        : 'Comienza agregando tu primer cliente'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredCustomers.map((customer) => (
                      <div 
                        key={customer.id} 
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {customer.name} {customer.lastName}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                {customer.email && (
                                  <div className="flex items-center space-x-1">
                                    <span>📧</span>
                                    <span>{customer.email}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div className="flex items-center space-x-1">
                                    <span>📞</span>
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
                          
                          <div className="flex items-center space-x-4">
                            {/* Saldo */}
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Saldo</div>
                              <div className={`text-lg font-bold ${customer.balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {getCurrencySymbol()}{customer.balance.toFixed(2)}
                              </div>
                            </div>
                            
                            {/* Botón recargar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRechargeBalance(customer);
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>Recargar</span>
                            </button>
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
                )}
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del cliente */}
      {console.log('Renderizando modal de detalles:', showCustomerDetailsModal, selectedCustomerForDetails)}
      {showCustomerDetailsModal && selectedCustomerForDetails && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowCustomerDetailsModal(false)}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Detalles del Cliente
                  </h2>
                </div>
                <button
                  onClick={() => setShowCustomerDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6">
                {/* Información del cliente */}
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedCustomerForDetails.name} {selectedCustomerForDetails.lastName}
                      </h3>
                      <p className="text-gray-600">Cliente registrado</p>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-3 mb-6">
                    {selectedCustomerForDetails.email && (
                      <div className="flex items-center space-x-3 text-gray-700">
                        <span className="text-lg">📧</span>
                        <span>{selectedCustomerForDetails.email}</span>
                      </div>
                    )}
                    {selectedCustomerForDetails.phone && (
                      <div className="flex items-center space-x-3 text-gray-700">
                        <span className="text-lg">📞</span>
                        <span>{selectedCustomerForDetails.phone}</span>
                      </div>
                    )}
                    {selectedCustomerForDetails.cardCode && (
                      <div className="flex items-center space-x-3 text-gray-700">
                        <CreditCard className="w-5 h-5" />
                        <span>{selectedCustomerForDetails.cardCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Saldo actual */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-green-800">Saldo actual:</span>
                      <span className="text-2xl font-bold text-green-900">
                        {getCurrencySymbol()}{selectedCustomerForDetails.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Notas si existen */}
                  {selectedCustomerForDetails.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-2">Notas:</h4>
                      <p className="text-gray-700">{selectedCustomerForDetails.notes}</p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleRechargeFromDetails(selectedCustomerForDetails)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Recargar Saldo</span>
                  </button>
                  <button
                    onClick={handleConfirmCustomerSelection}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <User className="w-5 h-5" />
                    <span>Seleccionar</span>
                  </button>
                </div>
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
          onClose={() => setShowRechargeModal(false)}
          onPaymentComplete={handleRechargeComplete}
          orderItems={[]}
          tableNumber=""
          customerName=""
          subtotal={0}
          tax={0}
          total={0}
          selectedCustomer={customerToRecharge}
          skipDbSave={true}
          isTicketWithoutTable={true}
        />
      )}
    </>
  );
};

export default CustomerSelectorModal;