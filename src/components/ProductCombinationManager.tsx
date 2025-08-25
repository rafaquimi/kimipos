import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Link, Settings, Save } from 'lucide-react';
import { ProductCombination, Category, Product } from '../types/product';
import ProductCombinationDetailModal from './ProductCombinationDetailModal';

interface ProductCombinationManagerProps {
  combinations: ProductCombination[];
  categories: Category[];
  products: Product[];
  onChange: (combinations: ProductCombination[]) => void;
}

const ProductCombinationManager: React.FC<ProductCombinationManagerProps> = ({ 
  combinations, 
  categories, 
  products,
  onChange 
}) => {
  const [editingCombination, setEditingCombination] = useState<string | null>(null);
  const [newCombination, setNewCombination] = useState({ 
    productId: '', 
    categoryId: '', 
    additionalPrice: 0,
    combinationType: 'product' // 'product' o 'category'
  });

  // Estado para el modal de detalle
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    categoryId: '',
    categoryName: '',
    basePrice: 0
  });

  const addCombination = () => {
    if (newCombination.combinationType === 'product' && !newCombination.productId) {
      alert('Por favor selecciona un producto');
      return;
    }
    if (newCombination.combinationType === 'category' && !newCombination.categoryId) {
      alert('Por favor selecciona una categoría');
      return;
    }

    // Verificar que no exista ya una combinación con este producto o categoría
    const exists = combinations.some(c => 
      (newCombination.combinationType === 'product' && c.productId === newCombination.productId) ||
      (newCombination.combinationType === 'category' && c.categoryId === newCombination.categoryId)
    );
    if (exists) {
      alert('Ya existe una combinación con este elemento');
      return;
    }

    const combination: ProductCombination = {
      id: `combination-${Date.now()}`,
      productId: newCombination.combinationType === 'product' ? newCombination.productId : undefined,
      categoryId: newCombination.combinationType === 'category' ? newCombination.categoryId : undefined,
      additionalPrice: newCombination.additionalPrice,
      isActive: true
    };

    onChange([...combinations, combination]);
    setNewCombination({ 
      productId: '', 
      categoryId: '', 
      additionalPrice: 0, 
      combinationType: 'product' 
    });
  };

  const updateCombination = (id: string, updates: Partial<ProductCombination>) => {
    const updatedCombinations = combinations.map(combination => 
      combination.id === id ? { ...combination, ...updates } : combination
    );
    onChange(updatedCombinations);
    setEditingCombination(null);
  };

  const deleteCombination = (id: string) => {
    onChange(combinations.filter(c => c.id !== id));
  };

  const toggleCombinationStatus = (id: string) => {
    const updatedCombinations = combinations.map(combination => 
      combination.id === id 
        ? { ...combination, isActive: !combination.isActive }
        : combination
    );
    onChange(updatedCombinations);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Categoría no encontrada';
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Producto no encontrado';
  };

  const openDetailModal = (categoryId: string, categoryName: string, basePrice: number) => {
    setDetailModal({
      isOpen: true,
      categoryId,
      categoryName,
      basePrice
    });
  };

  const handleDetailModalSave = (newCombinations: ProductCombination[]) => {
    // Eliminar combinaciones existentes de esta categoría
    const filteredCombinations = combinations.filter(c => c.categoryId !== detailModal.categoryId);
    
    // Agregar las nuevas combinaciones individuales
    onChange([...filteredCombinations, ...newCombinations]);
  };

  // Guardar directamente para toda la categoría con el mismo precio
  const saveCategoryBaseCombinations = () => {
    if (!newCombination.categoryId) {
      alert('Selecciona una categoría');
      return;
    }
    const categoryProducts = products.filter(p => p.categoryId === newCombination.categoryId);
    if (categoryProducts.length === 0) {
      alert('La categoría seleccionada no tiene productos');
      return;
    }

    const newCombinations: ProductCombination[] = categoryProducts.map(p => ({
      id: `comb-${newCombination.categoryId}-${p.id}`,
      productId: p.id,
      additionalPrice: newCombination.additionalPrice,
      isActive: true
    }));

    // Quitar combinaciones previas de estos productos o de la categoría
    const targetProductIds = new Set(categoryProducts.map(p => p.id));
    const filtered = combinations.filter(c => !(c.productId && targetProductIds.has(c.productId)) && c.categoryId !== newCombination.categoryId);

    onChange([...filtered, ...newCombinations]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h4 className="text-xs font-medium text-gray-700">Combinaciones</h4>
        <span className="text-xs text-gray-500">
          {combinations.length} combinaciones
        </span>
      </div>

      {/* Formulario para agregar nueva combinación - SIEMPRE ARRIBA */}
      <div className="border border-dashed border-gray-300 rounded p-2 mb-3 flex-shrink-0">
        <div className="flex items-center space-x-1 mb-2">
          <Plus className="w-3 h-3 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Nueva Combinación</span>
        </div>
        
        <div className="space-y-2">
          {/* Combinación por categoría */}
          <div className="p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-800">Categoría completa</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Nuevo</span>
            </div>
            <div className="flex items-center space-x-1">
              <select
                value={newCombination.categoryId}
                onChange={(e) => setNewCombination({ 
                  ...newCombination, 
                  categoryId: e.target.value 
                })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={newCombination.additionalPrice}
                onChange={(e) => setNewCombination({ 
                  ...newCombination, 
                  additionalPrice: parseFloat(e.target.value) || 0 
                })}
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="€"
              />
              <button
                onClick={() => {
                  if (newCombination.categoryId && newCombination.categoryId !== '') {
                    const category = categories.find(c => c.id === newCombination.categoryId);
                    if (category) {
                      openDetailModal(category.id, category.name, newCombination.additionalPrice);
                    }
                  }
                }}
                disabled={!newCombination.categoryId}
                className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Detalle"
              >
                <Settings className="w-3 h-3" />
              </button>
              <button
                onClick={saveCategoryBaseCombinations}
                disabled={!newCombination.categoryId}
                className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Guardar"
              >
                <Save className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Combinación por producto específico */}
          <div className="p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Producto específico</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">Legacy</span>
            </div>
            <div className="flex items-center space-x-1">
              <select
                value={newCombination.productId}
                onChange={(e) => setNewCombination({ 
                  ...newCombination, 
                  productId: e.target.value 
                })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Producto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={newCombination.additionalPrice}
                onChange={(e) => setNewCombination({ 
                  ...newCombination, 
                  additionalPrice: parseFloat(e.target.value) || 0 
                })}
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="€"
              />
              <button
                onClick={addCombination}
                disabled={!newCombination.productId}
                className="px-2 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Agregar"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de combinaciones existentes - CON SCROLL */}
      <div className="flex-1 min-h-0">
        <div className="space-y-1">
          {combinations.map((combination) => (
            <div key={combination.id} className="flex items-center space-x-1 p-2 bg-gray-50 rounded text-xs">
              {editingCombination === combination.id ? (
                // Modo edición
                <div className="flex-1 flex items-center space-x-1">
                  <select
                    value={combination.categoryId}
                    onChange={(e) => updateCombination(combination.id, { categoryId: e.target.value })}
                    className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={combination.additionalPrice}
                    onChange={(e) => updateCombination(combination.id, { 
                      additionalPrice: parseFloat(e.target.value) || 0 
                    })}
                    className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    placeholder="€"
                  />
                  <button
                    onClick={() => setEditingCombination(null)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                // Modo visualización
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link className="w-3 h-3 text-blue-500" />
                    <span className={`text-xs font-medium ${
                      combination.isActive ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {combination.productId 
                        ? getProductName(combination.productId)
                        : getCategoryName(combination.categoryId!)}
                    </span>
                    <span className={`text-xs font-medium ${
                      combination.additionalPrice > 0 ? 'text-green-600' : 
                      combination.additionalPrice < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {combination.additionalPrice > 0 ? '+' : ''}€{combination.additionalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleCombinationStatus(combination.id)}
                      className={`p-1 rounded text-xs ${
                        combination.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={combination.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {combination.isActive ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => setEditingCombination(combination.id)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="Editar"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteCombination(combination.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Información adicional */}
        {combinations.length === 0 && (
          <div className="text-center py-2 text-gray-500 text-xs">
            <p>No hay combinaciones configuradas.</p>
          </div>
        )}

        {combinations.length > 0 && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded mt-2">
            <p><strong>Info:</strong> Precio + = suma, - = descuento, 0 = sin costo</p>
          </div>
        )}
      </div>

      {/* Modal de detalle de productos */}
      <ProductCombinationDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        categoryId={detailModal.categoryId}
        categoryName={detailModal.categoryName}
        products={products.filter(p => p.categoryId === detailModal.categoryId)}
        baseCombinationPrice={detailModal.basePrice}
        onSave={handleDetailModalSave}
        currencySymbol="€"
      />
    </div>
  );
};

export default ProductCombinationManager;
