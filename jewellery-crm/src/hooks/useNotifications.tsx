'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Notification, NotificationType, NotificationPriority, NotificationStatus, NotificationSettings } from '@/types';
import { apiService } from '@/lib/api-service';
import { useAuth } from './useAuth';
import { notificationSound } from '@/lib/notification-sound';

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

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    console.log('🔍 fetchNotifications called with:', { user: user?.username, isAuthenticated, isHydrated });
    
    if (!user || !isAuthenticated || !isHydrated) {
      console.log('❌ fetchNotifications early return - missing user/auth/hydration');
      return;
    }

    try {
      console.log('📡 Starting API call to fetch notifications...');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Call the actual API to get notifications
      const response = await apiService.getNotifications();
      console.log('📡 API Response:', response);
      
      if (response.success && response.data) {
        // Extract the results array from the paginated response
        const notifications = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
        console.log('✅ Setting notifications in state:', notifications.length, 'notifications');
        dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      } else {
        // If no data or error, set empty array
        console.log('⚠️ No data or error in response, setting empty notifications');
        dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
        if (!response.success) {
          console.log('❌ API call failed:', response.message);
          dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to fetch notifications' });
        }
      }
    } catch (error) {
      console.error('💥 Error fetching notifications:', error);
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
        console.error('Failed to mark notification as read:', response.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
      } else {
        console.error('Failed to mark all notifications as read:', response.message);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      } else {
        console.error('Failed to delete notification:', response.message);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Create new notification
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const response = await apiService.createNotification(notification);
      if (response.success) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: response.data });
      } else {
        console.error('Failed to create notification:', response.message);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
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
        console.error('Failed to fetch notification settings:', response.message);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }, [user]);

  // Update notification settings
  const updateSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    try {
      const response = await apiService.updateNotificationSettings(settings);
      if (response.success) {
        dispatch({ type: 'SET_SETTINGS', payload: response.data });
      } else {
        console.error('Failed to update notification settings:', response.message);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
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

  // Set up real-time connection (WebSocket or polling)
  useEffect(() => {
    if (!user || !isAuthenticated || !isHydrated) return;

    // TODO: Implement WebSocket connection for real-time notifications
    // For now, we'll use polling
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });

    return () => {
      clearInterval(interval);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    };
  }, [user, isAuthenticated, isHydrated, fetchNotifications]);

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