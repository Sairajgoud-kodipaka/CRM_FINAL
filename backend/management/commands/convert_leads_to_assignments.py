from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from telecalling.models import Lead, CustomerVisit, Assignment
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Convert Google Sheets leads to CustomerVisit and Assignment objects'

    def handle(self, *args, **options):
        self.stdout.write('Converting leads to assignments...')
        
        leads = Lead.objects.filter(assigned_to__isnull=False)
        created_visits = 0
        created_assignments = 0
        
        for lead in leads:
            try:
                # Create CustomerVisit
                customer_visit, visit_created = CustomerVisit.objects.get_or_create(
                    customer_name=lead.name,
                    customer_phone=lead.phone,
                    defaults={
                        'sales_rep': User.objects.filter(role='manager').first() or User.objects.first(),
                        'customer_email': lead.email or '',
                        'visit_timestamp': lead.fetched_at,
                        'notes': f'Imported from Google Sheets - Source: {lead.source}',
                        'lead_quality': 'warm',
                        'assigned_to_telecaller': True,
                    }
                )
                
                if visit_created:
                    created_visits += 1
                
                # Create Assignment
                assignment, assignment_created = Assignment.objects.get_or_create(
                    customer_visit=customer_visit,
                    telecaller=lead.assigned_to,
                    defaults={
                        'assigned_by': User.objects.filter(role='manager').first() or User.objects.first(),
                        'status': 'assigned',
                        'priority': lead.priority,
                        'notes': f'Converted from Lead: {lead.source_system}',
                    }
                )
                
                if assignment_created:
                    created_assignments += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing lead {lead.name}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Conversion completed: {created_visits} visits, {created_assignments} assignments created')
        )
