'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import type { Notification, NotificationType, NotificationPriority, NotificationStatus, NotificationSettings } from '@/types';
import { apiService } from '@/lib/api-service';
import { useAuth } from './useAuth';
import { notificationSound } from '@/lib/notification-sound';
import { notificationWebSocket } from '@/services/notificationWebSocket';

// ================================
// NOTIFICATION CONTEXT TYPES
// ================================

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings | null;
  isConnected: boolean; // For real-time notifications
}

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'CLEAR_NOTIFICATIONS' };

// ================================
// NOTIFICATION REDUCER
// ================================

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_NOTIFICATIONS':
      // Ensure payload is an array and handle potential null/undefined
      const notifications = Array.isArray(action.payload) ? action.payload : [];
      const unreadCount = notifications.filter(n => n.status === 'unread').length;
      return {
        ...state,
        notifications,
        unreadCount
      };

    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      const newUnreadCount = action.payload.status === 'unread'
        ? state.unreadCount + 1
        : state.unreadCount;

      // Play notification sound for new unread notifications
      if (action.payload.status === 'unread' && typeof window !== 'undefined') {
        notificationSound.play();
      }

      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount
      };

    case 'UPDATE_NOTIFICATION':
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, ...action.payload.updates }
          : notification
      );
      const updatedUnreadCount = updatedNotifications.filter(n => n.status === 'unread').length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedUnreadCount
      };

    case 'REMOVE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      const filteredUnreadCount = filteredNotifications.filter(n => n.status === 'unread').length;
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredUnreadCount
      };

    case 'MARK_AS_READ':
      const markedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, status: 'read' as NotificationStatus, readAt: new Date() }
          : notification
      );
      const markedUnreadCount = markedNotifications.filter(n => n.status === 'unread').length;
      return {
        ...state,
        notifications: markedNotifications,
        unreadCount: markedUnreadCount
      };

    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(notification => ({
        ...notification,
        status: 'read' as NotificationStatus,
        readAt: new Date()
      }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0
      };

    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };

    default:
      return state;
  }
};

// ================================
// NOTIFICATION CONTEXT
// ================================

interface NotificationContextType {
  state: NotificationState;
  actions: {
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
    getSettings: () => Promise<void>;
    updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
    clearNotifications: () => void;
    refreshNotifications: () => Promise<void>;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ================================
// NOTIFICATION PROVIDER
// ================================

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    settings: null,
    isConnected: false
  });

  // Debounce mechanism to prevent rapid API calls
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const DEBOUNCE_DELAY = 5000; // 5 seconds

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const now = Date.now();

    // Prevent rapid successive calls
    if (now - lastFetchTime < DEBOUNCE_DELAY) {

      return;
    }



    if (!user || !isAuthenticated || !isHydrated) {

      return;
    }

    try {

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Call the actual API to get notifications
      const response = await apiService.getNotifications();
      
      console.log('🔔 Frontend: Notification API response:', {
        success: response.success,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : (response.data as any)?.results?.length || 0,
        rawData: response.data
      });

      if (response.success && response.data) {
        // Extract the results array from the paginated response
        const notifications = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
        
        console.log('🔔 Frontend: Processed notifications:', {
          count: notifications.length,
          notifications: notifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            userId: n.userId,
            storeId: n.storeId,
            tenantId: n.tenantId,
            status: n.status
          }))
        });

        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
        setLastFetchTime(Date.now()); // Update last fetch time on success
      } else {
        // If no data or error, set empty array
        console.warn('🔔 Frontend: No notifications in response:', response);
        dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
        if (!response.success) {
          dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to fetch notifications' });
        }
      }
    } catch (error) {

      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, isAuthenticated, isHydrated]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.success) {
        dispatch({ type: 'MARK_AS_READ', payload: id });
      } else {

      }
    } catch (error) {

    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
      } else {

      }
    } catch (error) {

    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      } else {

      }
    } catch (error) {

    }
  }, []);

  // Create new notification
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createNotification(notification);
      if (response.success) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: response.data });
      } else {

      }
    } catch (error) {

    }
  }, []);

  // Get notification settings
  const getSettings = useCallback(async () => {
    if (!user || !isAuthenticated || !isHydrated) return;

    try {
      const response = await apiService.getNotificationSettings();
      if (response.success) {
        dispatch({ type: 'SET_SETTINGS', payload: response.data });
      } else {

        // Don't throw error, just log warning to prevent affecting other components
      }
    } catch (error) {

      // Don't throw error, just log warning to prevent affecting other components
    }
  }, [user]);

  // Update notification settings
  const updateSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    try {
      const response = await apiService.updateNotificationSettings(settings);
      if (response.success) {
        dispatch({ type: 'SET_SETTINGS', payload: response.data });
      } else {

      }
    } catch (error) {

    }
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Initialize notifications when user is available
  useEffect(() => {
    if (user && isAuthenticated && isHydrated) {
      fetchNotifications();
      getSettings();
    }
  }, [user, isAuthenticated, isHydrated, fetchNotifications, getSettings]);

  // Set up real-time connection (WebSocket)
  useEffect(() => {
    if (!user || !isAuthenticated || !isHydrated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    notificationWebSocket.connect(token);

    // Subscribe to new notifications
    const unsubscribeNotification = notificationWebSocket.onNotification((notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      
      // Play sound for high/urgent priority notifications
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        notificationSound.play();
      }
      
      // Show browser notification for urgent items
      if (notification.priority === 'urgent' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `notification-${notification.id}`
        });
      }
    });

    // Subscribe to notification batches
    const unsubscribeBatch = notificationWebSocket.onNotificationBatch((notifications) => {
      notifications.forEach((notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });
    });

    // Subscribe to notification read events
    const unsubscribeRead = notificationWebSocket.onNotificationRead((notificationId) => {
      dispatch({ type: 'MARK_AS_READ', payload: notificationId.toString() });
    });

    // Update connection status
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: notificationWebSocket.isConnected });

    return () => {
      unsubscribeNotification();
      unsubscribeBatch();
      unsubscribeRead();
      notificationWebSocket.disconnect();
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    };
  }, [user, isAuthenticated, isHydrated]);

  const contextValue: NotificationContextType = {
    state,
    actions: {
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
      getSettings,
      updateSettings,
      clearNotifications,
      refreshNotifications
    }
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// ================================
// NOTIFICATION HOOK
// ================================

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
