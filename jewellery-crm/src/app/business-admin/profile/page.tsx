'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordForm } from '@/components/ui/password-form';
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

export default function ProfilePage() {
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
        console.error('Error fetching profile:', err);
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

      // Call the API to update the profile
      const response = await apiService.updateProfile(editFormData);
      
      if (response.success) {
        // Update local profile data with the response
        setProfileData(response.data);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }

      setEditMode(false);
      setSuccess('Profile updated successfully!');
      
      // Auto-hide success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Error updating profile:', err);
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
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg';
      case 'platform_admin':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
      case 'manager':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
      case 'inhouse_sales':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg';
      case 'tele_calling':
        return 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg';
      case 'marketing':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
          <User className="w-4 h-4" />
          Profile Management
        </div>
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">
          My Profile
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Manage your account settings, personal information, and security preferences
        </p>
      </div>

      {/* Enhanced Alerts */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 shadow-lg">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Tabs */}
      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            General Information
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          {/* Enhanced Profile Overview Card */}
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                    <AvatarImage src="" alt={`${profileData.first_name} ${profileData.last_name}`} />
                    <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                      {profileData.first_name?.charAt(0)}{profileData.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">
                      {profileData.first_name} {profileData.last_name}
                    </h2>
                    <p className="text-gray-300 text-lg">@{profileData.username}</p>
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(profileData.role)}>
                        <Crown className="w-4 h-4 mr-2" />
                        {getRoleDisplayName(profileData.role)}
                      </Badge>
                      {profileData.is_active && (
                        <Badge className="bg-green-500 text-white border-0 shadow-lg">
                          <Activity className="w-4 h-4 mr-2" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant={editMode ? "outline" : "default"}
                  onClick={() => editMode ? handleCancelEdit() : setEditMode(true)}
                  disabled={saving}
                  className={`${
                    editMode 
                      ? 'bg-white text-gray-900 hover:bg-gray-100 border-white' 
                      : 'bg-white/20 text-white hover:bg-white/30 border-white/30'
                  } shadow-lg`}
                >
                  {editMode ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Enhanced Personal Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">Personal Information</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-medium text-text-secondary">First Name</Label>
                        {editMode ? (
                          <Input
                            id="first_name"
                            value={editFormData.first_name}
                            onChange={(e) => handleEditInputChange('first_name', e.target.value)}
                            disabled={saving}
                            className="border-gray-200 focus:border-gray-500 focus:ring-gray-500"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-text-primary font-medium">{profileData.first_name || 'Not set'}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-medium text-text-secondary">Last Name</Label>
                        {editMode ? (
                          <Input
                            id="last_name"
                            value={editFormData.last_name}
                            onChange={(e) => handleEditInputChange('last_name', e.target.value)}
                            disabled={saving}
                            className="border-gray-200 focus:border-gray-500 focus:ring-gray-500"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-text-primary font-medium">{profileData.last_name || 'Not set'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        Email Address
                      </Label>
                      {editMode ? (
                        <Input
                          id="email"
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleEditInputChange('email', e.target.value)}
                          disabled={saving}
                          className="border-gray-200 focus:border-gray-500 focus:ring-gray-500"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-text-primary font-medium">{profileData.email || 'Not set'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Phone Number
                      </Label>
                      {editMode ? (
                        <Input
                          id="phone"
                          value={editFormData.phone}
                          onChange={(e) => handleEditInputChange('phone', e.target.value)}
                          disabled={saving}
                          className="border-gray-200 focus:border-gray-500 focus:ring-gray-500"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-text-primary font-medium">{profileData.phone || 'Not set'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        Address
                      </Label>
                      {editMode ? (
                        <Input
                          id="address"
                          value={editFormData.address}
                          onChange={(e) => handleEditInputChange('address', e.target.value)}
                          disabled={saving}
                          className="border-gray-200 focus:border-gray-500 focus:ring-gray-500"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-text-primary font-medium">{profileData.address || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Organization Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">Organization</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        Tenant
                      </Label>
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                        <p className="text-gray-900 font-medium">{profileData.tenant_name || 'Not assigned'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-500" />
                        Store
                      </Label>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-orange-900 font-medium">{profileData.store_name || 'Not assigned'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        Member Since
                      </Label>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-900 font-medium">{formatDate(profileData.created_at)}</p>
                      </div>
                    </div>

                    {profileData.last_login && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          Last Login
                        </Label>
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                          <p className="text-gray-900 font-medium">{formatDate(profileData.last_login)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              {editMode && (
                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 shadow-lg"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit} 
                    disabled={saving}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-8">
          {/* Enhanced Password Change */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <Shield className="w-6 h-6" />
                Change Password
              </CardTitle>
              <CardDescription className="text-gray-700">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <PasswordForm 
                onSuccess={handlePasswordChangeSuccess}
                onError={handlePasswordChangeError}
              />
            </CardContent>
          </Card>

          {/* Enhanced Account Security Info */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <Shield className="w-6 h-6" />
                Account Security
              </CardTitle>
              <CardDescription className="text-gray-700">
                Keep your account secure with these recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-green-200 rounded-xl bg-green-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-green-800">Strong Password</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Use a password that's at least 8 characters long with a mix of letters, numbers, and symbols.
                  </p>
                </div>
                
                <div className="p-6 border border-green-200 rounded-xl bg-green-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-green-800">Regular Updates</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Change your password regularly, especially if you suspect unauthorized access.
                  </p>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800">Secure Connection</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    Always access your account from secure, trusted networks and devices.
                  </p>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800">Log Out</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    Remember to log out when using shared or public computers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
 