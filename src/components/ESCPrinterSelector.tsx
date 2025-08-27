import React, { useState, useEffect } from 'react';
import { Printer, Wifi, Usb, Settings, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { ESCPOSPrinter, escposPrinterService } from '../utils/escposPrinterService';
import toast from 'react-hot-toast';

interface ESCPrinterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrinter: (printer: ESCPOSPrinter) => void;
  selectedPrinter?: ESCPOSPrinter;
}

const ESCPrinterSelector: React.FC<ESCPrinterSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPrinter,
  selectedPrinter
}) => {
  const [printers, setPrinters] = useState<ESCPOSPrinter[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    setLoading(true);
    try {
      await escposPrinterService.initialize();
      const availablePrinters = escposPrinterService.getPrinters();
      setPrinters(availablePrinters);
    } catch (error) {
      console.error('Error cargando impresoras:', error);
      toast.error('Error al cargar las impresoras ESC/POS');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPrinter = async (printer: ESCPOSPrinter) => {
    try {
      const success = await escposPrinterService.connectToPrinter(printer.id);
      if (success) {
        // Actualizar el estado local
        setPrinters(prev => prev.map(p => 
          p.id === printer.id ? { ...p, isConnected: true } : p
        ));
        toast.success(`Conectado a ${printer.name}`);
      } else {
        toast.error(`Error conectando a ${printer.name}`);
      }
    } catch (error) {
      console.error('Error conectando impresora:', error);
      toast.error(`Error conectando a ${printer.name}`);
    }
  };

  const handleDisconnectPrinter = async (printer: ESCPOSPrinter) => {
    try {
      const success = await escposPrinterService.disconnectFromPrinter(printer.id);
      if (success) {
        // Actualizar el estado local
        setPrinters(prev => prev.map(p => 
          p.id === printer.id ? { ...p, isConnected: false } : p
        ));
        toast.success(`Desconectado de ${printer.name}`);
      } else {
        toast.error(`Error desconectando de ${printer.name}`);
      }
    } catch (error) {
      console.error('Error desconectando impresora:', error);
      toast.error(`Error desconectando de ${printer.name}`);
    }
  };

  const handleTestPrinter = async (printer: ESCPOSPrinter) => {
    setTestingPrinter(printer.id);
    try {
      const success = await escposPrinterService.testPrinter(printer.id);
      if (success) {
        toast.success(`Prueba de impresión exitosa en ${printer.name}`);
      } else {
        toast.error(`Error en prueba de impresión de ${printer.name}`);
      }
    } catch (error) {
      console.error('Error probando impresora:', error);
      toast.error(`Error probando ${printer.name}`);
    } finally {
      setTestingPrinter(null);
    }
  };

  const getPrinterIcon = (type: string) => {
    switch (type) {
      case 'usb':
        return <Usb className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Printer className="w-4 h-4" />;
    }
  };

  const getPrinterTypeLabel = (type: string) => {
    switch (type) {
      case 'usb':
        return 'USB';
      case 'network':
        return 'Red';
      default:
        return 'Desconocido';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Seleccionar Impresora ESC/POS</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando impresoras...</p>
            </div>
          ) : printers.length === 0 ? (
            <div className="text-center py-8">
              <Printer className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No se detectaron impresoras ESC/POS</p>
              <p className="text-sm text-gray-500 mt-1">
                Asegúrate de que las impresoras estén conectadas y encendidas
              </p>
              <button
                onClick={loadPrinters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {printers.map((printer) => (
                <div
                  key={printer.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    selectedPrinter?.id === printer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getPrinterIcon(printer.type)}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {getPrinterTypeLabel(printer.type)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{printer.name}</h3>
                        {printer.address && (
                          <p className="text-sm text-gray-500">{printer.address}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Estado de conexión */}
                      <div className="flex items-center space-x-1">
                        {printer.isConnected ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {printer.isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex items-center space-x-1">
                        {printer.isConnected ? (
                          <button
                            onClick={() => handleDisconnectPrinter(printer)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Desconectar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnectPrinter(printer)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Conectar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleTestPrinter(printer)}
                          disabled={testingPrinter === printer.id || !printer.isConnected}
                          className={`p-1 rounded transition-colors ${
                            testingPrinter === printer.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : printer.isConnected
                              ? 'text-blue-600 hover:bg-blue-100'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title="Probar impresora"
                        >
                          {testingPrinter === printer.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => onSelectPrinter(printer)}
                          disabled={!printer.isConnected}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            printer.isConnected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Seleccionar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {printers.length > 0 && (
                <span>{printers.filter(p => p.isConnected).length} de {printers.length} conectadas</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadPrinters}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Actualizar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESCPrinterSelector;
