import logging
from apps.notifications.models import Notification
from apps.notifications.services import get_role_based_recipients
from apps.users.models import User

logger = logging.getLogger(__name__)


class StockTransferNotificationService:
    @staticmethod
    def notify_transfer_request(transfer):
        """Notify when a transfer is requested. Role-based, same tenant only."""
        if not getattr(transfer, 'from_store', None):
            logger.warning("Transfer %s has no from_store; skipping notifications", getattr(transfer, 'id', None))
            return
        tenant = transfer.from_store.tenant
        if not tenant:
            logger.warning("Transfer %s from_store has no tenant; skipping notifications", getattr(transfer, 'id', None))
            return
        # Creator (requested_by), manager of creator, business admin, receiving store (to_store) users
        users_to_notify = get_role_based_recipients(
            tenant,
            creator=transfer.requested_by,
            store=transfer.to_store,
            include_creator=True,
            include_manager_of_creator=True,
            include_manager_of_assignee=False,
            include_business_admin=True,
            include_store_manager=True,
            include_store_sales_and_telecalling=True,
        )
        unique_users = list({user.id: user for user in users_to_notify}.values())

        for user in unique_users:
            Notification.objects.create(
                user=user,
                tenant=transfer.from_store.tenant,
                store=transfer.to_store,
                type='stock_transfer_request',
                title='New Stock Transfer Request',
                message=f'Transfer request for {transfer.quantity} units of {transfer.product.name} from {transfer.from_store.name} to {transfer.to_store.name}',
                priority='medium',
                action_url=f'/products/transfers/{transfer.id}',
                action_text='Review Transfer'
            )
    
    @staticmethod
    def notify_transfer_approved(transfer):
        """Notify when a transfer is approved. Role-based, same tenant; when manager approves, business admin gets push."""
        if not getattr(transfer, 'from_store', None) or not getattr(transfer.from_store, 'tenant', None):
            return
        tenant = transfer.from_store.tenant
        # requested_by, manager of requested_by, business admin (so business admin sees manager's approval), store users
        users_to_notify = get_role_based_recipients(
            tenant,
            creator=transfer.requested_by,
            store=transfer.from_store,
            include_creator=True,
            include_manager_of_creator=True,
            include_manager_of_assignee=False,
            include_business_admin=True,
            include_store_manager=True,
            include_store_sales_and_telecalling=True,
        )
        if transfer.approved_by and transfer.approved_by.id not in {u.id for u in users_to_notify}:
            if getattr(transfer.approved_by, 'tenant_id', None) == tenant.id:
                users_to_notify.append(transfer.approved_by)
        unique_users = list({user.id: user for user in users_to_notify}.values())

        for user in unique_users:
            Notification.objects.create(
                user=user,
                tenant=transfer.from_store.tenant,
                store=transfer.from_store,
                type='stock_transfer_approved',
                title='Stock Transfer Approved',
                message=f'Transfer of {transfer.quantity} units of {transfer.product.name} from {transfer.from_store.name} to {transfer.to_store.name} has been approved',
                priority='medium',
                action_url=f'/products/transfers/{transfer.id}',
                action_text='Complete Transfer'
            )
    
    @staticmethod
    def notify_transfer_completed(transfer):
        """Notify when a transfer is completed. Role-based, same tenant only."""
        if not getattr(transfer, 'from_store', None) or not getattr(transfer.from_store, 'tenant', None):
            return
        tenant = transfer.from_store.tenant
        users_to_notify = get_role_based_recipients(
            tenant,
            creator=transfer.requested_by,
            store=transfer.from_store,
            include_creator=True,
            include_manager_of_creator=True,
            include_business_admin=True,
            include_store_manager=True,
            include_store_sales_and_telecalling=True,
        )
        if transfer.approved_by and transfer.approved_by.id not in {u.id for u in users_to_notify} and getattr(transfer.approved_by, 'tenant_id', None) == tenant.id:
            users_to_notify.append(transfer.approved_by)
        for u in User.objects.filter(tenant=tenant, store=transfer.to_store, role__in=['manager', 'inhouse_sales', 'tele_calling'], is_active=True):
            if u.id not in {x.id for x in users_to_notify}:
                users_to_notify.append(u)
        unique_users = list({user.id: user for user in users_to_notify}.values())

        for user in unique_users:
            Notification.objects.create(
                user=user,
                tenant=transfer.from_store.tenant,
                store=transfer.to_store,
                type='stock_transfer_completed',
                title='Stock Transfer Completed',
                message=f'Transfer of {transfer.quantity} units of {transfer.product.name} from {transfer.from_store.name} to {transfer.to_store.name} has been completed successfully',
                priority='low',
                action_url=f'/products/transfers/{transfer.id}',
                action_text='View Details'
            )
    
    @staticmethod
    def notify_transfer_cancelled(transfer):
        """Notify when a transfer is cancelled. Role-based, same tenant only."""
        if not getattr(transfer, 'from_store', None) or not getattr(transfer.from_store, 'tenant', None):
            return
        tenant = transfer.from_store.tenant
        users_to_notify = get_role_based_recipients(
            tenant,
            creator=transfer.requested_by,
            store=transfer.from_store,
            include_creator=True,
            include_manager_of_creator=True,
            include_business_admin=True,
            include_store_manager=True,
            include_store_sales_and_telecalling=True,
        )
        for u in User.objects.filter(tenant=tenant, store=transfer.to_store, role__in=['manager', 'inhouse_sales', 'tele_calling'], is_active=True):
            if u.id not in {x.id for x in users_to_notify}:
                users_to_notify.append(u)
        unique_users = list({user.id: user for user in users_to_notify}.values())

        for user in unique_users:
            Notification.objects.create(
                user=user,
                tenant=transfer.from_store.tenant,
                store=transfer.from_store,
                type='stock_transfer_cancelled',
                title='Stock Transfer Cancelled',
                message=f'Transfer of {transfer.quantity} units of {transfer.product.name} from {transfer.from_store.name} to {transfer.to_store.name} has been cancelled',
                priority='medium',
                action_url=f'/products/transfers/{transfer.id}',
                action_text='View Details'
            )
