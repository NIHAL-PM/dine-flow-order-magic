
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit?: Date;
  preferences?: string[];
  loyaltyPoints?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByPhone: (phone: string) => Customer | undefined;
  searchCustomers: (query: string) => Customer[];
  refreshCustomers: () => Promise<void>;
  updateCustomerStats: (customerId: string, orderAmount: number) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    refreshCustomers();

    const unsubscribe = enhancedDB.subscribe('customers', setCustomers);

    return unsubscribe;
  }, []);

  const refreshCustomers = async () => {
    try {
      const customersData = await enhancedDB.getData('customers');
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to refresh customers:', error);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await enhancedDB.addItem('customers', newCustomer);
      return newCustomer.id;
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await enhancedDB.updateItem('customers', id, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await enhancedDB.deleteItem('customers', id);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomerByPhone = (phone: string) => {
    return customers.find(customer => customer.phone === phone);
  };

  const searchCustomers = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowercaseQuery) ||
      customer.phone.includes(query) ||
      customer.email?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const updateCustomerStats = async (customerId: string, orderAmount: number) => {
    try {
      const customer = getCustomerById(customerId);
      if (customer) {
        await updateCustomer(customerId, {
          totalOrders: customer.totalOrders + 1,
          totalSpent: customer.totalSpent + orderAmount,
          lastVisit: new Date(),
          loyaltyPoints: (customer.loyaltyPoints || 0) + Math.floor(orderAmount / 10)
        });
      }
    } catch (error) {
      console.error('Failed to update customer stats:', error);
      throw error;
    }
  };

  return (
    <CustomerContext.Provider value={{
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomerById,
      getCustomerByPhone,
      searchCustomers,
      refreshCustomers,
      updateCustomerStats
    }}>
      {children}
    </CustomerContext.Provider>
  );
};
