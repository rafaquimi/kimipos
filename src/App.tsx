import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import ConfigurationPage from './pages/Configuration';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { TableProvider } from './contexts/TableContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ProductProvider } from './contexts/ProductContext';

const App: React.FC = () => {
  return (
    <DatabaseProvider>
      <ConfigProvider>
        <ProductProvider>
          <TableProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/configuration" element={<ConfigurationPage />} />
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
            </Layout>
          </BrowserRouter>
          </TableProvider>
        </ProductProvider>
      </ConfigProvider>
    </DatabaseProvider>
  );
};

export default App;
