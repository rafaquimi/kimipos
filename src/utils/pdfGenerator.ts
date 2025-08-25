import { jsPDF } from 'jspdf';

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

interface PartialPayment {
  id: string;
  tableId: string;
  amount: number;
  paymentMethod: 'cash' | 'card';
  date: Date;
  receiptNumber: string;
}

interface TaxBreakdown {
  taxName: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
}

interface TicketData {
  restaurantName: string;
  tableNumber: string;
  customerName?: string;
  mergedTableNumber?: string;
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  cashReceived?: string;
  cardAmount?: string;
  currencySymbol: string;
  // Información del cliente y saldo
  selectedCustomer?: any;
  useBalance?: boolean;
  balanceAmount?: number;
  remainingAmount?: number;
  remainingPaymentMethod?: 'cash' | 'card';
  // Tipo de documento
  documentType?: 'ticket' | 'recharge' | 'balance_payment' | 'partial_receipt';
  // Información de cobros parciales
  partialPayments?: PartialPayment[];
  totalPartialPayments?: number;
  finalPaymentAmount?: number;
  // Datos del negocio
  businessData?: {
    fiscalName: string;
    taxId: string;
    commercialName: string;
    address: string;
    phone: string;
    email: string;
    city: string;
  };
  // Desglose de impuestos
  taxBreakdown?: TaxBreakdown[];
  // ID del ticket
  ticketId?: string;
}

