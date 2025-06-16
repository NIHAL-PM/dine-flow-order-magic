import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { enhancedDB } from '@/services/enhancedDatabase';

interface Notification {
  id: string;
  type: 'order' | 'kitchen' | 'billing' | 'table' | 'system' | 'inventory';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  playSound: boolean;
  setPlaySound: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  getNotificationsByType: (type: string) => Notification[];
  refreshNotifications: () => Promise<void>;
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
  const [soundVolume, setSoundVolume] = useState(0.8);

  useEffect(() => {
    refreshNotifications();

    const handleDatabaseUpdate = (event: CustomEvent) => {
      try {
        const { table, data } = event.detail;
        
        switch (table) {
          case 'orders':
            handleOrderNotifications(data);
            break;
          case 'tables':
            handleTableNotifications(data);
            break;
          case 'menuItems':
            handleInventoryNotifications(data);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error handling database update notification:', error);
      }
    };

    window.addEventListener('databaseUpdate', handleDatabaseUpdate as EventListener);

    return () => {
      window.removeEventListener('databaseUpdate', handleDatabaseUpdate as EventListener);
    };
  }, []);

  const refreshNotifications = async () => {
    try {
      // In a real app, notifications would be stored in the database
      // For now, we'll keep them in memory but could extend to persist
      const today = new Date();
      const dayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // Filter notifications to keep only recent ones
      setNotifications(prev => prev.filter(n => n.timestamp > dayAgo));
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const handleOrderNotifications = (orders: any[]) => {
    try {
      const newOrders = orders.filter(order => {
        const orderTime = new Date(order.timestamp);
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        return orderTime > fiveSecondsAgo && order.status === 'saved';
      });

      newOrders.forEach(order => {
        addNotification({
          type: 'order',
          title: 'New Order Received',
          message: `Order ${order.tokenNumber} for ${order.orderType}${order.tableNumber ? ` at Table ${order.tableNumber}` : ''}`,
          actionUrl: '/kitchen',
          priority: order.priority === 'urgent' ? 'urgent' : 'medium',
          data: { orderId: order.id }
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
          actionUrl: '/billing',
          priority: 'high',
          data: { orderId: order.id }
        });
      });
    } catch (error) {
      console.error('Error handling order notifications:', error);
    }
  };

  const handleTableNotifications = (tables: any[]) => {
    try {
      // Handle table cleaning notifications
      const needsCleaning = tables.filter(table => table.status === 'cleaning');
      
      needsCleaning.forEach(table => {
        addNotification({
          type: 'table',
          title: 'Table Needs Cleaning',
          message: `Table ${table.number} requires cleaning`,
          actionUrl: '/tables',
          priority: 'medium',
          data: { tableId: table.id }
        });
      });
    } catch (error) {
      console.error('Error handling table notifications:', error);
    }
  };

  const handleInventoryNotifications = (items: any[]) => {
    try {
      // Handle low stock notifications
      const lowStockItems = items.filter(item => 
        item.stockQuantity && item.stockQuantity < 10
      );
      
      lowStockItems.forEach(item => {
        addNotification({
          type: 'inventory',
          title: 'Low Stock Alert',
          message: `${item.name} is running low (${item.stockQuantity} remaining)`,
          actionUrl: '/menu',
          priority: item.stockQuantity < 5 ? 'urgent' : 'medium',
          data: { itemId: item.id }
        });
      });
    } catch (error) {
      console.error('Error handling inventory notifications:', error);
    }
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const newNotification: Notification = {
        ...notificationData,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100
      
      // Show toast notification
      const toastConfig: any = {
        description: notificationData.message,
      };

      if (notificationData.actionUrl) {
        toastConfig.action = {
          label: 'View',
          onClick: () => window.location.href = notificationData.actionUrl!
        };
      }

      switch (notificationData.priority) {
        case 'urgent':
          toast.error(notificationData.title, toastConfig);
          break;
        case 'high':
          toast.warning(notificationData.title, toastConfig);
          break;
        default:
          toast.success(notificationData.title, toastConfig);
      }

      // Play sound if enabled
      if (playSound) {
        playNotificationSound(notificationData.priority);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationsByType = (type: string) => {
    return notifications.filter(n => n.type === type);
  };

  const playNotificationSound = (priority: string = 'medium') => {
    try {
      // Different tones for different priorities
      const frequencies = {
        urgent: [800, 1000, 800],
        high: [600, 800],
        medium: [400],
        low: [300]
      };

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freq = frequencies[priority as keyof typeof frequencies] || frequencies.medium;
      
      freq.forEach((frequency, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(soundVolume * 0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, index * 200);
      });
    } catch (error) {
      console.log('Sound playback not available');
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
      deleteNotification,
      playSound,
      setPlaySound,
      soundVolume,
      setSoundVolume,
      getNotificationsByType,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
