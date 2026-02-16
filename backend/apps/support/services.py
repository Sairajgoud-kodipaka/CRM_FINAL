from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import SupportTicket, SupportNotification
from django.db import models

User = get_user_model()


class SupportTicketService:
    """
    Service class for support ticket business logic and notifications.
    """
    
    @staticmethod
    def _push_for_recipient(recipient, title, message, action_url=None, priority='medium'):
        """Bridge to main CRM notifications for push on all devices."""
        try:
            from apps.notifications.services import create_push_notification
            create_push_notification(
                recipient, title, message,
                action_url=action_url or '/support',
                notif_type='announcement',
                priority=priority,
            )
        except Exception:
            pass

    @staticmethod
    def notify_platform_admins(ticket):
        """Send notification to all platform admins about new ticket. Platform admins are global (cross-tenant by design). Ticket creator is always the tenant's user."""
        platform_admins = User.objects.filter(role='platform_admin')
        title = f"New Support Ticket: {ticket.ticket_id}"
        message = f"New {ticket.priority} priority ticket from {ticket.tenant.name}: {ticket.title}"
        for admin in platform_admins:
            SupportNotification.objects.create(
                ticket=ticket,
                recipient=admin,
                notification_type=SupportNotification.NotificationType.TICKET_CREATED,
                title=title,
                message=message
            )
            SupportTicketService._push_for_recipient(admin, title, message, priority='medium')
    
    @staticmethod
    def notify_ticket_resolved(ticket):
        """Notify ticket creator (tenant's business admin) that ticket has been resolved. Same-tenant only."""
        title = f"Ticket Resolved: {ticket.ticket_id}"
        message = f"Issue ID #{ticket.ticket_id} has been marked resolved by Platform Admin. Please confirm if the problem is solved."
        SupportNotification.objects.create(
            ticket=ticket,
            recipient=ticket.created_by,
            notification_type=SupportNotification.NotificationType.TICKET_RESOLVED,
            title=title,
            message=message
        )
        SupportTicketService._push_for_recipient(ticket.created_by, title, message, priority='medium')
    
    @staticmethod
    def notify_ticket_closed(ticket):
        """Notify relevant parties when ticket is closed"""
        # Notify business admin
        title1 = f"Ticket Closed: {ticket.ticket_id}"
        message1 = f"Support ticket #{ticket.ticket_id} has been closed."
        SupportNotification.objects.create(
            ticket=ticket,
            recipient=ticket.created_by,
            notification_type=SupportNotification.NotificationType.TICKET_CLOSED,
            title=title1,
            message=message1
        )
        SupportTicketService._push_for_recipient(ticket.created_by, title1, message1, priority='low')
        
        # Notify assigned platform admin if different from closer
        if ticket.assigned_to and ticket.assigned_to != ticket.created_by:
            title2 = f"Ticket Closed: {ticket.ticket_id}"
            message2 = f"Support ticket #{ticket.ticket_id} has been closed by {ticket.created_by.get_full_name()}."
            SupportNotification.objects.create(
                ticket=ticket,
                recipient=ticket.assigned_to,
                notification_type=SupportNotification.NotificationType.TICKET_CLOSED,
                title=title2,
                message=message2
            )
            SupportTicketService._push_for_recipient(ticket.assigned_to, title2, message2, priority='low')
    
    @staticmethod
    def notify_ticket_reopened(ticket):
        """Notify platform admins when ticket is reopened"""
        platform_admins = User.objects.filter(role='platform_admin')
        title = f"Ticket Reopened: {ticket.ticket_id}"
        message = f"Support ticket #{ticket.ticket_id} has been reopened by {ticket.created_by.get_full_name()}. Issue persists."
        for admin in platform_admins:
            SupportNotification.objects.create(
                ticket=ticket,
                recipient=admin,
                notification_type=SupportNotification.NotificationType.TICKET_REOPENED,
                title=title,
                message=message
            )
            SupportTicketService._push_for_recipient(admin, title, message, priority='medium')
    
    @staticmethod
    def notify_message_received(ticket, message, specific_recipient=None):
        """Notify relevant parties about new message. specific_recipient is tenant-scoped; else platform admins (global)."""
        title = f"New Message: {ticket.ticket_id}"
        msg_text = f"New message from {message.sender.get_full_name()}: {message.content[:100]}..."
        if specific_recipient:
            # Notify specific recipient (usually business admin)
            SupportNotification.objects.create(
                ticket=ticket,
                recipient=specific_recipient,
                notification_type=SupportNotification.NotificationType.MESSAGE_RECEIVED,
                title=title,
                message=msg_text
            )
            SupportTicketService._push_for_recipient(specific_recipient, title, msg_text, priority='medium')
        else:
            # Notify all platform admins
            platform_admins = User.objects.filter(role='platform_admin')
            for admin in platform_admins:
                SupportNotification.objects.create(
                    ticket=ticket,
                    recipient=admin,
                    notification_type=SupportNotification.NotificationType.MESSAGE_RECEIVED,
                    title=title,
                    message=msg_text
                )
                SupportTicketService._push_for_recipient(admin, title, msg_text, priority='medium')
    
    @staticmethod
    def notify_callback_requested(ticket):
        """Notify platform admins about callback request"""
        platform_admins = User.objects.filter(role='platform_admin')
        title = f"Callback Requested: {ticket.ticket_id}"
        message = f"Business admin {ticket.created_by.get_full_name()} has requested a callback for ticket #{ticket.ticket_id}. Phone: {ticket.callback_phone}, Preferred time: {ticket.callback_preferred_time}"
        for admin in platform_admins:
            SupportNotification.objects.create(
                ticket=ticket,
                recipient=admin,
                notification_type=SupportNotification.NotificationType.CALLBACK_REQUESTED,
                title=title,
                message=message
            )
            SupportTicketService._push_for_recipient(admin, title, message, priority='high')
    
    @staticmethod
    def auto_assign_ticket(ticket):
        """Automatically assign ticket to available platform admin"""
        # Find platform admin with least assigned tickets
        platform_admins = User.objects.filter(role='platform_admin')
        
        if platform_admins.exists():
            # Get admin with least assigned tickets
            admin_with_least_tickets = platform_admins.annotate(
                assigned_count=SupportTicket.objects.filter(
                    assigned_to=models.F('id'),
                    status__in=['open', 'in_progress', 'reopened']
                ).count()
            ).order_by('assigned_count').first()
            
            ticket.assigned_to = admin_with_least_tickets
            ticket.save()
            
            return admin_with_least_tickets
        
        return None
    
    @staticmethod
    def check_overdue_tickets():
        """Check for overdue tickets and send notifications"""
        from datetime import timedelta
        
        # Define response time limits based on priority
        time_limits = {
            'critical': 4,
            'high': 8,
            'medium': 24,
            'low': 48
        }
        
        now = timezone.now()
        overdue_tickets = []
        
        for priority, hours in time_limits.items():
            limit_time = now - timedelta(hours=hours)
            
            overdue = SupportTicket.objects.filter(
                priority=priority,
                status__in=['open', 'in_progress'],
                created_at__lt=limit_time,
                assigned_to__isnull=True  # Only unassigned tickets
            )
            
            overdue_tickets.extend(list(overdue))
        
        # Send notifications for overdue tickets
        for ticket in overdue_tickets:
            platform_admins = User.objects.filter(role='platform_admin')
            title = f"Overdue Ticket: {ticket.ticket_id}"
            message = f"Support ticket #{ticket.ticket_id} is overdue for {ticket.priority} priority issue. Please assign and respond."
            for admin in platform_admins:
                SupportNotification.objects.create(
                    ticket=ticket,
                    recipient=admin,
                    notification_type=SupportNotification.NotificationType.TICKET_UPDATED,
                    title=title,
                    message=message
                )
                SupportTicketService._push_for_recipient(admin, title, message, priority='high')
        
        return overdue_tickets
    
    @staticmethod
    def auto_close_resolved_tickets():
        """Automatically close resolved tickets after specified days"""
        from datetime import timedelta
        
        # Get settings for auto-close days (default 7 days)
        auto_close_days = 7  # This could be fetched from SupportSettings
        
        cutoff_date = timezone.now() - timedelta(days=auto_close_days)
        
        resolved_tickets = SupportTicket.objects.filter(
            status='resolved',
            resolved_at__lt=cutoff_date
        )
        
        for ticket in resolved_tickets:
            ticket.status = SupportTicket.Status.CLOSED
            ticket.closed_at = timezone.now()
            ticket.save()
            
            # Create system message
            from .models import TicketMessage
            # Find a platform admin to use as sender for system message
            platform_admin = User.objects.filter(role='platform_admin').first()
            if platform_admin:
                TicketMessage.objects.create(
                    ticket=ticket,
                    sender=platform_admin,  # Use platform admin as sender for system message
                    content="Ticket automatically closed after resolution period",
                    is_system_message=True,
                    message_type='status_update'
                )
            
            # Notify business admin
            SupportTicketService.notify_ticket_closed(ticket)
        
        return resolved_tickets.count()
    
    @staticmethod
    def generate_ticket_summary(ticket):
        """Generate a summary of the ticket for reporting"""
        message_count = ticket.messages.count()
        response_time = ticket.response_time
        
        summary = {
            'ticket_id': ticket.ticket_id,
            'title': ticket.title,
            'status': ticket.status,
            'priority': ticket.priority,
            'category': ticket.category,
            'created_by': ticket.created_by.get_full_name(),
            'assigned_to': ticket.assigned_to.get_full_name() if ticket.assigned_to else 'Unassigned',
            'tenant': ticket.tenant.name,
            'created_at': ticket.created_at,
            'resolved_at': ticket.resolved_at,
            'closed_at': ticket.closed_at,
            'message_count': message_count,
            'response_time_hours': round(response_time.total_seconds() / 3600, 2) if response_time else None,
            'is_urgent': ticket.is_urgent,
            'requires_callback': ticket.requires_callback
        }
        
        return summary 