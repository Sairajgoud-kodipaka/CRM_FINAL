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
import { 
  Bot, 
  Plus, 
  Save, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  MessageSquare,
  Zap,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Brain
} from 'lucide-react';

interface BotTrigger {
  id: string;
  name: string;
  trigger_type: string;
  trigger_value: string;
  response_message: string;
  priority: number;
  is_active: boolean;
  requires_human_handoff: boolean;
}

interface Bot {
  id: string;
  name: string;
  description: string;
  status: string;
  welcome_message: string;
  fallback_message: string;
  max_conversation_turns: number;
  business_hours_only: boolean;
  after_hours_message: string;
  triggers: BotTrigger[];
}

export default function BotBuilder() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTrigger, setNewTrigger] = useState<Partial<BotTrigger>>({});

  // Mock data
  const [bots, setBots] = useState<Bot[]>([
    {
      id: '1',
      name: 'Jewelry Store Bot',
      description: 'Main customer service bot for jewelry inquiries',
      status: 'active',
      welcome_message: 'Welcome to our jewelry store! How can I help you today?',
      fallback_message: 'I apologize, but I need to connect you with a human agent for this request.',
      max_conversation_turns: 5,
      business_hours_only: true,
      after_hours_message: 'Thank you for your message. We are currently closed. Our team will respond during business hours (9 AM - 6 PM).',
      triggers: [
        {
          id: '1',
          name: 'Price Inquiry',
          trigger_type: 'keyword',
          trigger_value: 'price',
          response_message: 'Our jewelry prices range from ₹5,000 to ₹50,000 depending on the design and materials. Would you like to see our latest collection?',
          priority: 1,
          is_active: true,
          requires_human_handoff: false
        },
        {
          id: '2',
          name: 'Appointment Booking',
          trigger_type: 'keyword',
          trigger_value: 'appointment',
          response_message: 'I can help you book an appointment! Please let me know your preferred date and time, and I\'ll connect you with our team.',
          priority: 2,
          is_active: true,
          requires_human_handoff: true
        }
      ]
    }
  ]);

  const handleCreateBot = () => {
    setIsCreating(true);
    setSelectedBot(null);
  };

  const handleSaveBot = (botData: Partial<Bot>) => {
    if (selectedBot) {
      // Update existing bot
      setBots(bots.map(b => b.id === selectedBot.id ? { ...b, ...botData } : b));
    } else {
      // Create new bot
      const newBot: Bot = {
        id: Date.now().toString(),
        name: botData.name || 'New Bot',
        description: botData.description || '',
        status: 'inactive',
        welcome_message: botData.welcome_message || '',
        fallback_message: botData.fallback_message || '',
        max_conversation_turns: botData.max_conversation_turns || 5,
        business_hours_only: botData.business_hours_only || true,
        after_hours_message: botData.after_hours_message || '',
        triggers: []
      };
      setBots([...bots, newBot]);
      setSelectedBot(newBot);
    }
    setIsCreating(false);
  };

  const handleAddTrigger = () => {
    if (selectedBot && newTrigger.name && newTrigger.trigger_value && newTrigger.response_message) {
      const trigger: BotTrigger = {
        id: Date.now().toString(),
        name: newTrigger.name,
        trigger_type: newTrigger.trigger_type || 'keyword',
        trigger_value: newTrigger.trigger_value,
        response_message: newTrigger.response_message,
        priority: newTrigger.priority || 1,
        is_active: true,
        requires_human_handoff: newTrigger.requires_human_handoff || false
      };

      setBots(bots.map(b => 
        b.id === selectedBot.id 
          ? { ...b, triggers: [...b.triggers, trigger] }
          : b
      ));

      setNewTrigger({});
    }
  };

  const handleDeleteTrigger = (triggerId: string) => {
    if (selectedBot) {
      setBots(bots.map(b => 
        b.id === selectedBot.id 
          ? { ...b, triggers: b.triggers.filter(t => t.id !== triggerId) }
          : b
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
          <p className="text-gray-600">Create and manage WhatsApp bot automation workflows</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleCreateBot}>
            <Plus className="w-4 h-4 mr-2" />
            New Bot
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Your Bots</span>
              </CardTitle>
              <CardDescription>Select a bot to configure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedBot?.id === bot.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedBot(bot)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{bot.name}</h4>
                    <Badge className={getStatusColor(bot.status)}>
                      {bot.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{bot.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{bot.triggers.length} triggers</span>
                    <span>{bot.max_conversation_turns} max turns</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bot Configuration */}
        <div className="lg:col-span-2">
          {selectedBot ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bot Overview</CardTitle>
                    <CardDescription>Basic bot information and configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bot-name">Bot Name</Label>
                        <Input
                          id="bot-name"
                          value={selectedBot.name}
                          onChange={(e) => setSelectedBot({ ...selectedBot, name: e.target.value })}
                          placeholder="Enter bot name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bot-status">Status</Label>
                        <Select
                          value={selectedBot.status}
                          onValueChange={(value) => setSelectedBot({ ...selectedBot, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bot-description">Description</Label>
                      <Textarea
                        id="bot-description"
                        value={selectedBot.description}
                        onChange={(e) => setSelectedBot({ ...selectedBot, description: e.target.value })}
                        placeholder="Describe what this bot does"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="welcome-message">Welcome Message</Label>
                      <Textarea
                        id="welcome-message"
                        value={selectedBot.welcome_message}
                        onChange={(e) => setSelectedBot({ ...selectedBot, welcome_message: e.target.value })}
                        placeholder="Message shown when conversation starts"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fallback-message">Fallback Message</Label>
                      <Textarea
                        id="fallback-message"
                        value={selectedBot.fallback_message}
                        onChange={(e) => setSelectedBot({ ...selectedBot, fallback_message: e.target.value })}
                        placeholder="Message shown when bot doesn't understand"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="max-turns">Maximum Conversation Turns</Label>
                        <p className="text-sm text-gray-600">How many bot responses before human handoff</p>
                      </div>
                      <Input
                        id="max-turns"
                        type="number"
                        value={selectedBot.max_conversation_turns}
                        onChange={(e) => setSelectedBot({ ...selectedBot, max_conversation_turns: parseInt(e.target.value) })}
                        className="w-20"
                        min="1"
                        max="10"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Triggers Tab */}
              <TabsContent value="triggers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Bot Triggers</CardTitle>
                        <CardDescription>Configure automated responses based on keywords and patterns</CardDescription>
                      </div>
                      <Button onClick={() => setNewTrigger({})}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Trigger
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add New Trigger Form */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium mb-3">Add New Trigger</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="trigger-name">Trigger Name</Label>
                          <Input
                            id="trigger-name"
                            value={newTrigger.name || ''}
                            onChange={(e) => setNewTrigger({ ...newTrigger, name: e.target.value })}
                            placeholder="e.g., Price Inquiry"
                          />
                        </div>
                        <div>
                          <Label htmlFor="trigger-type">Trigger Type</Label>
                          <Select
                            value={newTrigger.trigger_type || 'keyword'}
                            onValueChange={(value) => setNewTrigger({ ...newTrigger, trigger_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="keyword">Keyword</SelectItem>
                              <SelectItem value="exact_match">Exact Match</SelectItem>
                              <SelectItem value="regex">Regular Expression</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="trigger-value">Trigger Value</Label>
                          <Input
                            id="trigger-value"
                            value={newTrigger.trigger_value || ''}
                            onChange={(e) => setNewTrigger({ ...newTrigger, trigger_value: e.target.value })}
                            placeholder="e.g., price, cost, how much"
                          />
                        </div>
                        <div>
                          <Label htmlFor="trigger-priority">Priority</Label>
                          <Input
                            id="trigger-priority"
                            type="number"
                            value={newTrigger.priority || 1}
                            onChange={(e) => setNewTrigger({ ...newTrigger, priority: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <Label htmlFor="response-message">Response Message</Label>
                        <Textarea
                          id="response-message"
                          value={newTrigger.response_message || ''}
                          onChange={(e) => setNewTrigger({ ...newTrigger, response_message: e.target.value })}
                          placeholder="What should the bot respond with?"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="human-handoff"
                            checked={newTrigger.requires_human_handoff || false}
                            onCheckedChange={(checked) => setNewTrigger({ ...newTrigger, requires_human_handoff: checked })}
                          />
                          <Label htmlFor="human-handoff">Requires human handoff</Label>
                        </div>
                      </div>
                      <Button onClick={handleAddTrigger} disabled={!newTrigger.name || !newTrigger.trigger_value || !newTrigger.response_message}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Trigger
                      </Button>
                    </div>

                    {/* Existing Triggers */}
                    <div className="space-y-4">
                      {selectedBot.triggers.map((trigger) => (
                        <div key={trigger.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium">{trigger.name}</h5>
                                <Badge variant="outline">{trigger.trigger_type}</Badge>
                                <Badge variant="secondary">Priority: {trigger.priority}</Badge>
                                {trigger.requires_human_handoff && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Human Handoff
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Trigger:</strong> {trigger.trigger_value}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Response:</strong> {trigger.response_message}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteTrigger(trigger.id)}
                              >
                                <Trash2 className="w-4 h-4" />
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
                    <CardTitle>Bot Settings</CardTitle>
                    <CardDescription>Advanced configuration options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="business-hours">Business Hours Only</Label>
                        <p className="text-sm text-gray-600">Bot only responds during business hours</p>
                      </div>
                      <Switch
                        id="business-hours"
                        checked={selectedBot.business_hours_only}
                        onCheckedChange={(checked) => setSelectedBot({ ...selectedBot, business_hours_only: checked })}
                      />
                    </div>
                    {selectedBot.business_hours_only && (
                      <div>
                        <Label htmlFor="after-hours-message">After Hours Message</Label>
                        <Textarea
                          id="after-hours-message"
                          value={selectedBot.after_hours_message}
                          onChange={(e) => setSelectedBot({ ...selectedBot, after_hours_message: e.target.value })}
                          placeholder="Message shown outside business hours"
                          rows={3}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Testing Tab */}
              <TabsContent value="testing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bot Testing</CardTitle>
                    <CardDescription>Test your bot responses and workflows</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Testing Interface Coming Soon</h3>
                      <p className="text-gray-600 mb-4">
                        Test your bot responses and conversation flows in real-time
                      </p>
                      <Button variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Start Testing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Bot</h3>
                <p className="text-gray-600 mb-4">
                  Choose a bot from the list to configure its settings and triggers
                </p>
                <Button onClick={handleCreateBot}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Bot
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
