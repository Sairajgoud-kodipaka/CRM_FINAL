'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Bot, 
  BarChart3, 
  Send, 
  Plus, 
  Settings, 
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  TrendingUp,
  BarChart
} from 'lucide-react';
import { BotBuilder } from '@/components/whatsapp/BotBuilder';
import { RealTimeChat } from '@/components/whatsapp/RealTimeChat';

interface WhatsAppSession {
  id: string;
  name: string;
  phone_number: string;
  status: string;
  messages_sent: number;
  messages_received: number;
  last_activity: string;
}

interface WhatsAppContact {
  id: string;
  phone_number: string;
  name: string;
  customer_type: string;
  status: string;
  total_messages: number;
  last_interaction: string;
}

interface WhatsAppMessage {
  id: string;
  contact_name: string;
  direction: string;
  content: string;
  created_at: string;
  is_bot_response: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_online: boolean;
  last_seen: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_recipients: number;
  messages_sent: number;
}

export default function DoubleTickDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSessions([
        {
          id: '1',
          name: 'Main Store',
          phone_number: '+91 98765 43210',
          status: 'active',
          messages_sent: 156,
          messages_received: 89,
          last_activity: '2 minutes ago'
        },
        {
          id: '2',
          name: 'Online Sales',
          phone_number: '+91 98765 43211',
          status: 'active',
          messages_sent: 89,
          messages_received: 45,
          last_activity: '5 minutes ago'
        }
      ]);

      setContacts([
        {
          id: '1',
          phone_number: '+91 98765 43210',
          name: 'Rahul Sharma',
          customer_type: 'customer',
          status: 'active',
          total_messages: 23,
          last_interaction: '1 hour ago'
        },
        {
          id: '2',
          phone_number: '+91 98765 43211',
          name: 'Priya Patel',
          customer_type: 'vip',
          status: 'active',
          total_messages: 45,
          last_interaction: '30 minutes ago'
        }
      ]);

      setMessages([
        {
          id: '1',
          contact_name: 'Rahul Sharma',
          direction: 'inbound',
          content: 'Hi, I want to know about your latest jewelry collection',
          created_at: '2 minutes ago',
          is_bot_response: false
        },
        {
          id: '2',
          contact_name: 'Priya Patel',
          direction: 'outbound',
          content: 'Thank you for your inquiry! Here are our latest designs...',
          created_at: '1 minute ago',
          is_bot_response: true
        }
      ]);

      setTeamMembers([
        {
          id: '1',
          name: 'Amit Kumar',
          role: 'Manager',
          is_online: true,
          last_seen: 'Now'
        },
        {
          id: '2',
          name: 'Neha Singh',
          role: 'Agent',
          is_online: true,
          last_seen: 'Now'
        },
        {
          id: '3',
          name: 'Rajesh Verma',
          role: 'Sales',
          is_online: false,
          last_seen: '2 hours ago'
        }
      ]);

      setCampaigns([
        {
          id: '1',
          name: 'New Collection Launch',
          status: 'active',
          total_recipients: 500,
          messages_sent: 450
        },
        {
          id: '2',
          name: 'Festival Sale',
          status: 'scheduled',
          total_recipients: 1000,
          messages_sent: 0
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Agent':
        return 'bg-green-100 text-green-800';
      case 'Sales':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DoubleTick WhatsApp Business</h1>
          <p className="text-gray-600">Professional WhatsApp management with team collaboration, bot automation, and campaigns</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {sessions.length} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.filter(t => t.is_online).length}</div>
            <p className="text-xs text-muted-foreground">
              {teamMembers.length} total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              {contacts.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Conversations</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="bots" className="flex items-center space-x-2">
            <Bot className="w-4 h-4" />
            <span>Bots</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Recent Conversations</span>
                </CardTitle>
                <CardDescription>Latest customer interactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      {message.direction === 'inbound' ? (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">←</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">→</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {message.contact_name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {message.content}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{message.created_at}</span>
                        {message.is_bot_response && (
                          <Badge variant="secondary" className="text-xs">Bot</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Team Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Status</span>
                </CardTitle>
                <CardDescription>Current team availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.is_online ? 'Online' : member.last_seen}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Active Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Active Campaigns</span>
              </CardTitle>
              <CardDescription>Currently running marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.filter(c => c.status === 'active').map((campaign) => (
                  <div key={campaign.id} className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Recipients:</span>
                        <span className="font-medium">{campaign.total_recipients}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Sent:</span>
                        <span className="font-medium">{campaign.messages_sent}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(campaign.messages_sent / campaign.total_recipients) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Conversations</CardTitle>
              <CardDescription>Real-time WhatsApp conversations with customers</CardDescription>
            </CardHeader>
            <CardContent>
              <RealTimeChat />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Sessions</CardTitle>
              <CardDescription>Manage your WhatsApp connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{session.name}</h4>
                        <p className="text-sm text-gray-600">{session.phone_number}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Last activity: {session.last_activity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <div>Sent: {session.messages_sent}</div>
                        <div>Received: {session.messages_received}</div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Customer Contacts</CardTitle>
                  <CardDescription>Manage your WhatsApp customer database</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium text-lg">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{contact.name}</h4>
                        <p className="text-sm text-gray-600">{contact.phone_number}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{contact.customer_type}</Badge>
                          <Badge className={getStatusColor(contact.status)}>
                            {contact.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <div>Messages: {contact.total_messages}</div>
                        <div>Last: {contact.last_interaction}</div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bots Tab */}
        <TabsContent value="bots" className="space-y-6">
          <BotBuilder />
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Marketing Campaigns</CardTitle>
                  <CardDescription>Create and manage WhatsApp marketing campaigns</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Send className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {campaign.total_recipients} recipients
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <div>Sent: {campaign.messages_sent}</div>
                        <div>Progress: {Math.round((campaign.messages_sent / campaign.total_recipients) * 100)}%</div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        {campaign.status === 'active' ? 'Pause' : 'Start'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Track your WhatsApp business metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics coming soon</h3>
                <p className="text-gray-600">
                  Detailed performance metrics and insights will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
