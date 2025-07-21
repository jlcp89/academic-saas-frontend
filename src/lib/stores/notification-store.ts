import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
  userId?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    addNotification: (notification) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        read: false,
      };

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    },

    markAsRead: (id) => {
      set((state) => {
        const updatedNotifications = state.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      });
    },

    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
        unreadCount: 0,
      }));
    },

    removeNotification: (id) => {
      set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        const updatedNotifications = state.notifications.filter(n => n.id !== id);
        const unreadCount = !notification?.read 
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount;
        
        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      });
    },

    clearAll: () => {
      set({
        notifications: [],
        unreadCount: 0,
      });
    },

    fetchNotifications: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const notifications = await response.json();
        const unreadCount = notifications.filter((n: Notification) => !n.read).length;
        
        set({
          notifications,
          unreadCount,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        });
      }
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
  }))
);

// Helper function to create different types of notifications
export const createNotification = {
  success: (title: string, message: string, options?: Partial<Notification>) => ({
    title,
    message,
    type: 'success' as const,
    ...options,
  }),
  
  error: (title: string, message: string, options?: Partial<Notification>) => ({
    title,
    message,
    type: 'error' as const,
    ...options,
  }),
  
  warning: (title: string, message: string, options?: Partial<Notification>) => ({
    title,
    message,
    type: 'warning' as const,
    ...options,
  }),
  
  info: (title: string, message: string, options?: Partial<Notification>) => ({
    title,
    message,
    type: 'info' as const,
    ...options,
  }),
};