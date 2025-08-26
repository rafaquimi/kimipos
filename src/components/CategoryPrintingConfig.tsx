import React, { useState } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { useConfig } from '../contexts/ConfigContext';
import { useSystemPrinters } from '../hooks/useSystemPrinters';
import { Printer, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryPrintingConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryPrintingConfig: React.FC<CategoryPrintingConfigProps> = ({ isOpen, onClose }) => {
  const { categories, products, updateCategoryPrinter } = useProducts();
  const { config } = useConfig();
  const { printers: systemPrinters, isLoading: isLoadingPrinters } = useSystemPrinters();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const activeCategories = categories.filter(c => c.isActive);
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const productsInCategory = selectedCategoryData 
    ? products.filter(p => p.categoryId === selectedCategory && p.isActive)
    : [];

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      setSelectedPrinter(category?.printerName || '');
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      toast.error('Selecciona una categoría');
      return;
    }

    setIsUpdating(true);
    try {
      updateCategoryPrinter(selectedCategory, selectedPrinter);
      
      const printerText = selectedPrinter || 'Sin impresora configurada';
      const categoryName = selectedCategoryData?.name || 'Categoría';
      
      toast.success(
        `${productsInCategory.length} productos de "${categoryName}" configurados para impresora: ${printerText}`,
        { duration: 4000 }
      );
      
      onClose();
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      toast.error('Error al actualizar la configuración');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Printer className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Configuración de Impresión por Categoría
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Selección de categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Seleccionar categoría --</option>
              {activeCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({products.filter(p => p.categoryId === category.id && p.isActive).length} productos)
                </option>
              ))}
            </select>
          </div>

          {/* Información de la categoría seleccionada */}
          {selectedCategoryData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedCategoryData.color }}
                />
                <h3 className="font-medium text-blue-900">{selectedCategoryData.name}</h3>
              </div>
              <p className="text-sm text-blue-700">
                {productsInCategory.length} producto{productsInCategory.length !== 1 ? 's' : ''} activo{productsInCategory.length !== 1 ? 's' : ''}
              </p>
              {selectedCategoryData.description && (
                <p className="text-sm text-blue-600 mt-1">{selectedCategoryData.description}</p>
              )}
            </div>
          )}

          {/* Configuración de impresión */}
          {selectedCategory && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Configuración de Impresión
                </label>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="categoryPrinterSelect" className="block text-sm font-medium text-gray-700 mb-2">
                      Impresora para todos los productos de esta categoría
                    </label>
                    <select
                      id="categoryPrinterSelect"
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sin impresora configurada</option>
                      {isLoadingPrinters ? (
                        <option value="" disabled>Cargando impresoras...</option>
                      ) : (
                        systemPrinters.map((printerName) => (
                          <option key={printerName} value={printerName}>
                            {printerName}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      Esta configuración se aplicará a todos los productos de la categoría que no tengan una impresora específica configurada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de productos afectados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Productos que se actualizarán:
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {productsInCategory.length > 0 ? (
                    <div className="space-y-1">
                      {productsInCategory.map(product => (
                        <div key={product.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{product.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">${product.price.toFixed(2)}</span>
                            {product.printerName && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {product.printerName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay productos activos en esta categoría</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estado de impresoras */}
          {isLoadingPrinters ? (
            <div className="text-sm text-gray-500">
              🔄 Cargando impresoras...
            </div>
          ) : systemPrinters.length > 0 ? (
            <div className="text-sm text-gray-500">
              🖨️ {systemPrinters.length} impresora{systemPrinters.length !== 1 ? 's' : ''} disponible{systemPrinters.length !== 1 ? 's' : ''}
            </div>
          ) : (
            <div className="text-sm text-red-500">
              ⚠️ No se detectaron impresoras del sistema
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCategory || isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                <span>Actualizar Categoría</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
