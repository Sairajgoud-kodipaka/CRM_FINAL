'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Send, 
  Plus, 
  Save, 
  Play, 
  Pause, 
  Trash2, 
  Users, 
  BarChart3,
  Calendar as CalendarIcon,
  Target,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  MousePointer
} from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  status: string;
  message_template: string;
  target_audience: {
    customer_type?: string[];
    tags?: string[];
    min_orders?: number;
    min_spent?: number;
  };
  scheduled_at?: Date;
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  replies_received: number;
  delivery_rate: number;
  read_rate: number;
  reply_rate: number;
}

export default function CampaignManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({});
  const [showCalendar, setShowCalendar] = useState(false);

  // Mock data
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'New Collection Launch',
      description: 'Announce our latest jewelry collection to VIP customers',
      campaign_type: 'broadcast',
      status: 'active',
      message_template: '🎉 Exciting news! Our new "Royal Elegance" collection is now available. Exclusive designs for our valued customers. Reply "VIEW" to see the collection or call us at +91 98765 43210.',
      target_audience: {
        customer_type: ['vip', 'returning'],
        min_spent: 10000
      },
      total_recipients: 500,
      messages_sent: 450,
      messages_delivered: 420,
      messages_read: 380,
      replies_received: 45,
      delivery_rate: 93.3,
      read_rate: 90.5,
      reply_rate: 11.8
    },
    {
      id: '2',
      name: 'Festival Sale',
      description: 'Promote our festival season discounts',
      campaign_type: 'template',
      status: 'scheduled',
      message_template: '🪔 Festival season is here! Get up to 30% off on selected jewelry pieces. Limited time offer valid until Diwali. Visit our store or call for appointments.',
      target_audience: {
        customer_type: ['customer', 'prospect'],
        tags: ['festival', 'sale']
      },
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      total_recipients: 1000,
      messages_sent: 0,
      messages_delivered: 0,
      messages_read: 0,
      replies_received: 0,
      delivery_rate: 0,
      read_rate: 0,
      reply_rate: 0
    }
  ]);

  const handleCreateCampaign = () => {
    setIsCreating(true);
    setSelectedCampaign(null);
    setNewCampaign({});
  };

  const handleSaveCampaign = () => {
    if (newCampaign.name && newCampaign.message_template) {
      const campaign: Campaign = {
        id: Date.now().toString(),
        name: newCampaign.name,
        description: newCampaign.description || '',
        campaign_type: newCampaign.campaign_type || 'broadcast',
        status: 'draft',
        message_template: newCampaign.message_template,
        target_audience: newCampaign.target_audience || {},
        scheduled_at: newCampaign.scheduled_at,
        total_recipients: 0,
        messages_sent: 0,
        messages_delivered: 0,
        messages_read: 0,
        replies_received: 0,
        delivery_rate: 0,
        read_rate: 0,
        reply_rate: 0
      };
      setCampaigns([...campaigns, campaign]);
      setSelectedCampaign(campaign);
      setIsCreating(false);
    }
  };

  const handleStartCampaign = (campaignId: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'active' } : c
    ));
  };

  const handlePauseCampaign = (campaignId: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'paused' } : c
    ));
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId));
    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'broadcast':
        return 'bg-blue-100 text-blue-800';
      case 'template':
        return 'bg-green-100 text-green-800';
      case 'automated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Create and manage WhatsApp marketing campaigns</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={handleCreateCampaign}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Campaigns</span>
              </CardTitle>
              <CardDescription>Select a campaign to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCampaign?.id === campaign.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className={getTypeColor(campaign.campaign_type)}>
                      {campaign.campaign_type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {campaign.total_recipients} recipients
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{campaign.messages_sent} sent</span>
                    {campaign.status === 'active' && (
                      <span className="text-green-600">● Live</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Configuration */}
        <div className="lg:col-span-2">
          {selectedCampaign ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="targeting">Targeting</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Overview</CardTitle>
                    <CardDescription>Basic campaign information and settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={selectedCampaign.name}
                          onChange={(e) => setSelectedCampaign({ ...selectedCampaign, name: e.target.value })}
                          placeholder="Enter campaign name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="campaign-type">Campaign Type</Label>
                        <Select
                          value={selectedCampaign.campaign_type}
                          onValueChange={(value) => setSelectedCampaign({ ...selectedCampaign, campaign_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="broadcast">Broadcast</SelectItem>
                            <SelectItem value="template">Template</SelectItem>
                            <SelectItem value="automated">Automated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="campaign-description">Description</Label>
                      <Textarea
                        id="campaign-description"
                        value={selectedCampaign.description}
                        onChange={(e) => setSelectedCampaign({ ...selectedCampaign, description: e.target.value })}
                        placeholder="Describe your campaign"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="campaign-status">Status</Label>
                        <Select
                          value={selectedCampaign.status}
                          onValueChange={(value) => setSelectedCampaign({ ...selectedCampaign, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="campaign-schedule">Schedule</Label>
                        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedCampaign.scheduled_at ? (
                                format(selectedCampaign.scheduled_at, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedCampaign.scheduled_at}
                              onSelect={(date) => {
                                setSelectedCampaign({ ...selectedCampaign, scheduled_at: date });
                                setShowCalendar(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Targeting Tab */}
              <TabsContent value="targeting" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Targeting</CardTitle>
                    <CardDescription>Define who will receive this campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customer-type">Customer Type</Label>
                      <Select
                        value={selectedCampaign.target_audience.customer_type?.[0] || ''}
                        onValueChange={(value) => setSelectedCampaign({
                          ...selectedCampaign,
                          target_audience: {
                            ...selectedCampaign.target_audience,
                            customer_type: [value]
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prospect">Prospects</SelectItem>
                          <SelectItem value="customer">Customers</SelectItem>
                          <SelectItem value="vip">VIP Customers</SelectItem>
                          <SelectItem value="returning">Returning Customers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="min-orders">Minimum Orders</Label>
                      <Input
                        id="min-orders"
                        type="number"
                        value={selectedCampaign.target_audience.min_orders || ''}
                        onChange={(e) => setSelectedCampaign({
                          ...selectedCampaign,
                          target_audience: {
                            ...selectedCampaign.target_audience,
                            min_orders: parseInt(e.target.value) || undefined
                          }
                        })}
                        placeholder="Minimum number of orders"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min-spent">Minimum Amount Spent</Label>
                      <Input
                        id="min-spent"
                        type="number"
                        value={selectedCampaign.target_audience.min_spent || ''}
                        onChange={(e) => setSelectedCampaign({
                          ...selectedCampaign,
                          target_audience: {
                            ...selectedCampaign.target_audience,
                            min_spent: parseInt(e.target.value) || undefined
                          }
                        })}
                        placeholder="Minimum amount spent (₹)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={selectedCampaign.target_audience.tags?.join(', ') || ''}
                        onChange={(e) => setSelectedCampaign({
                          ...selectedCampaign,
                          target_audience: {
                            ...selectedCampaign.target_audience,
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                          }
                        })}
                        placeholder="Enter tags separated by commas"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Message Content</CardTitle>
                    <CardDescription>Create your campaign message</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="message-template">Message Template</Label>
                      <Textarea
                        id="message-template"
                        value={selectedCampaign.message_template}
                        onChange={(e) => setSelectedCampaign({ ...selectedCampaign, message_template: e.target.value })}
                        placeholder="Write your campaign message here..."
                        rows={6}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Use emojis and clear language. Keep it under 1000 characters.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Message Preview</h4>
                      <div className="p-3 bg-white rounded border">
                        <p className="text-sm">{selectedCampaign.message_template || 'Your message will appear here...'}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Characters: {selectedCampaign.message_template.length}/1000</span>
                        <span>Estimated delivery time: 2-5 minutes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Track your campaign metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedCampaign.status === 'draft' ? (
                      <div className="text-center py-12">
                        <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign not launched yet</h3>
                        <p className="text-gray-600 mb-4">
                          Launch your campaign to see performance metrics
                        </p>
                        <Button onClick={() => handleStartCampaign(selectedCampaign.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Launch Campaign
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{selectedCampaign.total_recipients}</div>
                            <div className="text-sm text-gray-600">Total Recipients</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{selectedCampaign.messages_sent}</div>
                            <div className="text-sm text-gray-600">Messages Sent</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{selectedCampaign.messages_delivered}</div>
                            <div className="text-sm text-gray-600">Delivered</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{selectedCampaign.messages_read}</div>
                            <div className="text-sm text-gray-600">Read</div>
                          </div>
                        </div>

                        {/* Performance Rates */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Delivery Rate</span>
                              <span className="text-lg font-bold text-green-600">{selectedCampaign.delivery_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${selectedCampaign.delivery_rate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Read Rate</span>
                              <span className="text-lg font-bold text-blue-600">{selectedCampaign.read_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${selectedCampaign.read_rate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Reply Rate</span>
                              <span className="text-lg font-bold text-purple-600">{selectedCampaign.reply_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${selectedCampaign.reply_rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center space-x-4">
                          {selectedCampaign.status === 'active' ? (
                            <Button variant="outline" onClick={() => handlePauseCampaign(selectedCampaign.id)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Campaign
                            </Button>
                          ) : (
                            <Button onClick={() => handleStartCampaign(selectedCampaign.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Resume Campaign
                            </Button>
                          )}
                          <Button variant="outline">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Detailed Analytics
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Campaign</h3>
                <p className="text-gray-600 mb-4">
                  Choose a campaign from the list to manage its settings and performance
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
