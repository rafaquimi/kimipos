import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import ConfigurationPage from './pages/Configuration';
import ModifiersPage from './pages/Modifiers';
import WelcomeScreen from './components/WelcomeScreen';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { TableProvider } from './contexts/TableContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ProductProvider } from './contexts/ProductContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { BalanceIncentiveProvider } from './contexts/BalanceIncentiveContext';
import { ClosedTicketsProvider } from './contexts/ClosedTicketsContext';
import { OnScreenKeyboardProvider } from './contexts/OnScreenKeyboardContext';
import OnScreenKeyboard from './components/OnScreenKeyboard/OnScreenKeyboard';

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si es la primera vez que se accede
    const hasVisited = localStorage.getItem('kimipos-has-visited');
    
    if (hasVisited) {
      setShowWelcome(false);
    }
    
    setIsLoading(false);
  }, []);

  const handleEnterSystem = () => {
    localStorage.setItem('kimipos-has-visited', 'true');
    setShowWelcome(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onEnter={handleEnterSystem} />;
  }

  return (
    <DatabaseProvider>
      <ConfigProvider>
        <ProductProvider>
          <CustomerProvider>
            <BalanceIncentiveProvider>
              <ClosedTicketsProvider>
                <TableProvider>
                  <OnScreenKeyboardProvider>
                    <HashRouter>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/tables" element={<Tables />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/modifiers" element={<ModifiersPage />} />
                          <Route path="/configuration" element={<ConfigurationPage />} />
                          <Route path="/configuration/salons" element={<ConfigurationPage />} />
                          <Route path="/customers" element={<ConfigurationPage />} />
                          <Route path="/configuration/incentives" element={<ConfigurationPage />} />
                          <Route path="/configuration/tickets" element={<ConfigurationPage />} />
                          <Route path="/configuration/printing" element={<ConfigurationPage />} />
                          <Route path="/reports" element={<ConfigurationPage />} />
                          <Route path="/invoices" element={<ConfigurationPage />} />
                        </Routes>
                        <Toaster
                          position="top-right"
                          toastOptions={{
                            duration: 4000,
                            style: {
                              background: '#363636',
                              color: '#fff',
                            },
                            success: {
                              style: {
                                background: '#10b981',
                              },
                            },
                            error: {
                              style: {
                                background: '#ef4444',
                              },
                            },
                          }}
                        />
                        <OnScreenKeyboard />
                      </Layout>
                    </HashRouter>
                  </OnScreenKeyboardProvider>
                </TableProvider>
              </ClosedTicketsProvider>
            </BalanceIncentiveProvider>
          </CustomerProvider>
        </ProductProvider>
      </ConfigProvider>
    </DatabaseProvider>
  );
};

export default App;
