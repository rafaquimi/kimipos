// Servicio para consumir la API de impresoras del backend

export interface PrinterInfo {
  name: string;
  status?: string;
  default?: boolean;
  id?: string;
  model?: string;
  type?: string;
  uri?: string;
}

export interface PrintersResponse {
  success: boolean;
  printers: PrinterInfo[];
  count: number;
  error?: string;
}

/**
 * Obtiene la lista de impresoras del sistema desde el backend
 */
export const getSystemPrinters = async (): Promise<PrinterInfo[]> => {
  try {
    const response = await fetch('http://localhost:3001/printers');

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: PrintersResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error desconocido');
    }

    console.log(`✅ Se obtuvieron ${data.count} impresoras del backend:`, data.printers);
    return data.printers;
  } catch (error) {
    console.error('❌ Error obteniendo impresoras del backend:', error);
    throw error;
  }
};

/**
 * Obtiene la impresora predeterminada del sistema
 */
export const getDefaultPrinter = async (): Promise<PrinterInfo | null> => {
  try {
    const response = await fetch('http://localhost:3001/printers/default');

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Error desconocido');
    }

    console.log('✅ Impresora predeterminada obtenida:', data.printer);
    return data.printer;
  } catch (error) {
    console.error('❌ Error obteniendo impresora predeterminada:', error);
    return null;
  }
};

/**
 * Verifica si el servidor de impresoras está disponible
 */
export const checkPrinterServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3001/health');
    return response.ok;
  } catch (error) {
    console.log('⚠️ Servidor de impresoras no disponible:', error);
    return false;
  }
};

/**
 * Lista de impresoras comunes como fallback
 */
export const getCommonPrinters = (): string[] => {
  return [
    'Microsoft Print to PDF',
    'Microsoft XPS Document Writer',
    'Microsoft Print to OneNote',
    'HP LaserJet Pro M404n',
    'HP LaserJet Pro MFP M428fdw',
    'HP LaserJet Pro M15w',
    'HP LaserJet Pro MFP M148fdw',
    'Canon PIXMA TS8320',
    'Canon PIXMA MG3620',
    'Canon PIXMA TR4520',
    'Epson WorkForce WF-3720',
    'Epson Expression Home XP-4100',
    'Epson EcoTank ET-2720',
    'Brother HL-L2350DW',
    'Brother MFC-L2710DW',
    'Brother HL-L2370DW',
    'Samsung Xpress M2020W',
    'Samsung Xpress M2070W',
    'Lexmark MS310dn',
    'Lexmark CS410dn',
    'Impresora por defecto del sistema',
    'Impresora térmica genérica',
    'Impresora de cocina',
    'Impresora de bar',
    'Impresora de recibos',
    'Impresora de tickets'
  ];
};

/**
 * Combina impresoras del sistema con impresoras comunes
 */
export const combinePrinters = (systemPrinters: PrinterInfo[], commonPrinters: string[]): string[] => {
  // Si tenemos impresoras del sistema, solo usar esas
  if (systemPrinters.length > 0) {
    console.log('✅ Usando solo impresoras reales del sistema:', systemPrinters.map(p => p.name));
    return systemPrinters.map(p => p.name);
  }
  
  // Solo usar impresoras comunes si no hay impresoras del sistema
  console.log('⚠️ No se detectaron impresoras del sistema, usando lista genérica');
  return commonPrinters;
};
