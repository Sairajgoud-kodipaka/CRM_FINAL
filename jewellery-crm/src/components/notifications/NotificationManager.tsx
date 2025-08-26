'use client';

import React, { useEffect, useState } from 'react';
import { ToastNotification } from './ToastNotification';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';

interface NotificationManagerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxToasts = 3,
  position = 'top-right'
}) => {
  const { state, actions } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  // Filter notifications based on user role and store access
  const getScopedNotifications = (notifications: Notification[]) => {
    if (!user) return [];

    // Business admin can see all notifications
    if (user.role === 'business_admin') {
      return notifications;
    }

    // Store manager and inhouse sales can only see their store's notifications
    if (user.role === 'manager' || user.role === 'inhouse_sales') {
      return notifications.filter(notification => 
        notification.tenantId === user.tenant?.toString() &&
        (!notification.storeId || notification.storeId === user.store?.toString())
      );
    }

    // Tele-calling users can see their store's notifications and their own
    if (user.role === 'tele_calling') {
      return notifications.filter(notification => 
        notification.userId === user.id.toString() ||
        (notification.tenantId === user.tenant?.toString() &&
         (!notification.storeId || notification.storeId === user.store?.toString()))
      );
    }

    // Marketing users can see marketing-related notifications and their store's notifications
    if (user.role === 'marketing') {
      return notifications.filter(notification => 
        notification.type === 'marketing_campaign' ||
        notification.type === 'announcement' ||
        (notification.tenantId === user.tenant?.toString() &&
         (!notification.storeId || notification.storeId === user.store?.toString()))
      );
    }

    // Default: only show user's own notifications
    return notifications.filter(notification => 
      notification.userId === user.id.toString()
    );
  };

  // Handle new notifications and show them as toasts
  useEffect(() => {
    // Don't show notifications if user is not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Get scoped notifications that are unread and not already in active toasts
    const scopedNotifications = getScopedNotifications(state.notifications);
    const newNotifications = scopedNotifications.filter(
      notification => 
        notification.status === 'unread' && 
        !activeToasts.find(toast => toast.id === notification.id)
    );

    if (newNotifications.length > 0) {
      // Add new notifications to active toasts
      setActiveToasts(prev => {
        const updated = [...prev, ...newNotifications];
        // Keep only the latest notifications up to maxToasts
        return updated.slice(-maxToasts);
      });
    }
  }, [state.notifications, maxToasts, user, isAuthenticated, activeToasts]);

  // Remove notifications from active toasts if they're no longer unread
  useEffect(() => {
    // Don't process if user is not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    const scopedNotifications = getScopedNotifications(state.notifications);
    setActiveToasts(prev => 
      prev.filter(toast => {
        const currentNotification = scopedNotifications.find(n => n.id === toast.id);
        return currentNotification && currentNotification.status === 'unread';
      })
    );
  }, [state.notifications, user, isAuthenticated]);

  // Clear active toasts when component unmounts or when notifications are refreshed
  useEffect(() => {
    return () => {
      setActiveToasts([]);
    };
  }, []);

  // Add keyboard shortcut to dismiss all notifications (Escape key)
  useEffect(() => {
    // Don't add event listener if user is not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeToasts.length > 0) {
        dismissAllToasts();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeToasts.length, isAuthenticated, user]);

  // Don't show notifications if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Enable toast notifications - show them in bell dropdown
  // return null; // This was disabling notifications

  const handleToastClose = async (notificationId: string) => {
    // Remove from active toasts immediately
    setActiveToasts(prev => prev.filter(toast => toast.id !== notificationId));
    
    // Mark as read in the global state
    try {
      await actions.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleToastAction = async (notification: Notification) => {
    // Mark as read first
    try {
      await actions.markAsRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    // Remove from active toasts
    setActiveToasts(prev => prev.filter(toast => toast.id !== notification.id));
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Function to dismiss all active toasts
  const dismissAllToasts = () => {
    setActiveToasts([]);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {/* Dismiss all button - only show when there are multiple notifications */}
      {activeToasts.length > 1 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={dismissAllToasts}
            className="text-xs text-gray-500 hover:text-gray-700 bg-white px-2 py-1 rounded border shadow-sm"
            title="Dismiss all notifications (or press Escape)"
          >
            Dismiss All
          </button>
        </div>
      )}
      
      {activeToasts.map((notification, index) => (
        <div
          key={notification.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 20}px)`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            notification={notification}
            onClose={() => handleToastClose(notification.id)}
            onAction={() => handleToastAction(notification)}
            duration={notification.isPersistent ? undefined : 5000}
          />
        </div>
      ))}
    </div>
  );
}; 