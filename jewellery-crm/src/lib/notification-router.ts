import type { Notification } from '@/types';

/**
 * App uses role-prefixed routes (e.g. /sales/customers, /manager/customers).
 * Backend sends logical paths like /customers/123 — resolve to the correct app route.
 */
function getRolePrefix(role: string): string {
  const map: Record<string, string> = {
    business_admin: 'business-admin',
    manager: 'manager',
    inhouse_sales: 'sales',
    tele_calling: 'telecaller',
    marketing: 'marketing',
    platform_admin: 'platform',
  };
  return map[role] || 'sales';
}

/**
 * Resolve backend action_url to a route that exists in the app (role-prefixed).
 */
export function resolveActionUrlToAppRoute(actionUrl: string, userRole: string): string {
  if (!actionUrl || typeof actionUrl !== 'string') return '/';
  const path = actionUrl.replace(/^\//, '').trim();
  const prefix = getRolePrefix(userRole);

  // /customers or /customers/123 → list with detail modal open when id present
  if (path === 'customers' || path.startsWith('customers/')) {
    const id = path === 'customers' ? '' : path.slice('customers/'.length);
    return id ? `/${prefix}/customers?open=${id}` : `/${prefix}/customers`;
  }
  // /appointments or /appointments/123
  if (path === 'appointments' || path.startsWith('appointments/')) {
    const id = path.startsWith('appointments/') ? path.slice('appointments/'.length) : '';
    const base = `/${prefix}/appointments`;
    return id ? `${base}?open=${id}` : base;
  }
  // /products/transfers/123
  if (path.startsWith('products/transfers/')) {
    const id = path.slice('products/transfers/'.length);
    const base = prefix === 'business-admin' ? '/business-admin/inventory' : prefix === 'manager' ? '/manager/inventory' : `/${prefix}/products`;
    return id ? `${base}?transfer=${id}` : base;
  }
  // /products/transfers (list)
  if (path === 'products/transfers') {
    return prefix === 'business-admin' ? '/business-admin/inventory' : prefix === 'manager' ? '/manager/inventory' : `/${prefix}/products`;
  }

  return actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`;
}

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
 * Get notification route based on type and user role.
 * Backend actionUrl is resolved to role-prefixed app routes so navigation does not 404.
 */
export function getNotificationRoute(
  notification: Notification,
  userRole: string
): string {
  // Resolve backend action_url to app route (e.g. /customers/123 → /sales/customers/123)
  if (notification.actionUrl) {
    return resolveActionUrlToAppRoute(notification.actionUrl, userRole);
  }

  // Dynamic routing based on notification type (all role-prefixed)
  const prefix = getRolePrefix(userRole);
  switch (notification.type) {
    case 'new_customer':
      const customerId = extractIdFromNotification(notification, 'customer_id');
      if (customerId) {
        return `/${prefix}/customers?open=${customerId}`;
      }
      return `/${prefix}/customers`;

    case 'appointment_reminder':
      const appointmentId = extractIdFromNotification(notification, 'appointment_id');
      if (appointmentId) {
        return `/${prefix}/appointments?open=${appointmentId}`;
      }
      return `/${prefix}/appointments`;

    case 'deal_update':
      const dealCustomerId = extractIdFromNotification(notification, 'customer_id');
      if (dealCustomerId) {
        return `/${prefix}/customers?open=${dealCustomerId}`;
      }
      return `/${prefix}/pipeline`;

    case 'payment_received':
      const paymentCustomerId = extractIdFromNotification(notification, 'customer_id');
      if (paymentCustomerId) {
        return `/${prefix}/customers?open=${paymentCustomerId}`;
      }
      return `/${prefix}/dashboard`;

    case 'order_status':
      const orderId = extractIdFromNotification(notification, 'order_id');
      if (orderId) {
        return `/${prefix}/orders`;
      }
      return `/${prefix}/orders`;

    case 'inventory_alert':
      const productId = extractIdFromNotification(notification, 'product_id');
      if (productId) {
        return prefix === 'business-admin' ? '/business-admin/inventory' : prefix === 'manager' ? '/manager/inventory' : `/${prefix}/products`;
      }
      return prefix === 'business-admin' ? '/business-admin/inventory' : prefix === 'manager' ? '/manager/inventory' : `/${prefix}/products`;

    case 'task_reminder':
      const taskId = extractIdFromNotification(notification, 'task_id');
      if (taskId) {
        return `/${prefix}/dashboard`;
      }
      return `/${prefix}/dashboard`;

    case 'escalation':
      return prefix === 'manager' ? '/manager/support' : `/${prefix}/dashboard`;

    case 'announcement':
      return `/${prefix}/dashboard`;

    case 'stock_transfer_request':
    case 'stock_transfer_approved':
    case 'stock_transfer_completed':
    case 'stock_transfer_cancelled':
    case 'stock_transfer_rejected':
      const transferId = extractIdFromNotification(notification, 'transfer_id');
      const invBase = prefix === 'business-admin' ? '/business-admin/inventory' : prefix === 'manager' ? '/manager/inventory' : `/${prefix}/products`;
      return transferId ? `${invBase}?transfer=${transferId}` : invBase;

    case 'marketing_campaign':
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

