import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Home, 
  Settings, 
  Wifi, 
  WifiOff,
  Clock,
  User
} from 'lucide-react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderProps {
  onMenuClick: () => void;
  showMenu: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, lastSync } = useDatabase();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Punto de Venta';
      case '/products':
        return 'Productos';
      case '/categories':
        return 'Categorías';
      case '/tables':
        return 'Mesas y Salones';
      case '/orders':
        return 'Pedidos';
      case '/configuration':
        return 'Configuración';
      default:
        return 'KimiPOS';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Lado izquierdo */}
        <div className="flex items-center space-x-4">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
            </div>
          </div>
        </div>

        {/* Centro - Información de estado */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Estado de conexión */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>

          {/* Última sincronización */}
          {lastSync && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Sync: {format(lastSync, 'HH:mm', { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Lado derecho */}
        <div className="flex items-center space-x-4">
          {/* Hora actual */}
          <div className="hidden sm:flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {format(currentTime, 'HH:mm:ss', { locale: es })}
            </span>
          </div>

          {/* Navegación rápida */}
          <div className="flex items-center space-x-2">
            {location.pathname !== '/' && (
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Ir al POS"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            
            {location.pathname !== '/configuration' && (
              <button
                onClick={() => navigate('/configuration')}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Usuario */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Administrador</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

