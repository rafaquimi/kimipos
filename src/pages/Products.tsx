import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { Product } from '../types/product';
import { useConfig } from '../contexts/ConfigContext';
import ColorPicker from '../components/ColorPicker';
import ProductTariffManager from '../components/ProductTariffManager';
import ProductCombinationManager from '../components/ProductCombinationManager';
import { ProductTariff, ProductCombination } from '../types/product';
import toast from 'react-hot-toast';

const Products: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useProducts();
  const { getCurrencySymbol, config } = useConfig();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    backgroundColor: '#3b82f6', // Color por defecto
    isActive: true,
    taxId: '', // ID del impuesto seleccionado
    askForPrice: false
  });
  const [productTariffs, setProductTariffs] = useState<ProductTariff[]>([]);
  const [productCombinations, setProductCombinations] = useState<ProductCombination[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesStatus = showInactive || product.isActive;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Abrir modal para crear/editar
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        categoryId: product.categoryId,
        description: product.description || '',
        backgroundColor: product.backgroundColor || '#3b82f6',
        isActive: product.isActive,
        taxId: product.taxId || config.defaultTaxId || '',
        askForPrice: product.askForPrice || false
      });
      setProductTariffs(product.tariffs || []);
      setProductCombinations(product.combinations || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        categoryId: categories[0]?.id || '',
        description: '',
        backgroundColor: '#3b82f6',
        isActive: true,
        taxId: config.defaultTaxId || '',
        askForPrice: false
      });
      setProductTariffs([]);
      setProductCombinations([]);
    }
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      categoryId: '',
      description: '',
      backgroundColor: '#3b82f6',
      isActive: true,
      taxId: '',
      askForPrice: false
    });
    setProductTariffs([]);
    setProductCombinations([]);
  };

  // Guardar producto
  const handleSave = () => {
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    const price = parseFloat(formData.price);
    if (price <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    const productData = {
      name: formData.name.trim(),
      price,
      categoryId: formData.categoryId,
      description: formData.description.trim(),
      backgroundColor: formData.backgroundColor,
      taxId: formData.taxId,
      tariffs: productTariffs,
      combinations: productCombinations,
      isActive: formData.isActive,
      askForPrice: formData.askForPrice
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success('Producto actualizado exitosamente');
    } else {
      addProduct(productData);
      toast.success('Producto creado exitosamente');
    }

    closeModal();
  };

  // Eliminar producto
  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      deleteProduct(product.id);
      toast.success('Producto eliminado');
    }
  };

  // Cambiar estado activo/inactivo
  const toggleStatus = (product: Product) => {
    updateProduct(product.id, { isActive: !product.isActive });
    toast.success(`Producto ${!product.isActive ? 'activado' : 'desactivado'}`);
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600">Administra tu catálogo de productos</p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn btn-primary flex items-center space-x-2 px-6 py-4 min-h-[48px] text-base font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Búsqueda */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Mostrar inactivos */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Mostrar inactivos</span>
            </label>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio/Tarifas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-gray-500">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {category && (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          {product.tariffs && product.tariffs.length > 0 ? (
                            <div className="space-y-1">
                              {product.tariffs.map((tariff, index) => (
                                <div key={tariff.id} className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    tariff.isDefault 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {tariff.name}
                                  </span>
                                  <span className="font-medium">
                                    {getCurrencySymbol()}{tariff.price.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-1" />
                              {getCurrencySymbol()}{product.price.toFixed(2)}
                            </>
                                                )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        {product.backgroundColor && (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: product.backgroundColor }}
                              title={product.backgroundColor}
                            />
                            <span className="text-xs text-gray-600 font-mono">
                              {product.backgroundColor}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleStatus(product)}
                            className="p-3 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            title={product.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {product.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openModal(product)}
                            className="p-3 text-blue-600 hover:text-blue-800 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-3 text-red-600 hover:text-red-800 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear/editar producto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-blue-500 bg-gray-50">
            <div className="flex items-center space-x-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              {/* Pestañas */}
              <div className="flex">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Configuración Básica
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'advanced'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Configuración Avanzada
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
              <button
                onClick={closeModal}
                className="p-3 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-6 overflow-hidden">
            {activeTab === 'basic' ? (
              <div className="grid grid-cols-3 gap-4 h-full">
              {/* Columna 1 - Información Básica */}
              <div className="flex flex-col h-full">
                <div className="border-2 border-green-500 rounded-lg p-3 bg-green-50 mb-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 border-b-2 border-green-300 pb-2">
                    Información Básica
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Nombre del producto"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Precio *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Impuesto */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Impuesto *
                      </label>
                      <select
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar impuesto</option>
                        {config.taxes.map(tax => (
                          <option key={tax.id} value={tax.id}>
                            {tax.name} ({tax.rate * 100}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estado activo */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-700">Producto activo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Color de fondo */}
                <div className="border-2 border-purple-500 rounded-lg p-3 bg-purple-50">
                  <h4 className="text-sm font-semibold text-purple-800 mb-3 border-b-2 border-purple-300 pb-2">
                    Apariencia
                  </h4>
                  <ColorPicker
                    value={formData.backgroundColor}
                    onChange={(color) => setFormData({ ...formData, backgroundColor: color })}
                    label="Color de fondo del botón"
                  />
                </div>
              </div>

              {/* Columna 2 - Descripción y Tarifas */}
              <div className="flex flex-col h-full">
                {/* Descripción - Más pequeña */}
                <div className="border-2 border-blue-500 rounded-lg p-3 bg-blue-50 mb-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 border-b-2 border-blue-300 pb-2">
                    Descripción
                  </h4>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full h-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Descripción opcional del producto"
                  />
                </div>

                {/* Tarifas - Debajo de la descripción */}
                <div className="border-2 border-orange-500 rounded-lg p-3 bg-orange-50 flex-1 flex flex-col">
                  <h4 className="text-sm font-semibold text-orange-800 mb-3 border-b-2 border-orange-300 pb-2 flex-shrink-0">
                    Tarifas del Producto
                  </h4>
                  <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: '300px' }}>
                    <ProductTariffManager
                      tariffs={productTariffs}
                      onChange={setProductTariffs}
                    />
                  </div>
                </div>
              </div>

              {/* Columna 3 - Combinaciones */}
              <div className="flex flex-col h-full">
                <div className="border-2 border-indigo-500 rounded-lg p-3 bg-indigo-50 flex-1 flex flex-col">
                  <h4 className="text-sm font-semibold text-indigo-800 mb-3 border-b-2 border-indigo-300 pb-2 flex-shrink-0">
                    Combinaciones
                  </h4>
                  <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: '400px' }}>
                    <ProductCombinationManager
                      combinations={productCombinations}
                      categories={categories}
                      products={products}
                      onChange={setProductCombinations}
                    />
                  </div>
                </div>
              </div>
            </div>
            ) : (
              // Pestaña de Configuración Avanzada
              <div className="h-full">
                <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
                  <h4 className="text-lg font-semibold text-green-800 mb-4 border-b-2 border-green-300 pb-2">
                    Configuración Avanzada
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Pedir Precio */}
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="askForPrice"
                            checked={formData.askForPrice}
                            onChange={(e) => setFormData({ ...formData, askForPrice: e.target.checked })}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <label htmlFor="askForPrice" className="text-sm font-medium text-gray-700">
                            Pedir precio
                          </label>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Dashboard
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 ml-7">
                        Cuando esté activo, al seleccionar este producto en el dashboard aparecerá un popup solicitando el precio del producto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;