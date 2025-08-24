import { jsPDF } from 'jspdf';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  modifiers?: string[];
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
  currencySymbol: string;
  // Información del cliente y saldo
  selectedCustomer?: any;
  useBalance?: boolean;
  balanceAmount?: number;
  remainingAmount?: number;
  remainingPaymentMethod?: 'cash' | 'card';
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

    // Encabezado del restaurante
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleWidth = doc.getTextWidth(ticketData.restaurantName);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(ticketData.restaurantName, titleX, yPosition);
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
    doc.text(`Mesa: ${ticketData.tableNumber}`, leftMargin, yPosition);
    yPosition += 15;

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
    
    const taxText = `IVA: ${ticketData.currencySymbol}${ticketData.tax.toFixed(2)}`;
    const taxWidth = doc.getTextWidth(taxText);
    doc.text(taxText, pageWidth - rightMargin - taxWidth, yPosition);
    yPosition += 12;
    
    // Total final
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const totalText = `TOTAL: ${ticketData.currencySymbol}${ticketData.total.toFixed(2)}`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.text(totalText, pageWidth - rightMargin - totalWidth, yPosition);
    yPosition += 20;

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
      yPosition += 20;
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
