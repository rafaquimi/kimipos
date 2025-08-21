import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { Product, ProductCombination } from '../types/product';
import NumericKeypad from './NumericKeypad';

interface ProductCombinationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  products: Product[];
  baseCombinationPrice: number;
  onSave: (combinations: ProductCombination[]) => void;
  currencySymbol?: string;
}

const ProductCombinationDetailModal: React.FC<ProductCombinationDetailModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  products,
  baseCombinationPrice,
  onSave,
  currencySymbol = '€'
}) => {
  const [productPrices, setProductPrices] = useState<{[key: string]: number}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showNumericKeypad, setShowNumericKeypad] = useState(false);
  const [editingPriceFor, setEditingPriceFor] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Inicializar precios cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const initialPrices: {[key: string]: number} = {};
      products.forEach(product => {
        initialPrices[product.id] = baseCombinationPrice;
      });
      setProductPrices(initialPrices);
      setHasChanges(false);
    }
  }, [isOpen, products, baseCombinationPrice]);

  const handlePriceChange = (productId: string, newPrice: number) => {
    setProductPrices(prev => ({
      ...prev,
      [productId]: newPrice
    }));
    setHasChanges(true);
  };

  const openNumericKeypad = (productId: string) => {
    setEditingPriceFor(productId);
    setTempPrice((productPrices[productId] || 0).toString());
    setShowNumericKeypad(true);
  };

  const handleNumericKeypadConfirm = (value: string) => {
    if (editingPriceFor) {
      const numValue = parseFloat(value) || 0;
      handlePriceChange(editingPriceFor, numValue);
    }
    setShowNumericKeypad(false);
    setEditingPriceFor(null);
    setTempPrice('');
  };

  const handleNumericKeypadCancel = () => {
    setShowNumericKeypad(false);
    setEditingPriceFor(null);
    setTempPrice('');
  };

  const resetToBasePrice = () => {
    const resetPrices: {[key: string]: number} = {};
    products.forEach(product => {
      resetPrices[product.id] = baseCombinationPrice;
    });
    setProductPrices(resetPrices);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Crear combinaciones individuales para cada producto
    const combinations: ProductCombination[] = products.map(product => ({
      id: `comb-${categoryId}-${product.id}`,
      productId: product.id,
      additionalPrice: productPrices[product.id],
      isActive: true
    }));

    onSave(combinations);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleCancel}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-4 sm:align-middle sm:max-w-7xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Detalle de Productos - {categoryName}
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  Precio base de categoría: {baseCombinationPrice > 0 ? '+' : ''}{currencySymbol}{baseCombinationPrice.toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {products.length} productos en {categoryName}
                </span>
                <button
                  onClick={resetToBasePrice}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restablecer a precio base</span>
                </button>
              </div>
              {hasChanges && (
                <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  Cambios sin guardar
                </span>
              )}
            </div>

                         {/* Products Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {product.description || 'Sin descripción'}
                      </p>
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full ml-2"
                      style={{ backgroundColor: product.backgroundColor || '#6b7280' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Precio base:</span>
                      <span>{currencySymbol}{product.price.toFixed(2)}</span>
                    </div>
                    
                                         <div className="flex items-center space-x-2">
                       <label className="text-sm font-medium text-gray-700 flex-1">
                         Precio combinación:
                       </label>
                       <div className="relative">
                         <button
                           type="button"
                           onClick={() => openNumericKeypad(product.id)}
                           className={`w-24 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right cursor-pointer hover:bg-gray-50 transition-colors ${
                             productPrices[product.id] > 0 
                               ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                               : productPrices[product.id] < 0 
                               ? 'border-red-300 bg-red-50 hover:bg-red-100'
                               : 'border-gray-300 hover:bg-gray-50'
                           }`}
                         >
                           {(productPrices[product.id] || 0).toFixed(2)}
                         </button>
                         <span className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-none">
                           €
                         </span>
                       </div>
                     </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Precio final:</span>
                      <span className={`font-medium ${
                        (product.price + (productPrices[product.id] || 0)) > product.price 
                          ? 'text-green-600' 
                          : (product.price + (productPrices[product.id] || 0)) < product.price 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                      }`}>
                        {currencySymbol}{(product.price + (productPrices[product.id] || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Productos con precio +:</span>
                  <div className="font-medium text-green-600">
                    {products.filter(p => (productPrices[p.id] || 0) > 0).length}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Productos con descuento:</span>
                  <div className="font-medium text-red-600">
                    {products.filter(p => (productPrices[p.id] || 0) < 0).length}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Sin cambio:</span>
                  <div className="font-medium text-gray-600">
                    {products.filter(p => (productPrices[p.id] || 0) === 0).length}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Total productos:</span>
                  <div className="font-medium text-gray-900">
                    {products.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Guardar Cambios
              </button>
            </div>
                     </div>
         </div>
       </div>

       {/* Teclado numérico */}
       {showNumericKeypad && (
         <NumericKeypad
           isOpen={showNumericKeypad}
           onClose={handleNumericKeypadCancel}
           onConfirm={handleNumericKeypadConfirm}
           initialValue={tempPrice}
           title={`Editar precio - ${editingPriceFor ? products.find(p => p.id === editingPriceFor)?.name : ''}`}
         />
       )}
     </div>
   );
 };

export default ProductCombinationDetailModal;
