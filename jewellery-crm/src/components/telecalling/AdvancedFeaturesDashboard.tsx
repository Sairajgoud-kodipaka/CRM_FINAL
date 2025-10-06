'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Volume1, 
  Route, 
  Zap, 
  BarChart3, 
  Users, 
  Phone, 
  Clock,
  TrendingUp,
  Bot,
  Settings,
  Send,
  Play
} from 'lucide-react';
import { telecallingApiService } from '@/services/telecallingApi';

interface AdvancedFeaturesDashboardProps {
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
}

export function AdvancedFeaturesDashboard({ leadId, leadName, leadPhone }: AdvancedFeaturesDashboardProps) {
  const [activeTab, setActiveTab] = useState('sms');
  const [smsMessage, setSmsMessage] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('');
  const [routingStrategy, setRoutingStrategy] = useState('skill_based');
  const [automationWorkflow, setAutomationWorkflow] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // SMS Templates
  const smsTemplates = [
    { id: 'post_call_positive', name: 'Post-Call Positive', message: 'Hi {name}! Thank you for your interest in our jewelry. We\'ll send you our latest collection details shortly.' },
    { id: 'post_call_neutral', name: 'Post-Call Neutral', message: 'Hi {name}! Thank you for your time today. We\'ll follow up with more information about our jewelry collection.' },
    { id: 'appointment_reminder', name: 'Appointment Reminder', message: 'Hi {name}! Reminder: Your jewelry consultation is scheduled for {appointment_time}. We look forward to meeting you!' },
    { id: 'special_offer', name: 'Special Offer', message: 'Hi {name}! Exclusive offer: 20% off on our premium jewelry collection. Valid until {expiry_date}.' },
    { id: 'follow_up_1_day', name: 'Follow-up (1 Day)', message: 'Hi {name}! Hope you had a chance to think about our jewelry collection. Any questions? We\'re here to help!' },
    { id: 'birthday_wish', name: 'Birthday Wish', message: 'Hi {name}! Happy Birthday! Enjoy 15% off on your favorite jewelry today.' }
  ];

  // Voice Templates
  const voiceTemplates = [
    { id: 'appointment_reminder', name: 'Appointment Reminder', message: 'Hello {name}, this is a reminder from Jewelry Store. Your jewelry consultation appointment is scheduled for {appointment_time}. We look forward to meeting you!' },
    { id: 'follow_up_positive', name: 'Follow-up Positive', message: 'Hello {name}, thank you for your interest in our jewelry collection. We\'re excited to show you our latest designs. We\'ll be in touch soon!' },
    { id: 'special_offer', name: 'Special Offer', message: 'Hello {name}, we have an exclusive offer for you! Get 20% off on our premium jewelry collection. This offer is valid until {expiry_date}.' },
    { id: 'birthday_wish', name: 'Birthday Wish', message: 'Hello {name}, happy birthday! We hope you have a wonderful day. As a special birthday gift, enjoy 15% off on your favorite jewelry today.' },
    { id: 'customer_survey', name: 'Customer Survey', message: 'Hello {name}, we hope you\'re doing well. We would love to get your feedback about our jewelry and service. Please rate us on a scale of 1 to 5.' }
  ];

  // Automation Workflows
  const automationWorkflows = [
    { id: 'welcome_call', name: 'Welcome Call', description: 'Automated welcome call for new leads' },
    { id: 'follow_up_survey', name: 'Follow-up Survey', description: 'Customer satisfaction survey after calls' },
    { id: 'promotional_call', name: 'Promotional Call', description: 'Promotional calls with special offers' },
    { id: 'appointment_reminder', name: 'Appointment Reminder', description: 'Automated appointment reminders' },
    { id: 're_engagement', name: 'Re-engagement', description: 'Re-engage inactive leads' }
  ];

  // Routing Strategies
  const routingStrategies = [
    { id: 'skill_based', name: 'Skill Based', description: 'Route based on agent skills and lead requirements' },
    { id: 'workload_based', name: 'Workload Based', description: 'Route to agent with lowest current workload' },
    { id: 'performance_based', name: 'Performance Based', description: 'Route to highest performing agents' },
    { id: 'round_robin', name: 'Round Robin', description: 'Distribute calls evenly across agents' },
    { id: 'priority_based', name: 'Priority Based', description: 'Route high priority leads to best agents' },
    { id: 'geographic', name: 'Geographic', description: 'Route based on geographic location' }
  ];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await telecallingApiService.getRoutingAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const sendSMS = async (template?: any) => {
    if (!leadId) return;
    
    try {
      setIsLoading(true);
      const message = template ? template.message.replace('{name}', leadName || 'Customer') : smsMessage;
      
      const result = await telecallingApiService.sendSMS(leadId, message, template?.id);
      
      if (result.success) {
        setSmsMessage('');
        console.log('SMS sent successfully');
      } else {
        console.error('Failed to send SMS:', result.error);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendVoiceMessage = async (template?: any) => {
    if (!leadId) return;
    
    try {
      setIsLoading(true);
      const message = template ? template.message.replace('{name}', leadName || 'Customer') : voiceMessage;
      
      const result = await telecallingApiService.sendVoiceMessage(leadId, message, template?.id);
      
      if (result.success) {
        setVoiceMessage('');
        console.log('Voice message sent successfully');
      } else {
        console.error('Failed to send voice message:', result.error);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const routeCall = async () => {
    if (!leadId) return;
    
    try {
      setIsLoading(true);
      const result = await telecallingApiService.routeCall(leadId, routingStrategy);
      
      if (result.success) {
        console.log(`Call routed to ${result.agent_name} using ${result.routing_strategy}`);
      } else {
        console.error('Failed to route call:', result.error);
      }
    } catch (error) {
      console.error('Error routing call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutomation = async () => {
    if (!leadId || !automationWorkflow) return;
    
    try {
      setIsLoading(true);
      const result = await telecallingApiService.triggerAutomation(leadId, automationWorkflow);
      
      if (result.success) {
        console.log(`Automation workflow ${automationWorkflow} triggered successfully`);
      } else {
        console.error('Failed to trigger automation:', result.error);
      }
    } catch (error) {
      console.error('Error triggering automation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Features</h2>
        <Badge variant="outline" className="text-sm">
          <Bot className="w-4 h-4 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Volume1 className="w-4 h-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="routing" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            Routing
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom SMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Send Custom SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your SMS message..."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={() => sendSMS()} 
                  disabled={!smsMessage || isLoading}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>
              </CardContent>
            </Card>

            {/* SMS Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  SMS Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {smsTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendSMS(template)}
                        disabled={isLoading}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">{template.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Voice Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume1 className="w-5 h-5" />
                  Send Custom Voice Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Voice Message</label>
                  <Textarea
                    placeholder="Type your voice message..."
                    value={voiceMessage}
                    onChange={(e) => setVoiceMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={() => sendVoiceMessage()} 
                  disabled={!voiceMessage || isLoading}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Send Voice Message
                </Button>
              </CardContent>
            </Card>

            {/* Voice Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Voice Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {voiceTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendVoiceMessage(template)}
                        disabled={isLoading}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Send
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">{template.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Routing Tab */}
        <TabsContent value="routing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Routing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Advanced Call Routing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Routing Strategy</label>
                  <Select value={routingStrategy} onValueChange={setRoutingStrategy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {routingStrategies.map(strategy => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          <div>
                            <div className="font-medium">{strategy.name}</div>
                            <div className="text-xs text-gray-500">{strategy.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={routeCall} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Route className="w-4 h-4 mr-2" />
                  Route Call
                </Button>
              </CardContent>
            </Card>

            {/* Routing Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Routing Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.routing_strategies?.length || 0}
                        </div>
                        <div className="text-sm text-blue-800">Strategies Used</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.agent_performance?.length || 0}
                        </div>
                        <div className="text-sm text-green-800">Active Agents</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Top Performing Agents</h4>
                      {analytics.agent_performance?.slice(0, 3).map((agent: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{agent.telecaller__username}</span>
                          <Badge variant="outline">
                            {Math.round(agent.conversion_rate || 0)}% conversion
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Loading analytics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automation Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Automation Workflows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Workflow Type</label>
                  <Select value={automationWorkflow} onValueChange={setAutomationWorkflow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {automationWorkflows.map(workflow => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          <div>
                            <div className="font-medium">{workflow.name}</div>
                            <div className="text-xs text-gray-500">{workflow.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={triggerAutomation} 
                  disabled={!automationWorkflow || isLoading}
                  className="w-full"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Trigger Workflow
                </Button>
              </CardContent>
            </Card>

            {/* Automation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Automation Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {automationWorkflows.length}
                      </div>
                      <div className="text-sm text-purple-800">Available Workflows</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">24/7</div>
                      <div className="text-sm text-orange-800">Automation Active</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recent Automations</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Welcome calls</span>
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Follow-up surveys</span>
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Appointment reminders</span>
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

