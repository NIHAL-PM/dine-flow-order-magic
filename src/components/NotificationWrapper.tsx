
import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationSystem from './NotificationSystem';

const NotificationWrapper: React.FC = () => {
  const { notifications, markAsRead, dismissNotification, clearAllNotifications } = useNotifications();

  return (
    <NotificationSystem
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onDismiss={dismissNotification}
      onClearAll={clearAllNotifications}
    />
  );
};

export default NotificationWrapper;
