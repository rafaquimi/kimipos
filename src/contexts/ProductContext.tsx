import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  // Productos
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  // Categorías
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Cargar desde localStorage
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('kimipos_products');
      const savedCategories = localStorage.getItem('kimipos_categories');
      
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        const restored = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
        setProducts(restored);
      } else {
        // Productos iniciales
        const initialProducts: Product[] = [
          {
            id: '1',
            name: 'Coca Cola',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Refresco de cola 350ml',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Sprite',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Refresco de limón 350ml',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Corona',
            price: 45.00,
            categoryId: 'cat-2',
            description: 'Cerveza 355ml',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '4',
            name: 'Heineken',
            price: 50.00,
            categoryId: 'cat-2',
            description: 'Cerveza premium 355ml',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '5',
            name: 'Jack Daniels',
            price: 120.00,
            categoryId: 'cat-3',
            description: 'Whisky 50ml',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setProducts(initialProducts);
      }

      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        const restored = parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }));
        setCategories(restored);
      } else {
        // Categorías iniciales
        const initialCategories: Category[] = [
          {
            id: 'cat-1',
            name: 'Bebidas',
            color: '#3b82f6',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cat-2',
            name: 'Cervezas',
            color: '#f59e0b',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cat-3',
            name: 'Whisky',
            color: '#8b5cf6',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cat-4',
            name: 'Rones',
            color: '#ef4444',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cat-5',
            name: 'Ginebras',
            color: '#10b981',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setCategories(initialCategories);
      }
    } catch (error) {
      console.error('Error cargando productos y categorías:', error);
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (products.length > 0) {
      try {
        localStorage.setItem('kimipos_products', JSON.stringify(products));
      } catch (error) {
        console.error('Error guardando productos:', error);
      }
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) {
      try {
        localStorage.setItem('kimipos_categories', JSON.stringify(categories));
      } catch (error) {
        console.error('Error guardando categorías:', error);
      }
    }
  }, [categories]);

  // Funciones de productos
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `product-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...productData, updatedAt: new Date() }
        : p
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId && p.isActive);
  };

  // Funciones de categorías
  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, categoryData: Partial<Category>) => {
    setCategories(prev => prev.map(c => 
      c.id === id 
        ? { ...c, ...categoryData, updatedAt: new Date() }
        : c
    ));
  };

  const deleteCategory = (id: string) => {
    // Solo permitir eliminar si no hay productos en esta categoría
    const hasProducts = products.some(p => p.categoryId === id);
    if (!hasProducts) {
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    }
    return false;
  };

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id);
  };

  const value: ProductContextType = {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

