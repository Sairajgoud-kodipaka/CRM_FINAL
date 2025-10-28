'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordForm } from '@/components/ui/password-form';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  CheckCircle,
  Building2,
  Store,
  Crown,
  Clock,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role: string;
  tenant_name?: string;
  store_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export default function TelecallerProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const response = await apiService.getCurrentUser();
        if (response.success) {
          setProfileData(response.data);
          setEditFormData({
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            address: response.data.address || '',
          });
        } else {
          setError('Failed to load profile data');
        }
      } catch (err: any) {

        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated]);

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async () => {
    if (!profileData) return;

    try {
      setSaving(true);
      setError(null);

      const response = await apiService.updateProfile(editFormData);

      if (response.success) {
        setProfileData(response.data);
        setEditMode(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err: any) {

      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setEditFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });
    }
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChangeSuccess = () => {
    setSuccess('Password changed successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePasswordChangeError = (error: string) => {
    setError(error);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'business_admin':
        return 'Business Admin';
      case 'platform_admin':
        return 'Platform Admin';
      case 'manager':
        return 'Manager';
      case 'inhouse_sales':
        return 'In-house Sales';
      case 'tele_calling':
        return 'Tele-calling';
      case 'marketing':
        return 'Marketing';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'business_admin':
        return 'bg-purple-500 text-white';
      case 'platform_admin':
        return 'bg-blue-500 text-white';
      case 'manager':
        return 'bg-green-500 text-white';
      case 'inhouse_sales':
        return 'bg-orange-500 text-white';
      case 'tele_calling':
        return 'bg-pink-500 text-white';
      case 'marketing':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Skeleton className="h-8 w-8 mx-auto mb-4 rounded-full" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 mb-4 text-lg">Failed to load profile data</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and personal information</p>
        </div>
        <Button
          variant={editMode ? "outline" : "default"}
          onClick={() => editMode ? handleCancelEdit() : setEditMode(true)}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {editMode ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" alt={`${profileData.first_name} ${profileData.last_name}`} />
                  <AvatarFallback className="text-lg font-bold">
                    {profileData.first_name?.charAt(0)}{profileData.last_name?.charAt(0)}
                  </AvatarFallback>
        </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profileData.first_name} {profileData.last_name}
                  </h2>
                  <p className="text-gray-600">@{profileData.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getRoleColor(profileData.role)}>
                      <Crown className="w-3 h-3 mr-1" />
                      {getRoleDisplayName(profileData.role)}
                    </Badge>
                    {profileData.is_active && (
                      <Badge className="bg-green-500 text-white">
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">First Name</Label>
                        {editMode ? (
                          <Input
                            value={editFormData.first_name}
                            onChange={(e) => handleEditInputChange('first_name', e.target.value)}
                            disabled={saving}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            <p className="text-gray-900">{profileData.first_name || 'Not set'}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                        {editMode ? (
                          <Input
                            value={editFormData.last_name}
                            onChange={(e) => handleEditInputChange('last_name', e.target.value)}
                            disabled={saving}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            <p className="text-gray-900">{profileData.last_name || 'Not set'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      {editMode ? (
                        <Input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleEditInputChange('email', e.target.value)}
                          disabled={saving}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          <p className="text-gray-900">{profileData.email || 'Not set'}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      {editMode ? (
                        <PhoneInputComponent
                          value={editFormData.phone || ''}
                          onChange={(value) => handleEditInputChange('phone', value)}
                          placeholder="9876543210"
                          disabled={saving}
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          <p className="text-gray-900">{profileData.phone || 'Not set'}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </Label>
                      {editMode ? (
                        <Input
                          value={editFormData.address}
                          onChange={(e) => handleEditInputChange('address', e.target.value)}
                          disabled={saving}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          <p className="text-gray-900">{profileData.address || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Organization
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Tenant
                      </Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        <p className="text-gray-900">{profileData.tenant_name || 'Not assigned'}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        Store
                      </Label>
                      <div className="mt-1 p-2 bg-orange-50 rounded border border-orange-200">
                        <p className="text-orange-900">{profileData.store_name || 'Not assigned'}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Member Since
                      </Label>
                      <div className="mt-1 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-green-900">{formatDate(profileData.created_at)}</p>
                      </div>
                    </div>

                    {profileData.last_login && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Last Login
                        </Label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          <p className="text-gray-900">{formatDate(profileData.last_login)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {editMode && (
                <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Skeleton className="w-4 h-4 rounded" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <PasswordForm
            onSuccess={handlePasswordChangeSuccess}
            onError={handlePasswordChangeError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
