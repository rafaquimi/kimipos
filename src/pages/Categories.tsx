import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Save,
  X,
  Palette,
  Link as LinkIcon,
  Power,
  DollarSign
} from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { Category, Product } from '../types/product';
import { ProductCombination } from '../types/product';
import { useConfig } from '../contexts/ConfigContext';
import NumericKeypad from '../components/NumericKeypad';
import toast from 'react-hot-toast';

const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, products, updateProduct } = useProducts() as any;
  const { getCurrencySymbol } = useConfig();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Nueva sección: combinaciones por categoría
  const [comboFromCategoryId, setComboFromCategoryId] = useState<string>('');
  const [comboToCategoryId, setComboToCategoryId] = useState<string>('');
  const [comboPrice, setComboPrice] = useState<number>(0);

  // Estado para edición masiva de precios en el resumen
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadDestId, setKeypadDestId] = useState<string | null>(null);
  const [keypadInitial, setKeypadInitial] = useState<number>(0);

  // Colores predefinidos para las categorías
  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Filtrar categorías
  const filteredCategories = categories.filter(category =>
    !searchTerm || category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para crear/editar
  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        color: predefinedColors[0]
      });
    }
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  // Guardar categoría
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      isActive: true
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast.success('Categoría actualizada exitosamente');
    } else {
      addCategory(categoryData);
      toast.success('Categoría creada exitosamente');
    }

    closeModal();
  };

  // Eliminar categoría
  const handleDelete = (category: Category) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      try {
        deleteCategory(category.id);
        toast.success('Categoría eliminada');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al eliminar la categoría');
      }
    }
  };

  const applyCategoryCombinations = () => {
    if (!comboFromCategoryId || !comboToCategoryId) {
      toast.error('Selecciona categoría origen y destino');
      return;
    }
    if (comboFromCategoryId === comboToCategoryId) {
      toast.error('El origen y destino no pueden ser iguales');
      return;
    }

    // Productos de la categoría origen
    const sourceProducts: Product[] = (products as Product[]).filter(p => p.categoryId === comboFromCategoryId);
    if (sourceProducts.length === 0) {
      toast.error('La categoría origen no tiene productos');
      return;
    }

    // Para cada producto origen, agregamos una combinación por categoría destino
    sourceProducts.forEach(p => {
      const existing = p.combinations || [];
      // quitar previas hacia esa categoría (evitar duplicados)
      const withoutDest = existing.filter(c => c.categoryId !== comboToCategoryId);
      const newCombo: ProductCombination = {
        id: `comb-catcat-${comboFromCategoryId}-${comboToCategoryId}-${p.id}`,
        categoryId: comboToCategoryId,
        additionalPrice: comboPrice,
        isActive: true
      };
      updateProduct(p.id, { combinations: [...withoutDest, newCombo] });
    });

    toast.success(`Combinaciones aplicadas a ${sourceProducts.length} productos`);
  };

  // Acciones masivas desde el resumen
  const bulkSetActiveForDest = (originCategoryId: string, destCategoryId: string, active: boolean) => {
    const sourceProducts: Product[] = (products as Product[]).filter(p => p.categoryId === originCategoryId);
    sourceProducts.forEach(p => {
      const updated = (p.combinations || []).map(c => (
        c.categoryId === destCategoryId ? { ...c, isActive: active } : c
      ));
      updateProduct(p.id, { combinations: updated });
    });
    toast.success(`${active ? 'Activadas' : 'Desactivadas'} combinaciones hacia la categoría seleccionada`);
  };

  const openBulkEditPrice = (destCategoryId: string, initial: number) => {
    setKeypadDestId(destCategoryId);
    setKeypadInitial(initial);
    setShowKeypad(true);
  };

  const confirmBulkPrice = (value: number) => {
    if (!editingCategory || !keypadDestId) {
      setShowKeypad(false);
      return;
    }
    const sourceProducts: Product[] = (products as Product[]).filter(p => p.categoryId === editingCategory.id);
    sourceProducts.forEach(p => {
      const updated = (p.combinations || []).map(c => (
        c.categoryId === keypadDestId ? { ...c, additionalPrice: value } : c
      ));
      updateProduct(p.id, { combinations: updated });
    });
    setShowKeypad(false);
    setKeypadDestId(null);
    toast.success('Precio actualizado para todas las combinaciones seleccionadas');
  };

  const cancelBulkPrice = () => {
    setShowKeypad(false);
    setKeypadDestId(null);
  };

  // Resumen de combinaciones por categoría (para el modal de edición)
  const renderCategoryCombinationSummary = (categoryId: string) => {
    const sourceProducts: Product[] = (products as Product[]).filter(p => p.categoryId === categoryId);
    const total = sourceProducts.length;
    const destToPrices: Record<string, number[]> = {};
    const destToActiveCount: Record<string, number> = {};

    sourceProducts.forEach(p => {
      (p.combinations || [])
        .filter(c => !!c.categoryId)
        .forEach(c => {
          const key = c.categoryId as string;
          if (!destToPrices[key]) destToPrices[key] = [];
          destToPrices[key].push(c.additionalPrice);
          destToActiveCount[key] = (destToActiveCount[key] || 0) + (c.isActive ? 1 : 0);
        });
    });

    const destIds = Object.keys(destToPrices);
    if (destIds.length === 0) {
      return (
        <div className="text-sm text-gray-500">Sin combinaciones por categoría</div>
      );
    }

    const currency = getCurrencySymbol();

    return (
      <div className="space-y-2">
        {destIds.map(destId => {
          const prices = destToPrices[destId];
          const dest = categories.find((c: Category) => c.id === destId);
          const count = prices.length;
          const activeCount = destToActiveCount[destId] || 0;
          const allActive = activeCount === count;
          const uniform = prices.every(p => p === prices[0]);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const initialForEdit = uniform ? prices[0] : min;
          return (
            <div key={destId} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded text-white" style={{ backgroundColor: dest?.color || '#64748b' }}>
                  {dest?.name || 'Categoría'}
                </span>
                <span className="text-xs text-gray-500">{activeCount}/{count} activos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {uniform ? `${currency}${initialForEdit.toFixed(2)}` : `Varios (${currency}${min.toFixed(2)} - ${currency}${max.toFixed(2)})`}
                </span>
                <button
                  onClick={() => openBulkEditPrice(destId, initialForEdit)}
                  className="text-xs inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Editar precio masivo"
                >
                  <DollarSign className="w-3 h-3 mr-1"/> Precio
                </button>
                <button
                  onClick={() => bulkSetActiveForDest(categoryId, destId, !allActive)}
                  className={`text-xs inline-flex items-center px-2 py-1 rounded ${allActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  title={allActive ? 'Desactivar todas' : 'Activar todas'}
                >
                  <Power className="w-3 h-3 mr-1"/> {allActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
            <p className="text-gray-600">Organiza tus productos por categorías</p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2 px-6 py-4 min-h-[48px] text-base font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Categoría</span>
          </button>
        </div>

        {/* Sección: Combinaciones masivas por categoría */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Combinaciones por categorías</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded inline-flex items-center"><LinkIcon className="w-3 h-3 mr-1"/> Rápido</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={comboFromCategoryId}
              onChange={(e) => setComboFromCategoryId(e.target.value)}
              className="px-3 py-2 text-sm border border-blue-200 rounded-lg bg-white"
            >
              <option value="">Origen</option>
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="text-sm text-blue-700">se combina con</span>
            <select
              value={comboToCategoryId}
              onChange={(e) => setComboToCategoryId(e.target.value)}
              className="px-3 py-2 text-sm border border-blue-200 rounded-lg bg-white"
            >
              <option value="">Destino</option>
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={comboPrice}
              onChange={(e) => setComboPrice(parseFloat(e.target.value) || 0)}
              className="w-28 px-3 py-2 text-sm border border-blue-200 rounded-lg"
              placeholder="Precio ±"
            />
            <button
              onClick={applyCategoryCombinations}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Aplicar a la categoría
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-1">El campo "Precio" sirve para añadir (o restar con valores negativos) el precio a la categoría destino.</p>
          <p className="text-xs text-blue-600 mt-1">Aplica una combinación por categoría destino a todos los productos de la categoría origen.</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category: Category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openModal(category)}
                    className="p-3 text-gray-400 hover:text-blue-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-3 text-gray-400 hover:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {category.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Categoría
                </span>
                <div
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.color}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron categorías</p>
            <button
              onClick={() => openModal()}
              className="mt-4 btn btn-primary px-6 py-4 min-h-[48px] text-base font-medium"
            >
              Crear primera categoría
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear/editar categoría */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-3 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nombre de la categoría"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descripción opcional de la categoría"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="space-y-3">
                    {/* Selector de color personalizado */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                    
                    {/* Colores predefinidos */}
                    <div className="grid grid-cols-5 gap-3">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-12 h-12 rounded-full border-2 transition-all ${
                            formData.color === color 
                              ? 'border-gray-900 scale-110' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vista previa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vista previa
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-sm font-medium">
                      {formData.name || 'Nombre de la categoría'}
                    </span>
                  </div>
                </div>

                {/* Resumen de combinaciones por categoría */}
                {editingCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Combinaciones de esta categoría
                    </label>
                    {renderCategoryCombinationSummary(editingCategory.id)}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-6 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[48px] flex items-center justify-center text-base font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 min-h-[48px] text-base font-medium"
                >
                  <Save className="w-5 h-5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teclado numérico para edición masiva */}
      {showKeypad && keypadDestId && editingCategory && (
        <NumericKeypad
          value={keypadInitial}
          onConfirm={confirmBulkPrice}
          onCancel={cancelBulkPrice}
          currencySymbol={getCurrencySymbol()}
        />
      )}
    </div>
  );
};

export default Categories;
