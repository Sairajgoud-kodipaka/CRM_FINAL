#!/usr/bin/env python
"""
Test script to verify team member deletion works properly
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import TeamMember

User = get_user_model()

def test_deletion():
    print("Testing team member deletion...")
    
    # Find a test user with a team member record
    team_members = TeamMember.objects.all()[:5]
    
    if not team_members.exists():
        print("No team members found to test with")
        return
    
    for tm in team_members:
        user = tm.user
        print(f"\nTesting deletion of:")
        print(f"  TeamMember ID: {tm.id}")
        print(f"  User ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Name: {user.first_name} {user.last_name}")
        
        # Count before deletion
        user_count_before = User.objects.count()
        tm_count_before = TeamMember.objects.count()
        
        print(f"  Before deletion - Users: {user_count_before}, TeamMembers: {tm_count_before}")
        
        # Delete the user (this should cascade delete the team member)
        try:
            user.delete()
            
            # Count after deletion
            user_count_after = User.objects.count()
            tm_count_after = TeamMember.objects.count()
            
            print(f"  After deletion - Users: {user_count_after}, TeamMembers: {tm_count_after}")
            
            if user_count_after < user_count_before and tm_count_after < tm_count_before:
                print(f"  ✅ SUCCESS: Both user and team member deleted")
            else:
                print(f"  ❌ FAILED: Deletion didn't work as expected")
                
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
        
        break  # Only test one for now

if __name__ == "__main__":
    test_deletion()
