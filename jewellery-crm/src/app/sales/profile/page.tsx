'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiService, User } from '@/lib/api-service';
import { 
  Edit, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Building2, 
  Clock, 
  Star,
  Award,
  Activity,
  Settings,
  Bell,
  Key,
  Globe,
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Upload
} from 'lucide-react';

interface EnhancedUser extends User {
  tenant_name?: string;
  store_name?: string;
}

export default function SalesProfilePage() {
  const [profile, setProfile] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentUser();
      const userData = response.data;
      setProfile(userData);

            // Use tenant and store information from user data
      if (userData.tenant_name) {
        setTenantName(userData.tenant_name);
      } else if (userData.tenant) {
        // If we have tenant ID but no name, show a generic name
        setTenantName(`Tenant ${userData.tenant}`);
      }

      if (userData.store_name) {
        setStoreName(userData.store_name);
      } else if (userData.store) {
        // If we have store ID but no name, show a generic name
        setStoreName(`Store ${userData.store}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    // Navigate to edit profile page or open modal
    alert('Edit Profile functionality will be implemented here');
  };

  const handleSettings = () => {
    // Navigate to settings page
    alert('Settings page will be implemented here');
  };

  const handleNotifications = () => {
    // Navigate to notifications page
    alert('Notifications page will be implemented here');
  };

  const handleExportProfile = () => {
    // Export profile data
    const profileData = {
      name: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.name || profile?.username,
      email: profile?.email,
      phone: profile?.phone,
      role: profile?.role,
      tenant: tenantName,
      store: storeName,
      created_at: profile?.created_at,
      updated_at: profile?.updated_at
    };

    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'profile-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = () => {
    // Import profile data
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            alert('Profile data imported successfully!');
            console.log('Imported profile data:', data);
          } catch (error) {
            alert('Error importing profile data');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inhouse_sales':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sales_team':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'marketing':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'tele_calling':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'manager':
        return <Award className="w-4 h-4" />;
      case 'inhouse_sales':
        return <Target className="w-4 h-4" />;
      case 'sales_team':
        return <TrendingUp className="w-4 h-4" />;
      case 'marketing':
        return <Globe className="w-4 h-4" />;
      case 'tele_calling':
        return <Phone className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
            <p className="text-gray-600 mt-2">View and update your profile information</p>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse">
            <CardContent className="p-8 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="space-y-3 w-full">
                <div className="h-6 bg-gray-200 rounded w-32 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2 animate-pulse">
            <CardContent className="p-8">
              <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
            <p className="text-gray-600 mt-2">View and update your profile information</p>
          </div>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load profile</h3>
              <p className="text-gray-600">Please try refreshing the page or contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-600 mt-2">View and update your profile information</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleSettings}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleNotifications}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleExportProfile}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleImportProfile}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2" 
            onClick={handleEditProfile}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Main Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24 text-2xl font-bold bg-gradient-to-br from-orange-400 to-orange-600 text-white border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {profile.first_name?.[0] || profile.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Name and Role */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.name || profile.username
                  }
                </h2>
                <Badge className={`${getRoleColor(profile.role)} border px-3 py-1 flex items-center gap-2 w-fit mx-auto`}>
                  {getRoleIcon(profile.role)}
                  {profile.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 w-full">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Deals Won</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Customers</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-orange-600" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Email Address</div>
                    <div className="text-gray-900 font-medium">{profile.email}</div>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Phone Number</div>
                      <div className="text-gray-900 font-medium">{profile.phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Member Since</div>
                    <div className="text-gray-900 font-medium">
                      {profile.created_at ? formatDate(profile.created_at) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Username</div>
                    <div className="text-gray-900 font-medium">{profile.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Status</div>
                    <Badge className={`${
                      profile.is_active 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    } border`}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Last Updated</div>
                    <div className="text-gray-900 font-medium">
                      {profile.updated_at ? formatDate(profile.updated_at) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-gray-600">User ID</div>
              </div>
              <div className="text-lg font-bold text-gray-900 font-mono">{profile.id}</div>
            </div>

            {tenantName && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Tenant</div>
                </div>
                <div className="text-lg font-bold text-gray-900">{tenantName}</div>
              </div>
            )}

            {storeName && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-gray-600">Store</div>
              </div>
              <div className="text-lg font-bold text-gray-900">{storeName}</div>
            </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-sm font-medium text-gray-600">Account Type</div>
              </div>
              <div className="text-lg font-bold text-gray-900">Premium</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
