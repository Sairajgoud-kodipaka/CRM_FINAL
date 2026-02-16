"""
Send in-app + push notifications for appointments starting in ~1 hour.
Run via cron every 15–20 minutes, e.g.:
  */15 * * * * python manage.py send_appointment_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Send appointment reminder notifications (1 hour before) to assigned users and creators'

    def add_arguments(self, parser):
        parser.add_argument(
            '--window-min',
            type=int,
            default=50,
            help='Minutes from now to start the reminder window (default: 50)',
        )
        parser.add_argument(
            '--window-max',
            type=int,
            default=70,
            help='Minutes from now to end the reminder window (default: 70)',
        )

    def handle(self, *args, **options):
        from apps.clients.models import Appointment
        from apps.notifications.models import Notification
        from apps.users.models import User

        window_min = options['window_min']
        window_max = options['window_max']
        now = timezone.now()
        start = now + timedelta(minutes=window_min)
        end = now + timedelta(minutes=window_max)
        start_date, start_time = start.date(), start.time()
        end_date, end_time = end.date(), end.time()

        # Appointments in the window (today, time between start and end), not yet reminded
        qs = Appointment.objects.filter(
            date=start_date,
            time__gte=start_time,
            time__lt=end_time,
            status__in=[Appointment.Status.SCHEDULED, Appointment.Status.CONFIRMED],
            reminder_sent=False,
            is_deleted=False,
        ).select_related('client', 'tenant', 'assigned_to', 'created_by', 'client__store')

        count = 0
        num_appointments = 0
        for appointment in qs:
            num_appointments += 1
            if not getattr(appointment, 'tenant_id', None) and not getattr(appointment, 'tenant', None):
                self.stdout.write(self.style.WARNING(f'Appointment {appointment.id} has no tenant; skipping.'))
                continue
            first_name = (appointment.client.first_name if appointment.client else None) or 'Customer'
            location = (appointment.location or (appointment.client.store.name if appointment.client and appointment.client.store else '')) or 'Store'
            users_to_notify = []
            if appointment.assigned_to_id and appointment.assigned_to:
                users_to_notify.append(appointment.assigned_to)
            if appointment.created_by_id and appointment.created_by_id != (appointment.assigned_to_id or 0) and appointment.created_by:
                users_to_notify.append(appointment.created_by)
            seen = set()
            reminder_ok = True
            for u in users_to_notify:
                if not u or u.id in seen:
                    continue
                seen.add(u.id)
                try:
                    Notification.objects.create(
                        user=u,
                        tenant=appointment.tenant,
                        store=appointment.client.store if appointment.client else None,
                        type='appointment_reminder',
                        title=f'Reminder: {first_name} in 1 hour',
                        message=f'Appointment at {appointment.time} — {location}. Tap to open.',
                        priority='high',
                        status='unread',
                        action_url=f'/appointments/{appointment.id}',
                        action_text='View Appointment',
                        is_persistent=False,
                        metadata={'appointment_id': appointment.id},
                    )
                    count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Failed to create reminder notification for appointment {appointment.id} user {u.id}: {e}'))
                    reminder_ok = False
            if reminder_ok:
                appointment.reminder_sent = True
                appointment.reminder_date = now
                appointment.save(update_fields=['reminder_sent', 'reminder_date'])

        self.stdout.write(self.style.SUCCESS(f'Sent {count} reminder notification(s) for {num_appointments} appointment(s).'))
