'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { LuCircleCheck, LuTriangleAlert, LuInfo, LuCircleX, LuFlame, LuX } from 'react-icons/lu';

type NotificationType = 'info' | 'success' | 'warning' | 'danger' | 'ember';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  addNotification: (type: NotificationType, title: string, message: string) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setNotifications((prev) => [{ id, type, title, message, timestamp: Date.now() }, ...prev].slice(0, 50));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, dismissNotification, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

const ICONS: Record<NotificationType, ReactNode> = {
  info: <LuInfo className="h-4 w-4 text-info" />,
  success: <LuCircleCheck className="h-4 w-4 text-success" />,
  warning: <LuTriangleAlert className="h-4 w-4 text-warning" />,
  danger: <LuCircleX className="h-4 w-4 text-danger" />,
  ember: <LuFlame className="h-4 w-4 text-ember" />,
};

const BORDER_COLORS: Record<NotificationType, string> = {
  info: 'border-info/40',
  success: 'border-success/45',
  warning: 'border-warning/45',
  danger: 'border-danger/55',
  ember: 'border-ember/45',
};

const TIME_AGO = (ts: number): string => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export function NotificationToast() {
  const { notifications, dismissNotification } = useNotifications();
  const visible = notifications.slice(0, 3);

  return (
    <div className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 pointer-events-none">
      {visible.map((n) => (
        <div
          key={n.id}
          className={`toast-in pointer-events-auto w-80 rounded-md border bg-charcoal/95 shadow-toast p-3 flex gap-3 items-start ${BORDER_COLORS[n.type]}`}
        >
          <span className="mt-0.5 text-sm">{ICONS[n.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-bone truncate">{n.title}</p>
              <span className="text-xs text-stone whitespace-nowrap">{TIME_AGO(n.timestamp)}</span>
            </div>
            <p className="text-xs text-muted mt-0.5">{n.message}</p>
          </div>
          <button onClick={() => dismissNotification(n.id)} className="text-stone hover:text-bone transition-colors mt-0.5" aria-label="dismiss notification">
            <LuX className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
