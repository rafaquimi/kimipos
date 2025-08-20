import React, { useState } from 'react';
import { X, Receipt, CreditCard, DollarSign, Printer, Download } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

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
  total
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const { getCurrencySymbol, getTaxRate, config } = useConfig();

  if (!isOpen) return null;

  const currencySymbol = getCurrencySymbol();
  const change = parseFloat(cashReceived) - total;

  const generateTicket = () => {
    const ticketContent = `
${config.restaurant_name}
================================
Fecha: ${new Date().toLocaleDateString()}
Hora: ${new Date().toLocaleTimeString()}
Mesa: ${tableNumber}
${customerName ? `Cliente: ${customerName}` : ''}
================================
${orderItems.map(item => 
  `${item.productName}
  ${item.quantity} x ${currencySymbol}${item.unitPrice.toFixed(2)} = ${currencySymbol}${item.totalPrice.toFixed(2)}`
).join('\n')}
================================
Subtotal: ${currencySymbol}${subtotal.toFixed(2)}
IVA (${(getTaxRate() * 100).toFixed(0)}%): ${currencySymbol}${tax.toFixed(2)}
TOTAL: ${currencySymbol}${total.toFixed(2)}
================================
Método de pago: ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
${paymentMethod === 'cash' ? `Recibido: ${currencySymbol}${parseFloat(cashReceived).toFixed(2)}
Cambio: ${currencySymbol}${change.toFixed(2)}` : ''}
================================
¡Gracias por su visita!
    `.trim();

    // Crear archivo para descargar
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-mesa-${tableNumber}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePaymentComplete = () => {
    generateTicket();
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
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Receipt className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Cobro - Mesa {tableNumber}
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
                {orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="text-sm font-medium">
                      {currencySymbol}{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({(getTaxRate() * 100).toFixed(0)}%):</span>
                  <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>TOTAL:</span>
                  <span className="text-primary-600">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Método de pago */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Método de Pago</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Input para efectivo */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Recibida
                </label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min={total}
                />
                {parseFloat(cashReceived) > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Cambio: </span>
                    <span className={`font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currencySymbol}{change.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex space-x-3">
              <button
                onClick={generateTicket}
                className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Ticket</span>
              </button>
              <button
                onClick={handlePaymentComplete}
                disabled={paymentMethod === 'cash' && (parseFloat(cashReceived) < total || !cashReceived)}
                className="flex-1 btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                <span>Completar Cobro</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
