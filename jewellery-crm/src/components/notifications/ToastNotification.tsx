'use client';

import React, { useEffect, useState } from 'react';
import { X, Check, AlertTriangle, Info, Calendar, TrendingUp, Package, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Notification, NotificationType, NotificationPriority } from '@/types';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
  duration?: number;
}

const getNotificationIcon = (type: NotificationType, priority: NotificationPriority) => {
  const iconClass = "h-5 w-5";

  switch (type) {
    case 'appointment_reminder':
      return <Calendar className={`${iconClass} text-[#4A90E2]`} />;
    case 'deal_update':
      return <TrendingUp className={`${iconClass} text-[#00BDA5]`} />;
    case 'inventory_alert':
      return <Package className={`${iconClass} text-[#F5A623]`} />;
    case 'task_due':
      return <AlertTriangle className={`${iconClass} text-[#E74C3C]`} />;
    case 'announcement':
      return <Bell className={`${iconClass} text-[#4A90E2]`} />;
    default:
      return <Info className={`${iconClass} text-gray-500`} />;
  }
};

const getPriorityStyles = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return {
        container: 'bg-[#E74C3C]/10 border-[#E74C3C]',
        title: 'text-[#E74C3C]',
        message: 'text-[#E74C3C]/80',
        icon: 'text-[#E74C3C]'
      };
    case 'high':
      return {
        container: 'bg-[#F5A623]/10 border-[#F5A623]',
        title: 'text-[#F5A623]',
        message: 'text-[#F5A623]/80',
        icon: 'text-[#F5A623]'
      };
    case 'medium':
      return {
        container: 'bg-[#F5A623]/10 border-[#F5A623]',
        title: 'text-[#F5A623]',
        message: 'text-[#F5A623]/80',
        icon: 'text-[#F5A623]'
      };
    case 'low':
      return {
        container: 'bg-[#00BDA5]/10 border-[#00BDA5]',
        title: 'text-[#00BDA5]',
        message: 'text-[#00BDA5]/80',
        icon: 'text-[#00BDA5]'
      };
    default:
      return {
        container: 'bg-[#4A90E2]/10 border-[#4A90E2]',
        title: 'text-[#4A90E2]',
        message: 'text-[#4A90E2]/80',
        icon: 'text-[#4A90E2]'
      };
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

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
  onAction,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const styles = getPriorityStyles(notification.priority);

  useEffect(() => {
    if (notification.isPersistent) return;

    const timer = setTimeout(() => {
      if (!isHovered) {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow time for exit animation
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, isHovered, notification.isPersistent, onClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 w-96 max-w-sm bg-white rounded-lg shadow-lg border ${styles.container} transform transition-all duration-300 ease-in-out z-50 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.type, notification.priority)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-sm font-medium ${styles.title}`}>
                    {notification.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-xs ${styles.container}`}
                  >
                    {getPriorityText(notification.priority)}
                  </Badge>
                </div>
                <p className={`text-sm ${styles.message} mb-2`}>
                  {notification.message}
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                onClick={onClose}
                title="Close notification"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Action button */}
            {notification.actionText && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleAction}
                >
                  {notification.actionText}
                </Button>
                {notification.isPersistent && (
                  <span className="text-xs text-gray-500">
                    This notification will remain until dismissed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar for non-persistent notifications */}
      {!notification.isPersistent && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-linear"
            style={{
              width: `${((duration - (Date.now() - new Date(notification.createdAt).getTime())) / duration) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};
