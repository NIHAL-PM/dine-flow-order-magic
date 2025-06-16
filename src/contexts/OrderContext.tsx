
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enhancedDB } from '@/services/enhancedDatabase';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: string;
}

export interface SavedOrder {
  id: string;
  tokenNumber: string;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'saved' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  timestamp: Date;
  waiterName?: string;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  estimatedTime?: number;
  priority: 'normal' | 'high' | 'urgent';
  paymentMethod?: 'cash' | 'card' | 'upi';
  paymentStatus?: 'pending' | 'completed' | 'failed';
}

interface OrderContextType {
  savedOrders: SavedOrder[];
  completedOrders: SavedOrder[];
  addOrder: (order: Omit<SavedOrder, 'id' | 'timestamp' | 'status' | 'priority' | 'tokenNumber'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: SavedOrder['status']) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<SavedOrder>) => Promise<void>;
  getOrdersByStatus: (status: SavedOrder['status']) => SavedOrder[];
  deleteOrder: (orderId: string) => Promise<void>;
  getActiveOrders: () => SavedOrder[];
  getOrderById: (orderId: string) => SavedOrder | undefined;
  refreshOrders: () => Promise<void>;
  generateTokenNumber: (orderType: string) => string;
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
  const [tokenCounters, setTokenCounters] = useState({
    'dine-in': 1,
    'takeout': 1,
    'delivery': 1
  });

  useEffect(() => {
    refreshOrders();

    const unsubscribe = enhancedDB.subscribe('orders', (orders) => {
      const active = orders.filter((order: SavedOrder) => order.status !== 'completed' && order.status !== 'cancelled');
      const completed = orders.filter((order: SavedOrder) => order.status === 'completed' || order.status === 'cancelled');
      setSavedOrders(active);
      setCompletedOrders(completed);
      updateTokenCounters(orders);
    });

    return unsubscribe;
  }, []);

  const updateTokenCounters = (orders: SavedOrder[]) => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      new Date(order.timestamp).toDateString() === today
    );

    const counters = {
      'dine-in': 1,
      'takeout': 1,
      'delivery': 1
    };

    todayOrders.forEach(order => {
      const match = order.tokenNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]) + 1;
        if (order.orderType === 'dine-in' && num > counters['dine-in']) {
          counters['dine-in'] = num;
        } else if (order.orderType === 'takeout' && num > counters['takeout']) {
          counters['takeout'] = num;
        } else if (order.orderType === 'delivery' && num > counters['delivery']) {
          counters['delivery'] = num;
        }
      }
    });

    setTokenCounters(counters);
  };

  const refreshOrders = async () => {
    try {
      const orders = await enhancedDB.getData('orders') as SavedOrder[];
      const active = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
      const completed = orders.filter(order => order.status === 'completed' || order.status === 'cancelled');
      setSavedOrders(active);
      setCompletedOrders(completed);
      updateTokenCounters(orders);
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    }
  };

  const generateTokenNumber = (orderType: string): string => {
    const prefix = orderType === 'dine-in' ? 'D' : orderType === 'takeout' ? 'T' : 'DEL';
    const counter = tokenCounters[orderType as keyof typeof tokenCounters];
    return `${prefix}-${counter.toString().padStart(3, '0')}`;
  };

  const addOrder = async (orderData: Omit<SavedOrder, 'id' | 'timestamp' | 'status' | 'priority' | 'tokenNumber'>): Promise<string> => {
    try {
      const tokenNumber = generateTokenNumber(orderData.orderType);
      
      const newOrder: SavedOrder = {
        ...orderData,
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenNumber,
        timestamp: new Date(),
        status: 'saved',
        priority: 'normal',
        estimatedTime: orderData.estimatedTime || 15,
        tax: orderData.subtotal * 0.18, // 18% tax
        discount: orderData.discount || 0,
        total: orderData.subtotal + (orderData.subtotal * 0.18) - (orderData.discount || 0)
      };
      
      await enhancedDB.addItem('orders', newOrder);
      return newOrder.id;
    } catch (error) {
      console.error('Failed to add order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: SavedOrder['status']) => {
    try {
      await enhancedDB.updateItem('orders', orderId, { 
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const updateOrder = async (orderId: string, updates: Partial<SavedOrder>) => {
    try {
      await enhancedDB.updateItem('orders', orderId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  };

  const getOrdersByStatus = (status: SavedOrder['status']) => {
    if (status === 'completed' || status === 'cancelled') {
      return completedOrders.filter(order => order.status === status);
    }
    return savedOrders.filter(order => order.status === status);
  };

  const getActiveOrders = () => {
    return savedOrders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
  };

  const getOrderById = (orderId: string) => {
    return savedOrders.find(order => order.id === orderId) || 
           completedOrders.find(order => order.id === orderId);
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await enhancedDB.deleteItem('orders', orderId);
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  };

  return (
    <OrderContext.Provider value={{
      savedOrders,
      completedOrders,
      addOrder,
      updateOrderStatus,
      updateOrder,
      getOrdersByStatus,
      deleteOrder,
      getActiveOrders,
      getOrderById,
      refreshOrders,
      generateTokenNumber
    }}>
      {children}
    </OrderContext.Provider>
  );
};
