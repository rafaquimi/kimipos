import React, { useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  Receipt,
  User,
  CreditCard,
  Calculator,
  MapPin,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableSelectorModal from '../components/Table/TableSelectorModal';
import PaymentModal from '../components/Payment/PaymentModal';
import { TableData } from '../components/Table/TableComponent';
import { useTables } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const { addOrderToTable, getTableOrderItems, clearTableOrder } = useTables();
  const { getCurrencySymbol, getTaxRate } = useConfig();
  const { products, categories } = useProducts();

  // Solo productos activos
  const activeProducts = products.filter(p => p.isActive);
  const activeCategories = categories.filter(c => c.isActive);

  // Filtrar productos
  const filteredProducts = activeProducts.filter(product => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Funciones del carrito
  const addToOrder = (product: any) => {
    const existingItem = currentOrder.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCurrentOrder(currentOrder.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        status: 'pending'
      };
      setCurrentOrder([...currentOrder, newItem]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity === 0 
          ? null 
          : { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice };
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const removeFromOrder = (productId: string) => {
    setCurrentOrder(currentOrder.filter(item => item.productId !== productId));
  };

  const clearOrder = () => {
    setCurrentOrder([]);
    setCustomerName('');
    // No limpiamos la mesa seleccionada para mantener el contexto
  };

  const handleTableSelect = (table: TableData) => {
    setSelectedTable(table);
    
    // Si la mesa está ocupada, cargar los pedidos existentes
    if (table.status === 'occupied') {
      const existingOrderItems = getTableOrderItems(table.id);
      if (existingOrderItems.length > 0) {
        setCurrentOrder(existingOrderItems);
        toast.success(`Cargados ${existingOrderItems.length} productos de la mesa ${table.number}`);
      }
    } else {
      // Si la mesa está disponible, limpiar el pedido actual
      setCurrentOrder([]);
    }
  };

  const calculateTotal = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * getTaxRate();
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const processOrder = async () => {
    if (currentOrder.length === 0) {
      toast.error('El pedido está vacío');
      return;
    }

    if (!selectedTable) {
      toast.error('Debes seleccionar una mesa antes de procesar el pedido');
      return;
    }

    const { total } = calculateTotal();
    
    // Actualizar la mesa con el pedido
    addOrderToTable(selectedTable.id, total, currentOrder);
    
    toast.success(`Pedido procesado exitosamente para Mesa ${selectedTable.number}`);
    
    // Limpiar solo el carrito local, mantener la mesa seleccionada
    setCurrentOrder([]);
    setCustomerName('');
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Panel izquierdo - Categorías y Productos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con búsqueda */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              />
            </div>
            {customerName && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-4 py-2 rounded-xl shadow-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{customerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-sm">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
              }`}
            >
              Todas
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{ 
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  color: selectedCategory === category.id ? 'white' : undefined,
                  borderColor: selectedCategory === category.id ? category.color : undefined
                }}
                className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${
                  selectedCategory === category.id
                    ? 'text-white shadow-lg transform scale-105 border-2'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Productos */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToOrder(product)}
                className="product-card bg-gradient-to-br from-white via-white to-gray-50/50 hover:from-blue-50 hover:via-white hover:to-indigo-50 cursor-pointer p-5 rounded-2xl shadow-md border border-gray-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:shadow-blue-200/25 hover:scale-105 backdrop-blur-sm"
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {getCurrencySymbol()}{product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho - Carrito y totales */}
      <div className="w-96 bg-white/90 backdrop-blur-sm border-l border-gray-200/50 flex flex-col shadow-xl">
        {/* Header del carrito */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              Pedido Actual
            </h2>
            {currentOrder.length > 0 && (
              <button
                onClick={clearOrder}
                className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                title="Limpiar pedido"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Selección de mesa y cliente */}
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="Nombre del cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200 hover:shadow-md"
            />
            
            {/* Botón para seleccionar mesa */}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200 hover:shadow-md bg-white shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className={selectedTable ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedTable 
                      ? `Mesa ${selectedTable.number}${selectedTable.name ? ` - ${selectedTable.name}` : ''}` 
                      : 'Seleccionar mesa'
                    }
                  </span>
                </div>
                {selectedTable && (
                  <div className={`w-3 h-3 rounded-full ${
                    selectedTable.status === 'available' ? 'bg-green-500' :
                    selectedTable.status === 'occupied' ? 'bg-red-500' :
                    selectedTable.status === 'reserved' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                )}
              </button>
              {selectedTable && (
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    setCurrentOrder([]);
                    setCustomerName('');
                  }}
                  className="px-3 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm hover:shadow-md"
                  title="Limpiar selección de mesa"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentOrder.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay productos en el pedido</p>
              <p className="text-sm">Selecciona productos para agregar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.map((item) => (
                <div key={item.productId} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.productName}</h4>
                                             <p className="text-sm text-gray-600">{getCurrencySymbol()}{item.unitPrice.toFixed(2)} c/u</p>
                    </div>
                    <button
                      onClick={() => removeFromOrder(item.productId)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {getCurrencySymbol()}{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales y acciones */}
        {currentOrder.length > 0 && (
          <div className="border-t border-gray-200/50 p-6 space-y-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                 <span>Subtotal:</span>
                 <span>{getCurrencySymbol()}{subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span>IVA ({getTaxRate() * 100}%):</span>
                 <span>{getCurrencySymbol()}{tax.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xl font-bold border-t pt-3 border-gray-300">
                 <span className="text-gray-800">Total:</span>
                 <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{getCurrencySymbol()}{total.toFixed(2)}</span>
               </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={processOrder}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Receipt className="w-5 h-5" />
                <span>Procesar Pedido</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md">
                  <Calculator className="w-4 h-4" />
                  <span>Dividir</span>
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-md">
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta</span>
                </button>
              </div>
               
              {/* Botón para cobrar mesa si está ocupada */}
              {selectedTable && selectedTable.status === 'occupied' && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Cobrar Mesa</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

             {/* Modal de selección de mesas */}
       <TableSelectorModal
         isOpen={isTableModalOpen}
         onClose={() => setIsTableModalOpen(false)}
         onSelectTable={handleTableSelect}
         selectedTableId={selectedTable?.id}
       />

       {/* Modal de cobro */}
       <PaymentModal
         isOpen={isPaymentModalOpen}
         onClose={() => setIsPaymentModalOpen(false)}
         onPaymentComplete={() => {
           if (selectedTable) {
             clearTableOrder(selectedTable.id);
             setSelectedTable(null);
             setCurrentOrder([]);
             toast.success(`Mesa ${selectedTable.number} cobrada y liberada`);
           }
         }}
         orderItems={currentOrder}
         tableNumber={selectedTable?.number || ''}
         customerName={customerName}
         subtotal={subtotal}
         tax={tax}
         total={total}
       />
     </div>
   );
 };

export default Dashboard;
