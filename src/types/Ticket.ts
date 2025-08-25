export interface ClosedTicket {
  id: string;
  ticketId: string;
  tableNumber: string;
  customerName?: string;
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  cashReceived?: string;
  cardAmount?: string;
  currencySymbol: string;
  selectedCustomer?: any;
  useBalance?: boolean;
  balanceAmount?: number;
  remainingAmount?: number;
  remainingPaymentMethod?: 'cash' | 'card';
  restaurantName: string;
  documentType: 'ticket' | 'recharge' | 'balance_payment' | 'partial_receipt';
  partialPayments?: PartialPayment[];
  totalPartialPayments?: number;
  finalPaymentAmount?: number;
  businessData?: {
    fiscalName: string;
    taxId: string;
    commercialName: string;
    address: string;
    phone: string;
    email: string;
    city: string;
  };
  taxBreakdown?: TaxBreakdown[];
  closedAt: Date;
  mergedTableNumber?: string;
}

export interface OrderItem {
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

export interface PartialPayment {
  id: string;
  tableId: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  date: Date;
  receiptNumber: string;
}

export interface TaxBreakdown {
  taxName: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
}
