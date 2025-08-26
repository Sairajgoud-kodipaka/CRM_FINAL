'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Crown,
  Shield,
  User,
  TrendingUp,
  Activity,
  Phone,
  Mail
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  is_online: boolean;
  last_seen: string;
  total_messages_sent: number;
  total_customers_helped: number;
  average_response_time: number;
  customer_satisfaction_score: number;
  can_send_messages: boolean;
  can_manage_campaigns: boolean;
  can_manage_bots: boolean;
  can_manage_team: boolean;
  can_view_analytics: boolean;
  working_hours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
}

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({});

  // Mock data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Amit Kumar',
      email: 'amit.kumar@jewelrystore.com',
      phone: '+91 98765 43210',
      role: 'Manager',
      status: 'active',
      is_online: true,
      last_seen: 'Now',
      total_messages_sent: 1250,
      total_customers_helped: 89,
      average_response_time: 2.5,
      customer_satisfaction_score: 4.8,
      can_send_messages: true,
      can_manage_campaigns: true,
      can_manage_bots: true,
      can_manage_team: true,
      can_view_analytics: true,
      working_hours: {
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '18:00', enabled: true },
        saturday: { start: '10:00', end: '16:00', enabled: true },
        sunday: { start: '10:00', end: '16:00', enabled: false }
      }
    },
    {
      id: '2',
      name: 'Neha Singh',
      email: 'neha.singh@jewelrystore.com',
      phone: '+91 98765 43211',
      role: 'Agent',
      status: 'active',
      is_online: true,
      last_seen: 'Now',
      total_messages_sent: 890,
      total_customers_helped: 67,
      average_response_time: 3.2,
      customer_satisfaction_score: 4.6,
      can_send_messages: true,
      can_manage_campaigns: false,
      can_manage_bots: false,
      can_manage_team: false,
      can_view_analytics: true,
      working_hours: {
        monday: { start: '10:00', end: '19:00', enabled: true },
        tuesday: { start: '10:00', end: '19:00', enabled: true },
        wednesday: { start: '10:00', end: '19:00', enabled: true },
        thursday: { start: '10:00', end: '19:00', enabled: true },
        friday: { start: '10:00', end: '19:00', enabled: true },
        saturday: { start: '11:00', end: '17:00', enabled: true },
        sunday: { start: '11:00', end: '17:00', enabled: false }
      }
    },
    {
      id: '3',
      name: 'Rajesh Verma',
      email: 'rajesh.verma@jewelrystore.com',
      phone: '+91 98765 43212',
      role: 'Sales',
      status: 'active',
      is_online: false,
      last_seen: '2 hours ago',
      total_messages_sent: 650,
      total_customers_helped: 45,
      average_response_time: 4.1,
      customer_satisfaction_score: 4.4,
      can_send_messages: true,
      can_manage_campaigns: false,
      can_manage_bots: false,
      can_manage_team: false,
      can_view_analytics: true,
      working_hours: {
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '18:00', enabled: true },
        saturday: { start: '10:00', end: '16:00', enabled: true },
        sunday: { start: '10:00', end: '16:00', enabled: false }
      }
    }
  ]);

  const handleCreateMember = () => {
    setIsCreating(true);
    setSelectedMember(null);
    setNewMember({});
  };

  const handleSaveMember = () => {
    if (newMember.name && newMember.email && newMember.role) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone || '',
        role: newMember.role,
        status: 'active',
        is_online: false,
        last_seen: 'Never',
        total_messages_sent: 0,
        total_customers_helped: 0,
        average_response_time: 0,
        customer_satisfaction_score: 0,
        can_send_messages: true,
        can_manage_campaigns: false,
        can_manage_bots: false,
        can_manage_team: false,
        can_view_analytics: true,
        working_hours: {
          monday: { start: '09:00', end: '18:00', enabled: true },
          tuesday: { start: '09:00', end: '18:00', enabled: true },
          wednesday: { start: '09:00', end: '18:00', enabled: true },
          thursday: { start: '09:00', end: '18:00', enabled: true },
          friday: { start: '09:00', end: '18:00', enabled: true },
          saturday: { start: '10:00', end: '16:00', enabled: true },
          sunday: { start: '10:00', end: '16:00', enabled: false }
        }
      };
      setTeamMembers([...teamMembers, member]);
      setSelectedMember(member);
      setIsCreating(false);
    }
  };

  const handleUpdatePermissions = (memberId: string, permission: string, value: boolean) => {
    setTeamMembers(teamMembers.map(m => 
      m.id === memberId ? { ...m, [permission]: value } : m
    ));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Agent':
        return 'bg-green-100 text-green-800';
      case 'Sales':
        return 'bg-purple-100 text-purple-800';
      case 'Marketing':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Manager':
        return <Crown className="w-4 h-4" />;
      case 'Agent':
        return <User className="w-4 h-4" />;
      case 'Sales':
        return <TrendingUp className="w-4 h-4" />;
      case 'Marketing':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage your WhatsApp team members, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Report
          </Button>
          <Button onClick={handleCreateMember}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {teamMembers.filter(m => m.status === 'active').length} active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.filter(m => m.is_online).length}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((acc, m) => acc + m.average_response_time, 0) / teamMembers.length * 10) / 10}
            </div>
            <p className="text-xs text-muted-foreground">
              Minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((acc, m) => acc + m.customer_satisfaction_score, 0) / teamMembers.length * 10) / 10}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team Members</span>
              </CardTitle>
              <CardDescription>Select a member to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMember?.id === member.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gray-100">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role}</span>
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{member.total_messages_sent} messages</span>
                    <span>{member.total_customers_helped} customers</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Member Configuration */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Member Overview</CardTitle>
                    <CardDescription>Basic information and contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gray-100 text-lg">
                          {selectedMember.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedMember.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleColor(selectedMember.role)}>
                            {getRoleIcon(selectedMember.role)}
                            <span className="ml-1">{selectedMember.role}</span>
                          </Badge>
                          <Badge className={getStatusColor(selectedMember.status)}>
                            {selectedMember.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="member-email">Email</Label>
                        <Input
                          id="member-email"
                          value={selectedMember.email}
                          onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="member-phone">Phone</Label>
                        <Input
                          id="member-phone"
                          value={selectedMember.phone}
                          onChange={(e) => setSelectedMember({ ...selectedMember, phone: e.target.value })}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="member-role">Role</Label>
                      <Select
                        value={selectedMember.role}
                        onValueChange={(value) => setSelectedMember({ ...selectedMember, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Agent">Agent</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Permissions & Access</CardTitle>
                    <CardDescription>Control what this team member can do</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="send-messages" className="text-base font-medium">Send Messages</Label>
                          <p className="text-sm text-gray-600">Can send WhatsApp messages to customers</p>
                        </div>
                        <Switch
                          id="send-messages"
                          checked={selectedMember.can_send_messages}
                          onCheckedChange={(checked) => handleUpdatePermissions(selectedMember.id, 'can_send_messages', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="manage-campaigns" className="text-base font-medium">Manage Campaigns</Label>
                          <p className="text-sm text-gray-600">Can create and manage marketing campaigns</p>
                        </div>
                        <Switch
                          id="manage-campaigns"
                          checked={selectedMember.can_manage_campaigns}
                          onCheckedChange={(checked) => handleUpdatePermissions(selectedMember.id, 'can_manage_campaigns', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="manage-bots" className="text-base font-medium">Manage Bots</Label>
                          <p className="text-sm text-gray-600">Can configure automated bot responses</p>
                        </div>
                        <Switch
                          id="manage-bots"
                          checked={selectedMember.can_manage_bots}
                          onCheckedChange={(checked) => handleUpdatePermissions(selectedMember.id, 'can_manage_bots', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="manage-team" className="text-base font-medium">Manage Team</Label>
                          <p className="text-sm text-gray-600">Can add/remove team members and manage roles</p>
                        </div>
                        <Switch
                          id="manage-team"
                          checked={selectedMember.can_manage_team}
                          onCheckedChange={(checked) => handleUpdatePermissions(selectedMember.id, 'can_manage_team', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label htmlFor="view-analytics" className="text-base font-medium">View Analytics</Label>
                          <p className="text-sm text-gray-600">Can access performance reports and metrics</p>
                        </div>
                        <Switch
                          id="view-analytics"
                          checked={selectedMember.can_view_analytics}
                          onCheckedChange={(checked) => handleUpdatePermissions(selectedMember.id, 'can_view_analytics', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Working Hours</CardTitle>
                    <CardDescription>Set when this team member is available</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(selectedMember.working_hours).map(([day, hours]) => (
                        <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Switch
                              id={`${day}-enabled`}
                              checked={hours.enabled}
                              onCheckedChange={(checked) => {
                                const updatedMember = { ...selectedMember };
                                updatedMember.working_hours[day as keyof typeof updatedMember.working_hours].enabled = checked;
                                setSelectedMember(updatedMember);
                              }}
                            />
                            <Label htmlFor={`${day}-enabled`} className="capitalize font-medium">
                              {day}
                            </Label>
                          </div>
                          {hours.enabled && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={hours.start}
                                onChange={(e) => {
                                  const updatedMember = { ...selectedMember };
                                  updatedMember.working_hours[day as keyof typeof updatedMember.working_hours].start = e.target.value;
                                  setSelectedMember(updatedMember);
                                }}
                                className="w-24"
                              />
                              <span>to</span>
                              <Input
                                type="time"
                                value={hours.end}
                                onChange={(e) => {
                                  const updatedMember = { ...selectedMember };
                                  updatedMember.working_hours[day as keyof typeof updatedMember.working_hours].end = e.target.value;
                                  setSelectedMember(updatedMember);
                                }}
                                className="w-24"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Track individual performance and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{selectedMember.total_messages_sent}</div>
                          <div className="text-sm text-gray-600">Messages Sent</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{selectedMember.total_customers_helped}</div>
                          <div className="text-sm text-gray-600">Customers Helped</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{selectedMember.average_response_time}</div>
                          <div className="text-sm text-gray-600">Avg Response (min)</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{selectedMember.customer_satisfaction_score}</div>
                          <div className="text-sm text-gray-600">Satisfaction Score</div>
                        </div>
                      </div>

                      {/* Performance Charts Placeholder */}
                      <div className="text-center py-12">
                        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Charts</h3>
                        <p className="text-gray-600">
                          Detailed performance graphs and trends will be displayed here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Team Member</h3>
                <p className="text-gray-600 mb-4">
                  Choose a team member from the list to manage their settings and permissions
                </p>
                <Button onClick={handleCreateMember}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Team Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
