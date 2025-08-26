from django.core.management.base import BaseCommand
from apps.clients.models import Client
from apps.sales.models import Sale

class Command(BaseCommand):
    help = 'Update customer statuses based on their purchase behavior and pipeline activity'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        self.stdout.write('Starting customer status update...')
        
        # Get all customers
        customers = Client.objects.all()
        total_customers = customers.count()
        
        self.stdout.write(f'Found {total_customers} customers to process')
        
        # Track status changes
        status_changes = {
            'lead': {'to_prospect': 0, 'to_customer': 0},
            'prospect': {'to_customer': 0, 'to_lead': 0},
            'customer': {'to_prospect': 0, 'to_lead': 0},
            'inactive': {'to_lead': 0, 'to_prospect': 0, 'to_customer': 0}
        }
        
        updated_count = 0
        
        for customer in customers:
            old_status = customer.status
            old_status_display = customer.get_status_display()
            
            # Update status based on behavior
            status_message = customer.update_status_based_on_behavior()
            new_status = customer.status
            new_status_display = customer.get_status_display()
            
            if old_status != new_status:
                updated_count += 1
                
                # Track the change
                if old_status in status_changes and new_status in ['prospect', 'customer']:
                    if old_status == 'lead':
                        if new_status == 'prospect':
                            status_changes['lead']['to_prospect'] += 1
                        elif new_status == 'customer':
                            status_changes['lead']['to_customer'] += 1
                    elif old_status == 'prospect' and new_status == 'customer':
                        status_changes['prospect']['to_customer'] += 1
                
                if not dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {customer.full_name}: {old_status_display} → {new_status_display}'
                        )
                    )
                else:
                    self.stdout.write(
                        f'[DRY RUN] {customer.full_name}: {old_status_display} → {new_status_display}'
                    )
            else:
                if not dry_run:
                    self.stdout.write(
                        f'  {customer.full_name}: {old_status_display} (no change)'
                    )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('STATUS UPDATE SUMMARY')
        self.stdout.write('='*50)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No actual changes made'))
        
        self.stdout.write(f'Total customers processed: {total_customers}')
        self.stdout.write(f'Customers with status changes: {updated_count}')
        
        # Show detailed changes
        self.stdout.write('\nDetailed Changes:')
        for old_status, changes in status_changes.items():
            for change_type, count in changes.items():
                if count > 0:
                    self.stdout.write(f'  {old_status.title()} → {change_type.replace("_", " ").title()}: {count}')
        
        # Show current status distribution
        self.stdout.write('\nCurrent Status Distribution:')
        current_statuses = {}
        for customer in Client.objects.all():
            status = customer.status
            current_statuses[status] = current_statuses.get(status, 0) + 1
        
        for status, count in current_statuses.items():
            status_display = dict(Client.Status.choices)[status]
            self.stdout.write(f'  {status_display}: {count}')
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Successfully updated {updated_count} customer statuses!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'\n[DRY RUN] Would update {updated_count} customer statuses')
            )
