from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from telecalling.models import Lead, Assignment, CustomerVisit
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Check current telecaller count and lead assignments'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== TELECALLER STATISTICS ===\n'))
        
        # Get all telecallers
        telecallers = User.objects.filter(role='tele_calling', is_active=True)
        total_telecallers = telecallers.count()
        
        self.stdout.write(f"Total Active Telecallers: {total_telecallers}")
        
        if total_telecallers == 0:
            self.stdout.write(self.style.ERROR("No active telecallers found!"))
            return
        
        self.stdout.write("\n=== TELECALLER DETAILS ===")
        for telecaller in telecallers:
            self.stdout.write(f"\nTelecaller: {telecaller.get_full_name()} ({telecaller.username})")
            self.stdout.write(f"Email: {telecaller.email}")
            self.stdout.write(f"Active: {telecaller.is_active}")
            self.stdout.write(f"Last Login: {telecaller.last_login}")
        
        # Check Lead assignments (Google Sheets leads)
        self.stdout.write("\n=== LEAD ASSIGNMENTS (Google Sheets) ===")
        total_leads = Lead.objects.count()
        assigned_leads = Lead.objects.filter(assigned_to__isnull=False).count()
        unassigned_leads = Lead.objects.filter(assigned_to__isnull=True).count()
        
        self.stdout.write(f"Total Leads: {total_leads}")
        self.stdout.write(f"Assigned Leads: {assigned_leads}")
        self.stdout.write(f"Unassigned Leads: {unassigned_leads}")
        
        # Check assignments per telecaller
        self.stdout.write("\n=== ASSIGNMENTS PER TELECALLER ===")
        for telecaller in telecallers:
            assigned_count = Lead.objects.filter(assigned_to=telecaller).count()
            self.stdout.write(f"{telecaller.get_full_name()}: {assigned_count} leads")
        
        # Check Customer Visit assignments (Manual assignments)
        self.stdout.write("\n=== CUSTOMER VISIT ASSIGNMENTS (Manual) ===")
        total_visits = CustomerVisit.objects.count()
        assigned_visits = CustomerVisit.objects.filter(assigned_to_telecaller=True).count()
        unassigned_visits = CustomerVisit.objects.filter(assigned_to_telecaller=False).count()
        
        self.stdout.write(f"Total Customer Visits: {total_visits}")
        self.stdout.write(f"Assigned Visits: {assigned_visits}")
        self.stdout.write(f"Unassigned Visits: {unassigned_visits}")
        
        # Check assignments per telecaller for customer visits
        self.stdout.write("\n=== CUSTOMER VISIT ASSIGNMENTS PER TELECALLER ===")
        for telecaller in telecallers:
            visit_assignments = Assignment.objects.filter(telecaller=telecaller).count()
            self.stdout.write(f"{telecaller.get_full_name()}: {visit_assignments} customer visit assignments")
        
        # Check recent assignments
        self.stdout.write("\n=== RECENT ASSIGNMENTS (Last 24 hours) ===")
        recent_leads = Lead.objects.filter(
            assigned_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
        self.stdout.write(f"Leads assigned in last 24 hours: {recent_leads}")
        
        recent_assignments = Assignment.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
        self.stdout.write(f"Customer visit assignments in last 24 hours: {recent_assignments}")
        
        # Check lead sources
        self.stdout.write("\n=== LEAD SOURCES ===")
        sources = Lead.objects.values('source').annotate(count=Count('id')).order_by('-count')
        for source in sources:
            self.stdout.write(f"{source['source']}: {source['count']} leads")
        
        # Check lead statuses
        self.stdout.write("\n=== LEAD STATUSES ===")
        statuses = Lead.objects.values('status').annotate(count=Count('id')).order_by('-count')
        for status in statuses:
            self.stdout.write(f"{status['status']}: {status['count']} leads")
        
        self.stdout.write(self.style.SUCCESS('\n=== STATISTICS COMPLETE ==='))
