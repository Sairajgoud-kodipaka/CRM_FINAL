'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  MessageSquare,
  Activity
} from 'lucide-react';

interface WhatsAppSession {
  id: string;
  name: string;
  phone_number: string;
  status: string;
  connection_type: string;
  messages_sent: number;
  messages_received: number;
  last_activity: string;
  created_at: string;
  qr_code?: string;
  battery_level?: number;
  is_online: boolean;
}

export default function SessionsManagement() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mock data
  const [sessions, setSessions] = useState<WhatsAppSession[]>([
    {
      id: '1',
      name: 'Main Store',
      phone_number: '+91 98765 43210',
      status: 'connected',
      connection_type: 'multidevice',
      messages_sent: 156,
      messages_received: 89,
      last_activity: '2 minutes ago',
      created_at: '2024-01-01',
      battery_level: 85,
      is_online: true
    },
    {
      id: '2',
      name: 'Online Sales',
      phone_number: '+91 98765 43211',
      status: 'connected',
      connection_type: 'multidevice',
      messages_sent: 89,
      messages_received: 45,
      last_activity: '5 minutes ago',
      created_at: '2024-01-05',
      battery_level: 92,
      is_online: true
    },
    {
      id: '3',
      name: 'Customer Support',
      phone_number: '+91 98765 43212',
      status: 'disconnected',
      connection_type: 'multidevice',
      messages_sent: 234,
      messages_received: 156,
      last_activity: '1 hour ago',
      created_at: '2024-01-03',
      battery_level: 0,
      is_online: false
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'multidevice':
        return 'bg-blue-100 text-blue-800';
      case 'single_device':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConnectSession = (sessionId: string) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, status: 'connecting' }
        : s
    ));
    
    // Simulate connection process
    setTimeout(() => {
      setSessions(sessions.map(s => 
        s.id === sessionId 
          ? { ...s, status: 'connected', is_online: true }
          : s
      ));
    }, 2000);
  };

  const handleDisconnectSession = (sessionId: string) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, status: 'disconnected', is_online: false }
        : s
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Sessions</h1>
          <p className="text-gray-600">Manage your WhatsApp connections and devices</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'connected').length}</div>
            <p className="text-xs text-muted-foreground">
              {sessions.length} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Sessions</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.is_online).length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.reduce((sum, s) => sum + s.messages_sent + s.messages_received, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sent & received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="disconnected">Disconnected</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Active Sessions Tab */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently connected WhatsApp sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.filter(s => s.status === 'connected').map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.name}</h4>
                          <p className="text-sm text-gray-600">{session.phone_number}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                            <Badge variant="outline" className={getConnectionTypeColor(session.connection_type)}>
                              {session.connection_type}
                            </Badge>
                            {session.is_online && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-600">Online</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisconnectSession(session.id)}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                    
                    {/* Session Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{session.messages_sent}</div>
                        <div className="text-xs text-gray-600">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{session.messages_received}</div>
                        <div className="text-xs text-gray-600">Received</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{session.battery_level}%</div>
                        <div className="text-xs text-gray-600">Battery</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{session.last_activity}</div>
                        <div className="text-xs text-gray-600">Last Activity</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disconnected Sessions Tab */}
        <TabsContent value="disconnected" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disconnected Sessions</CardTitle>
              <CardDescription>Sessions that need reconnection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.filter(s => s.status === 'disconnected').map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.name}</h4>
                          <p className="text-sm text-gray-600">{session.phone_number}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                            <Badge variant="outline" className={getConnectionTypeColor(session.connection_type)}>
                              {session.connection_type}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs text-red-600">Offline</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handleConnectSession(session.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
              <CardDescription>Configure global session settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Session Settings</h3>
                <p className="text-gray-600">
                  Configure global settings for all WhatsApp sessions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Logs</CardTitle>
              <CardDescription>Recent connection activity and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Logs</h3>
                <p className="text-gray-600">
                  View detailed logs of all session connections and disconnections
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}