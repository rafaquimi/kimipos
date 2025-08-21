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
  DollarSign,
  Link2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableSelectorModal from '../components/Table/TableSelectorModal';
import PaymentModal from '../components/Payment/PaymentModal';
import MergeTablesModal from '../components/Table/MergeTablesModal';
import NumericKeypad from '../components/NumericKeypad';
import TariffSelectorModal from '../components/TariffSelectorModal';
import CombinationSelectorModal from '../components/CombinationSelectorModal';
import ModifiersModal from '../components/ModifiersModal';
import { TableData } from '../components/Table/TableComponent';
import { useTables } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';
import { calculateTotalBase, calculateTotalVAT, calculateTotalWithVAT, formatPrice } from '../utils/taxUtils';
import { ProductTariff } from '../types/product';
import { db } from '../database/db';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  modifiers?: string[];
}

const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [showNumericKeypad, setShowNumericKeypad] = useState(false);
  const [editingPriceFor, setEditingPriceFor] = useState<string | null>(null);
  const [showTariffSelector, setShowTariffSelector] = useState(false);
  const [selectedProductForTariff, setSelectedProductForTariff] = useState<any>(null);
  const [showCombinationSelector, setShowCombinationSelector] = useState(false);
  const [selectedProductForCombination, setSelectedProductForCombination] = useState<any>(null);
  // Estado temporal para gestionar flujo combinación + tarifa
  const [pendingCombination, setPendingCombination] = useState<{
    baseProduct: any;
    selectedProducts: Array<{product: any, quantity: number}>;
    combinationNames: string;
    additionalPrice: number;
  } | null>(null);
  // Modificadores
  const [modifiersFor, setModifiersFor] = useState<string | null>(null);
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  // Edición de tickets (desde Pedidos)
  const [editOrderId, setEditOrderId] = useState<number | null>(null);
  const [originalTotalForEdit, setOriginalTotalForEdit] = useState<number | null>(null);
  const [tempDiffForPayment, setTempDiffForPayment] = useState<{ 
    amount: number; 
    isIncrease: boolean; 
    newTotal?: number; 
    newSubtotal?: number; 
    newTax?: number; 
  } | null>(null);
  
  const { addOrderToTable, getTableOrderItems, clearTableOrder, unmergeTables } = useTables();
  const { getCurrencySymbol, getTaxRate, getModifiersForCategory } = useConfig();
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
  const addToOrder = (product: any, selectedTariff?: ProductTariff) => {
    const existingItem = currentOrder.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCurrentOrder(currentOrder.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const tariff = selectedTariff || product.tariffs?.find((t: ProductTariff) => t.isDefault) || { price: product.price };
      const newItem: OrderItem = {
        productId: product.id,
        productName: `${product.name}${selectedTariff ? ` - ${selectedTariff.name}` : ''}`,
        quantity: 1,
        unitPrice: tariff.price,
        totalPrice: tariff.price,
        status: 'pending',
        modifiers: []
      };
      setCurrentOrder([...currentOrder, newItem]);
    }
  };

  // Cargar ticket para edición si viene desde "Pedidos"
  React.useEffect(() => {
    const loadForEdit = async () => {
      const editOrderId = localStorage.getItem('orderToEdit');
      if (!editOrderId) return;
      try {
        const order = await db.orders.get(Number(editOrderId));
        if (order) {
          const items = order.items.map((it: any, idx: number) => ({
            productId: String(it.productId ?? `edit-${idx}`),
            productName: it.productName || `Producto ${idx+1}`,
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            totalPrice: it.totalPrice || 0,
            status: 'pending' as const,
            modifiers: [] as string[]
          }));
          setCurrentOrder(items);
          setEditOrderId(order.id || null);
          setOriginalTotalForEdit(order.total || 0);
          toast.success(`Editando ticket #${order.id}`);
        }
      } catch (e) {
        console.error('Error cargando ticket para edición:', e);
      }
    };
    loadForEdit();
  }, []);

  const clearEditingState = () => {
    // Limpiar estados de edición
    setEditOrderId(null);
    setOriginalTotalForEdit(null);
    setTempDiffForPayment(null);
    
    // Limpiar pedido actual
    setCurrentOrder([]);
    
    // Limpiar mesa seleccionada
    setSelectedTable(null);
    
    // Limpiar localStorage
    localStorage.removeItem('orderToEdit');
    
    toast.success('Dashboard limpiado, listo para nuevos pedidos');
  };

  const saveEditedOrder = async () => {
    if (!editOrderId) return;
    
    const { subtotal, tax, total } = calculateTotal();
    
    // Solo mostrar modal de cobro si hay diferencia, SIN guardar aún
    if (originalTotalForEdit !== null) {
      const diff = parseFloat((total - originalTotalForEdit).toFixed(2));
      if (Math.abs(diff) > 0.001) {
        // Preparar datos para el modal de cobro de diferencia
        setTempDiffForPayment({ 
          amount: Math.abs(diff), 
          isIncrease: diff > 0,
          newTotal: total,
          newSubtotal: subtotal,
          newTax: tax
        });
        setIsPaymentModalOpen(true);
        return; // No guardar hasta completar el cobro
      }
    }
    
    // Si no hay diferencia, guardar directamente y limpiar
    try {
      await db.orders.update(editOrderId, {
        items: currentOrder.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          modifiers: i.modifiers || []
        })),
        subtotal,
        tax,
        total,
        updatedAt: new Date()
      });
      
      toast.success('Ticket actualizado sin cambios en el total');
      clearEditingState();
    } catch (e) {
      console.error('Error guardando ticket editado:', e);
      toast.error('No se pudo guardar el ticket');
    }
  };

  const handleProductClick = (product: any) => {
    // Si el producto tiene combinaciones activas, mostrar selector de combinaciones
    if (product.combinations && product.combinations.some((c: any) => c.isActive)) {
      setSelectedProductForCombination(product);
      setShowCombinationSelector(true);
    }
    // Si el producto tiene múltiples tarifas, mostrar selector
    else if (product.tariffs && product.tariffs.length > 1) {
      setSelectedProductForTariff(product);
      setShowTariffSelector(true);
    } else {
      // Si solo tiene una tarifa o no tiene tarifas, agregar directamente
      addToOrder(product);
    }
  };

  const handleTariffSelect = (tariff: ProductTariff) => {
    // Si hay una combinación pendiente para este producto, combinar ambas selecciones
    if (pendingCombination && selectedProductForTariff && pendingCombination.baseProduct.id === selectedProductForTariff.id) {
      const { baseProduct, combinationNames, additionalPrice } = pendingCombination;
      const productName = `${baseProduct.name} con ${combinationNames} - ${tariff.name}`;
      const totalPrice = tariff.price + additionalPrice;

      const newItem: OrderItem = {
        productId: baseProduct.id,
        productName,
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice,
        status: 'pending',
        modifiers: []
      };

      setCurrentOrder([...currentOrder, newItem]);
      setPendingCombination(null);
      return;
    }

    // Caso normal: solo tarifa
    if (selectedProductForTariff) {
      addToOrder(selectedProductForTariff, tariff);
    }
  };

  // Modificadores: opciones por categoría (predeterminadas)
  const getDefaultModifiersForProduct = (productId: string): string[] => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    return getModifiersForCategory(product.categoryId);
  };

  const openModifiersForItem = (productId: string) => {
    setModifiersFor(productId);
    setShowModifiersModal(true);
  };

  const saveModifiersForItem = (productId: string, modifiers: string[]) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.productId === productId) {
        return { ...item, modifiers };
      }
      return item;
    }));
  };

  const handleCombinationConfirm = (baseProduct: any, selectedProducts: Array<{product: any, quantity: number}>) => {
    // Crear un nombre descriptivo para la combinación
    const combinationNames = selectedProducts.map(sp => 
      `${sp.product.name}${sp.quantity > 1 ? ` (x${sp.quantity})` : ''}`
    ).join(' + ');

    // Calcular solo el precio adicional por combinaciones
    const additionalPrice = selectedProducts.reduce((total, sp) => {
      // Buscar primero combinación específica por producto
      const specificCombination = baseProduct.combinations.find((c: any) => c.productId === sp.product.id);
      if (specificCombination) {
        return total + (specificCombination.additionalPrice * sp.quantity);
      }

      // Si no hay combinación específica, buscar por categoría
      const categoryCombination = baseProduct.combinations.find((c: any) => c.categoryId === sp.product.categoryId);
      return total + ((categoryCombination?.additionalPrice || 0) * sp.quantity);
    }, 0);

    // Si hay varias tarifas, pedimos primero tarifa y luego cerramos el flujo
    if (baseProduct.tariffs && baseProduct.tariffs.length > 1) {
      setPendingCombination({
        baseProduct,
        selectedProducts,
        combinationNames,
        additionalPrice
      });
      setSelectedProductForTariff(baseProduct);
      setShowTariffSelector(true);
      return;
    }

    // Sin múltiples tarifas: usar precio base + adicional
    const productName = `${baseProduct.name} con ${combinationNames}`;
    const totalPrice = baseProduct.price + additionalPrice;

    const newItem: OrderItem = {
      productId: baseProduct.id,
      productName,
      quantity: 1,
      unitPrice: totalPrice,
      totalPrice,
      status: 'pending'
    };

    setCurrentOrder([...currentOrder, newItem]);
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

  const updateUnitPrice = (productId: string, newPrice: number) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.productId === productId) {
        return { 
          ...item, 
          unitPrice: newPrice, 
          totalPrice: item.quantity * newPrice
        };
      }
      return item;
    }));
  };

  const handlePriceConfirm = (newPrice: number) => {
    if (editingPriceFor) {
      updateUnitPrice(editingPriceFor, newPrice);
    }
    setShowNumericKeypad(false);
    setEditingPriceFor(null);
  };

  const handlePriceCancel = () => {
    setShowNumericKeypad(false);
    setEditingPriceFor(null);
  };

  const togglePriceEdit = (productId: string) => {
    setEditingPriceFor(productId);
    setShowNumericKeypad(true);
  };

  const resetToOriginalPrice = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentOrder(currentOrder.map(item => {
        if (item.productId === productId) {
          return { 
            ...item, 
            unitPrice: product.price, 
            totalPrice: item.quantity * product.price
          };
        }
        return item;
      }));
    }
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
    const subtotal = calculateTotalBase(currentOrder);
    const tax = calculateTotalVAT(currentOrder);
    const total = calculateTotalWithVAT(currentOrder);
    return {
      subtotal,
      tax,
      total
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

    const { total, subtotal, tax } = calculateTotal();
    
    // Guardar/actualizar pedido en DB si venimos desde "Editar desde Orders"
    const editOrderId = localStorage.getItem('orderToEdit');
    if (editOrderId) {
      const existing = await db.orders.get(Number(editOrderId));
      if (existing) {
        await db.orders.update(existing.id!, {
          items: currentOrder.map(i => ({
            productId: 0,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            status: 'delivered'
          })),
          subtotal,
          tax,
          total,
          updatedAt: new Date()
        });
        localStorage.removeItem('orderToEdit');
      }
    }

    // Actualizar la mesa con el pedido
    addOrderToTable(selectedTable.id, total, currentOrder);
    
    toast.success(`Pedido procesado exitosamente para Mesa ${selectedTable.number}`);
    
    // Limpiar solo el carrito local, mantener la mesa seleccionada
    setCurrentOrder([]);
    setCustomerName('');
  };

  const clearTableCompleteOrder = () => {
    if (!selectedTable) {
      toast.error('Debes seleccionar una mesa primero');
      return;
    }

    if (selectedTable.status !== 'occupied') {
      toast.error('La mesa no tiene pedidos activos');
      return;
    }

    // Mostrar confirmación
    if (window.confirm(`¿Estás seguro de que quieres vaciar completamente el ticket de la Mesa ${selectedTable.number}? Esta acción no se puede deshacer.`)) {
      // Limpiar el pedido de la mesa (esto libera la mesa automáticamente)
      clearTableOrder(selectedTable.id);
      
      // Limpiar también el carrito local si es de esta mesa
      setCurrentOrder([]);
      setCustomerName('');
      
      // Actualizar la mesa seleccionada para reflejar el nuevo estado
      setSelectedTable({
        ...selectedTable,
        status: 'available',
        occupiedSince: undefined,
        currentOrder: undefined
      });
      
      toast.success(`Mesa ${selectedTable.number} vaciada y liberada exitosamente`);
    }
  };

  const handleUnmergeTables = () => {
    if (!selectedTable || !selectedTable.mergedWith) {
      toast.error('La mesa seleccionada no está unida a otra mesa');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de que quieres desunir la Mesa ${selectedTable.number}?`)) {
      unmergeTables(selectedTable.id);
      
      // Actualizar la mesa seleccionada para reflejar el nuevo estado
      setSelectedTable({
        ...selectedTable,
        mergedWith: undefined,
        isMaster: undefined,
        mergeGroup: undefined
      });
      
      toast.success(`Mesa ${selectedTable.number} desunida exitosamente`);
    }
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
              className={`px-6 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-200 shadow-sm min-h-[56px] flex items-center justify-center text-base ${
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
                className={`px-6 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-200 shadow-sm min-h-[56px] flex items-center justify-center text-base ${
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
                onClick={() => handleProductClick(product)}
                className="product-card cursor-pointer p-6 rounded-2xl shadow-md border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm min-h-[120px] flex flex-col justify-center"
                style={{
                  background: product.backgroundColor 
                    ? `linear-gradient(135deg, ${product.backgroundColor}15, ${product.backgroundColor}25, ${product.backgroundColor}15)`
                    : 'linear-gradient(135deg, #ffffff, #f8fafc, #ffffff)',
                  borderColor: product.backgroundColor ? `${product.backgroundColor}40` : '#e5e7eb',
                }}
                onMouseEnter={(e) => {
                  if (product.backgroundColor) {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${product.backgroundColor}25, ${product.backgroundColor}35, ${product.backgroundColor}25)`;
                    e.currentTarget.style.borderColor = `${product.backgroundColor}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (product.backgroundColor) {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${product.backgroundColor}15, ${product.backgroundColor}25, ${product.backgroundColor}15)`;
                    e.currentTarget.style.borderColor = `${product.backgroundColor}40`;
                  }
                }}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-base mb-3 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p 
                    className="text-xl font-bold"
                    style={{
                      color: product.backgroundColor || '#3b82f6'
                    }}
                  >
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
                className="p-3 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md min-w-[48px] min-h-[48px] flex items-center justify-center"
                title="Limpiar pedido"
              >
                <Trash2 className="w-6 h-6" />
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
                  className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm hover:shadow-md min-w-[48px] min-h-[48px] flex items-center justify-center text-lg font-bold"
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
                      <div className="flex items-center space-x-1 mt-1">
                        <button
                          onClick={() => togglePriceEdit(item.productId)}
                          className={`text-sm hover:underline cursor-pointer flex items-center ${
                            item.unitPrice !== products.find(p => p.id === item.productId)?.price
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-600'
                          }`}
                          title="Haz clic para editar el precio (IVA incluido)"
                        >
                          {getCurrencySymbol()}{formatPrice(item.unitPrice)} c/u (IVA incl.)
                          <DollarSign className="w-3 h-3 ml-1 opacity-50" />
                        </button>
                        <button
                          onClick={() => openModifiersForItem(item.productId)}
                          className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                          title="Añadir modificadores"
                        >
                          Modificadores
                        </button>
                        {item.unitPrice !== products.find(p => p.id === item.productId)?.price && (
                          <button
                            onClick={() => resetToOriginalPrice(item.productId)}
                            className="text-xs text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                            title="Restaurar precio original"
                          >
                            ↺
                          </button>
                        )}
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.modifiers.map((m, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromOrder(item.productId)}
                      className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-3 rounded-lg bg-gray-200 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="w-12 text-center font-semibold text-gray-800 text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-3 rounded-lg bg-gray-200 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Plus className="w-5 h-5" />
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
                 <span>Subtotal (sin IVA):</span>
                 <span>{getCurrencySymbol()}{formatPrice(subtotal)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span>IVA (21%):</span>
                 <span>{getCurrencySymbol()}{formatPrice(tax)}</span>
               </div>
               <div className="flex justify-between text-xl font-bold border-t pt-3 border-gray-300">
                 <span className="text-gray-800">Total (IVA incl.):</span>
                 <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{getCurrencySymbol()}{formatPrice(total)}</span>
               </div>
            </div>

            <div className="space-y-2">
              {editOrderId ? (
                <div className="space-y-2">
                  <button
                    onClick={saveEditedOrder}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Receipt className="w-5 h-5" />
                    <span>Guardar Cambios</span>
                  </button>
                  <button
                    onClick={clearEditingState}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar Edición</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={processOrder}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Receipt className="w-5 h-5" />
                  <span>Procesar Pedido</span>
                </button>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-2 rounded-xl font-medium flex items-center justify-center space-x-1 transition-all duration-200 hover:shadow-md text-sm">
                  <Calculator className="w-4 h-4" />
                  <span>Dividir</span>
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-2 rounded-xl font-medium flex items-center justify-center space-x-1 transition-all duration-200 hover:shadow-md text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta</span>
                </button>
                <button 
                  onClick={() => setIsMergeModalOpen(true)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-2 rounded-xl font-medium flex items-center justify-center space-x-1 transition-all duration-200 hover:shadow-md text-sm"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Unir</span>
                </button>
              </div>
               
              {/* Botón para cobrar mesa si está ocupada */}
              {selectedTable && selectedTable.status === 'occupied' && (
                <>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Cobrar Mesa</span>
                  </button>
                  
                  {/* Botón para vaciar completamente el ticket de la mesa */}
                  <button
                    onClick={clearTableCompleteOrder}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Vaciar Ticket Mesa</span>
                  </button>

                  {/* Botón para desunir mesas si está unida */}
                  {selectedTable.mergedWith && (
                    <button
                      onClick={handleUnmergeTables}
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Link2 className="w-5 h-5 transform rotate-45" />
                      <span>Desunir de Mesa {selectedTable.mergedWith}</span>
                    </button>
                  )}
                </>
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
         onPaymentComplete={async () => {
           // Si estamos cobrando una diferencia de ticket editado, ahora SÍ guardamos
           if (tempDiffForPayment && editOrderId) {
             try {
               await db.orders.update(editOrderId, {
                 items: currentOrder.map(i => ({
                   productId: i.productId,
                   productName: i.productName,
                   quantity: i.quantity,
                   unitPrice: i.unitPrice,
                   totalPrice: i.totalPrice,
                   modifiers: i.modifiers || []
                 })),
                 subtotal: tempDiffForPayment.newSubtotal || 0,
                 tax: tempDiffForPayment.newTax || 0,
                 total: tempDiffForPayment.newTotal || 0,
                 updatedAt: new Date()
               });
               
               setOriginalTotalForEdit(tempDiffForPayment.newTotal || 0);
               toast.success(tempDiffForPayment.isIncrease ? 'Diferencia cobrada y ticket actualizado' : 'Devolución procesada y ticket actualizado');
               
               // Limpiar el dashboard tras el cobro exitoso
               clearEditingState();
               
             } catch (e) {
               console.error('Error guardando ticket tras cobro:', e);
               toast.error('Error al guardar el ticket actualizado');
             }
           }
           
           setIsPaymentModalOpen(false);
           setTempDiffForPayment(null);
         }}
         orderItems={tempDiffForPayment ? [{
           productId: 'diff',
           productName: tempDiffForPayment.isIncrease ? 'Diferencia a cobrar (+)' : 'Devolución al cliente (-)',
           quantity: 1,
           unitPrice: tempDiffForPayment.isIncrease ? tempDiffForPayment.amount : -tempDiffForPayment.amount,
           totalPrice: tempDiffForPayment.isIncrease ? tempDiffForPayment.amount : -tempDiffForPayment.amount,
           status: 'pending'
         }] : currentOrder}
         tableNumber={selectedTable?.number || ''}
         customerName={customerName}
         subtotal={tempDiffForPayment ? (tempDiffForPayment.isIncrease ? tempDiffForPayment.amount : -tempDiffForPayment.amount) : subtotal}
         tax={tempDiffForPayment ? 0 : tax}
         total={tempDiffForPayment ? (tempDiffForPayment.isIncrease ? tempDiffForPayment.amount : -tempDiffForPayment.amount) : total}
         mergedTableNumber={selectedTable?.mergedWith}
         titleOverride={localStorage.getItem('orderToEdit') ? (tempDiffForPayment ? 'Cobro de diferencia' : 'Actualizar Ticket') : undefined}
         skipDbSave={!!localStorage.getItem('orderToEdit')}
         defaultPaymentMethod={'cash'}
         originalOrderItems={tempDiffForPayment ? currentOrder : undefined}
         originalSubtotal={tempDiffForPayment ? tempDiffForPayment.newSubtotal : undefined}
         originalTax={tempDiffForPayment ? tempDiffForPayment.newTax : undefined}
         originalTotal={tempDiffForPayment ? tempDiffForPayment.newTotal : undefined}
       />

       {/* Modal de unión de mesas */}
       <MergeTablesModal
         isOpen={isMergeModalOpen}
         onClose={() => setIsMergeModalOpen(false)}
       />

               {/* Teclado numérico */}
        {showNumericKeypad && editingPriceFor && (
          <NumericKeypad
            value={currentOrder.find(item => item.productId === editingPriceFor)?.unitPrice || 0}
            onConfirm={handlePriceConfirm}
            onCancel={handlePriceCancel}
            currencySymbol={getCurrencySymbol()}
          />
        )}

        {/* Modal de selección de tarifas */}
        {showTariffSelector && selectedProductForTariff && (
          <TariffSelectorModal
            isOpen={showTariffSelector}
            onClose={() => {
              setShowTariffSelector(false);
              setSelectedProductForTariff(null);
              setPendingCombination(null);
            }}
            productName={selectedProductForTariff.name}
            tariffs={selectedProductForTariff.tariffs || []}
            onSelectTariff={handleTariffSelect}
            currencySymbol={getCurrencySymbol()}
          />
        )}

        {/* Modal de selección de combinaciones */}
        {showCombinationSelector && selectedProductForCombination && (
          <CombinationSelectorModal
            isOpen={showCombinationSelector}
            onClose={() => {
              setShowCombinationSelector(false);
              setSelectedProductForCombination(null);
            }}
            baseProduct={selectedProductForCombination}
            combinations={selectedProductForCombination.combinations || []}
            availableProducts={activeProducts}
            onConfirmCombination={handleCombinationConfirm}
            currencySymbol={getCurrencySymbol()}
          />
        )}
        {/* Modal de modificadores */}
        {showModifiersModal && modifiersFor && (
          <ModifiersModal
            isOpen={showModifiersModal}
            onClose={() => { setShowModifiersModal(false); setModifiersFor(null); }}
            title="Seleccionar modificadores"
            options={getDefaultModifiersForProduct(modifiersFor)}
            selected={currentOrder.find(i => i.productId === modifiersFor)?.modifiers || []}
            onSave={(selected) => saveModifiersForItem(modifiersFor, selected)}
          />
        )}
     </div>
   );
 };

export default Dashboard;
