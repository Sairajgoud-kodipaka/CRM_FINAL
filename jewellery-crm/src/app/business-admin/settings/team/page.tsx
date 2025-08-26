'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/lib/api-service';

interface TeamMember {
  id: number; // Team member ID
  user_id?: number; // User ID
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
  tenant?: number;
  store?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateTeamMemberData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
  phone?: string;
  address?: string;
  store?: number;
}

interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  timezone: string;
  manager?: number;
  tenant: number;
  is_active: boolean;
  created_at: string;
}

export default function TeamSettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateTeamMemberData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: '',
    phone: '',
    address: '',
    store: undefined
  });

  useEffect(() => {
    fetchTeamMembers();
    fetchStores();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeamMembers();
      console.log('Team members response:', response);
      if (response.success) {
        const data = response.data as any;
        const teamMembersData = Array.isArray(data) ? data : data.results || [];
        console.log('Team members data:', teamMembersData);
        console.log('Team members store IDs:', teamMembersData.map((m: any) => ({ id: m.id, name: m.first_name, store: m.store })));
        setTeamMembers(teamMembersData);
      } else {
        setError('Failed to load team members');
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setError('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      console.log('Fetching stores...');
      const response = await apiService.getStores();
      console.log('Stores response:', response);
      if (response.success) {
        // Handle paginated response format
        const storesData = (response.data as any)?.results || (Array.isArray(response.data) ? response.data : []);
        console.log('Stores data:', storesData);
        console.log('Stores count:', storesData.length);
        console.log('Stores names:', storesData.map((s: any) => s.name));
        console.log('Stores IDs:', storesData.map((s: any) => s.id));
        setStores(storesData);
      } else {
        console.error('Failed to fetch stores:', response.message);
        setStores([]);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setStores([]);
    }
  };

  const handleCreateMember = async () => {
    try {
      setCreatingMember(true);
      
      // Validate required fields
      if (!createFormData.username || !createFormData.email || !createFormData.password || !createFormData.role) {
        setError('Please fill in all required fields');
        return;
      }

      // Create the team member
      const response = await apiService.createTeamMember(createFormData);
      
      if (response.success) {
        // Reset form and close modal
        setCreateFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          role: '',
          phone: '',
          address: '',
          store: undefined
        });
        setShowCreateModal(false);
        setError(null);
        
        // Refresh team members list
        await fetchTeamMembers();
      } else {
        setError(response.message || 'Failed to create team member');
      }
    } catch (error) {
      console.error('Failed to create team member:', error);
      setError('Failed to create team member');
    } finally {
      setCreatingMember(false);
    }
  };

  const handleInputChange = (field: keyof CreateTeamMemberData, value: string | number | undefined) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      setCreatingMember(true);
      setError(null);

      const updateData = {
        first_name: editingMember.first_name,
        last_name: editingMember.last_name,
        email: editingMember.email,
        role: editingMember.role,
        phone: editingMember.phone || '',
        address: editingMember.address || '',
        store: editingMember.store
      };

      console.log('Updating team member with data:', updateData);
      console.log('Team member ID:', editingMember.id);

      const response = await apiService.updateTeamMember(editingMember.id.toString(), updateData);
      
      console.log('Update response:', response);
      
      if (response.success) {
        setShowEditModal(false);
        setEditingMember(null);
        setError(null);
        await fetchTeamMembers(); // Refresh the list
      } else {
        setError(response.message || 'Failed to update team member');
      }
    } catch (error) {
      console.error('Failed to update team member:', error);
      setError('Failed to update team member');
    } finally {
      setCreatingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingMember(memberId);
      setError(null);

      const response = await apiService.deleteTeamMember(memberId.toString());
      
      if (response.success) {
        setError(null);
        await fetchTeamMembers(); // Refresh the list
      } else {
        setError(response.message || 'Failed to delete team member');
      }
    } catch (error) {
      console.error('Failed to delete team member:', error);
      setError('Failed to delete team member');
    } finally {
      setDeletingMember(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant={isActive ? "default" : "secondary"}
        className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
      >
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getRoleDisplay = (role: string) => {
    if (!role) return 'Unknown';
    const roleMap: { [key: string]: string } = {
      'business_admin': 'Business Admin',
      'inhouse_sales': 'In-House Sales',
      'marketing': 'Marketing',
      'tele_caller': 'Tele-Caller',
      'manager': 'Manager',
      'sales': 'Sales',
      'support': 'Support',
    };
    return roleMap[role] || role;
  };

  const getFullName = (member: TeamMember) => {
    if (member?.first_name && member?.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member?.name || member?.username || 'Unknown';
  };

  const filteredTeamMembers = (teamMembers || []).filter(member => {
    const fullName = getFullName(member)?.toLowerCase() || '';
    const email = member.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading team members...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTeamMembers}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Team Management</h1>
          <p className="text-text-secondary mt-1">Manage your team members and roles</p>
        </div>
        
        {/* Create Team Member Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="btn-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={createFormData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={createFormData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={createFormData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={createFormData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inhouse_sales">In-House Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="tele_caller">Tele-Caller</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={createFormData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={createFormData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>

                             <div>
                 <Label htmlFor="store">Assign Store</Label>
                 <Select value={createFormData.store?.toString() || 'none'} onValueChange={(value) => handleInputChange('store', value === 'none' ? undefined : parseInt(value, 10))}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select a store (optional)" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">No store assigned</SelectItem>
                     {!Array.isArray(stores) || stores.length === 0 ? (
                       <SelectItem value="loading" disabled>Loading stores...</SelectItem>
                     ) : (
                       stores.map(store => {
                         console.log('Rendering store:', store);
                         return (
                           <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                         );
                       })
                     )}
                   </SelectContent>
                 </Select>
               </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateMember}
                  disabled={creatingMember || !createFormData.username || !createFormData.email || !createFormData.password || !createFormData.role}
                  className="flex-1"
                >
                  {creatingMember ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Member'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingMember}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Edit Team Member Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editingMember?.first_name || ''}
                    onChange={(e) => setEditingMember(prev => prev ? {...prev, first_name: e.target.value} : null)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editingMember?.last_name || ''}
                    onChange={(e) => setEditingMember(prev => prev ? {...prev, last_name: e.target.value} : null)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editingMember?.email || ''}
                  onChange={(e) => setEditingMember(prev => prev ? {...prev, email: e.target.value} : null)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_role">Role *</Label>
                <Select value={editingMember?.role || ''} onValueChange={(value) => setEditingMember(prev => prev ? {...prev, role: value} : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inhouse_sales">In-House Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="tele_caller">Tele-Caller</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_phone">Phone Number</Label>
                <Input
                  id="edit_phone"
                  value={editingMember?.phone || ''}
                  onChange={(e) => setEditingMember(prev => prev ? {...prev, phone: e.target.value} : null)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_address">Address</Label>
                <Textarea
                  id="edit_address"
                  value={editingMember?.address || ''}
                  onChange={(e) => setEditingMember(prev => prev ? {...prev, address: e.target.value} : null)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_store">Assign Store</Label>
                <Select value={editingMember?.store?.toString() || 'none'} onValueChange={(value) => setEditingMember(prev => prev ? {...prev, store: value === 'none' ? undefined : parseInt(value, 10)} : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No store assigned</SelectItem>
                    {!Array.isArray(stores) || stores.length === 0 ? (
                      <SelectItem value="loading" disabled>Loading stores...</SelectItem>
                    ) : (
                      stores.map(store => (
                        <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdateMember}
                  disabled={creatingMember || !editingMember?.first_name || !editingMember?.email || !editingMember?.role}
                  className="flex-1"
                >
                  {creatingMember ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Member'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={creatingMember}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Role</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Email</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Phone</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Store</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeamMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    {searchTerm ? 'No team members found matching your search.' : 'No team members found.'}
                  </td>
                </tr>
              ) : (
                filteredTeamMembers.map((member) => (
                  <tr key={member.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">
                      {getFullName(member)}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {getRoleDisplay(member.role)}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {member.email}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {member.phone || '-'}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {(() => {
                        if (!member.store) {
                          return '-';
                        }
                        if (!Array.isArray(stores) || stores.length === 0) {
                          return 'Loading stores...';
                        }
                        const store = stores.find(s => s.id === member.store);
                        if (!store) {
                          console.log(`Store not found for ID: ${member.store}, available stores:`, stores.map(s => ({ id: s.id, name: s.name })));
                          return 'Unknown Store';
                        }
                        return store.name;
                      })()}
                    </td>
                    <td className="px-4 py-2">
                      {getStatusBadge(member.is_active)}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Edit"
                        onClick={() => handleEditMember(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Delete" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteMember(member.id)}
                        disabled={deletingMember === member.id}
                      >
                        {deletingMember === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTeamMembers.length > 0 && (
          <div className="text-sm text-text-secondary text-center">
            Showing {filteredTeamMembers.length} of {teamMembers.length} team members
          </div>
        )}
      </Card>
    </div>
  );
}
 
 