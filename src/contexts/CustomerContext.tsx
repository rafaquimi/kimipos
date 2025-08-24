import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../database/db';
import toast from 'react-hot-toast';

export interface Customer {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  cardCode: string;
  balance: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  searchCustomers: (term: string) => Customer[];
  loadCustomers: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByCardCode: (cardCode: string) => Customer | undefined;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadCustomers = async () => {
    try {
      const allCustomers = await db.customers.toArray();
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Error al cargar los clientes');
    }
  };

  const refreshCustomers = async () => {
    await loadCustomers();
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validar que el código de tarjeta sea único si se proporciona
      if (customerData.cardCode) {
        const existingCustomer = await db.customers.where('cardCode').equals(customerData.cardCode).first();
        if (existingCustomer) {
          toast.error('Ya existe un cliente con ese código de tarjeta');
          return;
        }
      }

      const newCustomer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.customers.add(newCustomer);
      await loadCustomers();
      toast.success('Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error al agregar el cliente');
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      // Validar que el código de tarjeta sea único si se está actualizando
      if (customerData.cardCode) {
        const existingCustomer = await db.customers
          .where('cardCode')
          .equals(customerData.cardCode)
          .filter(c => c.id !== id)
          .first();
        if (existingCustomer) {
          toast.error('Ya existe un cliente con ese código de tarjeta');
          return;
        }
      }

      const updateData = {
        ...customerData,
        updatedAt: new Date()
      };

      await db.customers.update(id, updateData);
      await loadCustomers();
      toast.success('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error al actualizar el cliente');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // Verificar si el cliente tiene pedidos asociados
      const customer = await db.customers.get(id);
      if (customer) {
        const orders = await db.orders.where('customerName').equals(customer.name).count();
        if (orders > 0) {
          toast.error('No se puede eliminar el cliente porque tiene pedidos asociados');
          return;
        }
      }

      await db.customers.delete(id);
      await loadCustomers();
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  const searchCustomers = (term: string): Customer[] => {
    if (!term.trim()) return customers;
    
    const searchTerm = term.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone.toLowerCase().includes(searchTerm) ||
      customer.cardCode.toLowerCase().includes(searchTerm)
    );
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomerByCardCode = (cardCode: string): Customer | undefined => {
    return customers.find(customer => customer.cardCode === cardCode);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const value: CustomerContextType = {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    loadCustomers,
    refreshCustomers,
    getCustomerById,
    getCustomerByCardCode
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

