'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings, NotificationType } from '@/types';
import { Bell, Mail, Smartphone, Clock, Save, RefreshCw } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { state, actions } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (state.settings) {
      setSettings(state.settings);
    }
  }, [state.settings]);

  const handleSettingChange = (path: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await actions.updateSettings(settings);
      // Show success message
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await actions.getSettings();
    } catch (error) {
      console.error('Error refreshing settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypes: { value: NotificationType; label: string; description: string }[] = [
    { value: 'appointment_reminder', label: 'Appointment Reminders', description: 'Get notified about upcoming appointments' },
    { value: 'deal_update', label: 'Deal Updates', description: 'Receive updates when deals change stages' },
    { value: 'new_customer', label: 'New Customers', description: 'Notifications when new customers are added' },
    { value: 'order_status', label: 'Order Status', description: 'Updates on order processing and delivery' },
    { value: 'inventory_alert', label: 'Inventory Alerts', description: 'Low stock and inventory warnings' },
    { value: 'task_due', label: 'Task Reminders', description: 'Reminders for due tasks and follow-ups' },
    { value: 'announcement', label: 'Announcements', description: 'Important announcements from management' },
    { value: 'escalation', label: 'Escalations', description: 'Urgent escalations requiring attention' },
    { value: 'marketing_campaign', label: 'Marketing Campaigns', description: 'Updates on marketing campaign performance' },
    { value: 'follow_up_reminder', label: 'Follow-up Reminders', description: 'Reminders for customer follow-ups' },
    { value: 'payment_received', label: 'Payment Notifications', description: 'Confirmations when payments are received' },
    { value: 'low_stock', label: 'Low Stock Alerts', description: 'Warnings when products are running low' },
    { value: 'high_demand', label: 'High Demand Alerts', description: 'Notifications for trending products' },
  ];

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading notification settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Notification Settings</h1>
          <p className="text-text-secondary mt-1">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                <p className="text-sm text-text-secondary">Receive notifications via email</p>
              </div>
              <Switch
                id="email-enabled"
                checked={settings.emailNotifications.enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('emailNotifications.enabled', checked)
                }
              />
            </div>

            {settings.emailNotifications.enabled && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="email-frequency">Email Frequency</Label>
                  <Select
                    value={settings.emailNotifications.frequency}
                    onValueChange={(value) => 
                      handleSettingChange('emailNotifications.frequency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                <p className="text-sm text-text-secondary">Receive notifications on your device</p>
              </div>
              <Switch
                id="push-enabled"
                checked={settings.pushNotifications.enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('pushNotifications.enabled', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              In-App Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-enabled">Enable In-App Notifications</Label>
                <p className="text-sm text-text-secondary">Show notifications within the app</p>
              </div>
              <Switch
                id="inapp-enabled"
                checked={settings.inAppNotifications.enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('inAppNotifications.enabled', checked)
                }
              />
            </div>

            {settings.inAppNotifications.enabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sound-enabled">Sound Notifications</Label>
                      <p className="text-sm text-text-secondary">Play sound for new notifications</p>
                    </div>
                    <Switch
                      id="sound-enabled"
                      checked={settings.inAppNotifications.sound}
                      onCheckedChange={(checked) => 
                        handleSettingChange('inAppNotifications.sound', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="desktop-enabled">Desktop Notifications</Label>
                      <p className="text-sm text-text-secondary">Show desktop notifications</p>
                    </div>
                    <Switch
                      id="desktop-enabled"
                      checked={settings.inAppNotifications.desktop}
                      onCheckedChange={(checked) => 
                        handleSettingChange('inAppNotifications.desktop', checked)
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
                <p className="text-sm text-text-secondary">Pause notifications during specific hours</p>
              </div>
              <Switch
                id="quiet-hours-enabled"
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('quietHours.enabled', checked)
                }
              />
            </div>

            {settings.quietHours.enabled && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => 
                        handleSettingChange('quietHours.startTime', e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => 
                        handleSettingChange('quietHours.endTime', e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <p className="text-sm text-text-secondary">
            Choose which types of notifications you want to receive
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationTypes.map((type) => (
              <div key={type.value} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">{type.label}</Label>
                  <p className="text-sm text-text-secondary">{type.description}</p>
                </div>
                <Switch
                  checked={settings.preferences[type.value as keyof typeof settings.preferences] || false}
                  onCheckedChange={(checked) => 
                    handleSettingChange(`preferences.${type.value}`, checked)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 