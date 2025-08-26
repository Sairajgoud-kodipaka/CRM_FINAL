'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Clock, User, Store, Bell, AlertTriangle, CheckCircle, Pin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AnnouncementDetailModalProps {
  announcement: {
    id: number;
    title: string;
    content: string;
    announcement_type: string;
    priority: string;
    priority_color?: string;
    is_pinned: boolean;
    requires_acknowledgment: boolean;
    target_roles: string[];
    target_stores: Array<{ id: number; name: string; code: string }>;
    target_tenants: Array<{ id: number; name: string; slug: string }>;
    publish_at: string;
    expires_at?: string;
    author: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
      role: string;
    };
    tenant: {
      id: number;
      name: string;
      slug: string;
    };
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_read_by_current_user?: boolean;
    is_acknowledged_by_current_user?: boolean;
  };
  onSuccess?: () => void;
}

export default function AnnouncementDetailModal({ announcement, onSuccess }: AnnouncementDetailModalProps) {
  const [open, setOpen] = React.useState(false);

  // Add debugging
  console.log('AnnouncementDetailModal rendered for announcement:', announcement.id, announcement.title);
  console.log('Modal open state:', open);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Bell className="w-4 h-4 text-blue-600" />;
      case 'low':
        return <Bell className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('Modal open state changing from', open, 'to', newOpen);
    setOpen(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => {
            console.log('Eye button clicked for announcement:', announcement.id);
            setOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-50 bg-white/95 backdrop-blur-md border-2 border-blue-500 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              {getPriorityIcon(announcement.priority)}
              <span>Announcement Details</span>
              {announcement.is_pinned && <Pin className="h-4 w-4 text-blue-500" />}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-black">{announcement.title}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    <Badge variant="outline">
                      {announcement.announcement_type.replace('_', ' ')}
                    </Badge>
                    {announcement.is_pinned && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                    {announcement.requires_acknowledgment && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Acknowledgment Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Author and Date Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    By: {announcement.author.first_name} {announcement.author.last_name} 
                    ({announcement.author.role})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Created: {formatDate(announcement.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                </div>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Publishing Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Publishing Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Publish Date:</span>
                      <span className="font-medium">{formatDate(announcement.publish_at)}</span>
                    </div>
                    {announcement.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expiry Date:</span>
                        <span className="font-medium">{formatDate(announcement.expires_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{formatDate(announcement.updated_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Targeting Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Targeting
                  </h3>
                  <div className="space-y-3 text-sm">
                    {announcement.target_roles.length > 0 && (
                      <div>
                        <span className="text-gray-600">Target Roles:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {announcement.target_roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {announcement.target_stores.length > 0 && (
                      <div>
                        <span className="text-gray-600">Target Stores:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {announcement.target_stores.map((store) => (
                            <Badge key={store.id} variant="outline" className="text-xs">
                              {store.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {announcement.target_tenants.length > 0 && (
                      <div>
                        <span className="text-gray-600">Target Tenants:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {announcement.target_tenants.map((tenant) => (
                            <Badge key={tenant.id} variant="outline" className="text-xs">
                              {tenant.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Status Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Read Status:</span>
                    <Badge variant={announcement.is_read_by_current_user ? "default" : "secondary"}>
                      {announcement.is_read_by_current_user ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  {announcement.requires_acknowledgment && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Acknowledgment:</span>
                      <Badge variant={announcement.is_acknowledged_by_current_user ? "default" : "secondary"}>
                        {announcement.is_acknowledged_by_current_user ? "Acknowledged" : "Pending"}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Status:</span>
                    <Badge variant={announcement.is_active ? "default" : "secondary"}>
                      {announcement.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant:</span>
                    <span className="font-medium">{announcement.tenant.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Simple fallback modal in case Dialog component has issues */}
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Announcement Details (Fallback)</h2>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{announcement.title}</h3>
              <p className="text-gray-700">{announcement.content}</p>
              <p className="text-sm text-gray-600">
                By: {announcement.author.first_name} {announcement.author.last_name} 
                ({announcement.author.role})
              </p>
              <p className="text-sm text-gray-600">
                Created: {formatDate(announcement.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
