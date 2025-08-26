'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Pause, 
  Settings,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BotTrigger {
  id: string;
  name: string;
  trigger_type: 'keyword' | 'exact_match' | 'regex' | 'intent';
  trigger_value: string;
  response_message: string;
  response_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  requires_human_handoff: boolean;
  handoff_message?: string;
  priority: number;
  is_active: boolean;
  min_confidence: number;
}

interface WhatsAppBot {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'testing';
  welcome_message: string;
  fallback_message: string;
  max_conversation_turns: number;
  business_hours_only: boolean;
  after_hours_message: string;
  triggers: BotTrigger[];
  created_at: string;
  updated_at: string;
}

export function BotBuilder() {
  const [bots, setBots] = useState<WhatsAppBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<WhatsAppBot | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTriggerDialogOpen, setIsTriggerDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<BotTrigger | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [botForm, setBotForm] = useState({
    name: '',
    description: '',
    welcome_message: '',
    fallback_message: '',
    max_conversation_turns: 5,
    business_hours_only: true,
    after_hours_message: ''
  });

  const [triggerForm, setTriggerForm] = useState<Omit<BotTrigger, 'id'> & { id?: string }>({
    name: '',
    trigger_type: 'keyword' as const,
    trigger_value: '',
    response_message: '',
    response_type: 'text' as const,
    media_url: '',
    requires_human_handoff: false,
    handoff_message: '',
    priority: 1,
    is_active: true,
    min_confidence: 0.8
  });

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      const mockBots: WhatsAppBot[] = [
        {
          id: '1',
          name: 'Customer Support Bot',
          description: 'Handles basic customer inquiries and support requests',
          status: 'active',
          welcome_message: 'Hello! Welcome to our jewelry store. How can I help you today?',
          fallback_message: 'I apologize, but I didn\'t understand that. Let me connect you with a human agent.',
          max_conversation_turns: 5,
          business_hours_only: true,
          after_hours_message: 'Thank you for your message! We are currently outside of business hours. Our team will respond to you during our next business day.',
          triggers: [
            {
              id: '1',
              name: 'Greeting Response',
              trigger_type: 'keyword',
              trigger_value: 'hello,hi,hey,good morning,good afternoon',
              response_message: 'Hello! Welcome to our jewelry store. How can I help you today?',
              response_type: 'text',
              requires_human_handoff: false,
              priority: 1,
              is_active: true,
              min_confidence: 0.8
            },
            {
              id: '2',
              name: 'Pricing Inquiry',
              trigger_type: 'intent',
              trigger_value: 'pricing',
              response_message: 'Our jewelry prices vary based on design and materials. Would you like me to connect you with a sales representative for detailed pricing?',
              response_type: 'text',
              requires_human_handoff: true,
              handoff_message: 'I\'m connecting you with our sales team for detailed pricing information.',
              priority: 2,
              is_active: true,
              min_confidence: 0.8
            }
          ],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ];

      setBots(mockBots);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateBot = async () => {
    try {
      const response = await fetch('/api/whatsapp/bots/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botForm)
      });

      if (response.ok) {
        const newBot = await response.json();
        setBots(prev => [...prev, newBot]);
        setIsCreateDialogOpen(false);
        resetBotForm();
      }
    } catch (error) {
      console.error('Error creating bot:', error);
    }
  };

  const handleCreateTrigger = async () => {
    if (!selectedBot) return;

    try {
      const response = await fetch(`/api/whatsapp/bots/${selectedBot.id}/triggers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerForm)
      });

      if (response.ok) {
        const newTrigger = await response.json();
        setBots(prev => prev.map(bot => 
          bot.id === selectedBot.id 
            ? { ...bot, triggers: [...bot.triggers, newTrigger] }
            : bot
        ));
        setIsTriggerDialogOpen(false);
        resetTriggerForm();
      }
    } catch (error) {
      console.error('Error creating trigger:', error);
    }
  };

  const handleUpdateTrigger = async () => {
    if (!selectedBot || !editingTrigger) return;

    try {
      const response = await fetch(`/api/whatsapp/bots/${selectedBot.id}/triggers/${editingTrigger.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerForm)
      });

      if (response.ok) {
        const updatedTrigger = await response.json();
        setBots(prev => prev.map(bot => 
          bot.id === selectedBot.id 
            ? { 
                ...bot, 
                triggers: bot.triggers.map(trigger => 
                  trigger.id === editingTrigger.id ? updatedTrigger : trigger
                )
              }
            : bot
        ));
        setIsTriggerDialogOpen(false);
        setEditingTrigger(null);
        resetTriggerForm();
      }
    } catch (error) {
      console.error('Error updating trigger:', error);
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!selectedBot) return;

    try {
      const response = await fetch(`/api/whatsapp/bots/${selectedBot.id}/triggers/${triggerId}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBots(prev => prev.map(bot => 
          bot.id === selectedBot.id 
            ? { 
                ...bot, 
                triggers: bot.triggers.filter(trigger => trigger.id !== triggerId)
              }
            : bot
        ));
      }
    } catch (error) {
      console.error('Error deleting trigger:', error);
    }
  };

  const resetBotForm = () => {
    setBotForm({
      name: '',
      description: '',
      welcome_message: '',
      fallback_message: '',
      max_conversation_turns: 5,
      business_hours_only: true,
      after_hours_message: ''
    });
  };

  const resetTriggerForm = () => {
    setTriggerForm({
      name: '',
      trigger_type: 'keyword',
      trigger_value: '',
      response_message: '',
      response_type: 'text',
      media_url: '',
      requires_human_handoff: false,
      handoff_message: '',
      priority: 1,
      is_active: true,
      min_confidence: 0.8
    });
  };

  const openEditTrigger = (trigger: BotTrigger) => {
    setEditingTrigger(trigger);
    setTriggerForm({
      name: trigger.name,
      trigger_type: trigger.trigger_type,
      trigger_value: trigger.trigger_value,
      response_message: trigger.response_message,
      response_type: trigger.response_type,
      media_url: trigger.media_url || '',
      requires_human_handoff: trigger.requires_human_handoff,
      handoff_message: trigger.handoff_message || '',
      priority: trigger.priority,
      is_active: trigger.is_active,
      min_confidence: trigger.min_confidence
    });
    setIsTriggerDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'keyword': return 'bg-blue-100 text-blue-800';
      case 'exact_match': return 'bg-purple-100 text-purple-800';
      case 'regex': return 'bg-orange-100 text-orange-800';
      case 'intent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
          <p className="text-gray-600">Create and configure WhatsApp bots for automated customer interactions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New WhatsApp Bot</DialogTitle>
              <DialogDescription>
                Configure your bot with welcome messages, fallback responses, and conversation limits.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Bot Name</Label>
                <Input
                  id="bot-name"
                  value={botForm.name}
                  onChange={(e) => setBotForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot-status">Status</Label>
                <Select value="inactive" onValueChange={() => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="bot-description">Description</Label>
                <Textarea
                  id="bot-description"
                  value={botForm.description}
                  onChange={(e) => setBotForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this bot does..."
                  rows={2}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={botForm.welcome_message}
                  onChange={(e) => setBotForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Hello! Welcome to our store. How can I help you?"
                  rows={2}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="fallback-message">Fallback Message</Label>
                <Textarea
                  id="fallback-message"
                  value={botForm.fallback_message}
                  onChange={(e) => setBotForm(prev => ({ ...prev, fallback_message: e.target.value }))}
                  placeholder="I didn't understand that. Let me connect you with a human agent."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-turns">Max Conversation Turns</Label>
                <Input
                  id="max-turns"
                  type="number"
                  value={botForm.max_conversation_turns}
                  onChange={(e) => setBotForm(prev => ({ ...prev, max_conversation_turns: parseInt(e.target.value) }))}
                  min={1}
                  max={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-hours">Business Hours Only</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="business-hours"
                    checked={botForm.business_hours_only}
                    onCheckedChange={(checked) => setBotForm(prev => ({ ...prev, business_hours_only: checked }))}
                  />
                  <Label htmlFor="business-hours">Enable business hours restriction</Label>
                </div>
              </div>
              {botForm.business_hours_only && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="after-hours-message">After Hours Message</Label>
                  <Textarea
                    id="after-hours-message"
                    value={botForm.after_hours_message}
                    onChange={(e) => setBotForm(prev => ({ ...prev, after_hours_message: e.target.value }))}
                    placeholder="We're currently outside business hours. We'll respond during our next business day."
                    rows={2}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBot}>
                <Save className="w-4 h-4 mr-2" />
                Create Bot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bots List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bots.map((bot) => (
          <Card key={bot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <p className="text-sm text-gray-600">{bot.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(bot.status)}>
                    {bot.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBot(bot)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Triggers:</span>
                  <span className="font-medium">{bot.triggers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Max Turns:</span>
                  <span className="font-medium">{bot.max_conversation_turns}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Business Hours:</span>
                  <span className="font-medium">
                    {bot.business_hours_only ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedBot(bot)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Bot
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bot Configuration Panel */}
      {selectedBot && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedBot.name} Configuration</CardTitle>
                <p className="text-gray-600">Manage bot triggers and responses</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setSelectedBot(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Bot Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Textarea
                    value={selectedBot.welcome_message}
                    onChange={(e) => setSelectedBot(prev => prev ? { ...prev, welcome_message: e.target.value } : null)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fallback Message</Label>
                  <Textarea
                    value={selectedBot.fallback_message}
                    onChange={(e) => setSelectedBot(prev => prev ? { ...prev, fallback_message: e.target.value } : null)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Triggers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Bot Triggers</h3>
                  <Dialog open={isTriggerDialogOpen} onOpenChange={setIsTriggerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Trigger
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}
                        </DialogTitle>
                        <DialogDescription>
                          Configure when and how your bot should respond to customer messages.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="trigger-name">Trigger Name</Label>
                          <Input
                            id="trigger-name"
                            value={triggerForm.name}
                            onChange={(e) => setTriggerForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Greeting Response"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trigger-type">Trigger Type</Label>
                          <Select 
                            value={triggerForm.trigger_type} 
                            onValueChange={(value: any) => setTriggerForm(prev => ({ ...prev, trigger_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="keyword">Keyword</SelectItem>
                              <SelectItem value="exact_match">Exact Match</SelectItem>
                              <SelectItem value="regex">Regular Expression</SelectItem>
                              <SelectItem value="intent">Intent Recognition</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="trigger-value">Trigger Value</Label>
                          <Input
                            id="trigger-value"
                            value={triggerForm.trigger_value}
                            onChange={(e) => setTriggerForm(prev => ({ ...prev, trigger_value: e.target.value }))}
                            placeholder={triggerForm.trigger_type === 'keyword' ? 'hello,hi,hey' : 'Enter trigger value'}
                          />
                          <p className="text-xs text-gray-500">
                            {triggerForm.trigger_type === 'keyword' && 'Separate multiple keywords with commas'}
                            {triggerForm.trigger_type === 'exact_match' && 'Enter exact text to match'}
                            {triggerForm.trigger_type === 'regex' && 'Enter a valid regular expression'}
                            {triggerForm.trigger_type === 'intent' && 'Enter the intent to recognize'}
                          </p>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="response-message">Response Message</Label>
                          <Textarea
                            id="response-message"
                            value={triggerForm.response_message}
                            onChange={(e) => setTriggerForm(prev => ({ ...prev, response_message: e.target.value }))}
                            placeholder="Enter the bot's response message..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="response-type">Response Type</Label>
                          <Select 
                            value={triggerForm.response_type} 
                            onValueChange={(value: any) => setTriggerForm(prev => ({ ...prev, response_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="audio">Audio</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={triggerForm.priority}
                            onChange={(e) => setTriggerForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                            min={1}
                            max={10}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="human-handoff"
                              checked={triggerForm.requires_human_handoff}
                              onCheckedChange={(checked) => setTriggerForm(prev => ({ ...prev, requires_human_handoff: checked }))}
                            />
                            <Label htmlFor="human-handoff">Requires Human Handoff</Label>
                          </div>
                          {triggerForm.requires_human_handoff && (
                            <Textarea
                              value={triggerForm.handoff_message}
                              onChange={(e) => setTriggerForm(prev => ({ ...prev, handoff_message: e.target.value }))}
                              placeholder="Message to send before transferring to human agent..."
                              rows={2}
                            />
                          )}
                        </div>
                        <div className="col-span-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="trigger-active"
                              checked={triggerForm.is_active}
                              onCheckedChange={(checked) => setTriggerForm(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label htmlFor="trigger-active">Trigger Active</Label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsTriggerDialogOpen(false);
                          setEditingTrigger(null);
                          resetTriggerForm();
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={editingTrigger ? handleUpdateTrigger : handleCreateTrigger}>
                          <Save className="w-4 h-4 mr-2" />
                          {editingTrigger ? 'Update Trigger' : 'Create Trigger'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Triggers List */}
                <div className="space-y-3">
                  {selectedBot.triggers.map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{trigger.name}</h4>
                          <Badge className={getTriggerTypeColor(trigger.trigger_type)}>
                            {trigger.trigger_type}
                          </Badge>
                          {trigger.requires_human_handoff && (
                            <Badge variant="secondary">Human Handoff</Badge>
                          )}
                          <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                            {trigger.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Trigger:</strong> {trigger.trigger_value}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Response:</strong> {trigger.response_message.substring(0, 100)}
                          {trigger.response_message.length > 100 && '...'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTrigger(trigger)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTrigger(trigger.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


