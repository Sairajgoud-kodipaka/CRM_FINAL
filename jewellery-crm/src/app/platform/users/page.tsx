'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout, CardContainer } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  ArrowLeft,
  UserPlus,
  Shield,
  Building2
} from 'lucide-react';
import Link from 'next/link';

interface PlatformUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_name: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockUsers: PlatformUser[] = [
      {
        id: 1,
        username: 'sairaj_admin',
        email: 'sairaj@jewelrycrm.com',
        first_name: 'Sairaj',
        last_name: 'Admin',
        role: 'platform_admin',
        tenant_name: 'Platform Admin',
        is_active: true,
        last_login: '2025-08-02 10:30:00',
        created_at: '2025-07-01'
      },
      {
        id: 2,
        username: 'abhinav_admin',
        email: 'abhinav@jewelrycrm.com',
        first_name: 'Abhinav',
        last_name: 'Admin',
        role: 'platform_admin',
        tenant_name: 'Platform Admin',
        is_active: true,
        last_login: '2025-08-02 09:15:00',
        created_at: '2025-07-01'
      },
      {
        id: 3,
        username: 'mandeep_business',
        email: 'mandeep@jewelrycrm.com',
        first_name: 'Mandeep',
        last_name: 'Business',
        role: 'business_admin',
        tenant_name: 'Mandeep Jewelries',
        is_active: true,
        last_login: '2025-08-02 08:45:00',
        created_at: '2025-07-21'
      },
      {
        id: 4,
        username: 'chinmay_business',
        email: 'chinmay@jewelrycrm.com',
        first_name: 'Chinmay',
        last_name: 'Business',
        role: 'business_admin',
        tenant_name: 'Chinmay Jewelries',
        is_active: true,
        last_login: '2025-08-01 16:20:00',
        created_at: '2025-07-21'
      }
    ];
    
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'platform_admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Platform Admin</Badge>;
      case 'business_admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Business Admin</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="User Management"
        subtitle="Manage all platform users across tenants"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage all platform users across tenants"
      actions={
        <div className="flex items-center space-x-2">
          <Link href="/platform/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      }
    >
      {/* Search and Filters */}
      <CardContainer className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Users Table */}
      <CardContainer>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">User</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Tenant</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Last Login</th>
                <th className="text-left py-3 px-4 font-medium">Created</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.tenant_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.last_login).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.last_login).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <CardContainer>
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </CardContainer>
        
        <CardContainer>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role === 'platform_admin').length}
              </p>
              <p className="text-sm text-muted-foreground">Platform Admins</p>
            </div>
          </div>
        </CardContainer>
        
        <CardContainer>
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role === 'business_admin').length}
              </p>
              <p className="text-sm text-muted-foreground">Business Admins</p>
            </div>
          </div>
        </CardContainer>
        
        <CardContainer>
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </CardContainer>
      </div>
    </DashboardLayout>
  );
} 