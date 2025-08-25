import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  Package,
  Grid,
  Layout,
  ShoppingCart,
  Settings,
  X,
  Users,
  BarChart3,
  Receipt,
  SlidersHorizontal,
  Gift,
  Archive
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Punto de Venta',
      href: '/',
      icon: Home,
      description: 'Interfaz principal del POS'
    },
    {
      name: 'Productos',
      href: '/products',
      icon: Package,
      description: 'Gestión de productos'
    },
    {
      name: 'Modificadores',
      href: '/modifiers',
      icon: SlidersHorizontal,
      description: 'Gestión de modificadores'
    },
    {
      name: 'Categorías',
      href: '/categories',
      icon: Grid,
      description: 'Organización de categorías'
    },
    {
      name: 'Mesas y Salones',
      href: '/configuration/salons',
      icon: Layout,
      description: 'Editor de salones y mesas'
    },
    {
      name: 'Pedidos',
      href: '/orders',
      icon: ShoppingCart,
      description: 'Historial de pedidos'
    },
    {
      name: 'Clientes',
      href: '/customers',
      icon: Users,
      description: 'Base de datos de clientes'
    },
    {
      name: 'Incentivos de Saldo',
      href: '/configuration/incentives',
      icon: Gift,
      description: 'Configuración de incentivos'
    },
    {
      name: 'Documentos Cerrados',
      href: '/configuration/tickets',
      icon: Archive,
      description: 'Historial de tickets, recargas y recibos'
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: BarChart3,
      description: 'Análisis y estadísticas'
    },
    {
      name: 'Facturas',
      href: '/invoices',
      icon: Receipt,
      description: 'Gestión de facturas'
    },
    {
      name: 'Configuración',
      href: '/configuration',
      icon: Settings,
      description: 'Configuración del sistema'
    }
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-bold text-gray-900">KimiPOS</h2>
                <p className="text-sm text-gray-500">Sistema de Gestión</p>
              </div>
            </div>
            
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${isActive ? 'text-primary-700' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-bold text-gray-900">KimiPOS</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-2 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? 'text-primary-700' : ''}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
