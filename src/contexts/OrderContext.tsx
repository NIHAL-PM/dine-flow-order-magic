
import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const addOrder = (orderData: Omit<SavedOrder, 'id' | 'timestamp' | 'status' | 'priority'>) => {
    const newOrder: SavedOrder = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'saved',
      priority: 'normal',
      estimatedTime: 15 // Default 15 minutes
    };
    setSavedOrders(prev => [...prev, newOrder]);
  };

  const updateOrderStatus = (orderId: string, status: SavedOrder['status']) => {
    if (status === 'completed') {
      // Move order from savedOrders to completedOrders
      setSavedOrders(prev => {
        const orderToComplete = prev.find(order => order.id === orderId);
        if (orderToComplete) {
          const updatedOrder = { ...orderToComplete, status };
          setCompletedOrders(completedPrev => [...completedPrev, updatedOrder]);
          return prev.filter(order => order.id !== orderId);
        }
        return prev;
      });
    } else {
      // Update status in savedOrders
      setSavedOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );
    }
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
    setSavedOrders(prev => prev.filter(order => order.id !== orderId));
    setCompletedOrders(prev => prev.filter(order => order.id !== orderId));
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
      getOrderById
    }}>
      {children}
    </OrderContext.Provider>
  );
};
