import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as notifApi from '../api/notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await notifApi.getNotifications();
      if (Array.isArray(data)) {
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      // Silent - user may not be logged in yet
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    // Fast polling for near real-time sync (every 15 seconds)
    const interval = setInterval(refreshUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

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
