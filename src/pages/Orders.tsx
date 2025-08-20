import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Filter, 
  Eye, 
  Receipt,
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign
} from 'lucide-react';
import { db, Order } from '../database/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Queries
  const orders = useLiveQuery(() => {
    let query = db.orders.toCollection();
    
    if (statusFilter) {
      query = query.filter(order => order.status === statusFilter);
    }
    
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const nextDay = new Date(filterDate.getTime() + 24 * 60 * 60 * 1000);
      query = query.filter(order => 
        order.createdAt >= filterDate && order.createdAt < nextDay
      );
    }
    
    if (searchTerm) {
      query = query.filter(order => 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.waiterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm)
      );
    }
    
    return query.reverse().sortBy('createdAt');
  }, [statusFilter, dateFilter, searchTerm]);

  const tables = useLiveQuery(() => db.tables.toArray());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'delivered':
        return 'Entregado';
      case 'paid':
        return 'Pagado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getTableName = (tableId?: number) => {
    if (!tableId) return 'Para llevar';
    const table = tables?.find(t => t.id === tableId);
    return table ? `Mesa ${table.number} - ${table.name}` : `Mesa ${tableId}`;
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await db.orders.update(orderId, {
        status: newStatus as any,
        updatedAt: new Date()
      });
      
      // Update selected order if it's the same
      if (selectedOrder?.id === orderId) {
        const updatedOrder = await db.orders.get(orderId);
        setSelectedOrder(updatedOrder || null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Panel izquierdo - Lista de pedidos */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Receipt className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, mesero o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="preparing">Preparando</option>
                <option value="ready">Listo</option>
                <option value="delivered">Entregado</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="flex-1 overflow-auto">
          {orders?.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedOrder?.id === order.id ? 'bg-primary-50 border-primary-200' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">
                    Pedido #{order.id}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="text-lg font-bold text-primary-600">
                  ${order.total.toFixed(2)}
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
                
                {order.customerName && (
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{order.customerName}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{getTableName(order.tableId)}</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {order.items.length} producto(s) • {order.waiterName}
                </div>
              </div>
            </div>
          ))}

          {orders?.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter || dateFilter
                    ? 'No se encontraron pedidos con los filtros aplicados'
                    : 'Los pedidos aparecerán aquí'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Detalle del pedido */}
      <div className="flex-1 flex flex-col">
        {selectedOrder ? (
          <>
            {/* Header del detalle */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Pedido #{selectedOrder.id}
                </h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id!, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="ready">Listo</option>
                    <option value="delivered">Entregado</option>
                    <option value="paid">Pagado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center space-x-1 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Creado:</span>
                  </div>
                  <div className="font-medium">
                    {format(selectedOrder.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center space-x-1 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Ubicación:</span>
                  </div>
                  <div className="font-medium">
                    {getTableName(selectedOrder.tableId)}
                  </div>
                </div>
                
                {selectedOrder.customerName && (
                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <User className="w-4 h-4" />
                      <span>Cliente:</span>
                    </div>
                    <div className="font-medium">{selectedOrder.customerName}</div>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center space-x-1 text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    <span>Mesero:</span>
                  </div>
                  <div className="font-medium">{selectedOrder.waiterName}</div>
                </div>
              </div>
            </div>

            {/* Items del pedido */}
            <div className="flex-1 overflow-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1">Nota: {item.notes}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Cantidad: {item.quantity}</span>
                          <span>Precio unitario: ${item.unitPrice.toFixed(2)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-primary-600">
                        ${item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA:</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descuento:</span>
                    <span>-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary-600">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 mb-1">Notas del pedido:</div>
                  <div className="text-sm text-yellow-700">{selectedOrder.notes}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un pedido</h3>
              <p className="text-gray-500">Haz clic en un pedido para ver sus detalles</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

