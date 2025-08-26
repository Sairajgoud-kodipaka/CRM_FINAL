import { Notification, NotificationType, NotificationPriority } from '@/types';

/**
 * Utility functions for creating and managing notifications
 */

export interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  actionText?: string;
  isPersistent?: boolean;
  expiresIn?: number; // seconds
  metadata?: Record<string, any>;
}

/**
 * Create a notification object with default values
 */
export function createNotification(options: CreateNotificationOptions): Omit<Notification, 'id' | 'createdAt' | 'userId' | 'tenantId'> {
  return {
    type: options.type,
    title: options.title,
    message: options.message,
    priority: options.priority || 'medium',
    status: 'unread',
    relatedId: options.relatedId,
    relatedType: options.relatedType,
    actionUrl: options.actionUrl,
    actionText: options.actionText,
    isPersistent: options.isPersistent || false,
    expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn * 1000) : undefined,
    metadata: options.metadata || {},
  };
}

/**
 * Predefined notification templates for common scenarios
 */
export const notificationTemplates = {
  // Appointment notifications
  appointmentReminder: (customerName: string, appointmentTime: string, appointmentId: string) => 
    createNotification({
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `You have an appointment with ${customerName} at ${appointmentTime}`,
      priority: 'high',
      relatedId: appointmentId,
      relatedType: 'appointment',
      actionUrl: `/appointments/${appointmentId}`,
      actionText: 'View Appointment',
    }),

  appointmentConfirmed: (customerName: string, appointmentTime: string, appointmentId: string) =>
    createNotification({
      type: 'appointment_reminder',
      title: 'Appointment Confirmed',
      message: `Appointment with ${customerName} has been confirmed for ${appointmentTime}`,
      priority: 'medium',
      relatedId: appointmentId,
      relatedType: 'appointment',
      actionUrl: `/appointments/${appointmentId}`,
      actionText: 'View Details',
    }),

  // Deal notifications
  dealStageChanged: (dealTitle: string, oldStage: string, newStage: string, dealId: string) =>
    createNotification({
      type: 'deal_update',
      title: 'Deal Stage Updated',
      message: `Deal "${dealTitle}" moved from ${oldStage} to ${newStage}`,
      priority: 'medium',
      relatedId: dealId,
      relatedType: 'deal',
      actionUrl: `/pipeline/${dealId}`,
      actionText: 'View Deal',
    }),

  dealClosed: (dealTitle: string, dealValue: number, dealId: string) =>
    createNotification({
      type: 'deal_update',
      title: 'Deal Closed Successfully',
      message: `Deal "${dealTitle}" has been closed with value ₹${dealValue.toLocaleString()}`,
      priority: 'high',
      relatedId: dealId,
      relatedType: 'deal',
      actionUrl: `/pipeline/${dealId}`,
      actionText: 'View Details',
    }),

  // Customer notifications
  newCustomer: (customerName: string, customerId: string) =>
    createNotification({
      type: 'new_customer',
      title: 'New Customer Added',
      message: `New customer "${customerName}" has been added to the system`,
      priority: 'medium',
      relatedId: customerId,
      relatedType: 'customer',
      actionUrl: `/customers/${customerId}`,
      actionText: 'View Customer',
    }),

  // Inventory notifications
  lowStock: (productName: string, currentStock: number, productId: string) =>
    createNotification({
      type: 'inventory_alert',
      title: 'Low Stock Alert',
      message: `${productName} is running low on stock (${currentStock} items remaining)`,
      priority: 'urgent',
      relatedId: productId,
      relatedType: 'product',
      actionUrl: `/inventory/${productId}`,
      actionText: 'View Product',
      isPersistent: true,
    }),

  outOfStock: (productName: string, productId: string) =>
    createNotification({
      type: 'inventory_alert',
      title: 'Out of Stock Alert',
      message: `${productName} is now out of stock`,
      priority: 'urgent',
      relatedId: productId,
      relatedType: 'product',
      actionUrl: `/inventory/${productId}`,
      actionText: 'Restock Product',
      isPersistent: true,
    }),

  // Order notifications
  orderStatusUpdate: (orderNumber: string, status: string, orderId: string) =>
    createNotification({
      type: 'order_status',
      title: 'Order Status Updated',
      message: `Order #${orderNumber} status has been updated to ${status}`,
      priority: 'medium',
      relatedId: orderId,
      relatedType: 'order',
      actionUrl: `/orders/${orderId}`,
      actionText: 'View Order',
    }),

  paymentReceived: (orderNumber: string, amount: number, orderId: string) =>
    createNotification({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ₹${amount.toLocaleString()} received for order #${orderNumber}`,
      priority: 'high',
      relatedId: orderId,
      relatedType: 'order',
      actionUrl: `/orders/${orderId}`,
      actionText: 'View Order',
    }),

  // Task notifications
  taskDue: (taskTitle: string, dueDate: string, taskId: string) =>
    createNotification({
      type: 'task_due',
      title: 'Task Due Soon',
      message: `Task "${taskTitle}" is due on ${dueDate}`,
      priority: 'high',
      relatedId: taskId,
      relatedType: 'task',
      actionUrl: `/tasks/${taskId}`,
      actionText: 'View Task',
    }),

  taskOverdue: (taskTitle: string, taskId: string) =>
    createNotification({
      type: 'task_due',
      title: 'Task Overdue',
      message: `Task "${taskTitle}" is overdue`,
      priority: 'urgent',
      relatedId: taskId,
      relatedType: 'task',
      actionUrl: `/tasks/${taskId}`,
      actionText: 'Complete Task',
      isPersistent: true,
    }),

  // System notifications
  systemMaintenance: (message: string) =>
    createNotification({
      type: 'system_alert',
      title: 'System Maintenance',
      message,
      priority: 'high',
      isPersistent: true,
    }),

  // Announcement notifications
  announcement: (title: string, message: string, announcementId: string) =>
    createNotification({
      type: 'announcement',
      title,
      message,
      priority: 'medium',
      relatedId: announcementId,
      relatedType: 'announcement',
      actionUrl: `/announcements/${announcementId}`,
      actionText: 'Read More',
    }),

  // Escalation notifications
  escalationCreated: (title: string, priority: string, escalationId: string) =>
    createNotification({
      type: 'escalation',
      title: 'New Escalation',
      message: `New ${priority} priority escalation: ${title}`,
      priority: priority === 'urgent' ? 'urgent' : 'high',
      relatedId: escalationId,
      relatedType: 'escalation',
      actionUrl: `/escalations/${escalationId}`,
      actionText: 'View Escalation',
      isPersistent: true,
    }),

  // Marketing notifications
  campaignPerformance: (campaignName: string, metric: string, value: string) =>
    createNotification({
      type: 'marketing_campaign',
      title: 'Campaign Performance Update',
      message: `Campaign "${campaignName}" ${metric}: ${value}`,
      priority: 'medium',
      actionUrl: '/marketing/campaigns',
      actionText: 'View Campaigns',
    }),

  // Follow-up notifications
  followUpReminder: (customerName: string, followUpDate: string, customerId: string) =>
    createNotification({
      type: 'follow_up_reminder',
      title: 'Follow-up Reminder',
      message: `Follow-up with ${customerName} scheduled for ${followUpDate}`,
      priority: 'high',
      relatedId: customerId,
      relatedType: 'customer',
      actionUrl: `/customers/${customerId}`,
      actionText: 'View Customer',
    }),
};

