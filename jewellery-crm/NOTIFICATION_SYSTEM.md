# Notification System Documentation

## Overview

The Jewellery CRM notification system provides real-time notifications for various business events, helping users stay informed about important activities in their jewellery business.

## Features

### 🎯 Core Features
- **Real-time notifications** with toast and in-app notifications
- **Multiple notification types** (appointments, deals, inventory, etc.)
- **Priority-based notifications** (urgent, high, medium, low)
- **User preferences** for notification types and delivery methods
- **Quiet hours** to pause notifications during specific times
- **Notification history** with read/unread status
- **Action buttons** to navigate directly to related content

### 🔔 Notification Types

| Type | Description | Priority | Example |
|------|-------------|----------|---------|
| `appointment_reminder` | Appointment reminders and confirmations | High | "Appointment with John Doe in 30 minutes" |
| `deal_update` | Sales pipeline updates | Medium | "Deal 'Wedding Ring' moved to negotiation" |
| `new_customer` | New customer registrations | Medium | "New customer 'Sarah Smith' added" |
| `order_status` | Order processing updates | Medium | "Order #12345 status updated to 'Shipped'" |
| `inventory_alert` | Low stock and inventory warnings | Urgent | "Gold Ring 18K running low (5 items)" |
| `task_due` | Task reminders and overdue alerts | High | "Task 'Follow up with customer' due today" |
| `announcement` | Management announcements | Medium | "New collection launch next week" |
| `escalation` | Urgent escalations | Urgent | "New urgent escalation requires attention" |
| `system_alert` | System maintenance and alerts | High | "System maintenance scheduled for 2 AM" |
| `marketing_campaign` | Campaign performance updates | Medium | "Campaign 'Summer Sale' CTR: 15%" |
| `follow_up_reminder` | Customer follow-up reminders | High | "Follow up with customer scheduled" |
| `payment_received` | Payment confirmations | High | "Payment of ₹50,000 received for Order #123" |
| `low_stock` | Low stock alerts | Urgent | "Product running low on stock" |
| `high_demand` | High demand alerts | Medium | "Product trending - consider restocking" |

## Architecture

### Components

1. **NotificationProvider** (`/hooks/useNotifications.ts`)
   - Global state management for notifications
   - Real-time updates and polling
   - User preferences management

2. **NotificationBell** (`/components/notifications/NotificationBell.tsx`)
   - Notification bell icon with unread count
   - Opens notification panel

3. **NotificationPanel** (`/components/notifications/NotificationPanel.tsx`)
   - Dropdown panel showing all notifications
   - Mark as read, delete, and action buttons
   - Filtering and search capabilities

4. **ToastNotification** (`/components/notifications/ToastNotification.tsx`)
   - Real-time toast notifications
   - Auto-dismiss with progress bar
   - Hover to pause dismissal

5. **NotificationManager** (`/components/notifications/NotificationManager.tsx`)
   - Manages multiple toast notifications
   - Position and stacking controls

### File Structure

```
src/
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── ToastNotification.tsx
│   │   ├── NotificationManager.tsx
│   │   └── index.ts
│   └── providers/
│       └── AppProviders.tsx
├── hooks/
│   └── useNotifications.ts
├── lib/
│   ├── api-service.ts (notification endpoints)
│   └── notification-utils.ts
├── types/
│   └── index.ts (notification types)
└── app/
    └── business-admin/
        └── settings/
            └── notifications/
                └── page.tsx
```

## Usage

### Basic Setup

1. **Wrap your app with providers**:
```tsx
// app/layout.tsx
import { AppProviders } from '@/components/providers/AppProviders';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
```

2. **Add notification bell to your layout**:
```tsx
import { NotificationBell } from '@/components/notifications';

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}
```

### Creating Notifications

#### Using Templates

```tsx
import { notificationTemplates } from '@/lib/notification-utils';
import { useNotifications } from '@/hooks/useNotifications';

function AppointmentComponent() {
  const { actions } = useNotifications();

  const handleAppointmentCreated = async (appointment) => {
    const notification = notificationTemplates.appointmentReminder(
      appointment.customerName,
      appointment.time,
      appointment.id
    );
    
    await actions.createNotification(notification);
  };
}
```

#### Custom Notifications

```tsx
import { createNotification } from '@/lib/notification-utils';
import { useNotifications } from '@/hooks/useNotifications';

function CustomNotification() {
  const { actions } = useNotifications();

  const createCustomNotification = async () => {
    const notification = createNotification({
      type: 'custom',
      title: 'Custom Notification',
      message: 'This is a custom notification',
      priority: 'medium',
      actionUrl: '/some-page',
      actionText: 'View Details',
      isPersistent: false,
    });

    await actions.createNotification(notification);
  };
}
```

