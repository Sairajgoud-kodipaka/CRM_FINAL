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
  Zap, 
  Plus, 
  Save, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  MessageSquare,
  Brain,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  MousePointer,
  Filter,
  Target,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  actions: {
    type: string;
    value: string;
    delay?: number;
  }[];
  status: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: {
    id: string;
    type: string;
    name: string;
    config: any;
    next_step?: string;
  }[];
  status: string;
  is_active: boolean;
  created_at: string;
  last_executed?: string;
  execution_count: number;
}

export default function SmartAutomation() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  // Mock data
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Welcome Message Auto-Reply',
      description: 'Automatically sends welcome message to new contacts',
      trigger_type: 'new_contact',
      trigger_conditions: [
        { field: 'contact_type', operator: 'equals', value: 'new' }
      ],
      actions: [
        { type: 'send_message', value: 'Welcome to our jewelry store! 🎉 How can we help you today?' }
      ],
      status: 'active',
      priority: 1,
      is_active: true,
      created_at: '2024-01-15',
      last_triggered: '2024-01-20',
      trigger_count: 45
    },
    {
      id: '2',
      name: 'Follow-up After Purchase',
      description: 'Sends follow-up message 3 days after purchase',
      trigger_type: 'purchase_completed',
      trigger_conditions: [
        { field: 'order_status', operator: 'equals', value: 'completed' }
      ],
      actions: [
        { type: 'send_message', value: 'Thank you for your purchase! We hope you love your jewelry. How was your experience with us?', delay: 259200 }
      ],
      status: 'active',
      priority: 2,
      is_active: true,
      created_at: '2024-01-10',
      last_triggered: '2024-01-18',
      trigger_count: 23
    }
  ]);

  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Customer Onboarding',
      description: 'Multi-step workflow for new customer engagement',
      steps: [
        {
          id: '1',
          type: 'trigger',
          name: 'New Contact Added',
          config: { trigger_type: 'new_contact' }
        },
        {
          id: '2',
          type: 'action',
          name: 'Send Welcome Message',
          config: { message: 'Welcome! We\'re excited to have you here.' },
          next_step: '3'
        },
        {
          id: '3',
          type: 'condition',
          name: 'Check Customer Type',
          config: { field: 'customer_type', operator: 'equals', value: 'vip' },
          next_step: '4'
        },
        {
          id: '4',
          type: 'action',
          name: 'Send VIP Welcome',
          config: { message: 'As a VIP customer, you get exclusive access to our latest collections!' }
        }
      ],
      status: 'active',
      is_active: true,
      created_at: '2024-01-12',
      last_executed: '2024-01-20',
      execution_count: 67
    }
  ]);

  const handleCreateRule = () => {
    setIsCreatingRule(true);
    setSelectedRule(null);
  };

  const handleCreateWorkflow = () => {
    setIsCreatingWorkflow(true);
    setSelectedWorkflow(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Automation</h1>
          <p className="text-gray-600">Automate customer interactions and workflows with AI-powered rules</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
          <Button onClick={handleCreateRule}>
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationRules.filter(r => r.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              {automationRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.length} total workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automationRules.reduce((sum, rule) => sum + rule.trigger_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Automation Rules</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Automation Activity</span>
                </CardTitle>
                <CardDescription>Latest triggers and executions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {automationRules.slice(0, 5).map((rule) => (
                  <div key={rule.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {rule.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Triggered {rule.trigger_count} times
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Last: {rule.last_triggered || 'Never'}
                        </span>
                        <Badge className={getStatusColor(rule.status)}>
                          {rule.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Automation Health</span>
                </CardTitle>
                <CardDescription>System status and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Rule Engine</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Workflow Engine</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">AI Processing</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Message Queue</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common automation tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Zap className="w-6 h-6" />
                  <span>Create Quick Rule</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Brain className="w-6 h-6" />
                  <span>Design Workflow</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Automation Rules</CardTitle>
                  <CardDescription>Configure automated responses and actions</CardDescription>
                </div>
                <Button onClick={handleCreateRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(rule.status)}>
                            {rule.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Priority: {rule.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <div>Triggers: {rule.trigger_count}</div>
                        <div>Last: {rule.last_triggered || 'Never'}</div>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          {rule.is_active ? 'Pause' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Workflows</CardTitle>
                  <CardDescription>Multi-step automation sequences</CardDescription>
                </div>
                <Button onClick={handleCreateWorkflow}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Workflow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {workflow.steps.length} steps
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <div>Executions: {workflow.execution_count}</div>
                        <div>Last: {workflow.last_executed || 'Never'}</div>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          {workflow.is_active ? 'Pause' : 'Activate'}
                        </Button>
                      </div>
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
              <CardTitle>Automation Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics coming soon</h3>
                <p className="text-gray-600">
                  Detailed automation performance metrics and insights will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
