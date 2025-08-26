import { useState, useEffect } from 'react';
import {
  getSystemPrinters,
  getCommonPrinters,
  combinePrinters,
  checkPrinterServerHealth,
  type PrinterInfo
} from '../services/printerService';

export const useSystemPrinters = () => {
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectPrinters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar si el servidor de impresoras está disponible
      const serverAvailable = await checkPrinterServerHealth();

      if (serverAvailable) {
        console.log('🔍 Servidor de impresoras disponible, obteniendo lista...');

        // Obtener impresoras del sistema desde el backend
        const systemPrinters = await getSystemPrinters();

        // Solo usar impresoras del sistema (sin combinar con genéricas)
        setPrinters(systemPrinters.map(p => p.name));

        console.log(`✅ Se obtuvieron ${systemPrinters.length} impresoras reales del sistema`);
      } else {
        console.log('⚠️ Servidor de impresoras no disponible');
        setError('El servidor de impresoras no está disponible. Inicia el servidor con "npm run server"');
        setPrinters([]);
      }
    } catch (error) {
      console.error('❌ Error al detectar impresoras del sistema:', error);
      setError('Error al conectar con el servidor de impresoras.');
      setPrinters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    detectPrinters();
  }, []);

  return {
    printers,
    isLoading,
    error,
    refreshPrinters: detectPrinters
  };
};
