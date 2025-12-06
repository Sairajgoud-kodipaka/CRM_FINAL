'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, X, Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/lib/api-service';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<CreateTeamMemberData[]>([]);
  const [importStatus, setImportStatus] = useState<{index: number; status: 'pending' | 'creating' | 'success' | 'error'; message?: string}[]>([]);
  const [isImporting, setIsImporting] = useState(false);
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
      const response = await apiService.listTeamMembers();
      if (response.success) {
        const data = response.data as any;
        const teamMembersData = Array.isArray(data) ? data : data.results || [];
        setTeamMembers(teamMembersData);
      } else {
        setError('Failed to load team members');
      }
    } catch (error) {
      setError('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await apiService.getStores();
      if (response.success) {
        // Handle paginated response format
        const storesData = (response.data as any)?.results || (Array.isArray(response.data) ? response.data : []);
        setStores(storesData);
      } else {
        setStores([]);
      }
    } catch (error) {
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
      const response = await apiService.updateTeamMember(editingMember.id.toString(), updateData);
      if (response.success) {
        setShowEditModal(false);
        setEditingMember(null);
        setError(null);
        await fetchTeamMembers(); // Refresh the list
      } else {
        setError(response.message || 'Failed to update team member');
      }
    } catch (error) {
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
      'tele_calling': 'Tele-Calling',
      'manager': 'Manager',
    };
    return roleMap[role] || role;
  };

  const getFullName = (member: TeamMember) => {
    if (member?.first_name && member?.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member?.name || member?.username || 'Unknown';
  };

  // CSV Template download
  const downloadCSVTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'username', 'password', 'role', 'phone'];
    const sampleData = [
      ['John', 'Doe', 'john@example.com', 'johndoe', 'Pass@123', 'inhouse_sales', '+919876543210'],
      ['Jane', 'Smith', 'jane@example.com', 'janesmith', 'Pass@456', 'manager', '+919876543211'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['first_name', 'email', 'username', 'password', 'role'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const parsedData: CreateTeamMemberData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Map to CreateTeamMemberData
        parsedData.push({
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          email: row.email || '',
          username: row.username || '',
          password: row.password || '',
          role: row.role || 'inhouse_sales',
          phone: row.phone || '',
        });
      }
      
      setImportData(parsedData);
      setImportStatus(parsedData.map((_, index) => ({ index, status: 'pending' })));
      setError(null);
    };
    
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  // Bulk import team members
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    
    setIsImporting(true);
    
    for (let i = 0; i < importData.length; i++) {
      // Update status to creating
      setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'creating' } : s));
      
      try {
        const response = await apiService.createTeamMember(importData[i]);
        
        if (response.success) {
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'success' } : s));
        } else {
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: response.message || 'Failed' } : s));
        }
      } catch (err: any) {
        setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: err.message || 'Error' } : s));
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsImporting(false);
    // Refresh team members list
    await fetchTeamMembers();
  };

  const resetImport = () => {
    setImportData([]);
    setImportStatus([]);
    setError(null);
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
          <Skeleton className="h-6 w-6 rounded" />
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
        
        <div className="flex items-center gap-2">
          {/* Import Team Button */}
          <Button 
            variant="outline" 
            className="text-sm flex items-center gap-1"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="w-4 h-4" /> Import Team
          </Button>
          
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
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-sm">First Name *</Label>
                  <Input
                    id="first_name"
                    value={createFormData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="John"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                  <Input
                    id="last_name"
                    value={createFormData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Doe"
                    className="h-9"
                  />
                </div>
              </div>
              
              {/* Row 2: Email & Username */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm">Username *</Label>
                  <Input
                    id="username"
                    value={createFormData.username}
                    onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="johndoe"
                    className="h-9"
                  />
                </div>
              </div>
              
              {/* Row 3: Role & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-sm">Role *</Label>
                  <Select value={createFormData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inhouse_sales">In-House Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="tele_calling">Tele-Calling</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm">Phone</Label>
                  <PhoneInputComponent
                    value={createFormData.phone || ''}
                    onChange={(value) => handleInputChange('phone', value)}
                    placeholder="Phone number"
                    defaultCountry="IN"
                  />
                </div>
              </div>
              
              {/* Row 4: Password & Store */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">Password *</Label>
                  <PasswordInput
                    id="password"
                    value={createFormData.password}
                    onChange={(value) => handleInputChange('password', value)}
                    placeholder="Create password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="store" className="text-sm">Assign Store</Label>
                  <Select value={createFormData.store?.toString() || 'none'} onValueChange={(value) => handleInputChange('store', value === 'none' ? undefined : parseInt(value, 10))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No store assigned</SelectItem>
                      {Array.isArray(stores) && stores.map(store => (
                        <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateMember}
                  disabled={creatingMember || !createFormData.username || !createFormData.email || !createFormData.password || !createFormData.role}
                  className="flex-1"
                >
                  {creatingMember ? (
                    <>
                      <Skeleton className="w-4 h-4 mr-2 rounded" />
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
                    <SelectItem value="tele_calling">Tele-Calling</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit_phone">Phone Number</Label>
                <PhoneInputComponent
                  value={editingMember?.phone || ''}
                  onChange={(value) => setEditingMember(prev => prev ? {...prev, phone: value} : null)}
                  placeholder="Enter phone number"
                  defaultCountry="IN"
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
                      <Skeleton className="w-4 h-4 mr-2 rounded" />
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
        
        {/* Import Team Modal */}
        <Dialog open={showImportModal} onOpenChange={(open) => { setShowImportModal(open); if (!open) resetImport(); }}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Team Members</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Upload a CSV file with the following columns:
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className="bg-white text-xs">first_name *</Badge>
                  <Badge variant="outline" className="bg-white text-xs">last_name</Badge>
                  <Badge variant="outline" className="bg-white text-xs">email *</Badge>
                  <Badge variant="outline" className="bg-white text-xs">username *</Badge>
                  <Badge variant="outline" className="bg-white text-xs">password *</Badge>
                  <Badge variant="outline" className="bg-white text-xs">role *</Badge>
                  <Badge variant="outline" className="bg-white text-xs">phone</Badge>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  <strong>Roles:</strong> inhouse_sales, marketing, tele_calling, manager
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadCSVTemplate}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" /> Download Template
                </Button>
              </div>
              
              {/* File Upload */}
              {importData.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">CSV files only</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ position: 'relative' }}
                  />
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      Select CSV File
                    </label>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Preview Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                      <span className="text-sm font-medium">{importData.length} members to import</span>
                      <Button variant="ghost" size="sm" onClick={resetImport} disabled={isImporting}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importData.map((member, index) => {
                            const status = importStatus[index];
                            return (
                              <tr key={index} className={status?.status === 'error' ? 'bg-red-50' : ''}>
                                <td className="px-3 py-2">
                                  {status?.status === 'pending' && <span className="text-gray-400">●</span>}
                                  {status?.status === 'creating' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                  {status?.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                  {status?.status === 'error' && (
                                    <span title={status.message}>
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">{member.first_name} {member.last_name}</td>
                                <td className="px-3 py-2 text-gray-500">{member.email}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Import Progress */}
                  {isImporting && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        Creating accounts... {importStatus.filter(s => s.status === 'success').length} of {importData.length} completed
                      </p>
                    </div>
                  )}
                  
                  {/* Results Summary */}
                  {!isImporting && importStatus.some(s => s.status === 'success' || s.status === 'error') && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">
                        ✓ {importStatus.filter(s => s.status === 'success').length} created
                      </span>
                      {importStatus.filter(s => s.status === 'error').length > 0 && (
                        <span className="text-red-600">
                          ✗ {importStatus.filter(s => s.status === 'error').length} failed
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                {importData.length > 0 && !importStatus.some(s => s.status === 'success') && (
                  <Button
                    onClick={handleBulkImport}
                    disabled={isImporting || importData.length === 0}
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Accounts...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Create {importData.length} Accounts
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setShowImportModal(false); resetImport(); }}
                  disabled={isImporting}
                  className={importData.length === 0 || importStatus.some(s => s.status === 'success') ? 'flex-1' : ''}
                >
                  {importStatus.some(s => s.status === 'success') ? 'Done' : 'Cancel'}
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
                          <Skeleton className="w-4 h-4 rounded" />
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
 
 
