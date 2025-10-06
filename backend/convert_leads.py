#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from telecalling.models import Lead, CustomerVisit, Assignment

User = get_user_model()

def convert_leads_to_assignments():
    """Convert Google Sheets leads to CustomerVisit and Assignment objects"""
    print("Converting Google Sheets leads to assignments...")
    
    leads = Lead.objects.filter(assigned_to__isnull=False)
    print(f"Found {leads.count()} leads to convert")
    
    created_visits = 0
    created_assignments = 0
    
    # Get manager for assignment
    manager = User.objects.filter(role='manager').first()
    if not manager:
        manager = User.objects.first()
    
    for lead in leads:
        try:
            # Create CustomerVisit
            customer_visit, visit_created = CustomerVisit.objects.get_or_create(
                customer_name=lead.name,
                customer_phone=lead.phone,
                defaults={
                    'sales_rep': manager,
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
                    'assigned_by': manager,
                    'status': 'assigned',
                    'priority': lead.priority,
                    'notes': f'Converted from Lead: {lead.source_system}',
                }
            )
            
            if assignment_created:
                created_assignments += 1
                
        except Exception as e:
            print(f"Error processing lead {lead.name}: {str(e)}")
            continue
    
    print(f"Conversion completed:")
    print(f"- Created {created_visits} new customer visits")
    print(f"- Created {created_assignments} new assignments")
    print(f"- Total assignments now: {Assignment.objects.count()}")

if __name__ == "__main__":
    convert_leads_to_assignments()
