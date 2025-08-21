import React, { useState } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import { Product, ProductCombination } from '../types/product';

interface CombinationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseProduct: Product;
  combinations: ProductCombination[];
  availableProducts: Product[];
  onConfirmCombination: (baseProduct: Product, selectedProducts: Array<{product: Product, quantity: number}>) => void;
  currencySymbol?: string;
}

const CombinationSelectorModal: React.FC<CombinationSelectorModalProps> = ({
  isOpen,
  onClose,
  baseProduct,
  combinations,
  availableProducts,
  onConfirmCombination,
  currencySymbol = '€'
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Array<{product: Product, quantity: number}>>([]);

  if (!isOpen) return null;

  // Filtrar productos que pueden combinarse
  const combinableProducts = availableProducts.filter(product => 
    combinations.some(combination => {
      // Combinación por producto específico
      if (combination.productId && combination.productId === product.id && combination.isActive) {
        return true;
      }
      // Combinación por categoría
      if (combination.categoryId && combination.categoryId === product.categoryId && combination.isActive) {
        return true;
      }
      return false;
    })
  );

  const getCombinationPrice = (product: Product) => {
    // Buscar primero combinación específica por producto
    const specificCombination = combinations.find(c => c.productId === product.id);
    if (specificCombination) {
      return specificCombination.additionalPrice;
    }
    
    // Si no hay combinación específica, buscar por categoría
    const categoryCombination = combinations.find(c => c.categoryId === product.categoryId);
    return categoryCombination?.additionalPrice || 0;
  };

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(sp => sp.product.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(sp => 
        sp.product.id === product.id 
          ? { ...sp, quantity: sp.quantity + 1 }
          : sp
      ));
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    const existing = selectedProducts.find(sp => sp.product.id === productId);
    if (existing && existing.quantity > 1) {
      setSelectedProducts(selectedProducts.map(sp => 
        sp.product.id === productId 
          ? { ...sp, quantity: sp.quantity - 1 }
          : sp
      ));
    } else {
      setSelectedProducts(selectedProducts.filter(sp => sp.product.id !== productId));
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = baseProduct.price;
    const combinationPrice = selectedProducts.reduce((total, sp) => {
      return total + (getCombinationPrice(sp.product) * sp.quantity);
    }, 0);
    return basePrice + combinationPrice;
  };

  const handleConfirm = () => {
    onConfirmCombination(baseProduct, selectedProducts);
    setSelectedProducts([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedProducts([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleCancel}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Combinar Producto
              </h3>
              <button
                onClick={handleCancel}
                className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              {baseProduct.name} - Selecciona productos para combinar
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productos disponibles para combinar */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Disponibles</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {combinableProducts.map((product) => {
                    const combinationPrice = getCombinationPrice(product);
                    return (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                                                             <span className={`text-xs px-2 py-1 rounded ${
                                 combinationPrice > 0 
                                   ? 'bg-green-100 text-green-600' 
                                   : combinationPrice < 0 
                                   ? 'bg-red-100 text-red-600'
                                   : 'bg-gray-100 text-gray-600'
                               }`}>
                                 {combinationPrice > 0 ? '+' : ''}{currencySymbol}{combinationPrice.toFixed(2)}
                               </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {product.description || 'Sin descripción'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              {currencySymbol}{product.price.toFixed(2)}
                            </span>
                            <Plus className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Productos seleccionados */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Seleccionados</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay productos seleccionados</p>
                      <p className="text-sm mt-1">Selecciona productos de la lista para combinarlos</p>
                    </div>
                  ) : (
                    selectedProducts.map(({ product, quantity }) => {
                      const combinationPrice = getCombinationPrice(product);
                      return (
                        <div key={product.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {product.name}
                                </span>
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                  x{quantity}
                                </span>
                              </div>
                                                             <p className="text-sm text-gray-500 mt-1">
                                 {combinationPrice > 0 ? '+' : ''}{currencySymbol}{combinationPrice.toFixed(2)} por unidad
                               </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                                             <span className={`text-sm font-medium ${
                                 (combinationPrice * quantity) > 0 ? 'text-green-600' : 
                                 (combinationPrice * quantity) < 0 ? 'text-red-600' : 'text-gray-600'
                               }`}>
                                 {(combinationPrice * quantity) > 0 ? '+' : ''}{currencySymbol}{(combinationPrice * quantity).toFixed(2)}
                               </span>
                              <button
                                onClick={() => removeProduct(product.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de precio */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Precio base:</p>
                  <p className="text-sm text-gray-600">Precio combinaciones:</p>
                  <p className="font-medium text-gray-900">Total:</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{currencySymbol}{baseProduct.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    +{currencySymbol}{selectedProducts.reduce((total, sp) => 
                      total + (getCombinationPrice(sp.product) * sp.quantity), 0
                    ).toFixed(2)}
                  </p>
                  <p className="font-medium text-lg text-gray-900">
                    {currencySymbol}{calculateTotalPrice().toFixed(2)}
                  </p>
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
                onClick={handleConfirm}
                disabled={selectedProducts.length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Combinación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinationSelectorModal;