export const generatePOSTicketPDF = (ticketData: TicketData): string => {
  try {
    // Crear PDF con tamaño fijo para simplificar
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [226, 800] // 80mm ancho, altura fija
    });

    let yPosition = 20;
    const pageWidth = 226;
    const leftMargin = 10;
    const rightMargin = 10;
    const contentWidth = pageWidth - leftMargin - rightMargin;

    // Determinar el tipo de documento
    const isRecharge = ticketData.documentType === 'recharge';
    const isBalancePayment = ticketData.documentType === 'balance_payment';
    const isPartialReceipt = ticketData.documentType === 'partial_receipt';

    // Encabezado del restaurante (usar nombre comercial si está disponible)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const restaurantTitle = ticketData.businessData?.commercialName || ticketData.restaurantName || 'Restaurante';
    const titleWidth = doc.getTextWidth(restaurantTitle);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(restaurantTitle, titleX, yPosition);
    yPosition += 20;
    
    // Datos del negocio si están disponibles
    if (ticketData.businessData) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Nombre comercial
      if (ticketData.businessData.commercialName) {
        const commercialNameWidth = doc.getTextWidth(ticketData.businessData.commercialName);
        const commercialNameX = (pageWidth - commercialNameWidth) / 2;
        doc.text(ticketData.businessData.commercialName, commercialNameX, yPosition);
        yPosition += 12;
      }
      
      // Nombre fiscal
      if (ticketData.businessData.fiscalName) {
        const fiscalNameWidth = doc.getTextWidth(ticketData.businessData.fiscalName);
        const fiscalNameX = (pageWidth - fiscalNameWidth) / 2;
        doc.text(ticketData.businessData.fiscalName, fiscalNameX, yPosition);
        yPosition += 12;
      }
      
      // CIF/NIF
      if (ticketData.businessData.taxId) {
        const taxIdWidth = doc.getTextWidth(`CIF/NIF: ${ticketData.businessData.taxId}`);
        const taxIdX = (pageWidth - taxIdWidth) / 2;
        doc.text(`CIF/NIF: ${ticketData.businessData.taxId}`, taxIdX, yPosition);
        yPosition += 12;
      }
      
      // Dirección
      if (ticketData.businessData.address) {
        const addressWidth = doc.getTextWidth(ticketData.businessData.address);
        const addressX = (pageWidth - addressWidth) / 2;
        doc.text(ticketData.businessData.address, addressX, yPosition);
        yPosition += 12;
      }
      
      // Ciudad
      if (ticketData.businessData.city) {
        const cityWidth = doc.getTextWidth(ticketData.businessData.city);
        const cityX = (pageWidth - cityWidth) / 2;
        doc.text(ticketData.businessData.city, cityX, yPosition);
        yPosition += 12;
      }
      
      // Teléfono
      if (ticketData.businessData.phone) {
        const phoneWidth = doc.getTextWidth(`Tel: ${ticketData.businessData.phone}`);
        const phoneX = (pageWidth - phoneWidth) / 2;
        doc.text(`Tel: ${ticketData.businessData.phone}`, phoneX, yPosition);
        yPosition += 12;
      }
      
      // Email
      if (ticketData.businessData.email) {
        const emailWidth = doc.getTextWidth(ticketData.businessData.email);
        const emailX = (pageWidth - emailWidth) / 2;
        doc.text(ticketData.businessData.email, emailX, yPosition);
        yPosition += 12;
      }
    }
    
    // Espacio adicional antes del título del documento
    yPosition += 15;
    
    // Título del documento según el tipo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    let documentTitle = 'FACTURA SIMPLIFICADA';
    if (isRecharge) {
      documentTitle = 'RECARGA DE SALDO';
    } else if (isBalancePayment) {
      documentTitle = 'ALBARÁN';
    } else if (isPartialReceipt) {
      documentTitle = 'RECIBO PARCIAL';
    } else if (ticketData.documentType === 'balance_payment') {
      documentTitle = 'RECIBO DE PAGO CON SALDO';
    }
    
    const documentTitleWidth = doc.getTextWidth(documentTitle);
    const documentTitleX = (pageWidth - documentTitleWidth) / 2;
    doc.text(documentTitle, documentTitleX, yPosition);
    yPosition += 20;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 10;

    // Información de fecha y hora
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Fecha: ${now.toLocaleDateString('es-ES')}`, leftMargin, yPosition);
    yPosition += 12;
    doc.text(`Hora: ${now.toLocaleTimeString('es-ES')}`, leftMargin, yPosition);
    yPosition += 12;
    
    // ID del ticket o recibo
    if (ticketData.ticketId) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const isReceipt = ticketData.documentType === 'balance_payment';
      const label = isReceipt ? 'Recibo Nº:' : 'Factura Sim. Nº:';
      doc.text(`${label} ${ticketData.ticketId}`, leftMargin, yPosition);
      yPosition += 12;
    }
    
    // Mostrar mesa solo si no es recarga
    if (!isRecharge) {
    doc.text(`Mesa: ${ticketData.tableNumber}`, leftMargin, yPosition);
    yPosition += 15;
    }

    // Información del cliente si existe
    if (ticketData.selectedCustomer) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE:', leftMargin, yPosition);
      yPosition += 12;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const customerName = `${ticketData.selectedCustomer.name} ${ticketData.selectedCustomer.lastName}`;
      doc.text(customerName, leftMargin, yPosition);
      yPosition += 12;
      
      if (ticketData.selectedCustomer.email) {
        doc.text(`Email: ${ticketData.selectedCustomer.email}`, leftMargin, yPosition);
        yPosition += 12;
      }
      
      if (ticketData.selectedCustomer.phone) {
        doc.text(`Tel: ${ticketData.selectedCustomer.phone}`, leftMargin, yPosition);
        yPosition += 12;
      }
      
      if (ticketData.selectedCustomer.cardCode) {
        doc.text(`Tarjeta: ${ticketData.selectedCustomer.cardCode}`, leftMargin, yPosition);
        yPosition += 12;
      }
      
      yPosition += 5;
    }

    // Línea separadora
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 10;

    // Productos
    ticketData.orderItems.forEach((item) => {
      // Nombre del producto
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(item.productName, leftMargin, yPosition);
      yPosition += 12;
      
      // Cantidad y precio
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const itemLine = `${item.quantity} x ${ticketData.currencySymbol}${item.unitPrice.toFixed(2)}`;
      const itemTotal = `${ticketData.currencySymbol}${item.totalPrice.toFixed(2)}`;
      
      doc.text(itemLine, leftMargin, yPosition);
      const totalWidth = doc.getTextWidth(itemTotal);
      doc.text(itemTotal, pageWidth - rightMargin - totalWidth, yPosition);
      yPosition += 15;
    });

    // Línea separadora
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 10;

    // Totales
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const subtotalText = `Subtotal: ${ticketData.currencySymbol}${ticketData.subtotal.toFixed(2)}`;
    const subtotalWidth = doc.getTextWidth(subtotalText);
    doc.text(subtotalText, pageWidth - rightMargin - subtotalWidth, yPosition);
    yPosition += 12;
    
    // Desglose de impuestos si está disponible
    if (ticketData.taxBreakdown && ticketData.taxBreakdown.length > 0) {
      // Mostrar cada tipo de IVA por separado
      ticketData.taxBreakdown.forEach((taxItem) => {
        const taxSubtotalText = `${taxItem.taxName} (${(taxItem.taxRate * 100).toFixed(0)}%): ${ticketData.currencySymbol}${taxItem.subtotal.toFixed(2)}`;
        const taxSubtotalWidth = doc.getTextWidth(taxSubtotalText);
        doc.text(taxSubtotalText, pageWidth - rightMargin - taxSubtotalWidth, yPosition);
        yPosition += 12;
        
        const taxAmountText = `IVA ${(taxItem.taxRate * 100).toFixed(0)}%: ${ticketData.currencySymbol}${taxItem.taxAmount.toFixed(2)}`;
        const taxAmountWidth = doc.getTextWidth(taxAmountText);
        doc.text(taxAmountText, pageWidth - rightMargin - taxAmountWidth, yPosition);
        yPosition += 12;
      });
    } else {
      // Mostrar IVA general si no hay desglose
      const taxText = `IVA: ${ticketData.currencySymbol}${ticketData.tax.toFixed(2)}`;
      const taxWidth = doc.getTextWidth(taxText);
      doc.text(taxText, pageWidth - rightMargin - taxWidth, yPosition);
      yPosition += 12;
    }
    
    // Total final - mostrar importe pendiente si hay cobros parciales
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Total final - mostrar siempre como "TOTAL"
    const totalText = `TOTAL: ${ticketData.currencySymbol}${ticketData.total.toFixed(2)}`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.text(totalText, pageWidth - rightMargin - totalWidth, yPosition);
    
    yPosition += 20;

    // Información específica para recibos parciales
    if (isPartialReceipt) {
      // Línea separadora
      doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
      yPosition += 10;
      
      // Sección de cobro parcial
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('COBRO PARCIAL', leftMargin, yPosition);
      yPosition += 15;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Total de la cuenta
      const accountTotalText = `Total de la cuenta: ${ticketData.currencySymbol}${ticketData.total.toFixed(2)}`;
      const accountTotalWidth = doc.getTextWidth(accountTotalText);
      doc.text(accountTotalText, pageWidth - rightMargin - accountTotalWidth, yPosition);
      yPosition += 12;
      
      // Monto cobrado
      const amountPaidText = `Monto cobrado: ${ticketData.currencySymbol}${ticketData.total.toFixed(2)}`;
      const amountPaidWidth = doc.getTextWidth(amountPaidText);
      doc.text(amountPaidText, pageWidth - rightMargin - amountPaidWidth, yPosition);
      yPosition += 12;
      
      // Monto pendiente
      const pendingAmount = ticketData.total - ticketData.total; // Esto se calculará correctamente cuando implementemos el sistema
      const pendingText = `Monto pendiente: ${ticketData.currencySymbol}${pendingAmount.toFixed(2)}`;
      const pendingWidth = doc.getTextWidth(pendingText);
      doc.text(pendingText, pageWidth - rightMargin - pendingWidth, yPosition);
      yPosition += 15;
      
      // Aviso
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Este es un recibo parcial. La factura fiscal se generará al liquidar la cuenta completa.', leftMargin, yPosition);
      yPosition += 15;
    }

    // Información de cobros parciales en ticket final
    if (ticketData.partialPayments && ticketData.partialPayments.length > 0) {
      // Línea separadora
      doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
      yPosition += 10;
      
      // Sección de cobros parciales
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PAGOS PREVIOS REALIZADOS', leftMargin, yPosition);
      yPosition += 15;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Resumen de la cuenta
      // El total que viene ya es el total original de la mesa
      const totalOriginal = ticketData.total;
      const summaryText = `Total de la cuenta: ${ticketData.currencySymbol}${totalOriginal.toFixed(2)}`;
      doc.text(summaryText, leftMargin, yPosition);
      yPosition += 12;
      
      // Listar cada pago previo con más detalle
      ticketData.partialPayments.forEach((payment, index) => {
        const paymentDate = new Date(payment.date).toLocaleDateString('es-ES');
        const paymentTime = new Date(payment.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const paymentMethodText = payment.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta';
        
        // Detalles del pago
        const paymentText = `${paymentDate} ${paymentTime} - ${paymentMethodText}: ${ticketData.currencySymbol}${payment.amount.toFixed(2)}`;
        doc.text(paymentText, leftMargin, yPosition);
        yPosition += 12;
      });
      
      // Resumen de pagos
      if (ticketData.totalPartialPayments) {
        yPosition += 5;
        doc.setFont('helvetica', 'bold');
        const totalPartialText = `Total pagado anteriormente: ${ticketData.currencySymbol}${ticketData.totalPartialPayments.toFixed(2)}`;
        const totalPartialWidth = doc.getTextWidth(totalPartialText);
        doc.text(totalPartialText, pageWidth - rightMargin - totalPartialWidth, yPosition);
        yPosition += 12;
        
        // Monto final cobrado en este ticket
        const finalPaymentAmount = ticketData.finalPaymentAmount || ticketData.total;
        const finalPaymentText = `Pago final realizado: ${ticketData.currencySymbol}${finalPaymentAmount.toFixed(2)}`;
        const finalPaymentWidth = doc.getTextWidth(finalPaymentText);
        doc.text(finalPaymentText, pageWidth - rightMargin - finalPaymentWidth, yPosition);
        yPosition += 15;
      }
    }

    // Detalles del pago con saldo si se usó
    if (ticketData.useBalance && ticketData.balanceAmount && ticketData.balanceAmount > 0) {
      // Línea separadora
      doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
      yPosition += 10;
      
      // Sección de pago con saldo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PAGO CON SALDO', leftMargin, yPosition);
      yPosition += 15;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Saldo usado
      const balanceUsedText = `Saldo usado: ${ticketData.currencySymbol}${ticketData.balanceAmount.toFixed(2)}`;
      const balanceUsedWidth = doc.getTextWidth(balanceUsedText);
      doc.text(balanceUsedText, pageWidth - rightMargin - balanceUsedWidth, yPosition);
      yPosition += 12;
      
      // Saldo restante
      if (ticketData.selectedCustomer) {
        const remainingBalance = ticketData.selectedCustomer.balance - ticketData.balanceAmount;
        const remainingBalanceText = `Saldo restante: ${ticketData.currencySymbol}${remainingBalance.toFixed(2)}`;
        const remainingBalanceWidth = doc.getTextWidth(remainingBalanceText);
        doc.text(remainingBalanceText, pageWidth - rightMargin - remainingBalanceWidth, yPosition);
        yPosition += 12;
      }
      
      // Método para el resto si hay monto restante
      if (ticketData.remainingAmount && ticketData.remainingAmount > 0) {
        const remainingMethodText = ticketData.remainingPaymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta';
        const remainingText = `Resto pagado con: ${remainingMethodText}`;
        const remainingWidth = doc.getTextWidth(remainingText);
        doc.text(remainingText, pageWidth - rightMargin - remainingWidth, yPosition);
        yPosition += 12;
      }
      
      yPosition += 10;
    }

    // Línea separadora
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 10;

    // Método de pago (solo si no se usó saldo o hay monto restante)
    if (!ticketData.useBalance || (ticketData.remainingAmount && ticketData.remainingAmount > 0)) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const paymentMethodText = ticketData.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta';
      doc.text(`Pago: ${paymentMethodText}`, leftMargin, yPosition);
      yPosition += 12;
      
      // Mostrar cantidad recibida
      if (ticketData.paymentMethod === 'cash' && ticketData.cashReceived) {
        const amountText = `Recibido: ${ticketData.currencySymbol}${parseFloat(ticketData.cashReceived).toFixed(2)}`;
        doc.text(amountText, leftMargin, yPosition);
        yPosition += 12;
        
        // Mostrar cambio si es necesario
        const change = parseFloat(ticketData.cashReceived) - ticketData.total;
        if (change > 0) {
          const changeText = `Cambio: ${ticketData.currencySymbol}${change.toFixed(2)}`;
          doc.text(changeText, leftMargin, yPosition);
          yPosition += 12;
        }
      } else if (ticketData.paymentMethod === 'card' && ticketData.cardAmount) {
        const amountText = `Cobrado: ${ticketData.currencySymbol}${parseFloat(ticketData.cardAmount).toFixed(2)}`;
        doc.text(amountText, leftMargin, yPosition);
        yPosition += 12;
      }
      yPosition += 8;
    }
    
    // Información adicional para recargas
    if (isRecharge && ticketData.selectedCustomer) {
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Saldo actualizado:', leftMargin, yPosition);
      yPosition += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const newBalance = ticketData.selectedCustomer.balance + ticketData.total;
      doc.text(`${ticketData.currencySymbol}${newBalance.toFixed(2)}`, leftMargin, yPosition);
      yPosition += 12;
    }

    // Pie de página
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const footerText = '¡Gracias por su visita!';
    const footerWidth = doc.getTextWidth(footerText);
    const footerX = (pageWidth - footerWidth) / 2;
    doc.text(footerText, footerX, yPosition);

    return doc.output('dataurlstring');

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('No se pudo generar el ticket PDF');
  }
};



export const openPDFInNewWindow = (pdfDataUrl: string, fileName: string = 'ticket') => {
  try {
    console.log('Intentando abrir PDF en nueva ventana...');
    
    // Crear ventana popup con contenido HTML que muestre el PDF
    const newWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket - ${fileName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif;
                background: #f5f5f5;
              }
              .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #333;
              }
              .actions {
                text-align: center;
                margin-bottom: 20px;
              }
              .btn {
                background: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin: 0 10px;
                text-decoration: none;
                display: inline-block;
              }
              .btn:hover {
                background: #0056b3;
              }
              .pdf-container {
                text-align: center;
              }
              iframe {
                border: 1px solid #ddd;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Ticket de Compra</h2>
                <p>Mesa: ${fileName.includes('mesa') ? fileName.split('-mesa-')[1]?.split('-')[0] : 'N/A'}</p>
              </div>
              <div class="actions">
                <button class="btn" onclick="window.print()">🖨️ Imprimir</button>
                <a class="btn" href="${pdfDataUrl}" download="${fileName}.pdf">💾 Descargar PDF</a>
                <button class="btn" onclick="window.close()">❌ Cerrar</button>
              </div>
              <div class="pdf-container">
                <iframe src="${pdfDataUrl}" width="100%" height="800px" type="application/pdf">
                  <p>Tu navegador no puede mostrar PDFs. <a href="${pdfDataUrl}" download="${fileName}.pdf">Haz clic aquí para descargar</a></p>
                </iframe>
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      console.log('PDF abierto en popup exitosamente');
    } else {
      console.log('No se pudo abrir popup, descargando...');
      downloadPDF(pdfDataUrl, fileName);
    }
  } catch (error) {
    console.error('Error abriendo PDF:', error);
    downloadPDF(pdfDataUrl, fileName);
  }
};

const downloadPDF = (pdfDataUrl: string, fileName: string) => {
  console.log('Descargando PDF...');
  const link = document.createElement('a');
  link.href = pdfDataUrl;
  link.download = `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log('PDF descargado');
};

// Función auxiliar para calcular el desglose de impuestos
export const calculateTaxBreakdown = (orderItems: OrderItem[]): TaxBreakdown[] => {
  const taxMap = new Map<string, TaxBreakdown>();
  
  orderItems.forEach((item) => {
    if (item.taxRate !== undefined && item.taxName) {
      const key = `${item.taxName}-${item.taxRate}`;
      
      if (!taxMap.has(key)) {
        taxMap.set(key, {
          taxName: item.taxName,
          taxRate: item.taxRate,
          subtotal: 0,
          taxAmount: 0
        });
      }
      
      const taxItem = taxMap.get(key)!;
      taxItem.subtotal += item.totalPrice;
      taxItem.taxAmount += item.totalPrice * item.taxRate;
    }
  });
  
  return Array.from(taxMap.values()).sort((a, b) => b.taxRate - a.taxRate);
};
