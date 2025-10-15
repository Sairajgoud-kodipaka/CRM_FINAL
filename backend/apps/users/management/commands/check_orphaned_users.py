#!/usr/bin/env python
"""
Management command to check for users without TeamMember records
and clean up orphaned users.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import TeamMember

User = get_user_model()

class Command(BaseCommand):
    help = 'Check for users without TeamMember records and optionally clean them up'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Delete users that don\'t have TeamMember records',
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Check specific username',
        )

    def handle(self, *args, **options):
        cleanup = options['cleanup']
        username = options['username']
        
        if username:
            # Check specific user
            try:
                user = User.objects.get(username=username)
                has_team_member = hasattr(user, 'team_member')
                self.stdout.write(f"User '{username}': {'HAS' if has_team_member else 'NO'} TeamMember record")
                
                if has_team_member:
                    tm = user.team_member
                    self.stdout.write(f"  TeamMember ID: {tm.id}")
                    self.stdout.write(f"  Employee ID: {tm.employee_id}")
                    self.stdout.write(f"  Status: {tm.status}")
                
                if not has_team_member and cleanup:
                    self.stdout.write(f"Deleting orphaned user: {username}")
                    user.delete()
                    self.stdout.write(self.style.SUCCESS(f"Deleted user: {username}"))
                    
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"User '{username}' not found"))
        else:
            # Check all users
            users_without_team_members = User.objects.filter(team_member__isnull=True)
            total_users = User.objects.count()
            users_with_team_members = total_users - users_without_team_members.count()
            
            self.stdout.write(f"Total Users: {total_users}")
            self.stdout.write(f"Users with TeamMember records: {users_with_team_members}")
            self.stdout.write(f"Users without TeamMember records: {users_without_team_members.count()}")
            
            if users_without_team_members.exists():
                self.stdout.write("\nUsers without TeamMember records:")
                for user in users_without_team_members:
                    self.stdout.write(f"  - {user.username} ({user.first_name} {user.last_name}) - {user.email}")
                
                if cleanup:
                    self.stdout.write(f"\nDeleting {users_without_team_members.count()} orphaned users...")
                    deleted_count = users_without_team_members.count()
                    users_without_team_members.delete()
                    self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} orphaned users"))
            else:
                self.stdout.write(self.style.SUCCESS("All users have TeamMember records"))
