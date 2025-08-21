import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Category, ProductTariff } from '../types/product';

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
      // TEMPORAL: Limpiar localStorage para forzar carga de nuevos productos
      localStorage.removeItem('kimipos_products');
      localStorage.removeItem('kimipos_categories');
      
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
        // Productos iniciales - Más de 100 productos realistas
        const initialProducts: Product[] = [
          // BEBIDAS (cat-1)
          {
            id: '1',
            name: 'Coca Cola',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Refresco de cola 350ml',
            backgroundColor: '#dc2626',
            tariffs: [
              { id: '1-1', name: '350ml', price: 25.00, isDefault: true }
            ],
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
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Fanta Naranja',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Refresco de naranja 350ml',
            backgroundColor: '#ea580c',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '4',
            name: 'Pepsi',
            price: 23.00,
            categoryId: 'cat-1',
            description: 'Refresco de cola 350ml',
            backgroundColor: '#2563eb',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '5',
            name: '7UP',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Refresco de lima-limón 350ml',
            backgroundColor: '#65a30d',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '6',
            name: 'Mirinda',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Refresco de naranja 350ml',
            backgroundColor: '#ea580c',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '7',
            name: 'Mountain Dew',
            price: 28.00,
            categoryId: 'cat-1',
            description: 'Refresco cítrico 350ml',
            backgroundColor: '#65a30d',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '8',
            name: 'Dr Pepper',
            price: 30.00,
            categoryId: 'cat-1',
            description: 'Refresco de cereza 350ml',
            backgroundColor: '#dc2626',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '9',
            name: 'Agua Mineral',
            price: 15.00,
            categoryId: 'cat-1',
            description: 'Agua mineral 500ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '10',
            name: 'Agua con Gas',
            price: 18.00,
            categoryId: 'cat-1',
            description: 'Agua carbonatada 500ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '11',
            name: 'Jugo de Naranja',
            price: 35.00,
            categoryId: 'cat-1',
            description: 'Jugo natural 300ml',
            backgroundColor: '#ea580c',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '12',
            name: 'Jugo de Manzana',
            price: 35.00,
            categoryId: 'cat-1',
            description: 'Jugo natural 300ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '13',
            name: 'Limonada',
            price: 30.00,
            categoryId: 'cat-1',
            description: 'Limonada natural 400ml',
            backgroundColor: '#ca8a04',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '14',
            name: 'Té Helado',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Té helado 350ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '15',
            name: 'Café Americano',
            price: 20.00,
            categoryId: 'cat-1',
            description: 'Café americano 250ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '16',
            name: 'Café Expresso',
            price: 18.00,
            categoryId: 'cat-1',
            description: 'Café expresso 30ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '17',
            name: 'Café Capuccino',
            price: 25.00,
            categoryId: 'cat-1',
            description: 'Café capuccino 200ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '18',
            name: 'Café Latte',
            price: 28.00,
            categoryId: 'cat-1',
            description: 'Café latte 250ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '19',
            name: 'Chocolate Caliente',
            price: 30.00,
            categoryId: 'cat-1',
            description: 'Chocolate caliente 250ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '20',
            name: 'Té Verde',
            price: 22.00,
            categoryId: 'cat-1',
            description: 'Té verde 250ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },

          // CERVEZAS (cat-2)
          {
            id: '21',
            name: 'Corona',
            price: 45.00,
            categoryId: 'cat-2',
            description: 'Cerveza 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '22',
            name: 'Heineken',
            price: 50.00,
            categoryId: 'cat-2',
            description: 'Cerveza premium 355ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '23',
            name: 'Budweiser',
            price: 40.00,
            categoryId: 'cat-2',
            description: 'Cerveza 355ml',
            backgroundColor: '#dc2626',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '24',
            name: 'Miller Lite',
            price: 42.00,
            categoryId: 'cat-2',
            description: 'Cerveza light 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '25',
            name: 'Coors Light',
            price: 43.00,
            categoryId: 'cat-2',
            description: 'Cerveza light 355ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '26',
            name: 'Stella Artois',
            price: 55.00,
            categoryId: 'cat-2',
            description: 'Cerveza belga 330ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '27',
            name: 'Dos Equis',
            price: 48.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '28',
            name: 'Tecate',
            price: 35.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#dc2626',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '29',
            name: 'Modelo Especial',
            price: 45.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '30',
            name: 'Pacifico',
            price: 42.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '31',
            name: 'Sol',
            price: 38.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '32',
            name: 'Victoria',
            price: 40.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '33',
            name: 'Indio',
            price: 35.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '34',
            name: 'Bohemia',
            price: 45.00,
            categoryId: 'cat-2',
            description: 'Cerveza mexicana 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '35',
            name: 'Negra Modelo',
            price: 48.00,
            categoryId: 'cat-2',
            description: 'Cerveza oscura 355ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '36',
            name: 'Guinness',
            price: 65.00,
            categoryId: 'cat-2',
            description: 'Cerveza stout 330ml',
            backgroundColor: '#18181b',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '37',
            name: 'Blue Moon',
            price: 58.00,
            categoryId: 'cat-2',
            description: 'Cerveza de trigo 355ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '38',
            name: 'Samuel Adams',
            price: 52.00,
            categoryId: 'cat-2',
            description: 'Cerveza artesanal 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '39',
            name: 'Sierra Nevada',
            price: 55.00,
            categoryId: 'cat-2',
            description: 'Cerveza IPA 355ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '40',
            name: 'Lagunitas',
            price: 58.00,
            categoryId: 'cat-2',
            description: 'Cerveza IPA 355ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },

          // WHISKY (cat-3)
          {
            id: '41',
            name: 'Jack Daniels',
            price: 120.00,
            categoryId: 'cat-3',
            description: 'Whisky 50ml',
            backgroundColor: '#92400e',
            combinations: [
              {
                id: 'comb-41-1',
                productId: '1', // Coca Cola específica
                additionalPrice: 25.00, // Precio adicional por Coca Cola
                isActive: true
              },
              {
                id: 'comb-41-2',
                productId: '2', // Sprite específico
                additionalPrice: 20.00, // Precio adicional por Sprite
                isActive: true
              },
              {
                id: 'comb-41-3',
                categoryId: 'cat-1', // Resto de bebidas
                additionalPrice: -1.00, // Descuento de 1€ para otras bebidas
                isActive: true
              }
            ],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '42',
            name: 'Jim Beam',
            price: 95.00,
            categoryId: 'cat-3',
            description: 'Whisky bourbon 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '43',
            name: 'Maker\'s Mark',
            price: 140.00,
            categoryId: 'cat-3',
            description: 'Whisky bourbon 50ml',
            backgroundColor: '#dc2626',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '44',
            name: 'Wild Turkey',
            price: 110.00,
            categoryId: 'cat-3',
            description: 'Whisky bourbon 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '45',
            name: 'Bulleit',
            price: 130.00,
            categoryId: 'cat-3',
            description: 'Whisky bourbon 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '46',
            name: 'Johnnie Walker Red',
            price: 100.00,
            categoryId: 'cat-3',
            description: 'Whisky escocés 50ml',
            backgroundColor: '#dc2626',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '47',
            name: 'Johnnie Walker Black',
            price: 180.00,
            categoryId: 'cat-3',
            description: 'Whisky escocés 50ml',
            backgroundColor: '#18181b',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '48',
            name: 'Chivas Regal',
            price: 160.00,
            categoryId: 'cat-3',
            description: 'Whisky escocés 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '49',
            name: 'Glenfiddich',
            price: 220.00,
            categoryId: 'cat-3',
            description: 'Whisky single malt 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '50',
            name: 'Macallan',
            price: 350.00,
            categoryId: 'cat-3',
            description: 'Whisky single malt 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '51',
            name: 'Jameson',
            price: 110.00,
            categoryId: 'cat-3',
            description: 'Whisky irlandés 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '52',
            name: 'Bushmills',
            price: 105.00,
            categoryId: 'cat-3',
            description: 'Whisky irlandés 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '53',
            name: 'Crown Royal',
            price: 125.00,
            categoryId: 'cat-3',
            description: 'Whisky canadiense 50ml',
            backgroundColor: '#7c3aed',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '54',
            name: 'Canadian Club',
            price: 90.00,
            categoryId: 'cat-3',
            description: 'Whisky canadiense 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '55',
            name: 'Suntory Toki',
            price: 140.00,
            categoryId: 'cat-3',
            description: 'Whisky japonés 50ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '56',
            name: 'Nikka',
            price: 160.00,
            categoryId: 'cat-3',
            description: 'Whisky japonés 50ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '57',
            name: 'Yamazaki',
            price: 280.00,
            categoryId: 'cat-3',
            description: 'Whisky japonés 50ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '58',
            name: 'Hibiki',
            price: 320.00,
            categoryId: 'cat-3',
            description: 'Whisky japonés 50ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '59',
            name: 'Evan Williams',
            price: 75.00,
            categoryId: 'cat-3',
            description: 'Whisky bourbon 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '60',
            name: 'Old Grand-Dad',
            price: 85.00,
            categoryId: 'cat-3',
            description: 'Whisky bourbon 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },

          // RONES (cat-4)
          {
            id: '61',
            name: 'Bacardi Blanco',
            price: 85.00,
            categoryId: 'cat-4',
            description: 'Ron blanco 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '62',
            name: 'Bacardi Dorado',
            price: 90.00,
            categoryId: 'cat-4',
            description: 'Ron dorado 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '63',
            name: 'Havana Club',
            price: 95.00,
            categoryId: 'cat-4',
            description: 'Ron cubano 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '64',
            name: 'Captain Morgan',
            price: 88.00,
            categoryId: 'cat-4',
            description: 'Ron especiado 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '65',
            name: 'Malibu',
            price: 95.00,
            categoryId: 'cat-4',
            description: 'Ron con coco 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '66',
            name: 'Kraken',
            price: 110.00,
            categoryId: 'cat-4',
            description: 'Ron especiado 50ml',
            backgroundColor: '#18181b',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '67',
            name: 'Mount Gay',
            price: 105.00,
            categoryId: 'cat-4',
            description: 'Ron barbadense 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '68',
            name: 'Appleton Estate',
            price: 115.00,
            categoryId: 'cat-4',
            description: 'Ron jamaicano 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '69',
            name: 'Goslings',
            price: 100.00,
            categoryId: 'cat-4',
            description: 'Ron bermudeño 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '70',
            name: 'Zacapa',
            price: 180.00,
            categoryId: 'cat-4',
            description: 'Ron guatemalteco 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '71',
            name: 'Flor de Caña',
            price: 95.00,
            categoryId: 'cat-4',
            description: 'Ron nicaragüense 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '72',
            name: 'Brugal',
            price: 85.00,
            categoryId: 'cat-4',
            description: 'Ron dominicano 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '73',
            name: 'Barceló',
            price: 90.00,
            categoryId: 'cat-4',
            description: 'Ron dominicano 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '74',
            name: 'Matusalem',
            price: 110.00,
            categoryId: 'cat-4',
            description: 'Ron dominicano 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '75',
            name: 'Don Q',
            price: 88.00,
            categoryId: 'cat-4',
            description: 'Ron puertorriqueño 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '76',
            name: 'Ron Abuelo',
            price: 120.00,
            categoryId: 'cat-4',
            description: 'Ron panameño 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '77',
            name: 'Diplomatico',
            price: 160.00,
            categoryId: 'cat-4',
            description: 'Ron venezolano 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '78',
            name: 'Santa Teresa',
            price: 140.00,
            categoryId: 'cat-4',
            description: 'Ron venezolano 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '79',
            name: 'Pampero',
            price: 95.00,
            categoryId: 'cat-4',
            description: 'Ron venezolano 50ml',
            backgroundColor: '#92400e',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '80',
            name: 'Cacique',
            price: 85.00,
            categoryId: 'cat-4',
            description: 'Ron venezolano 50ml',
            backgroundColor: '#fbbf24',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },

          // GINEBRAS (cat-5)
          {
            id: '81',
            name: 'Bombay Sapphire',
            price: 110.00,
            categoryId: 'cat-5',
            description: 'Ginebra premium 50ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '82',
            name: 'Tanqueray',
            price: 105.00,
            categoryId: 'cat-5',
            description: 'Ginebra londinense 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '83',
            name: 'Beefeater',
            price: 95.00,
            categoryId: 'cat-5',
            description: 'Ginebra londinense 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '84',
            name: 'Gordon\'s',
            price: 75.00,
            categoryId: 'cat-5',
            description: 'Ginebra 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '85',
            name: 'Hendrick\'s',
            price: 140.00,
            categoryId: 'cat-5',
            description: 'Ginebra premium 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '86',
            name: 'Plymouth',
            price: 125.00,
            categoryId: 'cat-5',
            description: 'Ginebra inglesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '87',
            name: 'Sipsmith',
            price: 130.00,
            categoryId: 'cat-5',
            description: 'Ginebra artesanal 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '88',
            name: 'Monkey 47',
            price: 180.00,
            categoryId: 'cat-5',
            description: 'Ginebra alemana 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '89',
            name: 'Malfy',
            price: 115.00,
            categoryId: 'cat-5',
            description: 'Ginebra italiana 50ml',
            backgroundColor: '#0891b2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '90',
            name: 'Citadelle',
            price: 120.00,
            categoryId: 'cat-5',
            description: 'Ginebra francesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '91',
            name: 'Nolet\'s',
            price: 200.00,
            categoryId: 'cat-5',
            description: 'Ginebra holandesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '92',
            name: 'Botanist',
            price: 160.00,
            categoryId: 'cat-5',
            description: 'Ginebra escocesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '93',
            name: 'Martin Miller\'s',
            price: 135.00,
            categoryId: 'cat-5',
            description: 'Ginebra premium 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '94',
            name: 'Fords',
            price: 110.00,
            categoryId: 'cat-5',
            description: 'Ginebra londinense 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '95',
            name: 'Broker\'s',
            price: 100.00,
            categoryId: 'cat-5',
            description: 'Ginebra londinense 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '96',
            name: 'Hayman\'s',
            price: 105.00,
            categoryId: 'cat-5',
            description: 'Ginebra familiar 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '97',
            name: 'Boodles',
            price: 115.00,
            categoryId: 'cat-5',
            description: 'Ginebra británica 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '98',
            name: 'Plymouth Navy Strength',
            price: 140.00,
            categoryId: 'cat-5',
            description: 'Ginebra de alta graduación 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '99',
            name: 'Sloe Gin',
            price: 95.00,
            categoryId: 'cat-5',
            description: 'Ginebra de endrinas 50ml',
            backgroundColor: '#ec4899',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '100',
            name: 'Old Raj',
            price: 150.00,
            categoryId: 'cat-5',
            description: 'Ginebra con azafrán 50ml',
            backgroundColor: '#ca8a04',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '101',
            name: 'Drumshanbo',
            price: 145.00,
            categoryId: 'cat-5',
            description: 'Ginebra irlandesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '102',
            name: 'Bertha\'s Revenge',
            price: 155.00,
            categoryId: 'cat-5',
            description: 'Ginebra irlandesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '103',
            name: 'Dingle',
            price: 165.00,
            categoryId: 'cat-5',
            description: 'Ginebra irlandesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '104',
            name: 'Gunpowder',
            price: 125.00,
            categoryId: 'cat-5',
            description: 'Ginebra irlandesa 50ml',
            backgroundColor: '#16a34a',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '105',
            name: 'Shortcross',
            price: 135.00,
            categoryId: 'cat-5',
            description: 'Ginebra irlandesa 50ml',
            backgroundColor: '#16a34a',
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
      isActive: categoryData.isActive ?? true, // Asegurar que siempre tenga un valor
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
    if (hasProducts) {
      throw new Error('No se puede eliminar una categoría que tiene productos asignados');
    }
    setCategories(prev => prev.filter(c => c.id !== id));
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

