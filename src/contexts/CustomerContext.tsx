import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, Customer } from '../database/db';
import toast from 'react-hot-toast';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  // CRUD operations
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent'>) => Promise<number>;
  updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  getCustomer: (id: number) => Customer | undefined;
  getCustomerByCardCode: (cardCode: string) => Customer | undefined;
  // Saldo operations
  addToBalance: (customerId: number, amount: number) => Promise<void>;
  deductFromBalance: (customerId: number, amount: number) => Promise<void>;
  // Search and filter
  searchCustomers: (query: string) => Customer[];
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar clientes al inicializar
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const allCustomers = await db.customers.orderBy('name').toArray();
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent'>): Promise<number> => {
    try {
      // Verificar si ya existe un cliente con el mismo código de tarjeta
      if (customerData.cardCode) {
        const existingCustomer = await db.customers.where('cardCode').equals(customerData.cardCode).first();
        if (existingCustomer) {
          throw new Error('Ya existe un cliente con este código de tarjeta');
        }
      }

      const id = await db.customers.add({
        ...customerData,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await loadCustomers();
      toast.success('Cliente agregado exitosamente');
      return id as number;
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Error al agregar cliente');
      throw error;
    }
  };

  const updateCustomer = async (id: number, updates: Partial<Customer>): Promise<void> => {
    try {
      // Verificar código de tarjeta único si se está actualizando
      if (updates.cardCode) {
        const existingCustomer = await db.customers.where('cardCode').equals(updates.cardCode).first();
        if (existingCustomer && existingCustomer.id !== id) {
          throw new Error('Ya existe un cliente con este código de tarjeta');
        }
      }

      await db.customers.update(id, {
        ...updates,
        updatedAt: new Date()
      });

      await loadCustomers();
      toast.success('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar cliente');
      throw error;
    }
  };

  const deleteCustomer = async (id: number): Promise<void> => {
    try {
      // Verificar si el cliente tiene pedidos asociados
      const orders = await db.orders.where('customerName').equals(customers.find(c => c.id === id)?.name || '').count();
      
      if (orders > 0) {
        throw new Error('No se puede eliminar un cliente con pedidos asociados');
      }

      await db.customers.delete(id);
      await loadCustomers();
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar cliente');
      throw error;
    }
  };

  const getCustomer = (id: number): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomerByCardCode = (cardCode: string): Customer | undefined => {
    return customers.find(customer => customer.cardCode === cardCode);
  };

  const addToBalance = async (customerId: number, amount: number): Promise<void> => {
    try {
      const customer = getCustomer(customerId);
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      const newBalance = customer.balance + amount;
      await updateCustomer(customerId, { balance: newBalance });
      toast.success(`Se agregaron ${amount.toFixed(2)}€ al saldo del cliente`);
    } catch (error) {
      console.error('Error al agregar saldo:', error);
      toast.error('Error al agregar saldo');
      throw error;
    }
  };

  const deductFromBalance = async (customerId: number, amount: number): Promise<void> => {
    try {
      const customer = getCustomer(customerId);
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }

      if (customer.balance < amount) {
        throw new Error('Saldo insuficiente');
      }

      const newBalance = customer.balance - amount;
      await updateCustomer(customerId, { balance: newBalance });
      toast.success(`Se descontaron ${amount.toFixed(2)}€ del saldo del cliente`);
    } catch (error) {
      console.error('Error al descontar saldo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al descontar saldo');
      throw error;
    }
  };

  const searchCustomers = (query: string): Customer[] => {
    if (!query.trim()) return customers;
    
    const searchTerm = query.toLowerCase().trim();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.includes(searchTerm) ||
      customer.cardCode?.toLowerCase().includes(searchTerm)
    );
  };

  const refreshCustomers = async (): Promise<void> => {
    await loadCustomers();
  };

  const value: CustomerContextType = {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    getCustomerByCardCode,
    addToBalance,
    deductFromBalance,
    searchCustomers,
    refreshCustomers
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

