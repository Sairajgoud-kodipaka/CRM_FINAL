"""
Team-members-only URLconf for direct access at api/team-members/.
Same views as under api/users/team-members/; avoids duplicate 'users' namespace.
"""
from django.urls import path
from . import views

app_name = 'team_members'

urlpatterns = [
    path('', views.TeamMemberListView.as_view(), name='team_members_list'),
    path('list/', views.team_members_list, name='team_members_list'),
    path('<int:manager_id>/', views.TeamMembersView.as_view(), name='team_members'),
    path('<int:pk>/', views.TeamMemberDetailView.as_view(), name='team_member_detail'),
    path('<int:pk>/update/', views.TeamMemberUpdateView.as_view(), name='team_member_update'),
    path('<int:pk>/delete/', views.TeamMemberDeleteView.as_view(), name='team_member_delete'),
]
