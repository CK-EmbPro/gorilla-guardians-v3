import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth";
import { useSSE } from "./useSSE";

export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const authHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("gg_auth_token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    try {
      const res = await fetch(`${API_BASE}/api/notifications?userId=${user.id}`, { credentials: "include", headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch {
      // network error — keep existing
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useSSE(user?.id, (event, data) => {
    if (event === "notification") {
      const n = data as AppNotification;
      setNotifications(prev => {
        if (prev.some(x => x.id === n.id)) return prev;
        return [n, ...prev];
      });
    }
  });

  const markRead = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeaders(),
        credentials: "include",
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/api/notifications/read-all?userId=${user.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        credentials: "include",
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationsProvider");
  return ctx;
}
