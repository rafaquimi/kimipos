import React, { useState, useEffect } from 'react';
import { X, Receipt, CreditCard, DollarSign, Printer, Download, FileText } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { db } from '../../database/db';
import { calculateBasePrice, calculateVATAmount, formatPrice } from '../../utils/taxUtils';
import { generatePOSTicketPDF, openPDFInNewWindow } from '../../utils/pdfGenerator';
import NumericKeypad from '../NumericKeypad';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

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
  mergedTableNumber?: string; // Número de la mesa unida si existe
  titleOverride?: string;
  skipDbSave?: boolean;
  defaultPaymentMethod?: 'cash' | 'card';
  originalOrderItems?: OrderItem[]; // Para mostrar el ticket real cuando es edición
  originalSubtotal?: number;
  originalTax?: number;
  originalTotal?: number;
  selectedCustomer?: any; // Cliente seleccionado con saldo
  allowPartialPayment?: boolean; // Permitir cobros parciales
  onPartialPayment?: (amount: number, paymentMethod: 'cash' | 'card') => void; // Callback para cobros parciales
  partialPayments?: any[]; // Datos de cobros parciales previos
  totalPartialPayments?: number; // Total de cobros parciales previos
  isTicketWithoutTable?: boolean; // Indica si es un ticket sin mesa
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
  const [useBalance, setUseBalance] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [remainingCashReceived, setRemainingCashReceived] = useState('');
  const [showNumericKeypad, setShowNumericKeypad] = useState(false);
  const [editingAmountFor, setEditingAmountFor] = useState<'cash' | 'remaining' | null>(null);
  const { getCurrencySymbol, getTaxRate, config } = useConfig();
  const { refreshCustomers } = useCustomers();

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

  if (rechargeData) {
    try {
      const data = JSON.parse(rechargeData);
      if (data.customer && data.amount) {
        effectiveOrderItems = data.orderItems || orderItems;
        effectiveSubtotal = data.subtotal || subtotal;
        effectiveTax = data.tax || tax;
        effectiveTotal = data.total || total;
        effectiveCustomerName = data.customer.name + ' ' + data.customer.lastName;
        effectiveTableNumber = 'RECARGA';
      }
    } catch (error) {
      console.error('Error parsing recharge data:', error);
    }
  }
  
  // Calcular montos cuando se usa saldo
  useEffect(() => {
    if (useBalance && hasCustomerBalance) {
      const balanceToUse = Math.min(customerBalance, effectiveTotal);
      setBalanceAmount(balanceToUse);
      const remaining = effectiveTotal - balanceToUse;
      setRemainingAmount(remaining);
      
      if (remaining > 0) {
        setPaymentMethod('mixed');
      } else {
        setPaymentMethod('balance');
      }
    } else {
      setBalanceAmount(0);
      setRemainingAmount(0);
      setPaymentMethod(defaultPaymentMethod);
    }
  }, [useBalance, customerBalance, effectiveTotal, defaultPaymentMethod, hasCustomerBalance]);
  
  // Mantener useBalance en false cuando es una recarga
  useEffect(() => {
    if (rechargeData) {
      setUseBalance(false);
    }
  }, [rechargeData]);
  
  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setUseBalance(false);
      setBalanceAmount(0);
      setRemainingAmount(0);
      setRemainingPaymentMethod('cash');
      setRemainingCashReceived('');
      setCashReceived('');
      setPaymentMethod(defaultPaymentMethod);
      
      // Verificar si es una recarga de saldo
      const rechargeData = localStorage.getItem('rechargeData');
      if (rechargeData) {
        try {
          const data = JSON.parse(rechargeData);
          // Si es una recarga, no permitir usar saldo
          if (data.customer && data.amount) {
            // Es una recarga, no usar saldo
            setUseBalance(false);
            setPaymentMethod('cash'); // Forzar método de pago por defecto
            console.log('Datos de recarga detectados:', data);
          }
        } catch (error) {
          console.error('Error parsing recharge data:', error);
        }
      }
    }
  }, [isOpen, defaultPaymentMethod]);



  if (!isOpen) return null;

  const currencySymbol = getCurrencySymbol();
  const change = parseFloat(cashReceived) - effectiveTotal;
  
  // Detectar si es una devolución (total negativo o producto de diferencia negativa)
  const isRefund = effectiveTotal < 0 || effectiveOrderItems.some(item => item.productName.includes('(-)'));
  const isAdjustment = effectiveOrderItems.some(item => item.productId === 'diff');
  
  // Calcular cambio para el pago restante
  const remainingChange = parseFloat(remainingCashReceived) - remainingAmount;

  // Funciones para el teclado numérico
  const handleAmountConfirm = (newAmount: number) => {
    if (editingAmountFor === 'cash') {
      setCashReceived(newAmount.toString());
    } else if (editingAmountFor === 'remaining') {
      setRemainingCashReceived(newAmount.toString());
    }
    setShowNumericKeypad(false);
    setEditingAmountFor(null);
  };

  const handleAmountCancel = () => {
    setShowNumericKeypad(false);
    setEditingAmountFor(null);
  };

  const openNumericKeypad = (type: 'cash' | 'remaining') => {
    setEditingAmountFor(type);
    setShowNumericKeypad(true);
  };

  const generateTicketPDF = () => {
    try {
      console.log('Iniciando generación de PDF...');
      
      // Usar los datos originales del ticket si están disponibles (edición), sino los actuales
      const itemsToShow = originalOrderItems || effectiveOrderItems;
      const subtotalToShow = originalSubtotal !== undefined ? originalSubtotal : effectiveSubtotal;
      const taxToShow = originalTax !== undefined ? originalTax : effectiveTax;
      const totalToShow = originalTotal !== undefined ? originalTotal : effectiveTotal;
      
      console.log('Datos del ticket:', {
        itemsToShow,
        subtotalToShow,
        taxToShow,
        totalToShow,
        tableNumber,
        paymentMethod
      });
      
      // Determinar el tipo de documento
      const rechargeData = localStorage.getItem('rechargeData');
      let documentType: 'ticket' | 'recharge' | 'balance_payment' = 'ticket';
      
      if (rechargeData) {
        documentType = 'recharge';
      } else if (useBalance && balanceAmount > 0) {
        documentType = 'balance_payment';
      }
      
      const ticketData = {
        restaurantName: config.restaurantName || 'Restaurante',
        tableNumber: effectiveTableNumber,
        customerName: effectiveCustomerName,
        mergedTableNumber,
        orderItems: itemsToShow,
        subtotal: subtotalToShow,
        tax: taxToShow,
        total: totalToShow,
        paymentMethod: paymentMethod === 'balance' ? 'card' : (paymentMethod === 'mixed' ? remainingPaymentMethod : paymentMethod),
        cashReceived: (paymentMethod === 'cash' || (paymentMethod === 'mixed' && remainingPaymentMethod === 'cash')) ? (useBalance ? remainingCashReceived : cashReceived) : undefined,
        currencySymbol,
        // Información del cliente y saldo
        selectedCustomer,
        useBalance,
        balanceAmount,
        remainingAmount,
        remainingPaymentMethod,
        // Tipo de documento
        documentType
      };

      // Verificar si hay cobros parciales para esta mesa
      const hasPartialPayments = allowPartialPayment && onPartialPayment && !isTicketWithoutTable;
      
      if (hasPartialPayments) {
        // Verificar si este es el pago final (no hay más cobros parciales pendientes)
        const remainingAmount = effectiveTotal - parseFloat(cashReceived || '0');
        if (remainingAmount <= 0) {
          // Es el pago final, generar ticket con historial completo
          console.log('Generando ticket final con historial de cobros parciales');
          
          const finalTicketData = {
            ...ticketData,
            // Información de cobros parciales
            partialPayments: partialPayments,
            totalPartialPayments: totalPartialPayments
          };
          
          const pdfDataUrl = generatePOSTicketPDF(finalTicketData);
          const fileName = `ticket-final-mesa-${tableNumber}-${new Date().toISOString().slice(0, 10)}`;
          openPDFInNewWindow(pdfDataUrl, fileName);
        } else {
          console.log('Es un cobro parcial, no generando ticket aquí. Se generará en el Dashboard con historial completo.');
        }
      } else {
        console.log('Generando PDF con datos:', ticketData);
        const pdfDataUrl = generatePOSTicketPDF(ticketData);
        console.log('PDF generado, abriendo ventana...');
        
        const fileName = `ticket-mesa-${tableNumber}-${new Date().toISOString().slice(0, 10)}`;
        
        // Abrir PDF en nueva ventana/popup
        openPDFInNewWindow(pdfDataUrl, fileName);
        console.log('PDF abierto exitosamente');
      }
      
    } catch (error) {
      console.error('Error generando ticket PDF:', error);
      alert(`Error al generar el ticket PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };



  const handlePaymentComplete = async () => {
    // Verificar si es un cobro parcial usando el campo "Cantidad Recibida"
    const receivedAmount = parseFloat(cashReceived || '0');
    
    // Para tickets sin mesa, NO permitir pagos parciales
    if (isTicketWithoutTable && receivedAmount < effectiveTotal) {
      alert(`Para tickets sin mesa se requiere el pago completo de ${currencySymbol}${effectiveTotal.toFixed(2)}`);
      return;
    }
    
    const isPartialPayment = allowPartialPayment && onPartialPayment && receivedAmount < effectiveTotal && !isTicketWithoutTable;
    
    if (isPartialPayment) {
      // Mostrar confirmación de cobro parcial
      const pendingAmount = effectiveTotal - receivedAmount;
      const confirmMessage = `¿Confirmar cobro parcial?\n\nMesa: ${tableNumber}\nMonto cobrado: ${currencySymbol}${receivedAmount.toFixed(2)}\nMonto pendiente: ${currencySymbol}${pendingAmount.toFixed(2)}\n\nLa cuenta quedará abierta con ${currencySymbol}${pendingAmount.toFixed(2)} pendientes por pagar.`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      // Generar recibo parcial
      const partialReceiptData = {
        orderItems: effectiveOrderItems,
        tableNumber: effectiveTableNumber,
        customerName: effectiveCustomerName,
        subtotal: effectiveSubtotal,
        tax: effectiveTax,
        total: receivedAmount, // Solo el monto cobrado
        paymentMethod: paymentMethod === 'balance' ? 'cash' : paymentMethod as 'cash' | 'card',
        cashReceived: cashReceived || receivedAmount.toString(),
        mergedTableNumber: mergedTableNumber,
        selectedCustomer: selectedCustomer,
        restaurantName: config.restaurantName,
        currencySymbol: getCurrencySymbol(),
        documentType: 'partial_receipt' as const
      };
      
      try {
        await generatePOSTicketPDF(partialReceiptData);
        console.log('Recibo parcial generado');
        
        // Llamar al callback para registrar el cobro parcial
        onPartialPayment(receivedAmount, paymentMethod === 'balance' ? 'cash' : paymentMethod as 'cash' | 'card');
        
        onClose();
        return;
      } catch (error) {
        console.error('Error generando recibo parcial:', error);
        return;
      }
    }
    
    // Verificar si es una recarga de saldo
    const rechargeData = localStorage.getItem('rechargeData');
    if (rechargeData) {
      try {
        const data = JSON.parse(rechargeData);
        if (data.customer && data.amount) {
          // Es una recarga, actualizar saldo del cliente
          const newBalance = data.customer.balance + data.amount + data.bonus;
          await db.customers.update(data.customer.id, {
            balance: newBalance,
            updatedAt: new Date()
          });
          
          // Refrescar el contexto de clientes
          await refreshCustomers();
          
          // Limpiar datos de recarga
          localStorage.removeItem('rechargeData');
          
          console.log(`Recarga completada para ${data.customer.name}: ${data.customer.balance} -> ${newBalance}`);
        }
      } catch (error) {
        console.error('Error procesando recarga:', error);
      }
    } else {
      // Actualizar saldo del cliente si se usó para pagar
      if (useBalance && selectedCustomer && balanceAmount > 0) {
        try {
          const newBalance = customerBalance - balanceAmount;
          await db.customers.update(selectedCustomer.id, {
            balance: newBalance,
            updatedAt: new Date()
          });
          console.log(`Saldo actualizado para ${selectedCustomer.name}: ${customerBalance} -> ${newBalance}`);
          
          // Refrescar el contexto de clientes para actualizar la interfaz
          await refreshCustomers();
          console.log('Contexto de clientes refrescado');
        } catch (e) {
          console.error('Error actualizando saldo del cliente:', e);
        }
      }
    }
    
    // Generar PDF automáticamente al completar pago
    generateTicketPDF();
    
    // Si hay pago mixto (saldo + efectivo/tarjeta), generar ticket separado para el resto
    if (useBalance && remainingAmount > 0) {
      try {
        // Generar ticket separado para la parte pagada con efectivo/tarjeta
        const remainingTicketData = {
          orderItems: orderItems,
          tableNumber: tableNumber,
          customerName: customerName,
          subtotal: subtotal,
          tax: tax,
          total: remainingAmount, // Solo el monto restante
          paymentMethod: remainingPaymentMethod,
          cashReceived: remainingCashReceived ? remainingCashReceived : remainingAmount.toString(),
          mergedTableNumber: mergedTableNumber,
          selectedCustomer: selectedCustomer,
          useBalance: false, // No usar saldo en este ticket
          balanceAmount: 0,
          remainingAmount: 0,
          remainingPaymentMethod: remainingPaymentMethod,
          restaurantName: config.restaurantName,
          currencySymbol: getCurrencySymbol(),
          documentType: 'ticket' as const // Ticket fiscal para el resto
        };
        
        // Generar PDF para el ticket del resto
        await generatePOSTicketPDF(remainingTicketData);
        console.log('Ticket separado generado para el resto pagado con efectivo/tarjeta');
      } catch (error) {
        console.error('Error generando ticket separado:', error);
      }
    }
    
    if (!skipDbSave) {
      try {
        // Guardar ticket cobrado en Dexie como "paid"
        await db.orders.add({
          tableId: tableNumber ? parseInt(tableNumber) : undefined,
          customerName: customerName || undefined,
          status: 'paid',
          items: orderItems.map(i => ({
            productId: 0,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            status: 'delivered'
          })),
          subtotal,
          tax,
          discount: 0,
          total,
          createdAt: new Date(),
          updatedAt: new Date(),
          closedAt: new Date(),
        });
      } catch (e) {
        console.error('Error guardando ticket en DB:', e);
      }
    }
    onPaymentComplete();
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
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isRefund ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <Receipt className={`w-6 h-6 ${isRefund ? 'text-red-600' : 'text-primary-600'}`} />
              <h2 className={`text-xl font-semibold ${isRefund ? 'text-red-700' : 'text-gray-900'}`}>
                {isRefund ? '⚠️ DEVOLUCIÓN' : (isAdjustment ? 'Cobro de Diferencia' : (titleOverride || `Cobro - Mesa ${tableNumber}`))}
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
            {/* Resumen del pedido */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Resumen del Pedido</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
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

            {/* Información del cliente con saldo */}
            {hasCustomerBalance && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-blue-800">Cliente con Saldo</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {currencySymbol}{customerBalance.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600">Saldo disponible</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="useBalance"
                        checked={useBalance}
                        onChange={(e) => setUseBalance(e.target.checked)}
                        disabled={rechargeData !== null}
                        className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                          rechargeData !== null ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <label 
                        htmlFor="useBalance" 
                        className={`text-sm font-medium ${
                          rechargeData !== null ? 'text-gray-500' : 'text-blue-800'
                        }`}
                      >
                        Usar saldo del cliente
                        {rechargeData !== null && (
                          <span className="block text-xs text-gray-400 mt-1">
                            No disponible para recargas
                          </span>
                        )}
                      </label>
                    </div>
                    
                    {useBalance && (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total a pagar:</span>
                            <span className="font-medium">{currencySymbol}{total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Saldo a usar:</span>
                            <span className="font-medium text-blue-600">{currencySymbol}{balanceAmount.toFixed(2)}</span>
                          </div>
                          {remainingAmount > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Restante a pagar:</span>
                                <span className="font-medium text-orange-600">{currencySymbol}{remainingAmount.toFixed(2)}</span>
                              </div>
                              <div className="pt-2 border-t border-gray-200">
                                <div className="text-sm text-gray-600 mb-2">Método para el resto:</div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setRemainingPaymentMethod('cash')}
                                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                                      remainingPaymentMethod === 'cash'
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                    }`}
                                  >
                                    Efectivo
                                  </button>
                                  <button
                                    onClick={() => setRemainingPaymentMethod('card')}
                                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                                      remainingPaymentMethod === 'card'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                    }`}
                                  >
                                    Tarjeta
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}



            {/* Totales */}
            <div className={`rounded-lg p-4 mb-6 ${isRefund ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'}`}>
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
                {isRefund && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">
                      🔴 ATENCIÓN: Debe devolver {currencySymbol}{formatPrice(Math.abs(total))} al cliente
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Método de pago - solo mostrar si no se usa saldo o hay monto restante */}
            {(!useBalance || remainingAmount > 0) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {useBalance ? 'Método para el Resto' : 'Método de Pago'}
                </h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => useBalance ? setRemainingPaymentMethod('cash') : setPaymentMethod('cash')}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      (useBalance ? remainingPaymentMethod : paymentMethod) === 'cash'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    onClick={() => useBalance ? setRemainingPaymentMethod('card') : setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      (useBalance ? remainingPaymentMethod : paymentMethod) === 'card'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input para efectivo */}
            {((!useBalance && paymentMethod === 'cash') || (useBalance && remainingPaymentMethod === 'cash' && remainingAmount > 0)) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {useBalance ? 'Cantidad Recibida (Resto)' : 'Cantidad Recibida'}
                </label>
                <button
                  onClick={() => openNumericKeypad(useBalance ? 'remaining' : 'cash')}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className={useBalance ? (remainingCashReceived ? 'text-gray-900' : 'text-gray-500') : (cashReceived ? 'text-gray-900' : 'text-gray-500')}>
                    {useBalance ? (remainingCashReceived || '0.00') : (cashReceived || '0.00')}
                  </span>
                  <span className="text-gray-400 ml-2">€</span>
                </button>
                {parseFloat(useBalance ? remainingCashReceived : cashReceived) > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Cambio: </span>
                    <span className={`font-semibold ${(useBalance ? remainingChange : change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currencySymbol}{(useBalance ? remainingChange : change).toFixed(2)}
                    </span>
                  </div>
                )}
                {/* Indicación de cobro parcial */}
                {!useBalance && cashReceived && parseFloat(cashReceived) < total && !isTicketWithoutTable && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                    ⚠️ Cobro parcial: Quedarán {currencySymbol}{(total - parseFloat(cashReceived)).toFixed(2)} pendientes
                  </div>
                )}
                {/* Advertencia para tickets sin mesa */}
                {!useBalance && cashReceived && parseFloat(cashReceived) < total && isTicketWithoutTable && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                    ❌ Se requiere el pago completo de {currencySymbol}{total.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              {/* Botón para previsualizar PDF */}
              <button
                onClick={generateTicketPDF}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Previsualizar Ticket PDF</span>
              </button>
              
              {/* Botón principal de completar cobro */}
              <button
                onClick={handlePaymentComplete}
                disabled={
                  // Solo validar que haya un monto introducido, permitir cobros parciales
                  (!useBalance && paymentMethod === 'cash' && !cashReceived) ||
                  // Pago con saldo pero hay monto restante en efectivo: validar que haya monto
                  (useBalance && remainingAmount > 0 && remainingPaymentMethod === 'cash' && !remainingCashReceived)
                }
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg flex items-center justify-center space-x-2 font-semibold text-lg transition-colors disabled:cursor-not-allowed"
              >

                <Printer className="w-5 h-5" />
                <span>
                  {useBalance && remainingAmount === 0 
                    ? 'Completar Cobro con Saldo e Imprimir PDF'
                    : 'Completar Cobro e Imprimir PDF'
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teclado numérico */}
      {showNumericKeypad && editingAmountFor && (
        <NumericKeypad
          value={editingAmountFor === 'cash' ? parseFloat(cashReceived || '0') : parseFloat(remainingCashReceived || '0')}
          onConfirm={handleAmountConfirm}
          onCancel={handleAmountCancel}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};

export default PaymentModal;
