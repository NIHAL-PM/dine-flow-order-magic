import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { enhancedDB } from '@/services/enhancedDatabase';

interface Notification {
  id: string;
  type: 'order' | 'kitchen' | 'billing' | 'table' | 'system' | 'inventory' | 'reservation' | 'workflow';
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

    // Database update listener
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

    // Workflow update listener
    const handleWorkflowUpdate = (event: CustomEvent) => {
      try {
        const { step, orderData } = event.detail;
        handleWorkflowNotifications(step, orderData);
      } catch (error) {
        console.error('Error handling workflow notification:', error);
      }
    };

    // Inventory update listener
    const handleInventoryUpdate = (event: CustomEvent) => {
      try {
        const { type, data } = event.detail;
        handleAdvancedInventoryNotifications(type, data);
      } catch (error) {
        console.error('Error handling inventory notification:', error);
      }
    };

    // Reservation update listener
    const handleReservationUpdate = (event: CustomEvent) => {
      try {
        const { type, reservation } = event.detail;
        handleReservationNotifications(type, reservation);
      } catch (error) {
        console.error('Error handling reservation notification:', error);
      }
    };

    // Waitlist update listener
    const handleWaitlistUpdate = (event: CustomEvent) => {
      try {
        const { type, entry } = event.detail;
        handleWaitlistNotifications(type, entry);
      } catch (error) {
        console.error('Error handling waitlist notification:', error);
      }
    };

    window.addEventListener('databaseUpdate', handleDatabaseUpdate as EventListener);
    window.addEventListener('orderWorkflowUpdate', handleWorkflowUpdate as EventListener);
    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    window.addEventListener('reservationUpdate', handleReservationUpdate as EventListener);
    window.addEventListener('waitlistUpdate', handleWaitlistUpdate as EventListener);

    return () => {
      window.removeEventListener('databaseUpdate', handleDatabaseUpdate as EventListener);
      window.removeEventListener('orderWorkflowUpdate', handleWorkflowUpdate as EventListener);
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
      window.removeEventListener('reservationUpdate', handleReservationUpdate as EventListener);
      window.removeEventListener('waitlistUpdate', handleWaitlistUpdate as EventListener);
    };
  }, []);

  const refreshNotifications = async () => {
    try {
      const today = new Date();
      const dayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
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

  const handleWorkflowNotifications = (step: string, orderData: any) => {
    try {
      let title = '';
      let message = '';
      let priority: Notification['priority'] = 'medium';
      let actionUrl = '';

      switch (step) {
        case 'kitchen_confirmed':
          title = 'Order Confirmed';
          message = `Order ${orderData.tokenNumber} confirmed by kitchen`;
          actionUrl = '/kitchen';
          break;
        case 'preparing':
          title = 'Order Being Prepared';
          message = `Order ${orderData.tokenNumber} is now being prepared`;
          actionUrl = '/kitchen';
          break;
        case 'ready':
          title = 'Order Ready';
          message = `Order ${orderData.tokenNumber} is ready to serve`;
          priority = 'high';
          actionUrl = '/billing';
          break;
        case 'served':
          title = 'Order Served';
          message = `Order ${orderData.tokenNumber} has been served`;
          actionUrl = '/billing';
          break;
        default:
          return;
      }

      addNotification({
        type: 'workflow',
        title,
        message,
        priority,
        actionUrl,
        data: { orderId: orderData.id, step }
      });
    } catch (error) {
      console.error('Error handling workflow notifications:', error);
    }
  };

  const handleAdvancedInventoryNotifications = (type: string, data: any) => {
    try {
      switch (type) {
        case 'low_stock_alert':
          addNotification({
            type: 'inventory',
            title: 'Low Stock Alert',
            message: `${data.alert.itemName} is running low (${data.alert.currentStock} remaining)`,
            priority: data.alert.severity === 'critical' ? 'urgent' : 'high',
            actionUrl: '/menu',
            data: { itemId: data.item.id, alertId: data.alert.id }
          });
          break;
        case 'expiry_alert':
          addNotification({
            type: 'inventory',
            title: 'Item Expiry Alert',
            message: data.message,
            priority: data.severity === 'critical' ? 'urgent' : 'medium',
            actionUrl: '/menu',
            data: { itemId: data.item.id }
          });
          break;
        case 'stock_movement':
          if (data.movement.type === 'OUT' && data.item.currentStock <= data.item.minimumStock) {
            addNotification({
              type: 'inventory',
              title: 'Stock Level Warning',
              message: `${data.item.name} stock is now below minimum level`,
              priority: 'medium',
              actionUrl: '/menu',
              data: { itemId: data.item.id }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling inventory notifications:', error);
    }
  };

  const handleReservationNotifications = (type: string, reservation: any) => {
    try {
      switch (type) {
        case 'created':
          addNotification({
            type: 'reservation',
            title: 'New Reservation',
            message: `Reservation for ${reservation.customerName} - ${reservation.partySize} people at ${reservation.time}`,
            priority: 'medium',
            actionUrl: '/tables',
            data: { reservationId: reservation.id }
          });
          break;
        case 'updated':
          if (reservation.status === 'arrived') {
            addNotification({
              type: 'reservation',
              title: 'Customer Arrived',
              message: `${reservation.customerName} has arrived for their reservation`,
              priority: 'high',
              actionUrl: '/tables',
              data: { reservationId: reservation.id }
            });
          }
          break;
        case 'reminder_sent':
          addNotification({
            type: 'reservation',
            title: 'Reminder Sent',
            message: `Reminder sent to ${reservation.customerName} for reservation at ${reservation.time}`,
            priority: 'low',
            actionUrl: '/tables',
            data: { reservationId: reservation.id }
          });
          break;
      }
    } catch (error) {
      console.error('Error handling reservation notifications:', error);
    }
  };

  const handleWaitlistNotifications = (type: string, entry: any) => {
    try {
      if (type === 'added') {
        addNotification({
          type: 'table',
          title: 'Customer Added to Waitlist',
          message: `${entry.customerName} (party of ${entry.partySize}) added to waitlist`,
          priority: 'medium',
          actionUrl: '/tables',
          data: { waitlistId: entry.id }
        });
      }
    } catch (error) {
      console.error('Error handling waitlist notifications:', error);
    }
  };

  const handleTableNotifications = (tables: any[]) => {
    try {
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

      setNotifications(prev => [newNotification, ...prev].slice(0, 100));
      
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