### Notification Settings

Users can manage their notification preferences at `/business-admin/settings/notifications`:

- **Email notifications** with frequency options
- **Push notifications** for mobile devices
- **In-app notifications** with sound and desktop options
- **Quiet hours** to pause notifications
- **Per-type preferences** for granular control

## API Integration

### Backend Endpoints

The notification system expects these API endpoints:

```typescript
// Get user notifications
GET /api/notifications/?page=1&status=unread&type=appointment_reminder

// Mark notification as read
POST /api/notifications/{id}/mark_as_read/

// Mark all notifications as read
POST /api/notifications/mark_all_as_read/

// Delete notification
DELETE /api/notifications/{id}/

// Create notification
POST /api/notifications/
{
  "type": "appointment_reminder",
  "title": "Appointment Reminder",
  "message": "You have an appointment...",
  "priority": "high",
  "relatedId": "123",
  "relatedType": "appointment",
  "actionUrl": "/appointments/123",
  "actionText": "View Appointment"
}

// Get notification settings
GET /api/notifications/settings/

// Update notification settings
PUT /api/notifications/settings/
{
  "emailNotifications": { "enabled": true, "frequency": "immediate" },
  "pushNotifications": { "enabled": true },
  "inAppNotifications": { "enabled": true, "sound": true },
  "quietHours": { "enabled": false, "startTime": "22:00", "endTime": "08:00" },
  "preferences": { "appointmentReminders": true, "dealUpdates": true }
}
```

### Data Models

#### Notification
```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  relatedId?: string;
  relatedType?: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  isPersistent: boolean;
}
```

#### NotificationSettings
```typescript
interface NotificationSettings {
  userId: string;
  tenantId: string;
  emailNotifications: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  pushNotifications: {
    enabled: boolean;
    types: NotificationType[];
  };
  inAppNotifications: {
    enabled: boolean;
    types: NotificationType[];
    sound: boolean;
    desktop: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  preferences: Record<NotificationType, boolean>;
}
```

## Configuration

### Environment Variables

```env
# Notification polling interval (seconds)
NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL=30

# Maximum toast notifications
NEXT_PUBLIC_MAX_TOAST_NOTIFICATIONS=3

# Toast notification duration (milliseconds)
NEXT_PUBLIC_TOAST_DURATION=5000
```

### Customization

#### Styling
The notification components use Tailwind CSS classes and can be customized by modifying the component styles.

#### Icons
Notification icons are from Lucide React and can be customized in the `getNotificationIcon` function.

#### Colors
Priority colors can be customized in the `getNotificationPriorityColor` function.

## Best Practices

### 1. Notification Timing
- Use appropriate priorities (urgent for critical issues, low for informational)
- Respect quiet hours settings
- Don't spam users with too many notifications

### 2. Content Guidelines
- Keep titles concise and descriptive
- Provide clear action buttons when relevant
- Use consistent messaging across notification types

### 3. Performance
- Implement proper cleanup for notification listeners
- Use pagination for large notification lists
- Cache notification settings to reduce API calls

### 4. User Experience
- Allow users to control notification preferences
- Provide clear ways to mark notifications as read
- Support both immediate and digest notification modes

## Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Check if NotificationProvider is properly wrapped
   - Verify API endpoints are working
   - Check browser console for errors

2. **Real-time updates not working**
   - Ensure polling is enabled
   - Check network connectivity
   - Verify WebSocket connection (if implemented)

3. **Settings not saving**
   - Check API permissions
   - Verify data format matches expected schema
   - Check for validation errors

### Debug Mode

Enable debug logging by setting:
```typescript
localStorage.setItem('notification-debug', 'true');
```

This will log all notification events to the console.

## Future Enhancements

### Planned Features
- [ ] WebSocket support for real-time updates
- [ ] Push notification support for mobile devices
- [ ] Notification templates for different business types
- [ ] Advanced filtering and search
- [ ] Notification analytics and reporting
- [ ] Bulk notification actions
- [ ] Notification scheduling
- [ ] Multi-language support

### Integration Opportunities
- [ ] WhatsApp integration for external notifications
- [ ] Email service integration
- [ ] SMS notifications
- [ ] Slack/Discord webhook integration
- [ ] Calendar integration for appointment reminders

## Support

For issues or questions about the notification system:
1. Check this documentation
2. Review the component source code
3. Check browser console for errors
4. Verify API endpoints are working
5. Test with different notification types and priorities 