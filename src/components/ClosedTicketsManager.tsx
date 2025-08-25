import React, { useState } from 'react';
import { Search, Printer, Calendar, Hash, User, Receipt, Filter } from 'lucide-react';
import { useClosedTickets } from '../contexts/ClosedTicketsContext';
import { generatePOSTicketPDF, openPDFInNewWindow } from '../utils/pdfGenerator';
import { useConfig } from '../contexts/ConfigContext';

const ClosedTicketsManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const { closedTickets, searchClosedTickets } = useClosedTickets();
  const { getCurrencySymbol, config } = useConfig();

  // Filtrar tickets por fecha, término de búsqueda y tipo de documento
  const filteredTickets = React.useMemo(() => {
    let tickets = closedTickets;
    
    // Filtrar por fecha si está seleccionada
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const selectedDateString = selectedDateObj.toDateString();
      
      tickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.closedAt);
        return ticketDate.toDateString() === selectedDateString;
      });
    }
    
    // Filtrar por tipo de documento
    if (selectedDocumentType) {
      if (selectedDocumentType === 'fiscal') {
        // Documentos fiscales: tickets y recargas
        tickets = tickets.filter(ticket => 
          ticket.documentType === 'ticket' || ticket.documentType === 'recharge'
        );
      } else if (selectedDocumentType === 'receipts') {
        // Recibos: balance_payment y partial_receipt
        tickets = tickets.filter(ticket => 
          ticket.documentType === 'balance_payment' || ticket.documentType === 'partial_receipt'
        );
      } else {
        // Tipo específico
        tickets = tickets.filter(ticket => ticket.documentType === selectedDocumentType);
      }
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      tickets = tickets.filter(ticket => 
        ticket.ticketId.toLowerCase().includes(lowerQuery) ||
        ticket.tableNumber.toLowerCase().includes(lowerQuery) ||
        (ticket.customerName && ticket.customerName.toLowerCase().includes(lowerQuery)) ||
        ticket.orderItems.some(item => item.productName.toLowerCase().includes(lowerQuery))
      );
    }
    
    return tickets;
  }, [closedTickets, selectedDate, selectedDocumentType, searchTerm]);

  const handleReprintTicket = (ticket: any) => {
    try {
      // Usar los datos actuales del negocio desde la configuración
      const currentBusinessData = config.businessData;

      const pdfDataUrl = generatePOSTicketPDF({
        ...ticket,
        businessData: currentBusinessData
      });
      
      const fileName = `ticket-${ticket.ticketId}-reprint-${new Date().toISOString().slice(0, 10)}`;
      openPDFInNewWindow(pdfDataUrl, fileName);
    } catch (error) {
      console.error('Error reprinting ticket:', error);
      alert('Error al reimprimir el ticket');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'fiscal': return 'Documentos Fiscales';
      case 'receipts': return 'Recibos';
      case 'ticket': return 'Ticket (Factura)';
      case 'recharge': return 'Recarga';
      case 'balance_payment': return 'Recibo de Pago con Saldo';
      case 'partial_receipt': return 'Recibo Parcial';
      default: return type;
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSearchTerm('');
    setSelectedDocumentType('');
  };

  const getFilterStatus = () => {
    const hasDateFilter = selectedDate !== '';
    const hasSearchFilter = searchTerm.trim() !== '';
    const hasDocumentTypeFilter = selectedDocumentType !== '';
    return hasDateFilter || hasSearchFilter || hasDocumentTypeFilter;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos Cerrados ({filteredTickets.length})
            {getFilterStatus() && (
              <span className="text-sm text-gray-500 ml-2">
                de {closedTickets.length} total
              </span>
            )}
          </h3>
          
          {getFilterStatus() && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Campo de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por ID, mesa, cliente o productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Selector de fecha */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Selector de tipo de documento */}
          <div className="relative">
            <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                             <option value="">Todos los documentos</option>
               <option value="fiscal">Documentos Fiscales (Tickets + Recargas)</option>
               <option value="ticket">Solo Tickets (Facturas)</option>
               <option value="recharge">Solo Recargas</option>
               <option value="receipts">Solo Recibos (Pago con Saldo + Parciales)</option>
               <option value="balance_payment">Solo Recibos de Pago con Saldo</option>
               <option value="partial_receipt">Solo Recibos Parciales</option>
            </select>
          </div>
        </div>

        {/* Información de filtros activos */}
        {getFilterStatus() && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros activos:</span>
              {selectedDate && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Fecha: {new Date(selectedDate).toLocaleDateString('es-ES')}
                </span>
              )}
              {selectedDocumentType && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Tipo: {getDocumentTypeLabel(selectedDocumentType)}
                </span>
              )}
              {searchTerm && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  Búsqueda: "{searchTerm}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Lista de tickets */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {getFilterStatus() ? 'No se encontraron documentos' : 'No hay documentos cerrados'}
              </h4>
              <p className="text-gray-600">
                {getFilterStatus() 
                  ? 'Intenta con otros filtros o términos de búsqueda' 
                  : 'Los documentos aparecerán aquí después de ser procesados'
                }
              </p>
              {getFilterStatus() && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-600">
                        #{ticket.ticketId}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {getDocumentTypeLabel(ticket.documentType)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formatDate(ticket.closedAt)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Mesa:</span>
                    <span className="text-sm text-gray-600">
                      {ticket.tableNumber || 'Sin mesa'}
                    </span>
                  </div>
                  
                  {ticket.customerName && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {ticket.customerName}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {ticket.currencySymbol}{ticket.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Productos */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Productos:</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {ticket.orderItems.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {item.quantity}x {item.productName} - {ticket.currencySymbol}{item.totalPrice.toFixed(2)}
                      </div>
                    ))}
                    {ticket.orderItems.length > 3 && (
                      <div className="text-sm text-gray-500">
                        ... y {ticket.orderItems.length - 3} productos más
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón reimprimir */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleReprintTicket(ticket)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Reimprimir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClosedTicketsManager;
