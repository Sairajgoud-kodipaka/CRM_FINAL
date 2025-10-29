from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('login/', views.login_view, name='login'),
    path('profile/', views.user_profile, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    path('demo-users/', views.demo_users, name='demo_users'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('profile/update/', views.UserProfileUpdateView.as_view(), name='profile_update'),
    # Password Reset
    path('password-reset/request/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # User management
    path('users/', views.UserCreateView.as_view(), name='users_create'),
    path('users/list/', views.users_list, name='users_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('sales-team/', views.SalesTeamListView.as_view(), name='sales_team_list'),
    path('sales-team/performance/', views.SalesTeamPerformanceView.as_view(), name='sales_team_performance'),
    path('sales-team/<int:user_id>/profile/', views.SalesPersonDetailView.as_view(), name='sales_person_detail'),
    path('sales-team/<int:pk>/', views.UserDetailView.as_view(), name='sales_team_profile'),
    path('users/team-members/', views.TeamMemberListView.as_view(), name='team_members_list'),
    path('users/team-members/list/', views.team_members_list, name='team_members_list'),
    
    # Role-based salesperson assignment - MUST come before generic detail view
    path('users/team-members/<int:manager_id>/', views.TeamMembersView.as_view(), name='team_members'),
    
    path('users/team-members/<int:pk>/', views.TeamMemberDetailView.as_view(), name='team_member_detail'),
    path('users/team-members/<int:pk>/update/', views.TeamMemberUpdateView.as_view(), name='team_member_update'),
    path('users/team-members/<int:pk>/delete/', views.TeamMemberDeleteView.as_view(), name='team_member_delete'),
    path('users/tenant/<int:tenant_id>/sales-users/', views.TenantSalesUsersView.as_view(), name='tenant_sales_users'),
    path('users/sales-users/', views.AllSalesUsersView.as_view(), name='all_sales_users'),
    path('users/salespersons/context/', views.SalesPersonsContextView.as_view(), name='salespersons_context'),
    path('audit/assignment-override/', views.AssignmentOverrideAuditView.as_view(), name='assignment_override_audit'),
] 