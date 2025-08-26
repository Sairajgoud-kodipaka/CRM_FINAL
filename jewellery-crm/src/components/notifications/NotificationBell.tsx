'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';
import { NotificationPanel } from './NotificationPanel';

interface NotificationBellProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  variant = 'ghost',
  size = 'md'
}) => {
  const { state } = useNotifications();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);



  // Filter notifications based on user role and store access (same logic as NotificationManager)
  const getScopedNotifications = (notifications: Notification[]) => {
    if (!user) {
      return [];
    }

    // Business admin can see all notifications
    if (user.role === 'business_admin') {
      return notifications;
    }

    // Manager can see their store's notifications
    if (user.role === 'manager') {
      return notifications.filter(notification => 
        notification.tenantId === user.tenant?.toString() &&
        (!notification.storeId || notification.storeId === user.store?.toString())
      );
    }

    // Inhouse sales can see their own notifications
    if (user.role === 'inhouse_sales') {
      return notifications.filter(notification => 
        notification.userId === user.id.toString()
      );
    }

    // Telecaller can see their assigned notifications
    if (user.role === 'tele_calling') {
      return notifications.filter(notification => 
        notification.userId === user.id.toString() ||
        notification.tenantId === user.tenant?.toString()
      );
    }

    // Marketing team can see marketing-related notifications
    if (user.role === 'marketing') {
      return notifications.filter(notification => 
        notification.type === 'marketing_campaign' ||
        notification.type === 'announcement'
      );
    }

    // Default: only show user's own notifications
    return notifications.filter(notification => 
      notification.userId === user.id.toString()
    );
  };

  // Don't render if user is not authenticated
  if (!isAuthenticated || !isHydrated || !user) {
    return null;
  }

  // Get scoped unread count
  const scopedNotifications = getScopedNotifications(state.notifications);
  const unreadCount = scopedNotifications.filter(n => n.status === 'unread').length;



  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 20;
      default:
        return 18;
    }
  };

  const handleBellClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size="icon"
        className={`relative ${getSizeClasses()} ${className}`}
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        {state.isLoading ? (
          <Loader2 className={`h-${getIconSize()} w-${getIconSize()} animate-spin`} />
        ) : state.isConnected ? (
          <Bell className={`h-${getIconSize()} w-${getIconSize()}`} />
        ) : (
          <BellOff className={`h-${getIconSize()} w-${getIconSize()} text-muted-foreground`} />
        )}
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification panel */}
      {isPanelOpen && (
        <NotificationPanel onClose={handlePanelClose} />
      )}
    </div>
  );
}; 