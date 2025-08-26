import React, { useState, useEffect } from 'react';
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
  X,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableSelectorModal from '../components/Table/TableSelectorModal';
import PaymentModal from '../components/Payment/PaymentModal';

import NumericKeypad from '../components/NumericKeypad';
import TariffSelectorModal from '../components/TariffSelectorModal';
import CombinationSelectorModal from '../components/CombinationSelectorModal';
import ModifiersModal from '../components/ModifiersModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { TableData } from '../components/Table/TableComponent';
import { useTables } from '../contexts/TableContext';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';
import { useCustomers, Customer } from '../contexts/CustomerContext';
import { useBalanceIncentives } from '../contexts/BalanceIncentiveContext';
import CustomerSelector from '../components/CustomerSelector';
import CustomerModal from '../components/CustomerModal';
import TransferAccountModal from '../components/TransferAccountModal';
import CustomerSelectorModal from '../components/CustomerSelectorModal';
import PriceInputModal from '../components/PriceInputModal';
import PendingChangesModal from '../components/PendingChangesModal';

import { calculateTotalBase, calculateTotalVAT, calculateTotalWithVAT, formatPrice } from '../utils/taxUtils';
import { ProductTariff } from '../types/product';
import { db } from '../database/db';
import { generatePOSTicketPDF } from '../utils/pdfGenerator';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  modifiers?: string[];
  taxRate?: number;
  taxName?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false); // No abrir automáticamente al inicio
  const [isTicketWithoutTable, setIsTicketWithoutTable] = useState(false); // Para tickets sin mesa
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
  // Modal de confirmación
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } | null>(null);
  const [showPriceInputModal, setShowPriceInputModal] = useState(false);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<any>(null);
  const [showPendingChangesModal, setShowPendingChangesModal] = useState(false);
  // Modal para recargar saldo
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  // Modal de traslado de cuenta
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Estados para recarga desde consulta de saldo
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [customerForRecharge, setCustomerForRecharge] = useState<Customer | null>(null);
  // Modal de selección de clientes
  const [showCustomerSelectorModal, setShowCustomerSelectorModal] = useState(false);
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
  
  const { addOrderToTable, getTableOrderItems, clearTableOrder, tables, removeNamedAccount, addNamedAccount, updateTableStatus, salons, addPartialPayment, getPartialPayments, getTotalPartialPayments, clearPartialPayments, updateTableTotalAfterPartialPayment } = useTables();
  const { getCurrencySymbol, getTaxRate, getModifiersForCategory, config } = useConfig();
  const { products, categories } = useProducts();
  const { customers, updateCustomer, getCustomerByCardCode } = useCustomers();
  const { incentives } = useBalanceIncentives();

  // Manejar estado de recarga desde consulta de saldo
  React.useEffect(() => {
    const location = window.location;
    const state = (location as any).state;
    
    if (state?.selectedCustomerForRecharge && state?.showRechargeModal) {
      setCustomerForRecharge(state.selectedCustomerForRecharge);
      setShowRechargeModal(true);
      setSelectedCustomer(state.selectedCustomerForRecharge);
      
      // Limpiar el estado de la URL
      window.history.replaceState({}, document.title);
    }
  }, []);

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
    const tariff = selectedTariff || product.tariffs?.find((t: ProductTariff) => t.isDefault) || { price: product.price };
    const currentPrice = tariff.price;
    
    // Buscar producto existente por ID Y precio (para manejar cambios de precio)
    const existingItem = currentOrder.find(item => 
      item.productId === product.id && 
      item.unitPrice === currentPrice &&
      item.productName === `${product.name}${selectedTariff ? ` - ${selectedTariff.name}` : ''}`
    );
    
    if (existingItem) {
      // Si existe con el mismo precio, incrementar cantidad
      setCurrentOrder(currentOrder.map(item =>
        (item.productId === product.id && 
         item.unitPrice === currentPrice &&
         item.productName === `${product.name}${selectedTariff ? ` - ${selectedTariff.name}` : ''}`)
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      // Si no existe o existe con precio diferente, crear nueva línea
      const tariff = selectedTariff || product.tariffs?.find((t: ProductTariff) => t.isDefault) || { price: product.price };
      
      // Obtener información del impuesto del producto
      let taxRate = 0;
      let taxName = 'IVA General';
      
      if (product.taxId) {
        const tax = config.taxes.find(t => t.id === product.taxId);
        if (tax) {
          taxRate = tax.rate;
          taxName = tax.name;
        }
      } else {
        // Usar impuesto por defecto si no hay uno específico
        const defaultTax = config.taxes.find(t => t.isDefault);
        if (defaultTax) {
          taxRate = defaultTax.rate;
          taxName = defaultTax.name;
        }
      }
      
      const newItem: OrderItem = {
        productId: product.id,
        productName: `${product.name}${selectedTariff ? ` - ${selectedTariff.name}` : ''}`,
        quantity: 1,
        unitPrice: tariff.price,
        totalPrice: tariff.price,
        status: 'pending',
        modifiers: [],
        taxRate: taxRate,
        taxName: taxName
      };
      setCurrentOrder([...currentOrder, newItem]);
    }
  };

  // Cargar ticket para edición si viene desde "Pedidos"
  React.useEffect(() => {
    const loadForEdit = async () => {
      const editOrderId = localStorage.getItem('orderToEdit');
      if (!editOrderId) {
        // Si no hay ticket para editar, abrir modal de mesas
        setIsTableModalOpen(true);
        return;
      }
      try {
        const order = await db.orders.get(Number(editOrderId));
        if (order) {
          const items = order.items.map((it: any, idx: number) => {
            // Buscar el producto para obtener información de impuestos
            const product = products.find(p => p.id === it.productId);
            let taxRate = 0;
            let taxName = 'IVA General';
            
            if (product && product.taxId) {
              const tax = config.taxes.find(t => t.id === product.taxId);
              if (tax) {
                taxRate = tax.rate;
                taxName = tax.name;
              }
            } else {
              // Usar impuesto por defecto si no hay uno específico
              const defaultTax = config.taxes.find(t => t.isDefault);
              if (defaultTax) {
                taxRate = defaultTax.rate;
                taxName = defaultTax.name;
              }
            }
            
            return {
              productId: String(it.productId ?? `edit-${idx}`),
              productName: it.productName || `Producto ${idx+1}`,
              quantity: it.quantity || 1,
              unitPrice: it.unitPrice || 0,
              totalPrice: it.totalPrice || 0,
              status: 'pending' as const,
              modifiers: [] as string[],
              taxRate: taxRate,
              taxName: taxName
            };
          });
          setCurrentOrder(items);
          setEditOrderId(order.id || null);
          setOriginalTotalForEdit(order.total || 0);
          toast.success(`Editando ticket #${order.id}`);
          // No abrir modal de mesas cuando se está editando
          setIsTableModalOpen(false);
        }
      } catch (e) {
        console.error('Error cargando ticket para edición:', e);
        // Si hay error, abrir modal de mesas
        setIsTableModalOpen(true);
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
    
    // Limpiar mesa seleccionada y ticket sin mesa
    setSelectedTable(null);
    setIsTicketWithoutTable(false);
    
    // Limpiar localStorage
    localStorage.removeItem('orderToEdit');
    
    // Abrir modal de mesas para seleccionar nueva mesa
    setIsTableModalOpen(true);
    
    toast.success('Dashboard limpiado, selecciona una nueva mesa');
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
    // Verificar que haya una mesa seleccionada o esté en modo ticket sin mesa
    if (!selectedTable && !isTicketWithoutTable) {
      toast.error('Debes seleccionar una mesa antes de agregar productos');
      setIsTableModalOpen(true);
      return;
    }
    
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
      // Si solo tiene una tarifa o no tiene tarifas, verificar askForPrice
      if (product.askForPrice) {
        setSelectedProductForPrice(product);
        setShowPriceInputModal(true);
      } else {
        // Si no tiene askForPrice, agregar directamente
        addToOrder(product);
      }
    }
  };

  const handlePriceInputConfirm = (price: number) => {
    if (selectedProductForPrice) {
      // Verificar si es un producto con combinación
      if (selectedProductForPrice._combinationData) {
        const { baseProduct, selectedProducts, combinationNames, additionalPrice, selectedTariff } = selectedProductForPrice._combinationData;
        
        // Crear el nombre del producto con combinación
        let productName = `${baseProduct.name} con ${combinationNames}`;
        if (selectedTariff) {
          productName += ` - ${selectedTariff.name}`;
        }
        
        // Usar el precio específico introducido por el usuario
        const newItem: OrderItem = {
          productId: baseProduct.id,
          productName,
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
          status: 'pending'
        };
        
        setCurrentOrder([...currentOrder, newItem]);
      } else if (selectedProductForPrice._selectedTariff) {
        // Producto con tarifa seleccionada
        const productWithSpecificPrice = {
          ...selectedProductForPrice,
          price: price,
          tariffs: [{ id: 'specific-price', name: 'Precio específico', price: price, isDefault: true }]
        };
        addToOrder(productWithSpecificPrice);
      } else {
        // Producto simple sin combinación
        const productWithSpecificPrice = {
          ...selectedProductForPrice,
          price: price,
          tariffs: [{ id: 'specific-price', name: 'Precio específico', price: price, isDefault: true }]
        };
        addToOrder(productWithSpecificPrice);
      }
      
      setSelectedProductForPrice(null);
    }
  };

  const handleTariffSelect = (tariff: ProductTariff) => {
    // Verificar que haya una mesa seleccionada o esté en modo ticket sin mesa
    if (!selectedTable && !isTicketWithoutTable) {
      toast.error('Debes seleccionar una mesa antes de agregar productos');
      setIsTableModalOpen(true);
      return;
    }
    
    // Si hay una combinación pendiente para este producto, combinar ambas selecciones
    if (pendingCombination && selectedProductForTariff && pendingCombination.baseProduct.id === selectedProductForTariff.id) {
      const { baseProduct, combinationNames, additionalPrice } = pendingCombination;
      
      // Si el producto tiene askForPrice activo, mostrar modal de precio específico
      if (baseProduct.askForPrice) {
        // Guardar la información de la combinación + tarifa para usarla después
        const combinationData = {
          baseProduct,
          selectedProducts: pendingCombination.selectedProducts,
          combinationNames,
          additionalPrice,
          selectedTariff: tariff
        };
        
        // Crear un producto temporal con la información de la combinación + tarifa
        const productWithCombinationAndTariff = {
          ...baseProduct,
          _combinationData: combinationData
        };
        
        setSelectedProductForPrice(productWithCombinationAndTariff);
        setShowPriceInputModal(true);
        setPendingCombination(null);
        return;
      }
      
      const productName = `${baseProduct.name} con ${combinationNames} - ${tariff.name}`;
      const totalPrice = tariff.price + additionalPrice;

      // Obtener información del impuesto del producto base
      let taxRate = 0;
      let taxName = 'IVA General';
      
      if (baseProduct.taxId) {
        const tax = config.taxes.find(t => t.id === baseProduct.taxId);
        if (tax) {
          taxRate = tax.rate;
          taxName = tax.name;
        }
      } else {
        // Usar impuesto por defecto si no hay uno específico
        const defaultTax = config.taxes.find(t => t.isDefault);
        if (defaultTax) {
          taxRate = defaultTax.rate;
          taxName = defaultTax.name;
        }
      }
      
      const newItem: OrderItem = {
        productId: baseProduct.id,
        productName,
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice,
        status: 'pending',
        modifiers: [],
        taxRate: taxRate,
        taxName: taxName
      };

      setCurrentOrder([...currentOrder, newItem]);
      setPendingCombination(null);
      return;
    }

    // Caso normal: solo tarifa
    if (selectedProductForTariff) {
      // Si el producto tiene askForPrice activo, mostrar modal de precio específico
      if (selectedProductForTariff.askForPrice) {
        // Crear un producto temporal con la tarifa seleccionada
        const productWithTariff = {
          ...selectedProductForTariff,
          _selectedTariff: tariff
        };
        
        setSelectedProductForPrice(productWithTariff);
        setShowPriceInputModal(true);
        return;
      }
      
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
    // Verificar que haya una mesa seleccionada o esté en modo ticket sin mesa
    if (!selectedTable && !isTicketWithoutTable) {
      toast.error('Debes seleccionar una mesa antes de agregar productos');
      setIsTableModalOpen(true);
      return;
    }
    
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

    // Si el producto tiene askForPrice activo, mostrar modal de precio específico
    if (baseProduct.askForPrice) {
      // Guardar la información de la combinación para usarla después
      const combinationData = {
        baseProduct,
        selectedProducts,
        combinationNames,
        additionalPrice
      };
      
      // Crear un producto temporal con la información de la combinación
      const productWithCombination = {
        ...baseProduct,
        _combinationData: combinationData
      };
      
      setSelectedProductForPrice(productWithCombination);
      setShowPriceInputModal(true);
      return;
    }

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
    setSelectedCustomer(null);
    // No limpiamos la mesa seleccionada para mantener el contexto
    // Pero sí limpiamos el cliente asignado de la mesa
    if (selectedTable) {
      setSelectedTable({
        ...selectedTable,
        assignedCustomer: undefined,
        temporaryName: undefined // También limpiar nombre temporal al limpiar el pedido
      });
    }
  };

  // Función para abrir modal de traslado de cuenta
  const handleTransferAccount = () => {
    if (selectedCustomer) {
      setShowTransferModal(true);
    }
  };

  // Función para completar el traslado de cuenta
  const handleNavigateToConfiguration = () => {
    console.log('Navegando a configuración:', { 
      editOrderId, 
      currentOrderLength: currentOrder.length,
      selectedTable,
      isTicketWithoutTable 
    });
    
    // Caso especial: Ticket sin mesa con productos
    if (isTicketWithoutTable && currentOrder.length > 0) {
      console.log('Mostrando modal de cobro para ticket sin mesa');
      // Mostrar modal de confirmación para cobrar o cancelar
      setConfirmationData({
        title: 'Ticket sin mesa pendiente',
        message: 'Tienes un ticket sin mesa con productos. ¿Deseas cobrar el ticket actual antes de entrar en configuración?',
        type: 'warning',
        onConfirm: () => {
          // Abrir modal de cobro
          setIsPaymentModalOpen(true);
        }
      });
      setShowConfirmationModal(true);
      return;
    }
    
    // Verificar si hay cambios pendientes reales
    let hasPendingChanges = false;
    
    if (editOrderId && currentOrder.length > 0) {
      // Para tickets editados, siempre hay cambios si hay pedido
      hasPendingChanges = true;
    } else if (selectedTable && currentOrder.length > 0) {
      // Para mesas, verificar si el pedido actual es diferente al original
      const originalOrder = getTableOrderItems(selectedTable.id);
      hasPendingChanges = JSON.stringify(currentOrder) !== JSON.stringify(originalOrder);
    }
    
    console.log('¿Hay cambios pendientes?', hasPendingChanges);
    
    if (hasPendingChanges) {
      console.log('Mostrando modal de cambios pendientes');
      // Mostrar modal de cambios pendientes
      setShowPendingChangesModal(true);
      return;
    }
    
    console.log('Navegando directamente a configuración');
    // Si no hay cambios pendientes, navegar directamente
    navigate('/configuration');
  };

  const handleSaveAndNavigate = async () => {
    try {
      if (editOrderId) {
        // Para tickets editados
        await saveEditedOrder();
      } else if (selectedTable) {
        // Para mesas normales, actualizar el pedido de la mesa
        const { subtotal, tax, total } = calculateTotal();
        
        // Actualizar el pedido en la mesa
        addOrderToTable(selectedTable.id, total, currentOrder, selectedCustomer, true);
        
        toast.success('Cambios guardados en la mesa');
      }
      // Nota: Los tickets sin mesa se manejan con el modal de cobro
      
      navigate('/configuration');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  const handleDiscardAndNavigate = () => {
    // Limpiar el estado de edición y navegar
    clearEditingState();
    navigate('/configuration');
  };

  const handleTransferAccountComplete = (sourceTable: TableData, customer: Customer) => {
    console.log('Iniciando traslado de cuenta:', { sourceTable, customer });
    try {
            // Obtener todas las mesas de todos los salones para la verificación
      const allTables = salons.flatMap(s => s.tables);
      
      // Verificar si el cliente ya tiene una cuenta por nombre abierta
      console.log('Verificando cuentas existentes para el cliente:', customer.id);
      console.log('Todas las mesas:', allTables);
      
      const existingNamedAccount = allTables.find(table => 
        table.id !== sourceTable.id && 
        table.assignedCustomer?.id === customer.id
      );
    
      let customerAccountId: string;
      
      if (existingNamedAccount) {
        console.log('Cliente ya tiene cuenta abierta, usando la existente:', existingNamedAccount);
        // Usar la cuenta existente del cliente
        customerAccountId = existingNamedAccount.id;
      } else {
        // El cliente no tiene cuenta abierta, crear una nueva
        console.log('Cliente no tiene cuenta abierta, creando nueva');
        const customerAccountName = `${customer.name} ${customer.lastName}`;
        
        // Buscar si ya existe una cuenta por nombre para este cliente
        console.log('Buscando cuenta existente para:', customerAccountName);
        const existingAccount = allTables.find(table => 
          table.name === customerAccountName && 
          table.id !== sourceTable.id
        );
      
        if (existingAccount) {
          // Usar la cuenta existente
          console.log('Usando cuenta existente:', existingAccount);
          customerAccountId = existingAccount.id;
        } else {
          // Crear una nueva cuenta por nombre
          console.log('Creando nueva cuenta por nombre');
          try {
            customerAccountId = addNamedAccount(customerAccountName);
            console.log('Nueva cuenta creada con ID:', customerAccountId);
          } catch (error) {
            console.error('Error creando cuenta por nombre:', error);
            toast.error('Error al crear la cuenta por nombre');
            return;
          }
        }
      }

      // Obtener los pedidos de la mesa origen
      const tableOrderItems = getTableOrderItems(sourceTable.id);
      console.log('Productos encontrados en la mesa:', tableOrderItems);
      
      // Si la mesa está vacía, solo crear/abrir la cuenta del cliente
      if (tableOrderItems.length === 0) {
        console.log('Mesa vacía - solo creando/abriendo cuenta del cliente');
        
        // Limpiar la mesa origen (liberarla)
        console.log('Limpiando mesa origen:', sourceTable.id);
        clearTableOrder(sourceTable.id);
        updateTableStatus(sourceTable.id, 'available');
        
        toast.success(`Cuenta del cliente ${customer.name} ${customer.lastName} creada/abierta. Mesa ${sourceTable.number} liberada.`);
        
        // Limpiar el Dashboard después del traslado
        setSelectedCustomer(null);
        setSelectedTable(null);
        setCurrentOrder([]);
        
        // Cerrar el modal
        setShowTransferModal(false);
        return;
      }



      // Mover todos los productos de la mesa a la cuenta del cliente
      const customerAccountName = `${customer.name} ${customer.lastName}`;
      const total = tableOrderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      console.log('Total a trasladar:', total);
      console.log('Trasladando a cuenta:', customerAccountId);
      
      try {
        addOrderToTable(customerAccountId, total, tableOrderItems, customer);
        console.log('Productos trasladados exitosamente');

        // Limpiar la mesa origen
        console.log('Limpiando mesa origen:', sourceTable.id);
        clearTableOrder(sourceTable.id);
        
        // Actualizar el estado de la mesa origen a disponible
        updateTableStatus(sourceTable.id, 'available');
        console.log('Mesa origen liberada');

        toast.success(`Cuenta trasladada exitosamente de Mesa ${sourceTable.number} a ${customerAccountName}`);
        
        // Limpiar el Dashboard después del traslado
        setSelectedCustomer(null);
        setSelectedTable(null);
        setCurrentOrder([]);
        
        // Cerrar el modal
        setShowTransferModal(false);
      } catch (error) {
        console.error('Error durante el traslado:', error);
        toast.error('Error durante el traslado de la cuenta');
        return;
      }
      
    } catch (error) {
      console.error('Error trasladando cuenta:', error);
      toast.error('Error al trasladar la cuenta');
    }
  };

  // Función para manejar la actualización del cliente
  const handleCustomerUpdate = async (updatedCustomer: any) => {
    try {
      await updateCustomer(updatedCustomer.id!, updatedCustomer);
      // Actualizar el cliente seleccionado con los nuevos datos
      setSelectedCustomer(updatedCustomer);
      toast.success(`Saldo de ${updatedCustomer.name} ${updatedCustomer.lastName} actualizado a ${getCurrencySymbol()}${updatedCustomer.balance.toFixed(2)}`);
    } catch (error) {
      toast.error('Error al actualizar el saldo del cliente');
    }
  };



  const handleTableSelect = (table: TableData) => {
    // Si hay un cliente seleccionado, asignarlo a la mesa y eliminar nombre temporal
    const tableWithCustomer = selectedCustomer ? {
      ...table,
      assignedCustomer: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        lastName: selectedCustomer.lastName,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone
      },
      temporaryName: undefined // Eliminar nombre temporal cuando se asigna un cliente
    } : table;

    setSelectedTable(tableWithCustomer);
    setIsTicketWithoutTable(false); // Salir del modo ticket sin mesa
    
    // Si la mesa ya tiene un cliente asignado, seleccionarlo en el selector
    if (table.assignedCustomer && !selectedCustomer) {
      // Buscar el cliente en la lista de clientes
      const customer = customers.find(c => c.id === table.assignedCustomer!.id);
      if (customer) {
        setSelectedCustomer(customer);
        toast.success(`Cliente ${customer.name} ${customer.lastName} cargado de la mesa ${table.number}`);
      }
    }
    
    // Si hay un cliente seleccionado, mostrar mensaje
    if (selectedCustomer) {
      toast.success(`Cliente ${selectedCustomer.name} ${selectedCustomer.lastName} asignado a la mesa ${table.number}`);
    }
    
    // Si la mesa está ocupada, cargar los pedidos existentes
    if (table.status === 'occupied') {
      const existingOrderItems = getTableOrderItems(table.id);

      if (existingOrderItems.length > 0) {
        setCurrentOrder(existingOrderItems);
        
        // Calcular el total pendiente considerando cobros parciales
        const totalPartialPayments = getTotalPartialPayments(table.id);
        // Usar el total de la mesa para consistencia con TableComponent
        const originalTotal = table.currentOrder?.total || 0;
        const pendingTotal = Math.max(0, originalTotal - totalPartialPayments);
        
        const isNamedAccount = table.id.startsWith('account-');
        const message = isNamedAccount 
          ? `Cargados ${existingOrderItems.length} productos de la cuenta de ${table.name}`
          : `Cargados ${existingOrderItems.length} productos de la mesa ${table.number}`;
        
        // Mostrar mensaje adicional si hay cobros parciales
        if (totalPartialPayments > 0) {
          toast.success(`${message}. Total pendiente: ${getCurrencySymbol()}${pendingTotal.toFixed(2)} (ya cobrado: ${getCurrencySymbol()}${totalPartialPayments.toFixed(2)})`);
        } else {
          toast.success(message);
        }
      } else {
        // Mesa ocupada pero sin productos, limpiar carrito
        setCurrentOrder([]);
      }
    } else {
      // Si la mesa está disponible, limpiar el pedido actual
      setCurrentOrder([]);
    }
    
    // Cerrar el modal después de seleccionar una mesa
    setIsTableModalOpen(false);
  };

  const handleTicketWithoutTable = () => {
    setSelectedTable(null);
    setIsTicketWithoutTable(true);
    setCurrentOrder([]);
    setSelectedCustomer(null);
    setIsTableModalOpen(false);
    toast.success('Modo ticket sin mesa activado. Puedes agregar productos y cobrarlos directamente.');
  };

  const calculateTotal = () => {
    const subtotal = calculateTotalBase(currentOrder);
    const tax = calculateTotalVAT(currentOrder);
    const total = calculateTotalWithVAT(currentOrder);
    
    // Retornar el total calculado del carrito actual
    // Los cobros parciales se manejan por separado en el PaymentModal
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

    // Actualizar la mesa con el pedido y el cliente asignado
    // Usar replaceExisting: true para reemplazar completamente los productos existentes
    addOrderToTable(selectedTable.id, total, currentOrder, selectedCustomer, true);
    
    // Mostrar mensaje de éxito
    if (selectedTable.id.startsWith('account-')) {
      toast.success(`Pedido procesado exitosamente para ${selectedTable.name}`);
    } else {
      toast.success(`Pedido procesado exitosamente para Mesa ${selectedTable.number}`);
    }
    
    // Limpiar todo y volver a la pantalla de mesas
    setCurrentOrder([]);
    setSelectedCustomer(null);
    setSelectedTable(null);
    setIsTableModalOpen(true);
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmationData({ title, message, onConfirm, type });
    setShowConfirmationModal(true);
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

    // Mostrar confirmación con modal personalizado
    const isNamedAccount = selectedTable.id.startsWith('account-');
    const title = isNamedAccount ? 'Eliminar Cuenta' : 'Vaciar Ticket Mesa';
    const message = isNamedAccount 
      ? `¿Estás seguro de que quieres eliminar la cuenta de "${selectedTable.name}"?`
      : `¿Estás seguro de que quieres vaciar completamente el ticket de la Mesa ${selectedTable.number}?`;

    const handleConfirm = () => {
      if (isNamedAccount) {
        // Para cuentas por nombre, eliminarlas completamente del salón
        removeNamedAccount(selectedTable.id);
        toast.success(`Cuenta de ${selectedTable.name} eliminada exitosamente`);
        
        // Limpiar el carrito local
        setCurrentOrder([]);
        setSelectedCustomer(null);
        
        // Deseleccionar la mesa y abrir modal de selección
        setSelectedTable(null);
        // Pequeño retraso para asegurar que el estado se actualice
        setTimeout(() => {
          setIsTableModalOpen(true);
        }, 100);
      } else {
        // Para mesas normales, limpiar el pedido
        clearTableOrder(selectedTable.id);
        
        // Actualizar la mesa seleccionada para reflejar el nuevo estado
        setSelectedTable({
          ...selectedTable,
          status: 'available',
          occupiedSince: undefined,
          currentOrder: undefined
        });
        
        toast.success(`Mesa ${selectedTable.number} vaciada y liberada exitosamente`);
        
        // Limpiar también el carrito local
        setCurrentOrder([]);
        setSelectedCustomer(null);
      }
    };

    showConfirmation(title, message, handleConfirm, 'danger');
  };







  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="h-full flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Panel izquierdo - Categorías y Productos */}
      <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-white/90 backdrop-blur-sm lg:border-r border-gray-200/50 shadow-xl">
        {/* Header con búsqueda */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50 p-4 shadow-sm">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              />
            </div>
            {selectedCustomer && (
              <div className="flex items-center space-x-2 bg-white border border-blue-200 px-3 py-2 rounded-lg shadow-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 truncate">{selectedCustomer.name} {selectedCustomer.lastName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-sm">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${
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
                className={`px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${
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
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedTable && !isTicketWithoutTable && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
              <div className="flex items-center justify-center space-x-2 text-yellow-700">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Selecciona una mesa</span>
              </div>
            </div>
          )}
          

          {isTicketWithoutTable && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Receipt className="w-4 h-4" />
                <span className="text-sm font-medium">Modo ticket sin mesa</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="product-card cursor-pointer p-3 rounded-xl shadow-md border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm min-h-[100px] flex flex-col justify-center"
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
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p 
                    className="text-2xl font-bold"
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

      {/* Panel derecho - Líneas de pedido y botones */}
      <div className="w-full lg:w-1/2 flex flex-col lg:flex-row bg-white/90 backdrop-blur-sm lg:border-l border-gray-200/50 shadow-xl">
        {/* Panel de líneas de pedido */}
        <div className="w-full lg:w-[60%] flex flex-col lg:border-r border-gray-200/50">
          {/* Header del carrito */}
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Líneas de Pedido</h2>
              <div className="flex items-center space-x-2 flex-wrap">
                {selectedTable && (
                  <div className="flex items-center space-x-2 bg-white px-2 lg:px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                    <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500" />
                    <span className="text-xs lg:text-sm font-medium text-gray-700 truncate">
                      Mesa {selectedTable.number}{selectedTable.name ? ` - ${selectedTable.name}` : ''}
                    </span>
                    <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full flex-shrink-0 ${
                      selectedTable.status === 'available' ? 'bg-green-500' :
                      selectedTable.status === 'occupied' ? 'bg-red-500' :
                      selectedTable.status === 'reserved' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                  </div>
                )}
                {isTicketWithoutTable && (
                  <div className="flex items-center space-x-2 bg-blue-100 px-2 lg:px-3 py-2 rounded-lg shadow-sm border border-blue-200">
                    <Receipt className="w-3 h-3 lg:w-4 lg:h-4 text-blue-600" />
                    <span className="text-xs lg:text-sm font-medium text-blue-700">Ticket sin mesa</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentOrder.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No hay productos en el pedido</p>
                <p className="text-sm text-gray-400 mt-1">Selecciona productos del panel izquierdo para agregar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentOrder.map((item) => (
                  <div key={item.productId} className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-3 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Primera fila - Información principal */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* Botón eliminar */}
                      <button
                        onClick={() => removeFromOrder(item.productId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      {/* Nombre del producto */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm lg:text-base leading-tight truncate">{item.productName}</h4>
                      </div>
                      
                      {/* Total del item */}
                      <div className="flex-shrink-0">
                        <span className="text-sm lg:text-base font-bold text-gray-900">
                          {getCurrencySymbol()}{formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Segunda fila - Controles y precio unitario */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Lado izquierdo - Precio unitario y modificadores */}
                      <div className="flex items-center gap-2 flex-1">
                        {/* Precio unitario */}
                        <button
                          onClick={() => togglePriceEdit(item.productId)}
                          className={`text-xs lg:text-sm font-semibold hover:underline cursor-pointer flex items-center ${
                            item.unitPrice !== products.find(p => p.id === item.productId)?.price
                              ? 'text-blue-600'
                              : 'text-gray-700'
                          }`}
                          title="Haz clic para editar el precio (IVA incluido)"
                        >
                          {getCurrencySymbol()}{formatPrice(item.unitPrice)} c/u
                          <DollarSign className="w-3 h-3 ml-1 opacity-50" />
                        </button>
                        
                        {/* Botón modificadores */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModifiersForItem(item.productId)}
                            className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 border border-gray-200"
                            title="Añadir modificadores"
                          >
                            Mods
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
                      </div>
                      
                      {/* Lado derecho - Controles de cantidad */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110 min-w-[24px] min-h-[24px] flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-semibold text-gray-800 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110 min-w-[24px] min-h-[24px] flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Modificadores en línea separada si existen */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.modifiers.map((m, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded border">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {(currentOrder.length > 0 || editOrderId) && (
            <div className="border-t border-gray-200/50 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              {currentOrder.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (sin IVA):</span>
                    <span>{getCurrencySymbol()}{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA (21%):</span>
                    <span>{getCurrencySymbol()}{formatPrice(tax)}</span>
                  </div>
                  
                  {/* Información de cobros parciales */}
                  {selectedTable && getTotalPartialPayments(selectedTable.id) > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 space-y-1">
                      <div className="flex justify-between text-xs text-yellow-800">
                        <span className="font-medium">Total actual:</span>
                        <span>{getCurrencySymbol()}{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-yellow-700">
                        <span>Ya cobrado:</span>
                        <span className="font-medium">{getCurrencySymbol()}{formatPrice(getTotalPartialPayments(selectedTable.id))}</span>
                      </div>
                      <div className="flex justify-between text-sm text-yellow-800 font-semibold border-t border-yellow-300 pt-1">
                        <span>Pendiente por cobrar:</span>
                        <span>{getCurrencySymbol()}{formatPrice(total - getTotalPartialPayments(selectedTable.id))}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-300">
                    <span className="text-gray-800">Total (IVA incl.):</span>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{getCurrencySymbol()}{formatPrice(total)}</span>
                  </div>
                </div>
              ) : editOrderId && (
                <div className="text-center text-gray-600 py-2">
                  <p className="text-sm font-medium">Ticket vacío</p>
                  <p className="text-xs text-gray-500 mt-1">Puedes guardar el ticket sin productos o cancelar la edición</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel de botones de acción */}
        <div className="w-full lg:w-[40%] flex flex-col bg-gradient-to-r from-green-50 to-emerald-50">
          {/* Header de acciones */}
          <div className="p-4 border-b border-gray-200/50">
            <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-3">Acciones</h2>
            
            {/* Botón para seleccionar cliente */}
            <button
              onClick={() => setShowCustomerSelectorModal(true)}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs lg:text-sm text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200 hover:shadow-md bg-white shadow-sm"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <User className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 flex-shrink-0" />
                <span className={`truncate ${selectedCustomer ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedCustomer 
                    ? `${selectedCustomer.name} ${selectedCustomer.lastName}` 
                    : 'Seleccionar cliente'
                  }
                </span>
              </div>
              {selectedCustomer && (
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xs text-green-600 font-medium">
                    {getCurrencySymbol()}{selectedCustomer.balance.toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(null);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Quitar cliente"
                  >
                    ✕
                  </button>
                </div>
              )}
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Botones del cliente */}
            {selectedCustomer && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleTransferAccount}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center space-x-1 transition-all duration-200 hover:shadow-lg hover:scale-105 text-xs"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Trasladar</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Botón para seleccionar mesa */}
            <div className="space-y-2">
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200 hover:shadow-md bg-white shadow-sm"
              >
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className={`truncate ${selectedTable ? 'text-gray-900' : 'text-gray-500'}`}>
                    {selectedTable 
                      ? `Mesa ${selectedTable.number}` 
                      : 'Seleccionar mesa'
                    }
                  </span>
                </div>
                {selectedTable && (
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
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
                    setSelectedCustomer(null);
                    setIsTableModalOpen(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm hover:shadow-md flex items-center justify-center text-xs"
                >
                  Cambiar Mesa
                </button>
              )}
            </div>

            {/* Botones principales */}
            {editOrderId ? (
              <div className="space-y-2">
                <div className="space-y-2">
                  <button
                    onClick={saveEditedOrder}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={clearEditingState}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={processOrder}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Procesar Pedido</span>
                </button>
                
                <div className="grid grid-cols-1 gap-2">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg font-medium flex items-center justify-center space-x-1 transition-all duration-200 hover:shadow-md text-xs">
                    <Calculator className="w-3 h-3" />
                    <span>Dividir</span>
                  </button>
                </div>
                
                {/* Botones principales - Cobrar y Vaciar */}
                {((selectedTable && selectedTable.status === 'occupied') || isTicketWithoutTable) && currentOrder.length > 0 ? (
                  <div className="space-y-2">
                    {/* Botón Cobrar - Destacado */}
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-sm border-2 border-green-400 ring-2 ring-green-200 animate-pulse"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>COBRAR</span>
                    </button>
                    
                    {/* Botón Vaciar */}
                    {selectedTable && (
                      <button
                        onClick={clearTableCompleteOrder}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Vaciar</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Botón de configuración en la parte inferior */}
          <div className="border-t border-gray-200/50 p-4">
            <button
              onClick={handleNavigateToConfiguration}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center space-x-1 transition-all duration-200 hover:shadow-lg hover:scale-105 text-xs"
            >
              <Settings className="w-3 h-3" />
              <span>Configuración</span>
            </button>
            

          </div>
        </div>
      </div>

                              {/* Modal de selección de mesas */}
         <TableSelectorModal
           isOpen={isTableModalOpen}
           onClose={() => setIsTableModalOpen(false)}
           onSelectTable={handleTableSelect}
           selectedTableId={selectedTable?.id}
           forceOpen={!selectedTable && !isTicketWithoutTable && !editOrderId} // No forzar si se está editando
           onTicketWithoutTable={handleTicketWithoutTable}
         />

       {/* Modal de cobro */}
       <PaymentModal
         isOpen={isPaymentModalOpen}
         onClose={() => setIsPaymentModalOpen(false)}
         allowPartialPayment={selectedTable && !isTicketWithoutTable ? selectedTable.status === 'occupied' : false}
         partialPayments={selectedTable && !isTicketWithoutTable ? getPartialPayments(selectedTable.id) : []}
         totalPartialPayments={selectedTable && !isTicketWithoutTable ? getTotalPartialPayments(selectedTable.id) : 0}
         isTicketWithoutTable={isTicketWithoutTable}
         onPartialPayment={selectedTable && !isTicketWithoutTable ? (amount, paymentMethod) => {
           // Registrar el cobro parcial
           addPartialPayment(selectedTable!.id, amount, paymentMethod);
           // Actualizar el total de la mesa restando el cobro parcial
           updateTableTotalAfterPartialPayment(selectedTable!.id, amount);
           toast.success(`Cobro parcial de ${getCurrencySymbol()}${amount.toFixed(2)} registrado`);
           
           // Cerrar el modal de pago
           setIsPaymentModalOpen(false);
           
           // Limpiar el carrito local
           setCurrentOrder([]);
           setSelectedCustomer(null);
           
           // Deseleccionar la mesa actual
           setSelectedTable(null);
           
           // Abrir modal de selección de mesas para continuar trabajando
           setIsTableModalOpen(true);
         } : undefined}
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
                                               } else {
               // Cobro normal de mesa o ticket sin mesa - limpiar el dashboard
               if (selectedTable) {
                 // Limpiar cobros parciales si es el pago final
                 const partialPayments = getPartialPayments(selectedTable.id);
                 if (partialPayments.length > 0) {
                   clearPartialPayments(selectedTable.id);
                 }
                 
                 // Si es una cuenta por nombre y hay productos en el carrito, guardar el pedido antes de cobrar
                 if (selectedTable.id.startsWith('account-') && currentOrder.length > 0) {
                   const { total, subtotal, tax } = calculateTotal();
                   addOrderToTable(selectedTable.id, total, currentOrder, selectedCustomer, true);
                   console.log('Pedido guardado en cuenta por nombre antes del cobro:', selectedTable.name);
                 }
                 
                 // Limpiar el pedido de la mesa
                 clearTableOrder(selectedTable.id);
                 
                 // Limpiar el carrito local
                 setCurrentOrder([]);
                 setSelectedCustomer(null);
                 
                 // Deseleccionar completamente la mesa
                 setSelectedTable(null);
                 
                 // Abrir modal de mesas para seleccionar nueva mesa
                 setIsTableModalOpen(true);
                 
                 // Verificar si la mesa estaba unida para mostrar un mensaje más específico
                 if (selectedTable.mergedWith) {
                   toast.success(`Cuenta de mesas unidas cobrada exitosamente. Las mesas han sido liberadas y desunidas. Selecciona una nueva mesa.`);
                 } else if (selectedTable.id.startsWith('account-')) {
                   toast.success(`Cuenta de ${selectedTable.name} cobrada y cerrada exitosamente. Selecciona una nueva mesa.`);
                 } else {
                   toast.success(`Mesa ${selectedTable.number} cobrada y liberada exitosamente. Selecciona una nueva mesa.`);
                 }
               } else if (isTicketWithoutTable) {
                 // Cobro de ticket sin mesa
                 setCurrentOrder([]);
                 setSelectedCustomer(null);
                 setIsTicketWithoutTable(false);
                 
                 // Abrir modal de mesas para seleccionar nueva mesa
                 setIsTableModalOpen(true);
                 
                 toast.success('Ticket sin mesa cobrado exitosamente. Selecciona una nueva mesa.');
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
         customerName={selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.lastName}` : ''}
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
         selectedCustomer={selectedCustomer}
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

         {/* Modal de confirmación */}
         {showConfirmationModal && confirmationData && (
           <ConfirmationModal
             isOpen={showConfirmationModal}
             onClose={() => setShowConfirmationModal(false)}
             onConfirm={confirmationData.onConfirm}
             title={confirmationData.title}
             message={confirmationData.message}
             type={confirmationData.type}
           />
         )}

         {/* Modal de cliente para recargar saldo */}
         {showCustomerModal && customerToEdit && (
           <CustomerModal
             isOpen={showCustomerModal}
             onClose={() => {
               setShowCustomerModal(false);
               setCustomerToEdit(null);
             }}
             customer={customerToEdit}
             onSave={handleCustomerUpdate}
           />
         )}

         {/* Modal de recarga desde consulta de saldo */}
         {showRechargeModal && customerForRecharge && (
           <CustomerModal
             isOpen={showRechargeModal}
             onClose={() => {
               setShowRechargeModal(false);
               setCustomerForRecharge(null);
               setSelectedCustomer(null);
             }}
             customer={customerForRecharge}
             onSave={(updatedCustomer) => {
               handleCustomerUpdate(updatedCustomer);
               setShowRechargeModal(false);
               setCustomerForRecharge(null);
               // Abrir modal de cobro después de la recarga
               setIsPaymentModalOpen(true);
             }}
           />
         )}

         {/* Modal de traslado de cuenta */}
         {showTransferModal && selectedCustomer && (
           <TransferAccountModal
             isOpen={showTransferModal}
             onClose={() => setShowTransferModal(false)}
             customer={selectedCustomer}
             tables={tables}
             onTransfer={handleTransferAccountComplete}
           />
         )}

         {/* Modal de selección de clientes */}
         {showCustomerSelectorModal && (
           <CustomerSelectorModal
             isOpen={showCustomerSelectorModal}
             onClose={() => setShowCustomerSelectorModal(false)}
             onCustomerSelect={setSelectedCustomer}
             selectedCustomer={selectedCustomer}
           />
         )}

         {/* Modal de precio específico */}
         {showPriceInputModal && selectedProductForPrice && (
           <PriceInputModal
             isOpen={showPriceInputModal}
             onClose={() => {
               setShowPriceInputModal(false);
               setSelectedProductForPrice(null);
             }}
             onConfirm={handlePriceInputConfirm}
             productName={selectedProductForPrice.name}
             currencySymbol={getCurrencySymbol()}
           />
         )}

         {/* Modal de cambios pendientes */}
         <PendingChangesModal
           isOpen={showPendingChangesModal}
           onClose={() => setShowPendingChangesModal(false)}
           onSave={handleSaveAndNavigate}
           onDiscard={handleDiscardAndNavigate}
         />
      </div>
    );
  };

export default Dashboard;
