
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { db } from '@/services/database';

interface Notification {
  id: string;
  type: 'order' | 'kitchen' | 'billing' | 'table' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  playSound: boolean;
  setPlaySound: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [playSound, setPlaySound] = useState(true);

  useEffect(() => {
    // Listen for database changes to trigger notifications
    const handleDatabaseUpdate = (event: CustomEvent) => {
      const { table, data } = event.detail;
      
      switch (table) {
        case 'orders':
          handleOrderNotifications(data);
          break;
        case 'tables':
          handleTableNotifications(data);
          break;
      }
    };

    window.addEventListener('databaseUpdate', handleDatabaseUpdate as EventListener);

    return () => {
      window.removeEventListener('databaseUpdate', handleDatabaseUpdate as EventListener);
    };
  }, []);

  const handleOrderNotifications = (orders: any[]) => {
    const newOrders = orders.filter(order => {
      const orderTime = new Date(order.timestamp);
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      return orderTime > fiveSecondsAgo && order.status === 'saved';
    });

    newOrders.forEach(order => {
      addNotification({
        type: 'order',
        title: 'New Order Received',
        message: `Order ${order.tokenNumber} for ${order.orderType}`,
        actionUrl: '/kitchen'
      });
    });

    const readyOrders = orders.filter(order => {
      const updateTime = new Date(order.updatedAt || order.timestamp);
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      return updateTime > fiveSecondsAgo && order.status === 'ready';
    });

    readyOrders.forEach(order => {
      addNotification({
        type: 'kitchen',
        title: 'Order Ready',
        message: `Order ${order.tokenNumber} is ready for serving`,
        actionUrl: '/billing'
      });
    });
  };

  const handleTableNotifications = (tables: any[]) => {
    // Handle table-related notifications if needed
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    
    // Show toast notification
    toast.success(notificationData.title, {
      description: notificationData.message,
      action: notificationData.actionUrl ? {
        label: 'View',
        onClick: () => window.location.href = notificationData.actionUrl!
      } : undefined
    });

    // Play sound if enabled
    if (playSound) {
      playNotificationSound();
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIfCDSI0fPMeisEIHjD8dqPQAoVYK');
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      // Ignore sound errors
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      playSound,
      setPlaySound
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
