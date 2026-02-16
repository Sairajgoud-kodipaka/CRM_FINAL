'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';

/**
 * NotificationPermissionPrompt Component
 * 
 * Shows a popup on the login page asking users to enable notifications.
 * Only shows if:
 * - Browser supports notifications
 * - Permission is "default" (not yet asked)
 * - User hasn't dismissed it in this session
 * 
 * When user clicks "Enable notifications", requests browser permission.
 * After permission is granted, the existing PushNotificationInitializer
 * (which runs after login) will automatically subscribe the user.
 */
export function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // Check browser support
    if (!('Notification' in window)) {
      return; // Browser doesn't support notifications
    }

    // Only show if permission hasn't been asked yet
    if (Notification.permission !== 'default') {
      return; // Already granted or denied
    }

    // Check if user dismissed it in this session (stored in sessionStorage)
    const dismissed = sessionStorage.getItem('notif_prompt_dismissed');
    if (dismissed === '1') {
      return;
    }

    // Show after a short delay to let login page render first
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mounted]);

  const handleEnable = async () => {
    if (!('Notification' in window)) {
      setVisible(false);
      return;
    }

    try {
      setLoading(true);
      
      // Request permission (requires user gesture - this button click)
      const result = await Notification.requestPermission();
      
      if (result === 'granted') {
        // Permission granted! The PushNotificationInitializer (which runs after login)
        // will see permission === "granted" and automatically call subscribe()
        // which sends the subscription to the backend.
        setVisible(false);
        // Store that permission was granted so we don't show again
        sessionStorage.setItem('notif_permission_granted', '1');
      } else {
        // User denied or dismissed - remember for this session
        sessionStorage.setItem('notif_prompt_dismissed', '1');
        setVisible(false);
      }
    } catch (error) {
      console.error('[Notification Prompt] Error requesting permission:', error);
      sessionStorage.setItem('notif_prompt_dismissed', '1');
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('notif_prompt_dismissed', '1');
    setVisible(false);
  };

  if (!visible || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">
            Enable Notifications?
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            Stay updated with instant alerts for new customers, appointments, and important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Get notified when new customers are added</p>
            <p>• Receive appointment reminders</p>
            <p>• Stay on top of important updates</p>
            <p className="text-xs mt-3 text-muted-foreground/80">
              You can change this anytime in your browser settings
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
              disabled={loading}
            >
              Maybe later
            </Button>
            <Button
              type="button"
              onClick={handleEnable}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Enabling...' : 'Enable notifications'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
