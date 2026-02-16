"""
Helpers to create main CRM notifications (in-app + WebSocket + Web Push).
Use from other apps (e.g. telecalling, support) to ensure push reaches all devices.

Role-based recipients follow NOTIFICATION_TEMPLATES.md: strict tenant isolation,
creator, manager of creator, business admin (same tenant only). No cross-tenant.
"""
import logging
from .models import Notification

logger = logging.getLogger(__name__)


def get_role_based_recipients(
    tenant,
    *,
    creator=None,
    assigned_to=None,
    store=None,
    include_creator=True,
    include_manager_of_creator=True,
    include_manager_of_assignee=True,
    include_business_admin=True,
    include_store_manager=True,
    include_store_sales_and_telecalling=False,
):
    """
    Return a deduplicated list of users who should receive a notification,
    all strictly within the same tenant (no cross-tenant).

    Used for: new customer, new appointment, stock transfer, etc.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if not tenant:
        return []
    users = []
    seen_ids = set()

    def add(u):
        if u and u.id not in seen_ids and getattr(u, 'tenant_id', None) == tenant.id:
            seen_ids.add(u.id)
            users.append(u)

    if include_creator and creator:
        add(creator)
    if include_manager_of_creator and creator and getattr(creator, 'manager_id', None):
        manager = getattr(creator, 'manager', None) or (User.objects.filter(pk=creator.manager_id).first() if creator.manager_id else None)
        if manager:
            add(manager)
    if include_manager_of_assignee and assigned_to and assigned_to != creator:
        add(assigned_to)
        if getattr(assigned_to, 'manager_id', None):
            mgr = getattr(assigned_to, 'manager', None) or (User.objects.filter(pk=assigned_to.manager_id).first() if assigned_to.manager_id else None)
            if mgr:
                add(mgr)
    if include_business_admin:
        for u in User.objects.filter(tenant=tenant, role='business_admin', is_active=True):
            add(u)
    if include_store_manager and store:
        for u in User.objects.filter(tenant=tenant, role='manager', store=store, is_active=True):
            add(u)
    if include_store_sales_and_telecalling and store:
        for u in User.objects.filter(
            tenant=tenant,
            store=store,
            role__in=['inhouse_sales', 'tele_calling'],
            is_active=True,
        ):
            add(u)
    return users


def create_push_notification(
    user,
    title,
    message,
    action_url=None,
    notif_type='announcement',
    priority='medium',
    store=None,
    action_text=None,
    metadata=None,
):
    """
    Create a main Notification for the given user. Delivered in-app, WebSocket, and Web Push.
    Use from telecalling/support so push is sent to all user devices.
    """
    if not user or not getattr(user, 'tenant_id', None):
        return None
    try:
        return Notification.objects.create(
            user=user,
            tenant=user.tenant,
            store=store or getattr(user, 'store', None),
            type=notif_type,
            title=title,
            message=message,
            priority=priority,
            status='unread',
            action_url=action_url or '/',
            action_text=action_text or 'View',
            is_persistent=False,
            metadata=metadata or {},
        )
    except Exception as e:
        logger.warning("create_push_notification failed for user %s: %s", getattr(user, 'id', None), e)
        return None
