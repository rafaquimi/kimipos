import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useDatabase } from '../../contexts/DatabaseContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isReady } = useDatabase();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Inicializando KimiPOS</h2>
          <p className="text-gray-600">Preparando la base de datos...</p>
        </div>
      </div>
    );
  }

  const isMainPOS = location.pathname === '/';

  return (
    <div className="h-full flex">
      {/* Sidebar - Solo visible en páginas que no sean POS principal */}
      {!isMainPOS && (
        <>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* Contenido principal */}
      <div className={`flex-1 flex flex-col`}>
        {!isMainPOS && (
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
            showMenu={true}
          />
        )}
        <main className={`flex-1 overflow-hidden ${isMainPOS ? 'h-full' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
