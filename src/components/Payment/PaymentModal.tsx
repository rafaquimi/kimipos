import React, { useState, useEffect } from 'react';
import { X, Receipt, CreditCard, DollarSign, Printer, User } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { db } from '../../database/db';
import { formatPrice } from '../../utils/taxUtils';
import { generatePOSTicketPDF, openPDFInNewWindow, calculateTaxBreakdown } from '../../utils/pdfGenerator';
import { getNextTicketId, formatTicketId } from '../../utils/ticketIdGenerator';
import { getNextReceiptId, formatReceiptId } from '../../utils/receiptIdGenerator';
import { useClosedTickets } from '../../contexts/ClosedTicketsContext';
import IntegratedNumericKeypad from './IntegratedNumericKeypad';
import ChangePopup from './ChangePopup';
import PartialPaymentConfirmationModal from './PartialPaymentConfirmationModal';
import { OrderItem } from '../../types/Ticket';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  orderItems: OrderItem[];
  tableNumber: string;
  customerName?: string;
  subtotal: number;
  tax: number;
  total: number;
  mergedTableNumber?: string;
  titleOverride?: string;
  skipDbSave?: boolean;
  defaultPaymentMethod?: 'cash' | 'card';
  originalOrderItems?: OrderItem[];
  originalSubtotal?: number;
  originalTax?: number;
  originalTotal?: number;
  selectedCustomer?: any;
  allowPartialPayment?: boolean;
  onPartialPayment?: (amount: number, paymentMethod: 'cash' | 'card') => void;
  partialPayments?: any[];
  totalPartialPayments?: number;
  isTicketWithoutTable?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  orderItems,
  tableNumber,
  customerName,
  subtotal,
  tax,
  total,
  mergedTableNumber,
  titleOverride,
  skipDbSave = false,
  defaultPaymentMethod = 'cash',
  originalOrderItems,
  originalSubtotal,
  originalTax,
  originalTotal,
  selectedCustomer,
  allowPartialPayment = false,
  onPartialPayment,
  partialPayments = [],
  totalPartialPayments = 0,
  isTicketWithoutTable = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'balance' | 'mixed'>(defaultPaymentMethod);
  const [cashReceived, setCashReceived] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [useBalance, setUseBalance] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [remainingCashReceived, setRemainingCashReceived] = useState('');
  const [remainingCardAmount, setRemainingCardAmount] = useState('');
  const [showChangePopup, setShowChangePopup] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [partialPaymentData, setPartialPaymentData] = useState<{
    receivedAmount: number;
    pendingAmount: number;
    paymentMethod: 'cash' | 'card';
  } | null>(null);
  
  const { getCurrencySymbol, config } = useConfig();
  const { refreshCustomers, updateCustomer } = useCustomers();
  const { addClosedTicket } = useClosedTickets();

  const currencySymbol = getCurrencySymbol();
  const isRefund = total < 0;
  const isAdjustment = originalTotal !== undefined;

  // Función para manejar la confirmación del pago parcial
  const handlePartialPaymentConfirm = async () => {
    if (!partialPaymentData) return;
    
    const { receivedAmount, pendingAmount, paymentMethod } = partialPaymentData;
    
    const partialTaxBreakdown = calculateTaxBreakdown(effectiveOrderItems);
    
    // Generar ID del recibo parcial
    const partialReceiptId = formatTicketId(getNextTicketId());
    
    const partialReceiptData = {
      orderItems: effectiveOrderItems,
      tableNumber: effectiveTableNumber,
      customerName: effectiveCustomerName,
      subtotal: effectiveSubtotal,
      tax: effectiveTax,
      total: receivedAmount,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === 'cash' ? (cashReceived || receivedAmount.toString()) : undefined,
      cardAmount: paymentMethod === 'card' ? (cardAmount || receivedAmount.toString()) : undefined,
      mergedTableNumber: mergedTableNumber,
      selectedCustomer: selectedCustomer,
      restaurantName: config.businessData?.commercialName || 'Restaurante',
      currencySymbol: getCurrencySymbol(),
      documentType: 'partial_receipt' as const,
      taxBreakdown: partialTaxBreakdown.length > 0 ? partialTaxBreakdown : undefined,
      ticketId: partialReceiptId
    };
    
    try {
      await generatePOSTicketPDF({
        ...partialReceiptData,
        businessData: config.businessData
      });
      console.log('Recibo parcial generado');
      
      onPartialPayment(receivedAmount, paymentMethod);
      
      setShowPartialPaymentModal(false);
      setPartialPaymentData(null);
      onClose();
    } catch (error) {
      console.error('Error generando recibo parcial:', error);
      setShowPartialPaymentModal(false);
      setPartialPaymentData(null);
    }
  };

  const handlePartialPaymentCancel = () => {
    setShowPartialPaymentModal(false);
    setPartialPaymentData(null);
  };

  // Lógica para saldo del cliente
  const customerBalance = selectedCustomer?.balance || 0;
  const hasCustomerBalance = customerBalance > 0;
  
  // Verificar si es una recarga y usar esos datos si están disponibles
  const rechargeData = localStorage.getItem('rechargeData');
  let effectiveOrderItems = orderItems;
  let effectiveSubtotal = subtotal;
  let effectiveTax = tax;
  let effectiveTotal = total;
  let effectiveCustomerName = customerName;
  let effectiveTableNumber = tableNumber;
  let effectiveTicketId: string | undefined;

  // Si es una recarga, usar los datos del localStorage
  if (rechargeData && isTicketWithoutTable) {
    try {
      const parsedRechargeData = JSON.parse(rechargeData);
      effectiveOrderItems = parsedRechargeData.orderItems || orderItems;
      effectiveSubtotal = parsedRechargeData.subtotal || subtotal;
      effectiveTax = parsedRechargeData.tax || tax;
      effectiveTotal = parsedRechargeData.total || total;
      effectiveTicketId = parsedRechargeData.ticketId;
    } catch (error) {
      console.error('Error parsing recharge data:', error);
    }
  }

  // Calcular el subtotal real basado en los productos
  const calculateRealSubtotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Si hay cobros parciales, recalcular el subtotal basado en los productos reales
  if (totalPartialPayments > 0) {
    effectiveSubtotal = calculateRealSubtotal(effectiveOrderItems);
    effectiveTax = effectiveTotal - effectiveSubtotal;
  }

  // El total que viene del Dashboard es el total original de la mesa
  const actualPendingAmount = effectiveTotal - totalPartialPayments;

  // Calcular cambios
  const change = parseFloat(cashReceived || '0') - actualPendingAmount;
  const cardChange = parseFloat(cardAmount || '0') - actualPendingAmount;
  const remainingChange = parseFloat(remainingCashReceived || '0') - remainingAmount;
  const remainingCardChange = parseFloat(remainingCardAmount || '0') - remainingAmount;

  // Inicializar montos cuando cambia el método de pago o cuando se abre el modal
  useEffect(() => {
    const actualPendingAmount = effectiveTotal - totalPartialPayments;
    if (paymentMethod === 'card') {
      setCardAmount(actualPendingAmount.toString());
    } else if (paymentMethod === 'cash') {
      setCashReceived(actualPendingAmount.toString());
    }
  }, [paymentMethod, effectiveTotal, totalPartialPayments, isOpen]);

  // Inicializar montos restantes cuando cambia el método de pago restante
  useEffect(() => {
    if (remainingAmount > 0) {
      if (remainingPaymentMethod === 'card' && !remainingCardAmount) {
        setRemainingCardAmount(remainingAmount.toString());
      } else if (remainingPaymentMethod === 'cash' && !remainingCashReceived) {
        setRemainingCashReceived(remainingAmount.toString());
      }
    }
  }, [remainingPaymentMethod, remainingAmount, remainingCardAmount, remainingCashReceived]);

  // Calcular saldo a usar
  useEffect(() => {
    if (useBalance && hasCustomerBalance) {
      const amountToUse = Math.min(customerBalance, effectiveTotal);
      setBalanceAmount(amountToUse);
      setRemainingAmount(Math.max(0, effectiveTotal - amountToUse));
    } else {
      setBalanceAmount(0);
      setRemainingAmount(effectiveTotal);
    }
  }, [useBalance, hasCustomerBalance, customerBalance, effectiveTotal]);

  const handlePaymentComplete = async () => {
    const receivedAmount = paymentMethod === 'cash' 
      ? parseFloat(cashReceived || '0') 
      : parseFloat(cardAmount || '0');
    
    // Para tickets sin mesa, NO permitir pagos parciales
    if (isTicketWithoutTable && receivedAmount < actualPendingAmount) {
      alert(`Para tickets sin mesa se requiere el pago completo de ${currencySymbol}${actualPendingAmount.toFixed(2)}`);
      return;
    }
    
    // Validar que no se cobre más del monto pendiente (solo para tarjeta)
    if (paymentMethod === 'card' && receivedAmount > actualPendingAmount) {
      alert(`No se puede cobrar más de ${currencySymbol}${actualPendingAmount.toFixed(2)}. El monto máximo permitido es el pendiente de la cuenta.`);
      return;
    }
    
    const isPartialPayment = allowPartialPayment && onPartialPayment && receivedAmount < actualPendingAmount && !isTicketWithoutTable;
    
    if (isPartialPayment) {
      const pendingAmount = actualPendingAmount - receivedAmount;
      
      // Mostrar modal de confirmación personalizado
      setPartialPaymentData({
        receivedAmount,
        pendingAmount,
        paymentMethod: paymentMethod === 'balance' ? 'cash' : paymentMethod as 'cash' | 'card'
      });
      setShowPartialPaymentModal(true);
      return;
    }
    
    // Mostrar popup de cambio si es pago en efectivo y hay cambio
    if (paymentMethod === 'cash' && receivedAmount > actualPendingAmount) {
      const change = receivedAmount - actualPendingAmount;
      setChangeAmount(change);
      setShowChangePopup(true);
      
      // Esperar 4 segundos antes de continuar con el proceso
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    // Si se usó saldo del cliente, generar recibo de pago con saldo
    if (useBalance && selectedCustomer && balanceAmount > 0) {
      try {
        const newBalance = selectedCustomer.balance - balanceAmount;
        await updateCustomer(selectedCustomer.id, {
          ...selectedCustomer,
          balance: newBalance
        });
        console.log(`Saldo actualizado para ${selectedCustomer.name}: ${selectedCustomer.balance} -> ${newBalance}`);
        
        // Generar recibo de pago con saldo
        const balanceReceiptId = formatReceiptId(getNextReceiptId());
        
        const balanceReceiptData = {
          orderItems: effectiveOrderItems,
          tableNumber: effectiveTableNumber,
          customerName: effectiveCustomerName,
          subtotal: effectiveSubtotal,
          tax: effectiveTax,
          total: balanceAmount, // Solo el monto pagado con saldo
          paymentMethod: 'balance' as const,
          mergedTableNumber: mergedTableNumber,
          selectedCustomer: selectedCustomer,
          useBalance: true,
          balanceAmount: balanceAmount,
          remainingAmount: remainingAmount,
          remainingPaymentMethod: remainingPaymentMethod,
          restaurantName: config.businessData?.commercialName || 'Restaurante',
          currencySymbol: getCurrencySymbol(),
          documentType: 'balance_payment' as const,
          taxBreakdown: calculateTaxBreakdown(effectiveOrderItems),
          finalPaymentAmount: balanceAmount,
          ticketId: balanceReceiptId
        };
        
        // @ts-ignore
        const pdfDataUrl = generatePOSTicketPDF({
          ...balanceReceiptData,
          businessData: config.businessData
        });
        
        const fileName = `recibo-saldo-${selectedCustomer.name}-${new Date().toISOString().slice(0, 10)}`;
        openPDFInNewWindow(pdfDataUrl, fileName);
        
        // Guardar recibo de pago con saldo
        const closedReceipt = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...balanceReceiptData,
          businessData: config.businessData,
          closedAt: new Date()
        };
        // @ts-ignore
        addClosedTicket(closedReceipt);
        
        // Si hay monto restante, generar PDF adicional para esa parte
        if (remainingAmount > 0) {
          const remainingTicketId = formatTicketId(getNextTicketId());
          
          const remainingTicketData = {
            orderItems: effectiveOrderItems,
            tableNumber: effectiveTableNumber,
            customerName: effectiveCustomerName,
            subtotal: effectiveSubtotal,
            tax: effectiveTax,
            total: remainingAmount, // Solo el monto restante
            paymentMethod: remainingPaymentMethod,
            cashReceived: remainingPaymentMethod === 'cash' ? (remainingCashReceived || remainingAmount.toString()) : undefined,
            cardAmount: remainingPaymentMethod === 'card' ? (remainingCardAmount || remainingAmount.toString()) : undefined,
            mergedTableNumber: mergedTableNumber,
            selectedCustomer: selectedCustomer,
            useBalance: false,
            balanceAmount: 0,
            remainingAmount: 0,
            remainingPaymentMethod: 'cash',
            restaurantName: config.businessData?.commercialName || 'Restaurante',
            currencySymbol: getCurrencySymbol(),
            documentType: 'ticket' as const,
            taxBreakdown: calculateTaxBreakdown(effectiveOrderItems),
            finalPaymentAmount: remainingAmount,
            ticketId: remainingTicketId
          };
          
          // @ts-ignore
          const remainingPdfDataUrl = generatePOSTicketPDF({
            ...remainingTicketData,
            businessData: config.businessData
          });
          
          const remainingFileName = `ticket-mesa-${tableNumber}-${new Date().toISOString().slice(0, 10)}`;
          openPDFInNewWindow(remainingPdfDataUrl, remainingFileName);
          
          // Guardar ticket cerrado para el monto restante
          const closedRemainingTicket = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...remainingTicketData,
            businessData: config.businessData,
            closedAt: new Date()
          };
          // @ts-ignore
          addClosedTicket(closedRemainingTicket);
        }
        
        // Completar pago
        onPaymentComplete();
        onClose();
        return;
        
      } catch (error) {
        console.error('Error actualizando saldo del cliente:', error);
        alert('Error al actualizar el saldo del cliente');
        return;
      }
    }

    // Generar PDF y completar pago (solo para pagos sin saldo o recargas)
    try {
      // Usar ID existente o generar uno nuevo
      const ticketId = effectiveTicketId || formatTicketId(getNextTicketId());
      
      // Determinar el tipo de documento
      const isRecharge = rechargeData && isTicketWithoutTable;
      
      const ticketData = {
        orderItems: effectiveOrderItems,
        tableNumber: effectiveTableNumber,
        customerName: effectiveCustomerName,
        subtotal: effectiveSubtotal,
        tax: effectiveTax,
        total: effectiveTotal,
        paymentMethod: paymentMethod === 'balance' ? 'cash' : paymentMethod as 'cash' | 'card',
        cashReceived: paymentMethod === 'cash' ? (cashReceived || receivedAmount.toString()) : undefined,
        cardAmount: paymentMethod === 'card' ? (cardAmount || receivedAmount.toString()) : undefined,
        mergedTableNumber: mergedTableNumber,
        selectedCustomer: selectedCustomer,
        useBalance: useBalance,
        balanceAmount: balanceAmount,
        remainingAmount: remainingAmount,
        remainingPaymentMethod: remainingPaymentMethod,
        restaurantName: config.businessData?.commercialName || 'Restaurante',
        currencySymbol: getCurrencySymbol(),
        documentType: isRecharge ? 'recharge' as const : 'ticket' as const,
        taxBreakdown: calculateTaxBreakdown(effectiveOrderItems),
        finalPaymentAmount: receivedAmount,
        ticketId: ticketId
      };
      
      const pdfDataUrl = generatePOSTicketPDF({
        ...ticketData,
        businessData: config.businessData
      });
      
      const fileName = `ticket-mesa-${tableNumber}-${new Date().toISOString().slice(0, 10)}`;
      openPDFInNewWindow(pdfDataUrl, fileName);
      
      // Guardar ticket cerrado
      const closedTicket = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...ticketData,
        businessData: config.businessData,
        closedAt: new Date()
      };
      addClosedTicket(closedTicket);
      
    } catch (error) {
      console.error('Error generando ticket PDF:', error);
      alert(`Error al generar el ticket PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
    
    onPaymentComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-xl lg:max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 lg:p-6 border-b ${isRefund ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Receipt className={`w-5 h-5 lg:w-6 lg:h-6 ${isRefund ? 'text-red-600' : 'text-primary-600'}`} />
              <h2 className={`text-lg lg:text-xl font-semibold ${isRefund ? 'text-red-700' : 'text-gray-900'}`}>
                {isRefund ? '⚠️ DEVOLUCIÓN' : (isAdjustment ? 'Cobro de Diferencia' : (titleOverride || `Cobro - Mesa ${tableNumber}`))}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-1 lg:p-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 lg:gap-3">
              {/* Columna izquierda - Resumen y configuración */}
              <div className="space-y-4 lg:space-y-6">
                {/* Resumen del pedido */}
                <div>
                  <h3 className="text-base lg:text-lg font-semibold mb-2 lg:mb-3">Resumen del Pedido</h3>
                  <div className="bg-gray-50 rounded-lg p-3 lg:p-4 max-h-48 lg:max-h-64 overflow-y-auto">
                    {orderItems.map((item, index) => {
                      const isNegativeItem = item.productName.includes('(-)');
                      return (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className={`text-sm ${isNegativeItem ? 'text-red-700 font-medium' : ''}`}>
                            {item.quantity}x {item.productName}
                          </span>
                          <span className={`text-sm font-medium ${isNegativeItem ? 'text-red-700' : ''}`}>
                            {isNegativeItem ? '-' : ''}{currencySymbol}{Math.abs(item.totalPrice).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Opción de usar saldo del cliente */}
                {selectedCustomer && hasCustomerBalance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">
                          {selectedCustomer.name} {selectedCustomer.lastName}
                        </span>
                      </div>
                      <span className="text-sm text-blue-600">
                        Saldo: {currencySymbol}{customerBalance.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useBalance}
                          onChange={(e) => setUseBalance(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-blue-800">
                          Usar saldo del cliente
                        </span>
                      </label>
                    </div>
                    
                    {useBalance && (
                      <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                        <div className="text-sm text-blue-700">
                          <div className="flex justify-between mb-1">
                            <span>Saldo disponible:</span>
                            <span className="font-medium">{currencySymbol}{customerBalance.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Total a pagar:</span>
                            <span className="font-medium">{currencySymbol}{actualPendingAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Saldo a usar:</span>
                            <span className="text-green-600">{currencySymbol}{balanceAmount.toFixed(2)}</span>
                          </div>
                          {remainingAmount > 0 && (
                            <div className="flex justify-between font-semibold text-orange-600">
                              <span>Restante por pagar:</span>
                              <span>{currencySymbol}{remainingAmount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Totales */}
                <div className={`rounded-lg p-4 ${isRefund ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal (sin IVA):</span>
                      <span className={isRefund ? 'text-red-700' : ''}>{isRefund && effectiveSubtotal < 0 ? '-' : ''}{currencySymbol}{formatPrice(Math.abs(effectiveSubtotal))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (21%):</span>
                      <span className={isRefund ? 'text-red-700' : ''}>{isRefund && tax < 0 ? '-' : ''}{currencySymbol}{formatPrice(Math.abs(tax))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>TOTAL (IVA incl.):</span>
                      <span className={`${isRefund ? 'text-red-700 font-bold' : 'text-primary-600'}`}>
                        {isRefund && effectiveTotal < 0 ? '-' : ''}{currencySymbol}{formatPrice(Math.abs(effectiveTotal))}
                      </span>
                    </div>
                    {useBalance && hasCustomerBalance && (
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-600">Pagado con saldo:</span>
                          <span className="text-blue-600 font-medium">-{currencySymbol}{balanceAmount.toFixed(2)}</span>
                        </div>
                        {remainingAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-600">Restante ({remainingPaymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}):</span>
                            <span className="text-orange-600 font-medium">{currencySymbol}{remainingAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Información de pagos parciales */}
                    {totalPartialPayments > 0 && (
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Pagos realizados:</span>
                          <span className="text-green-600 font-medium">{currencySymbol}{totalPartialPayments.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600">Pendiente por cobrar:</span>
                          <span className="text-orange-600 font-medium">{currencySymbol}{actualPendingAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Método de pago */}
                {(!useBalance || remainingAmount > 0) && (
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold mb-2 lg:mb-3">
                      {useBalance ? 'Método para el Resto' : 'Método de Pago'}
                    </h3>
                    <div className="flex space-x-2 lg:space-x-4">
                      <button
                        onClick={() => useBalance ? setRemainingPaymentMethod('cash') : setPaymentMethod('cash')}
                        className={`flex-1 flex items-center justify-center space-x-1 lg:space-x-2 p-2 lg:p-3 rounded-lg border-2 transition-colors ${
                          (useBalance ? remainingPaymentMethod : paymentMethod) === 'cash'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <DollarSign className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="text-sm lg:text-base">Efectivo</span>
                      </button>
                      <button
                        onClick={() => useBalance ? setRemainingPaymentMethod('card') : setPaymentMethod('card')}
                        className={`flex-1 flex items-center justify-center space-x-1 lg:space-x-2 p-2 lg:p-3 rounded-lg border-2 transition-colors ${
                          (useBalance ? remainingPaymentMethod : paymentMethod) === 'card'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="text-sm lg:text-base">Tarjeta</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3">
                  <button
                    onClick={handlePaymentComplete}
                    disabled={
                      (!useBalance && paymentMethod === 'cash' && !cashReceived) ||
                      (!useBalance && paymentMethod === 'card' && !cardAmount) ||
                      (useBalance && remainingAmount > 0 && remainingPaymentMethod === 'cash' && !remainingCashReceived) ||
                      (useBalance && remainingAmount > 0 && remainingPaymentMethod === 'card' && !remainingCardAmount)
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 lg:py-4 px-4 lg:px-6 rounded-lg flex items-center justify-center space-x-2 font-semibold text-base lg:text-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {useBalance ? (
                      <>
                        <Printer className="w-5 h-5" />
                        <span>Completar Pago con Saldo e Imprimir Recibo</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        <span>Completar Cobro e Imprimir PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Columna derecha - Teclado numérico */}
              <div className="space-y-1 lg:space-y-2">
                {/* Teclado numérico para efectivo */}
                {((!useBalance && paymentMethod === 'cash') || (useBalance && remainingPaymentMethod === 'cash' && remainingAmount > 0)) && (
                  <div>
                    <h3 className="text-xs font-semibold mb-0.5">
                      {useBalance ? 'Cantidad Recibida (Resto)' : 'Cantidad Recibida'}
                    </h3>
                    <IntegratedNumericKeypad
                      value={useBalance ? (remainingCashReceived || '0') : (cashReceived || '0')}
                      onValueChange={useBalance ? setRemainingCashReceived : setCashReceived}
                      currencySymbol={currencySymbol}
                      placeholder="0.00"
                    />
                    {parseFloat(useBalance ? remainingCashReceived : cashReceived) > 0 && (
                      <div className="mt-0.5 p-0.5 bg-blue-50 rounded text-center">
                        <div className="text-xs text-gray-600">Cambio:</div>
                        <div className="text-xs font-bold text-green-600">
                          {currencySymbol}{(useBalance ? remainingChange : change).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Teclado numérico para tarjeta */}
                {((!useBalance && paymentMethod === 'card') || (useBalance && remainingPaymentMethod === 'card' && remainingAmount > 0)) && (
                  <div>
                    <h3 className="text-xs font-semibold mb-0.5">
                      {useBalance ? 'Cantidad a Cobrar (Resto)' : 'Cantidad a Cobrar'}
                    </h3>
                    <IntegratedNumericKeypad
                      value={useBalance ? (remainingCardAmount || '0') : (cardAmount || '0')}
                      onValueChange={useBalance ? setRemainingCardAmount : setCardAmount}
                      currencySymbol={currencySymbol}
                      placeholder="0.00"
                    />
                    {parseFloat(useBalance ? remainingCardAmount : cardAmount) > 0 && (
                      <div className="mt-0.5 p-0.5 bg-blue-50 rounded text-center">
                        <div className="text-xs text-gray-600">Diferencia:</div>
                        <div className="text-xs font-bold text-blue-600">
                          {currencySymbol}{(useBalance ? remainingCardChange : cardChange).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de cambio */}
      <ChangePopup
        isOpen={showChangePopup}
        onClose={() => setShowChangePopup(false)}
        changeAmount={changeAmount}
        currencySymbol={currencySymbol}
      />

      {/* Modal de confirmación de pago parcial */}
      <PartialPaymentConfirmationModal
        isOpen={showPartialPaymentModal}
        onConfirm={handlePartialPaymentConfirm}
        onCancel={handlePartialPaymentCancel}
        tableNumber={tableNumber}
        amountCollected={partialPaymentData?.receivedAmount || 0}
        pendingAmount={partialPaymentData?.pendingAmount || 0}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default PaymentModal;
