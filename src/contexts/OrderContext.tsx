
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
}

interface OrderContextType {
  savedOrders: SavedOrder[];
  addOrder: (order: Omit<SavedOrder, 'id' | 'timestamp' | 'status'>) => void;
  updateOrderStatus: (orderId: string, status: SavedOrder['status']) => void;
  getOrdersByStatus: (status: SavedOrder['status']) => SavedOrder[];
  deleteOrder: (orderId: string) => void;
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

  const addOrder = (orderData: Omit<SavedOrder, 'id' | 'timestamp' | 'status'>) => {
    const newOrder: SavedOrder = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'saved'
    };
    setSavedOrders(prev => [...prev, newOrder]);
  };

  const updateOrderStatus = (orderId: string, status: SavedOrder['status']) => {
    setSavedOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const getOrdersByStatus = (status: SavedOrder['status']) => {
    return savedOrders.filter(order => order.status === status);
  };

  const deleteOrder = (orderId: string) => {
    setSavedOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <OrderContext.Provider value={{
      savedOrders,
      addOrder,
      updateOrderStatus,
      getOrdersByStatus,
      deleteOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
};
