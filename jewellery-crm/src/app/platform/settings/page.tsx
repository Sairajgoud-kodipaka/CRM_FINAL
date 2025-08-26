'use client';

import React, { useState } from 'react';
import { DashboardLayout, CardContainer } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Users,
  Building2,
  Mail, 
  Bell,
  Save,
  ArrowLeft,
  AlertTriangle,
  Power,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: '',
    defaultPlan: 'professional',
    maxUsersPerTenant: 5,
    twoFactorAuth: false,
    sessionTimeout: true,
    sessionTimeoutMinutes: 30,
    smtpHost: '',
    smtpPort: '',
    fromEmail: '',
    newTenantNotifications: true,
    systemAlerts: true,
    billingNotifications: true,
    tenantDeactivationEnabled: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message or handle response
  };

  const handleTenantDeactivationToggle = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      tenantDeactivationEnabled: enabled
    }));
  };

  return (
    <DashboardLayout
      title="System Settings"
      subtitle="Configure platform-wide settings and preferences"
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Link href="/platform/dashboard">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* General Settings */}
        <CardContainer>
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">General Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={settings.platformName}
                onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                placeholder="Enter platform name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="default_plan">Default Subscription Plan</Label>
              <Select value={settings.defaultPlan} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultPlan: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select default plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="max_users">Default Max Users per Tenant</Label>
              <Input
                id="max_users"
                type="number"
                value={settings.maxUsersPerTenant}
                onChange={(e) => setSettings(prev => ({ ...prev, maxUsersPerTenant: parseInt(e.target.value) || 0 }))}
                placeholder="Enter max users"
                className="mt-1"
              />
            </div>
          </div>
        </CardContainer>

        {/* Security Settings */}
        <CardContainer>
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">Security Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
              </div>
              <Switch 
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
                className="sm:ml-4"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Switch 
                checked={settings.sessionTimeout}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sessionTimeout: checked }))}
                className="sm:ml-4"
              />
            </div>
            
            {settings.sessionTimeout && (
              <div>
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter timeout in minutes"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </CardContainer>

        {/* Tenant Management */}
        <CardContainer>
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">Tenant Management</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Label>Tenant Deactivation</Label>
                  <Badge variant="outline" className="text-xs">New</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Allow platform admins to deactivate tenants</p>
              </div>
              <Switch 
                checked={settings.tenantDeactivationEnabled}
                onCheckedChange={handleTenantDeactivationToggle}
                className="sm:ml-4"
              />
            </div>
            
            {settings.tenantDeactivationEnabled && (
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Tenant Deactivation Enabled</p>
                    <p className="mt-1">Platform admins can now deactivate tenants from the tenant management page. Deactivated tenants will lose access to the platform.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <Label>New Tenant Notifications</Label>
                <p className="text-sm text-muted-foreground">Notify when new tenants join</p>
              </div>
              <Switch 
                checked={settings.newTenantNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, newTenantNotifications: checked }))}
                className="sm:ml-4"
              />
            </div>
          </div>
        </CardContainer>

        {/* Notification Settings */}
        <CardContainer>
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">Notification Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <Label>System Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive system health alerts</p>
              </div>
              <Switch 
                checked={settings.systemAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemAlerts: checked }))}
                className="sm:ml-4"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <Label>Billing Notifications</Label>
                <p className="text-sm text-muted-foreground">Notify about payment issues</p>
              </div>
              <Switch 
                checked={settings.billingNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, billingNotifications: checked }))}
                className="sm:ml-4"
              />
            </div>
          </div>
        </CardContainer>
      </div>

      {/* Email Settings - Optional Section */}
      <div className="mt-6">
        <CardContainer>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-semibold">Email Settings</h3>
            </div>
            <Badge variant="outline" className="text-xs w-fit">Optional</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={settings.smtpHost}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                placeholder="Enter SMTP host"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                placeholder="Enter SMTP port"
                className="mt-1"
              />
            </div>
            
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="Enter from email"
                className="mt-1"
              />
            </div>
          </div>
        </CardContainer>
      </div>
    </DashboardLayout>
  );
} 