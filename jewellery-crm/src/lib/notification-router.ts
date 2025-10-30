import type { Notification } from '@/types';

/**
 * Extract ID from notification message or metadata
 */
function extractIdFromNotification(notification: Notification, key: string): string {
  // First try metadata
  if (notification.metadata && typeof notification.metadata === 'object') {
    const metadata = notification.metadata as Record<string, any>;
    if (metadata[key]) {
      return String(metadata[key]);
    }
  }

  // Fallback to parsing message for #123 pattern
  if (notification.message) {
    const match = notification.message.match(/#(\d+)/);
    if (match) {
      return match[1];
    }
  }

  return '';
}

/**
 * Get notification route based on type and user role
 */
export function getNotificationRoute(
  notification: Notification,
  userRole: string
): string {
  // Use action_url if explicitly set
  if (notification.actionUrl) {
    return notification.actionUrl;
  }

  // Dynamic routing based on notification type
  switch (notification.type) {
    case 'new_customer':
      // Extract customer ID from metadata or message
      const customerId = extractIdFromNotification(notification, 'customer_id');
      if (customerId) {
        return userRole === 'business_admin'
          ? `/business-admin/customers/${customerId}`
          : `/customers/${customerId}`;
      }
      return userRole === 'business_admin'
        ? '/business-admin/customers'
        : '/customers';

    case 'appointment_reminder':
      // Extract appointment ID from metadata or message
      const appointmentId = extractIdFromNotification(notification, 'appointment_id');
      if (appointmentId) {
        return `/appointments?id=${appointmentId}`;
      }
      return '/appointments';

    case 'deal_update':
      // Extract customer ID for deal update
      const dealCustomerId = extractIdFromNotification(notification, 'customer_id');
      if (dealCustomerId) {
        return `/customers/${dealCustomerId}`;
      }
      return '/sales';

    case 'payment_received':
      // Extract customer ID
      const paymentCustomerId = extractIdFromNotification(notification, 'customer_id');
      if (paymentCustomerId) {
        return `/customers/${paymentCustomerId}`;
      }
      return '/sales';

    case 'order_status':
      // Extract order ID
      const orderId = extractIdFromNotification(notification, 'order_id');
      if (orderId) {
        return `/orders/${orderId}`;
      }
      return '/orders';

    case 'inventory_alert':
      // Extract product ID
      const productId = extractIdFromNotification(notification, 'product_id');
      if (productId) {
        return `/products/${productId}`;
      }
      return '/products';

    case 'task_reminder':
      // Extract task ID
      const taskId = extractIdFromNotification(notification, 'task_id');
      if (taskId) {
        return `/tasks/${taskId}`;
      }
      return '/tasks';

    case 'escalation':
      // Go to support/escalations
      return '/support/escalations';

    case 'announcement':
      // Go to announcements page
      return '/announcements';

    case 'stock_transfer_request':
    case 'stock_transfer_approved':
    case 'stock_transfer_completed':
    case 'stock_transfer_cancelled':
    case 'stock_transfer_rejected':
      // Extract transfer ID
      const transferId = extractIdFromNotification(notification, 'transfer_id');
      if (transferId) {
        return `/inventory/transfers/${transferId}`;
      }
      return '/inventory/transfers';

    case 'marketing_campaign':
      // Go to marketing campaigns
      return '/marketing/campaigns';

    default:
      return '/';
  }
}

/**
 * Format notification message for display
 */
export function formatNotificationMessage(notification: Notification): string {
  return notification.message || notification.title;
}

/**
 * Get notification priority color
 */
export function getNotificationPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-blue-500';
    case 'low':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(notification: Notification): string {
  switch (notification.type) {
    case 'new_customer':
      return '👤';
    case 'appointment_reminder':
      return '📅';
    case 'deal_update':
      return '💼';
    case 'payment_received':
      return '💰';
    case 'order_status':
      return '📦';
    case 'inventory_alert':
      return '📊';
    case 'task_reminder':
      return '✅';
    case 'escalation':
      return '⚠️';
    case 'announcement':
      return '📢';
    case 'marketing_campaign':
      return '📱';
    default:
      return '🔔';
  }
}

