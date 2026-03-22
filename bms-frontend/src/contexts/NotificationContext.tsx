import React, { createContext, useContext, useEffect, useState } from 'react';
import * as notifApi from '../api/notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const data = await notifApi.getNotifications();
      if (Array.isArray(data)) {
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
