'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Check, Trash2, Settings, RefreshCw, Calendar, TrendingUp, Package, AlertTriangle, MessageSquare, Bell, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Notification, NotificationType, NotificationPriority } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { notificationSound } from '@/lib/notification-sound';

interface NotificationPanelProps {
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'appointment_reminder':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'deal_update':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'inventory_alert':
      return <Package className="h-4 w-4 text-orange-500" />;
    case 'task_due':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'announcement':
      return <Bell className="h-4 w-4 text-purple-500" />;
    case 'escalation':
      return <MessageSquare className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityText = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Normal';
  }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { state, actions } = useNotifications();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Debug logging
  console.log('🔔 NotificationPanel render:', {
    user: user?.username,
    role: user?.role,
    tenant: user?.tenant,
    store: user?.store,
    isAuthenticated,
    isHydrated,
    totalNotifications: state.notifications.length,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    error: state.error
  });

  // Debug function to manually fetch notifications
  const handleDebugFetch = async () => {
    console.log('🔧 Manual debug fetch triggered');
    try {
      await actions.fetchNotifications();
      console.log('🔧 Manual fetch completed');
    } catch (error) {
      console.error('🔧 Manual fetch failed:', error);
    }
  };

  // Initialize volume from notification sound
  useEffect(() => {
    setVolume(notificationSound.getVolume());
  }, []);

  // Filter notifications based on user role and store access
  const getScopedNotifications = (notifications: Notification[]) => {
    console.log('🔍 getScopedNotifications called with:', {
      totalNotifications: notifications.length,
      userRole: user?.role,
      userTenant: user?.tenant,
      userStore: user?.store
    });

    if (!user) return [];

    // Business admin can see all notifications
    if (user.role === 'business_admin') {
      console.log('👑 Business admin - showing all notifications');
      return notifications;
    }

    // Manager can see their store's notifications
    if (user.role === 'manager') {
      const filtered = notifications.filter(notification => 
        notification.tenantId === user.tenant?.toString() &&
        (!notification.storeId || notification.storeId === user.store?.toString())
      );
      console.log('👔 Manager - filtered to:', filtered.length, 'notifications');
      return filtered;
    }

    // Inhouse sales can see their store's notifications and their own
    if (user.role === 'inhouse_sales') {
      const filtered = notifications.filter(notification => 
        notification.userId === user.id.toString() ||
        (notification.tenantId === user.tenant?.toString() &&
         (!notification.storeId || notification.storeId === user.store?.toString()))
      );
      console.log('💼 Inhouse sales - filtered to:', filtered.length, 'notifications');
      return filtered;
    }

    // Telecaller can see their assigned notifications
    if (user.role === 'tele_calling') {
      const filtered = notifications.filter(notification => 
        notification.userId === user.id.toString() ||
        notification.tenantId === user.tenant?.toString()
      );
      console.log('📞 Telecaller - filtered to:', filtered.length, 'notifications');
      return filtered;
    }

    // Marketing team can see marketing-related notifications
    if (user.role === 'marketing') {
      const filtered = notifications.filter(notification => 
        notification.type === 'marketing_campaign' ||
        notification.type === 'announcement'
      );
      console.log('📢 Marketing - filtered to:', filtered.length, 'notifications');
      return filtered;
    }

    // Default: only show user's own notifications
    const filtered = notifications.filter(notification => 
      notification.userId === user.id.toString()
    );
    console.log('🔒 Default - showing only own notifications:', filtered.length);
    return filtered;
  };

  // Don't render if user is not authenticated
  if (!isAuthenticated || !isHydrated || !user) {
    return null;
  }

  const scopedNotifications = getScopedNotifications(state.notifications);
  const unreadCount = scopedNotifications.filter(n => n.status === 'unread').length;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMarkAsRead = async (notificationId: string) => {
    await actions.markAsRead(notificationId);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to delete this notification?');
      
      if (!confirmed) {
        return;
      }
      
      await actions.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to delete all ${scopedNotifications.length} notifications? This action cannot be undone.`
      );
      
      if (!confirmed) {
        return;
      }
      
      // Delete all notifications one by one
      const deletePromises = scopedNotifications.map(notification => 
        actions.deleteNotification(notification.id)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    await actions.markAllAsRead();
  };

  const handleRefresh = async () => {
    await actions.refreshNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === 'unread') {
      await actions.markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    notificationSound.setEnabled(!newMutedState);
    
    // Test sound if unmuting
    if (newMutedState === false) {
      notificationSound.play();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    notificationSound.setVolume(newVolume);
  };

  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        notification.status === 'unread' ? 'bg-blue-50' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                >
                  {getPriorityText(notification.priority)}
                </Badge>
                {notification.status === 'unread' && (
                  <Badge variant="default" className="text-xs bg-blue-500">
                    New
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {notification.status === 'unread' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(notification.id);
                }}
                title="Delete notification"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Action button */}
          {notification.actionText && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotificationClick(notification);
                }}
              >
                {notification.actionText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        
        {/* Debug button - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDebugFetch}
            className="text-xs"
          >
            🔧 Debug Fetch
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Debug Status - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 bg-gray-50 border-b text-xs">
          <div className="font-mono">
            <div>🔍 Status: {state.isLoading ? 'Loading...' : state.error ? 'Error' : 'Ready'}</div>
            <div>📊 Total: {state.notifications.length} | Unread: {state.unreadCount}</div>
            <div>👤 User: {user?.username} | Role: {user?.role}</div>
            <div>🏢 Tenant: {user?.tenant} | Store: {user?.store}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {scopedNotifications.length > 0 && (
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {scopedNotifications.length} notification{scopedNotifications.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                title="Volume"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Notification settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
              onClick={() => notificationSound.play()}
              title="Test notification sound"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              onClick={handleDeleteAllNotifications}
              title="Delete all notifications"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="max-h-80 overflow-y-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading notifications...</span>
            </div>
          </div>
        ) : scopedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No notifications</h4>
            <p className="text-sm text-gray-500">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {scopedNotifications.map(renderNotification)}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {scopedNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {state.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                // TODO: Navigate to notifications page
                console.log('View all notifications');
              }}
            >
              View all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 