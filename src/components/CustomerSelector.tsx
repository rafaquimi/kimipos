import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, X, ChevronDown, CreditCard, Mail, Phone } from 'lucide-react';
import { useCustomers, Customer } from '../contexts/CustomerContext';
import { useNavigate } from 'react-router-dom';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  placeholder?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onCustomerSelect,
  placeholder = "Seleccionar cliente..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { customers, searchCustomers } = useCustomers();
  const navigate = useNavigate();

  // Filtrar clientes basado en el término de búsqueda
  const filteredCustomers = searchTerm ? searchCustomers(searchTerm) : customers;

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onCustomerSelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleNewCustomer = () => {
    setIsOpen(false);
    setSearchTerm('');
    navigate('/customers');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo de selección */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {selectedCustomer ? (
            <>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">
                  {selectedCustomer.name} {selectedCustomer.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.cardCode}
                </div>
              </div>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{placeholder}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {selectedCustomer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">
                          {customer.name} {customer.lastName}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          {customer.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{customer.email}</span>
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
                      {customer.balance > 0 && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500">Saldo</div>
                          <div className="text-sm font-semibold text-green-600">
                            €{customer.balance.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón para nuevo cliente */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleNewCustomer}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
