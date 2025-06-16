
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/database';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface SavedOrder {
  id: string;
  tokenNumber: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  status: 'saved' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  timestamp: Date;
  waiterName?: string;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  estimatedTime?: number;
  priority: 'normal' | 'high' | 'urgent';
}

interface OrderContextType {
  savedOrders: SavedOrder[];
  completedOrders: SavedOrder[];
  addOrder: (order: Omit<SavedOrder, 'id' | 'timestamp' | 'status' | 'priority'>) => void;
  updateOrderStatus: (orderId: string, status: SavedOrder['status']) => void;
  getOrdersByStatus: (status: SavedOrder['status']) => SavedOrder[];
  deleteOrder: (orderId: string) => void;
  getActiveOrders: () => SavedOrder[];
  getOrderById: (orderId: string) => SavedOrder | undefined;
  refreshOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    // Load initial data
    refreshOrders();

    // Subscribe to database changes
    const unsubscribe = db.subscribe('orders', (orders) => {
      const active = orders.filter((order: SavedOrder) => order.status !== 'completed');
      const completed = orders.filter((order: SavedOrder) => order.status === 'completed');
      setSavedOrders(active);
      setCompletedOrders(completed);
    });

    return unsubscribe;
  }, []);

  const refreshOrders = () => {
    const orders = db.getData('orders') as SavedOrder[];
    const active = orders.filter(order => order.status !== 'completed');
    const completed = orders.filter(order => order.status === 'completed');
    setSavedOrders(active);
    setCompletedOrders(completed);
  };

  const addOrder = (orderData: Omit<SavedOrder, 'id' | 'timestamp' | 'status' | 'priority'>) => {
    const newOrder: SavedOrder = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'saved',
      priority: 'normal',
      estimatedTime: 15
    };
    
    const allOrders = db.getData('orders') as SavedOrder[];
    db.setData('orders', [...allOrders, newOrder]);
  };

  const updateOrderStatus = (orderId: string, status: SavedOrder['status']) => {
    const allOrders = db.getData('orders') as SavedOrder[];
    const updatedOrders = allOrders.map(order =>
      order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
    );
    db.setData('orders', updatedOrders);
  };

  const getOrdersByStatus = (status: SavedOrder['status']) => {
    if (status === 'completed') {
      return completedOrders;
    }
    return savedOrders.filter(order => order.status === status);
  };

  const getActiveOrders = () => {
    return savedOrders.filter(order => order.status !== 'completed');
  };

  const getOrderById = (orderId: string) => {
    return savedOrders.find(order => order.id === orderId) || 
           completedOrders.find(order => order.id === orderId);
  };

  const deleteOrder = (orderId: string) => {
    const allOrders = db.getData('orders') as SavedOrder[];
    const filteredOrders = allOrders.filter(order => order.id !== orderId);
    db.setData('orders', filteredOrders);
  };

  return (
    <OrderContext.Provider value={{
      savedOrders,
      completedOrders,
      addOrder,
      updateOrderStatus,
      getOrdersByStatus,
      deleteOrder,
      getActiveOrders,
      getOrderById,
      refreshOrders
    }}>
      {children}
    </OrderContext.Provider>
  );
};
