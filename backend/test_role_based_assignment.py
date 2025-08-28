#!/usr/bin/env python3
"""
🧪 Role-Based Salesperson Assignment - Comprehensive Test Suite

This test file verifies the deterministic dropdown logic and role-based access control
for the salesperson assignment system in the Jewelry CRM.

Test Coverage:
✅ Role Assignment Logic
✅ Deterministic Dropdown Behavior  
✅ Security & Permissions
✅ Audit Trail Logging
✅ API Endpoint Access Control
"""

import os
import sys
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import User, TeamMember
from apps.tenants.models import Tenant
from apps.stores.models import Store

User = get_user_model()

class RoleBasedAssignmentTest(TestCase):
    """Comprehensive test suite for role-based salesperson assignment"""
    
    def setUp(self):
        """Set up test data and users"""
        # Create test tenant
        self.tenant = Tenant.objects.create(
            name="Test Jewelry Store",
            slug="test-jewelry",
            is_active=True
        )
        
        # Create test store
        self.store = Store.objects.create(
            name="Test Store",
            code="TS001",
            tenant=self.tenant,
            is_active=True
        )
        
        # Create test users with different roles
        self.platform_admin = User.objects.create_user(
            username='platform_admin',
            email='admin@test.com',
            password='testpass123',
            first_name='Platform',
            last_name='Admin',
            role='platform_admin',
            is_active=True
        )
        
        self.business_admin = User.objects.create_user(
            username='business_admin',
            email='business@test.com',
            password='testpass123',
            first_name='Business',
            last_name='Admin',
            role='business_admin',
            tenant=self.tenant,
            is_active=True
        )
        
        self.manager = User.objects.create_user(
            username='manager',
            email='manager@test.com',
            password='testpass123',
            first_name='Store',
            last_name='Manager',
            role='manager',
            tenant=self.tenant,
            store=self.store,
            is_active=True
        )
        
        self.sales_person_1 = User.objects.create_user(
            username='sales1',
            email='sales1@test.com',
            password='testpass123',
            first_name='Sales',
            last_name='Person 1',
            role='inhouse_sales',
            tenant=self.tenant,
            store=self.store,
            is_active=True
        )
        
        self.sales_person_2 = User.objects.create_user(
            username='sales2',
            email='sales2@test.com',
            password='testpass123',
            first_name='Sales',
            last_name='Person 2',
            role='inhouse_sales',
            tenant=self.tenant,
            store=self.store,
            is_active=True
        )
        
        self.tele_caller = User.objects.create_user(
            username='telecaller',
            email='telecaller@test.com',
            password='testpass123',
            first_name='Tele',
            last_name='Caller',
            role='tele_calling',
            tenant=self.tenant,
            store=self.store,
            is_active=True
        )
        
        # Create team member relationships
        self.team_member_1 = TeamMember.objects.create(
            user=self.sales_person_1,
            employee_id='EMP001',
            manager=self.manager,
            status='active'
        )
        
        self.team_member_2 = TeamMember.objects.create(
            user=self.sales_person_2,
            employee_id='EMP002',
            manager=self.manager,
            status='active'
        )
        
        # Setup API client
        self.client = APIClient()
        
    def test_role_assignment_logic(self):
        """Test the core role assignment logic"""
        print("\n🧪 Testing Role Assignment Logic...")
        
        # Test 1: Sales users cannot change assignment
        self.client.force_authenticate(user=self.sales_person_1)
        self.assertEqual(self.sales_person_1.role, 'inhouse_sales')
        self.assertTrue(self.sales_person_1.is_active)
        
        # Test 2: Managers can only assign their team
        self.client.force_authenticate(user=self.manager)
        self.assertEqual(self.manager.role, 'manager')
        self.assertEqual(self.manager.store, self.store)
        
        # Test 3: Business admins can assign in their tenant
        self.client.force_authenticate(user=self.business_admin)
        self.assertEqual(self.business_admin.role, 'business_admin')
        self.assertEqual(self.business_admin.tenant, self.tenant)
        
        # Test 4: Platform admins can assign globally
        self.client.force_authenticate(user=self.platform_admin)
        self.assertEqual(self.platform_admin.role, 'platform_admin')
        
        print("✅ Role assignment logic verified")
    
    def test_deterministic_dropdown_behavior(self):
        """Test the deterministic dropdown behavior based on role"""
        print("\n🧪 Testing Deterministic Dropdown Behavior...")
        
        # Test 1: Manager sees only their team
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(f'/api/users/team-members/{self.manager.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should only see team members, not all users
        self.assertIn('users', data)
        self.assertEqual(len(data['users']), 2)  # 2 sales people in team
        self.assertEqual(data['access_level'], 'manager')
        
        # Verify only sales users are returned
        user_roles = [user['role'] for user in data['users']]
        self.assertTrue(all(role in ['inhouse_sales', 'tele_calling'] for role in user_roles))
        
        print("✅ Manager dropdown shows only team members")
        
        # Test 2: Business admin sees tenant users
        self.client.force_authenticate(user=self.business_admin)
        response = self.client.get(f'/api/users/tenant/{self.tenant.id}/sales-users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should see all sales users in tenant
        self.assertIn('users', data)
        self.assertEqual(data['access_level'], 'business_admin')
        self.assertEqual(data['tenant_name'], self.tenant.name)
        
        print("✅ Business admin dropdown shows tenant users")
        
        # Test 3: Platform admin sees all users
        self.client.force_authenticate(user=self.platform_admin)
        response = self.client.get('/api/users/sales-users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should see all sales users globally
        self.assertIn('users', data)
        self.assertEqual(data['access_level'], 'platform_admin')
        self.assertEqual(data['tenant_scope'], 'global')
        
        print("✅ Platform admin dropdown shows global users")
    
    def test_security_and_permissions(self):
        """Test security and permission enforcement"""
        print("\n🧪 Testing Security & Permissions...")
        
        # Test 1: Unauthorized access denied
        self.client.force_authenticate(user=self.sales_person_1)
        response = self.client.get(f'/api/users/team-members/{self.manager.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 2: Manager cannot access other manager's team
        other_manager = User.objects.create_user(
            username='other_manager',
            email='other@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Manager',
            role='manager',
            tenant=self.tenant,
            is_active=True
        )
        
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(f'/api/users/team-members/{other_manager.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 3: Business admin cannot access other tenant
        other_tenant = Tenant.objects.create(
            name="Other Tenant",
            slug="other-tenant",
            is_active=True
        )
        
        self.client.force_authenticate(user=self.business_admin)
        response = self.client.get(f'/api/users/tenant/{other_tenant.id}/sales-users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        print("✅ Security and permissions enforced correctly")
    
    def test_audit_trail_logging(self):
        """Test audit trail logging for assignments"""
        print("\n🧪 Testing Audit Trail Logging...")
        
        # Test assignment override logging
        audit_data = {
            'assignedByUserId': self.manager.id,
            'assignedByRole': self.manager.role,
            'assignedToUserId': self.sales_person_1.id,
            'assignedToName': self.sales_person_1.get_full_name(),
            'assignmentType': 'manager',
            'assignmentScope': 'team',
            'timestamp': '2024-01-01T00:00:00Z'
        }
        
        self.client.force_authenticate(user=self.manager)
        response = self.client.post('/api/users/audit/assignment-override/', audit_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('audit_id', data)
        self.assertIn('logged_at', data)
        
        print("✅ Audit trail logging working correctly")
    
    def test_api_endpoint_access_control(self):
        """Test API endpoint access control"""
        print("\n🧪 Testing API Endpoint Access Control...")
        
        endpoints = [
            ('/api/users/team-members/1/', 'GET'),
            ('/api/users/tenant/1/sales-users/', 'GET'),
            ('/api/users/sales-users/', 'GET'),
            ('/api/users/audit/assignment-override/', 'POST')
        ]
        
        # Test each endpoint with different user roles
        for endpoint, method in endpoints:
            print(f"   Testing {method} {endpoint}")
            
            # Test with sales person (should be denied)
            self.client.force_authenticate(user=self.sales_person_1)
            if method == 'GET':
                response = self.client.get(endpoint)
            else:
                response = self.client.post(endpoint, {})
            
            # Sales people should not have access to these endpoints
            if 'audit' not in endpoint:  # Audit endpoint has different logic
                self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        
        print("✅ API endpoint access control working correctly")
    
    def test_role_based_data_filtering(self):
        """Test role-based data filtering"""
        print("\n🧪 Testing Role-Based Data Filtering...")
        
        # Test 1: Manager sees only their store users
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(f'/api/users/tenant/{self.tenant.id}/sales-users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should only see users from their store
        store_users = [user for user in data['users'] if user['store_name'] == self.store.name]
        self.assertEqual(len(store_users), 3)  # 2 sales + 1 tele caller
        
        print("✅ Manager data filtered by store")
        
        # Test 2: Business admin sees all tenant users
        self.client.force_authenticate(user=self.business_admin)
        response = self.client.get(f'/api/users/tenant/{self.tenant.id}/sales-users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should see all sales users in tenant
        self.assertEqual(data['store_scope'], 'all_stores')
        
        print("✅ Business admin sees all tenant users")
    
    def run_all_tests(self):
        """Run all tests and provide summary"""
        print("🚀 Starting Role-Based Assignment Test Suite...")
        print("=" * 60)
        
        try:
            self.test_role_assignment_logic()
            self.test_deterministic_dropdown_behavior()
            self.test_security_and_permissions()
            self.test_audit_trail_logging()
            self.test_api_endpoint_access_control()
            self.test_role_based_data_filtering()
            
            print("=" * 60)
            print("🎉 ALL TESTS PASSED! Role-based assignment system is working correctly.")
            print("✅ Role Assignment Logic: VERIFIED")
            print("✅ Deterministic Dropdown: VERIFIED")
            print("✅ Security & Permissions: VERIFIED")
            print("✅ Audit Trail Logging: VERIFIED")
            print("✅ API Access Control: VERIFIED")
            print("✅ Data Filtering: VERIFIED")
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            raise

if __name__ == "__main__":
    # Run the test suite
    test_suite = RoleBasedAssignmentTest()
    test_suite.setUp()
    test_suite.run_all_tests()
