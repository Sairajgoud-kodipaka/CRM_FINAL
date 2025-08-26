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
    
    # User management
    path('users/', views.UserCreateView.as_view(), name='users_create'),
    path('users/list/', views.users_list, name='users_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('sales-team/', views.SalesTeamListView.as_view(), name='sales_team_list'),
    path('sales-team/performance/', views.SalesTeamPerformanceView.as_view(), name='sales_team_performance'),
    path('sales-team/<int:user_id>/profile/', views.SalesPersonDetailView.as_view(), name='sales_person_detail'),
    path('sales-team/<int:pk>/', views.UserDetailView.as_view(), name='sales_team_profile'),
    path('team-members/', views.TeamMemberListView.as_view(), name='team_members'),
    path('team-members/list/', views.team_members_list, name='team_members_list'),
    path('team-members/<int:pk>/', views.TeamMemberDetailView.as_view(), name='team_member_detail'),
    path('team-members/<int:pk>/update/', views.TeamMemberUpdateView.as_view(), name='team_member_update'),
    path('team-members/<int:pk>/delete/', views.TeamMemberDeleteView.as_view(), name='team_member_delete'),
] 