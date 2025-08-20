import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Save,
  X,
  Palette
} from 'lucide-react';
import { useProducts, Category } from '../contexts/ProductContext';
import toast from 'react-hot-toast';

const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

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
          {filteredCategories.map((category) => (
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
    </div>
  );
};

export default Categories;
