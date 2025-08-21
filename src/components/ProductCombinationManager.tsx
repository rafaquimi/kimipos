import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Link, Settings } from 'lucide-react';
import { ProductCombination, Category } from '../types/product';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Combinaciones Disponibles</h4>
        <span className="text-xs text-gray-500">
          {combinations.length} combinaciones
        </span>
      </div>

      {/* Lista de combinaciones existentes */}
      <div className="space-y-2">
        {combinations.map((combination) => (
          <div key={combination.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            {editingCombination === combination.id ? (
              // Modo edición
              <div className="flex-1 flex items-center space-x-2">
                <select
                  value={combination.categoryId}
                  onChange={(e) => updateCombination(combination.id, { categoryId: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
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
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  placeholder="Precio +"
                />
                <button
                  onClick={() => setEditingCombination(null)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Modo visualización
              <div className="flex-1 flex items-center justify-between">
                                 <div className="flex items-center space-x-3">
                   <div className="flex items-center space-x-2">
                     <Link className="w-4 h-4 text-blue-500" />
                     <span className={`text-sm font-medium ${
                       combination.isActive ? 'text-gray-700' : 'text-gray-400'
                     }`}>
                       {combination.productId 
                         ? getProductName(combination.productId)
                         : getCategoryName(combination.categoryId!)
                       }
                     </span>
                     {combination.productId && (
                       <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">
                         Producto
                       </span>
                     )}
                     {combination.categoryId && (
                       <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                         Categoría
                       </span>
                     )}
                     {!combination.isActive && (
                       <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded">
                         Inactiva
                       </span>
                     )}
                   </div>
                   <span className={`text-sm font-medium ${
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
                    title="Editar combinación"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCombination(combination.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar combinación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

             {/* Formulario para agregar nueva combinación */}
       <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
         <div className="flex items-center space-x-2 mb-3">
           <Plus className="w-4 h-4 text-gray-500" />
           <span className="text-sm font-medium text-gray-700">Agregar Nueva Combinación</span>
         </div>
         
         <div className="space-y-3">
           {/* Combinación por categoría (nuevo sistema) */}
           <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-blue-800">Categoría completa (recomendado)</span>
               <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Nuevo</span>
             </div>
             <div className="flex items-center space-x-2">
               <select
                 value={newCombination.categoryId}
                 onChange={(e) => setNewCombination({ 
                   ...newCombination, 
                   categoryId: e.target.value 
                 })}
                 className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="">Seleccionar categoría</option>
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
                 className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Precio ±"
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
                 className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
               >
                 <Settings className="w-4 h-4 inline mr-1" />
                 Detalle
               </button>
             </div>
             <p className="text-xs text-blue-600 mt-1">
               💡 Establece un precio base y luego personaliza cada producto individualmente
             </p>
           </div>

           {/* Combinación por producto específico (sistema anterior) */}
           <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-gray-700">Producto específico</span>
               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Legacy</span>
             </div>
             <div className="flex items-center space-x-2">
               <select
                 value={newCombination.productId}
                 onChange={(e) => setNewCombination({ 
                   ...newCombination, 
                   productId: e.target.value 
                 })}
                 className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="">Seleccionar producto específico</option>
                 {products.map(product => (
                   <option key={product.id} value={product.id}>
                     {product.name} - {product.price.toFixed(2)}€
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
                 className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Precio ±"
               />
               <button
                 onClick={addCombination}
                 disabled={!newCombination.productId}
                 className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
               >
                 Agregar
               </button>
             </div>
           </div>
         </div>
         
         <div className="mt-3 text-xs text-gray-500">
           <p>💡 Puedes usar precios negativos para descuentos (ej: -1.00€)</p>
           <p>💡 Precio 0.00€ = sin costo adicional</p>
         </div>
       </div>

      {/* Información adicional */}
      {combinations.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>No hay combinaciones configuradas.</p>
          <p className="mt-1">Agrega combinaciones para permitir que este producto se combine con otros de categorías específicas.</p>
        </div>
      )}

                    {combinations.length > 0 && (
         <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
           <p><strong>Información sobre combinaciones:</strong></p>
           <ul className="mt-1 space-y-1">
             <li>• <strong>Categoría completa (recomendado):</strong> Establece un precio base y personaliza cada producto</li>
             <li>• <strong>Producto específico:</strong> Combinación directa con un producto individual</li>
             <li>• <strong>Precio positivo (+):</strong> Se suma al precio base del producto</li>
             <li>• <strong>Precio negativo (-):</strong> Se resta del precio base (descuento)</li>
             <li>• <strong>Precio 0.00€:</strong> Sin costo adicional</li>
             <li>• <strong>Botón "Detalle":</strong> Abre un popup para editar precios individuales</li>
             <li>• En el dashboard, aparecerá la opción de combinar cuando sea relevante</li>
             <li>• Puedes activar/desactivar combinaciones sin eliminarlas</li>
           </ul>
         </div>
       )}

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