/**
 * Helper function to format notification messages with variables
 */
export function formatNotificationMessage(template: string, variables: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    appointment_reminder: 'calendar',
    deal_update: 'trending-up',
    new_customer: 'user-plus',
    order_status: 'package',
    inventory_alert: 'package',
    task_due: 'clock',
    announcement: 'megaphone',
    escalation: 'alert-triangle',
    system_alert: 'alert-circle',
    marketing_campaign: 'bar-chart',
    follow_up_reminder: 'phone',
    payment_received: 'credit-card',
    low_stock: 'package',
    high_demand: 'trending-up',
    custom: 'bell',
  };

  return icons[type] || 'bell';
}

/**
 * Get notification priority color
 */
export function getNotificationPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    urgent: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green',
  };

  return colors[priority] || 'gray';
}

/**
 * Check if notification should be shown based on user preferences
 */
export function shouldShowNotification(
  notification: Notification,
  userPreferences: Record<string, boolean>
): boolean {
  // Check if user has enabled this notification type
  const preferenceKey = notification.type as keyof typeof userPreferences;
  return userPreferences[preferenceKey] !== false;
}

/**
 * Check if notification is within quiet hours
 */
export function isWithinQuietHours(
  notification: Notification,
  quietHours: { enabled: boolean; startTime: string; endTime: string }
): boolean {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes <= endMinutes) {
    // Same day quiet hours
    return currentTime >= startMinutes && currentTime <= endMinutes;
  } else {
    // Overnight quiet hours
    return currentTime >= startMinutes || currentTime <= endMinutes;
  }
} 