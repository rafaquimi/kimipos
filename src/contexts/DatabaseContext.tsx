import React, { createContext, useContext, useEffect, useState } from 'react';

interface DatabaseContextType {
  isReady: boolean;
  isOnline: boolean;
  lastSync: Date | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Simular inicialización de base de datos
    const initDatabase = async () => {
      try {
        console.log('Inicializando aplicación...');
        // Simular delay de inicialización
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsReady(true);
        console.log('Aplicación inicializada correctamente');
      } catch (error) {
        console.error('Error de inicialización:', error);
        setIsReady(true); // Siempre marcar como listo
      }
    };

    initDatabase();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value: DatabaseContextType = {
    isReady,
    isOnline,
    lastSync,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
