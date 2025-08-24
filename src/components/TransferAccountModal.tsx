import React, { useState } from 'react';
import { X, MapPin, User, DollarSign, AlertTriangle, Link2 } from 'lucide-react';
import { Customer } from '../contexts/CustomerContext';
import { TableData } from './Table/TableComponent';
import toast from 'react-hot-toast';

interface TransferAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  tables: TableData[];
  onTransfer: (sourceTable: TableData, customer: Customer) => void;
}

const TransferAccountModal: React.FC<TransferAccountModalProps> = ({
  isOpen,
  onClose,
  customer,
  tables,
  onTransfer
}) => {
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);

  if (!isOpen) return null;

  // Filtrar mesas que tienen pedidos (ocupadas)
  const occupiedTables = tables.filter(table => 
    table.status === 'occupied' && 
    table.id !== 'virtual' // Excluir mesas virtuales
  );

  const handleTransfer = () => {
    if (!selectedTable) {
      toast.error('Por favor selecciona una mesa para trasladar');
      return;
    }

    onTransfer(selectedTable, customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <Link2 className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Trasladar Cuenta
                </h2>
                <p className="text-sm text-gray-600">
                  {customer.name} {customer.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Información del cliente */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Cliente seleccionado:
                  </p>
                  <p className="text-sm text-blue-700">
                    {customer.name} {customer.lastName}
                  </p>
                  {customer.balance > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Saldo disponible: €{customer.balance.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Selección de mesa */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                Seleccionar Mesa para Trasladar
              </h3>
              
              {occupiedTables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay mesas ocupadas</p>
                  <p className="text-sm">Todas las mesas están libres</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {occupiedTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`w-full p-4 border rounded-lg text-left transition-all duration-200 ${
                        selectedTable?.id === table.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">
                            Mesa {table.number}
                          </div>
                          {table.name && (
                            <div className="text-sm text-gray-600">
                              {table.name}
                            </div>
                          )}
                          {table.temporaryName && (
                            <div className="text-sm text-blue-600">
                              {table.temporaryName}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Advertencia */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Importante:
                  </p>
                  <p className="text-sm text-yellow-700">
                    Al trasladar la cuenta, la mesa quedará libre y todos los productos se moverán a la cuenta por nombre del cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransfer}
                disabled={!selectedTable}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200"
              >
                Trasladar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferAccountModal;
