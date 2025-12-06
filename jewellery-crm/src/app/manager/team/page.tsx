'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X, Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
import { apiService, User } from '@/lib/api-service';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTapNavigation } from '@/hooks/useTapNavigation';

interface InviteMemberData {
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

export default function ManagerTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [inviteData, setInviteData] = useState<InviteMemberData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'inhouse_sales'
  });
  const [editData, setEditData] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'inhouse_sales',
    phone: '',
    address: ''
  });
  
  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<InviteMemberData[]>([]);
  const [importStatus, setImportStatus] = useState<{index: number; status: 'pending' | 'creating' | 'success' | 'error'; message?: string}[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Generate a strong default password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Initialize password when component mounts
  useEffect(() => {
    setInviteData(prev => ({
      ...prev,
      password: generateStrongPassword()
    }));
  }, []);

  useEffect(() => {
    // Check if user is logged in first
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {

      // Try to auto-login with demo credentials
      const autoLogin = async () => {
        try {
          const loginResponse = await apiService.login('rara', 'password123');
          if (loginResponse.success) {

            fetchTeam();
            fetchCurrentUser();
          } else {

            router.push('/');
          }
        } catch (error) {

          router.push('/login');
        }
      };
      autoLogin();
      return;
    }

    fetchTeam();
    fetchCurrentUser();
  }, [router]);


  const fetchCurrentUser = async () => {
    try {


      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        setCurrentUser(response.data);

      } else {

      }
    } catch (error) {

    }
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);


      const response = await apiService.listTeamMembers();


      if (response.success && response.data) {
        // Handle paginated response
        let teamMembers: User[] = [];
        if (Array.isArray(response.data)) {
          teamMembers = response.data;
        } else if (typeof response.data === 'object' && response.data !== null && 'results' in response.data && Array.isArray((response.data as { results: User[] }).results)) {
          teamMembers = (response.data as { results: User[] }).results;
        }


        setTeam(teamMembers);
      } else {

        setTeam([]);
      }
    } catch (error) {

      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  // CSV Template download for import
  const downloadCSVTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'username', 'password', 'role', 'phone'];
    const sampleData = [
      ['John', 'Doe', 'john@example.com', 'johndoe', 'Pass@123', 'inhouse_sales', '+919876543210'],
      ['Jane', 'Smith', 'jane@example.com', 'janesmith', 'Pass@456', 'tele_calling', '+919876543211'],
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

  // Parse CSV file for import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['first_name', 'email', 'username', 'password', 'role'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setImportError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const parsedData: InviteMemberData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Map to InviteMemberData - only roles manager can create
        const role = row.role || 'inhouse_sales';
        const allowedRoles = ['inhouse_sales', 'tele_calling', 'marketing'];
        
        parsedData.push({
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          email: row.email || '',
          username: row.username || '',
          password: row.password || '',
          role: allowedRoles.includes(role) ? role : 'inhouse_sales',
          phone: row.phone || '',
        });
      }
      
      setImportData(parsedData);
      setImportStatus(parsedData.map((_, index) => ({ index, status: 'pending' })));
      setImportError(null);
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Bulk import team members
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    
    setIsImporting(true);
    
    for (let i = 0; i < importData.length; i++) {
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
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsImporting(false);
    await fetchTeam();
  };

  const resetImport = () => {
    setImportData([]);
    setImportStatus([]);
    setImportError(null);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {

      // Remove store field since backend will auto-assign it
      const { store, ...memberData } = inviteData;

      // Ensure all required fields are present
      const requiredFields = ['username', 'email', 'first_name', 'last_name', 'password', 'role'];
      const missingFields = requiredFields.filter(field => !memberData[field as keyof typeof memberData]);

      if (missingFields.length > 0) {

        toast({
          title: "Error",
          description: `Missing required fields: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }


      const response = await apiService.createTeamMember(memberData);

      if (response.success) {

        setShowInviteModal(false);
        setInviteData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: generateStrongPassword(),
          role: 'inhouse_sales'
        });
        toast({
          title: "Success",
          description: "Team member added successfully!",
          variant: "success",
        });
        // Refresh team members
        await fetchTeam();
      } else {

        const errorMessage = typeof response.errors === 'string' ? response.errors : response.message || 'Failed to add member. Please try again.';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {

      let errorMessage = 'Error adding member. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditMember = useCallback((member: User) => {
    setSelectedMember(member);
    setEditData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      role: member.role,
      phone: member.phone || '',
      address: member.address || ''
    });
    setShowEditModal(true);
  }, []);

  const handleViewMember = useCallback((member: User) => {
    // For team members, view and edit are the same - open edit modal
    handleEditMember(member);
  }, [handleEditMember]);

  const isMobile = useIsMobile();
  
  // For team members, both view and edit open the same modal
  const handleEditMemberFromRow = useCallback((member: User) => {
    handleEditMember(member);
  }, [handleEditMember]);

  const { handleRowClick, handleRowDoubleClick } = useTapNavigation(
    handleViewMember,
    handleEditMemberFromRow,
    isMobile
  );

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setEditLoading(true);
    try {

      // Use the team member ID for updates
      const response = await apiService.updateTeamMember(selectedMember.id.toString(), editData);

      if (response.success) {

        setShowEditModal(false);
        setSelectedMember(null);
        setEditData({
          first_name: '',
          last_name: '',
          email: '',
          role: 'inhouse_sales',
          phone: '',
          address: ''
        });
        toast({
          title: "Success",
          description: "Team member updated successfully!",
          variant: "success",
        });
        // Refresh team members
        await fetchTeam();
      } else {

        toast({
          title: "Error",
          description: "Failed to update member. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Error updating member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMember = async (member: User) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    setDeleteLoading(memberToDelete.id.toString());
    setShowDeleteConfirm(false);

    try {

      // Use the team member ID (not user_id) for deletion
      const response = await apiService.deleteTeamMember(memberToDelete.id.toString());

      if (response.success) {

        toast({
          title: "Success",
          description: "Team member permanently deleted from database!",
          variant: "success",
        });
        // Refresh team members
        await fetchTeam();
      } else {

        toast({
          title: "Error",
          description: "Failed to delete member. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Error deleting member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
      setMemberToDelete(null);
    }
  };

  const filteredTeam = Array.isArray(team) ? team.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const email = member.email.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  }) : [];

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card className="p-4">
          <div className="h-10 w-80 bg-muted animate-pulse rounded mb-4" />
          <TableSkeleton rows={5} columns={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Team</h1>
          <p className="text-text-secondary mt-1">View and manage your team members</p>
          {currentUser && (
            <div className="mt-2 text-xs text-gray-500">
              <span>Logged in as: {currentUser.first_name} {currentUser.last_name} ({currentUser.role})</span>
              {currentUser.store && <span> | Store: {currentUser.store}</span>}
              {currentUser.tenant && <span> | Tenant: {currentUser.tenant}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="text-sm flex items-center gap-1"
          >
            <Upload className="w-4 h-4" /> Import Team
          </Button>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input
            placeholder="Search by name or email..."
            className="w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Role</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Email</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    {loading ? (
                      <div className="flex flex-col items-center gap-2">
                        <TableSkeleton rows={3} columns={5} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span>No team members found.</span>
                        <span className="text-sm text-gray-500">Team members will appear here once they are added to your store.</span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTeam.map((member, i) => (
                  <tr 
                    key={i} 
                    className="border-t border-border hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(member)}
                    onDoubleClick={() => handleRowDoubleClick(member)}
                  >
                    <td className="px-4 py-2 font-medium text-text-primary">
                      {`${member.first_name} ${member.last_name}`}
                    </td>
                    <td className="px-4 py-2 text-text-primary">{member.role}</td>
                    <td className="px-4 py-2 text-text-primary">{member.email}</td>
                    <td className="px-4 py-2">
                      <Badge variant={member.is_active ? "default" : "secondary"} className="capitalize text-xs">
                        {member.is_active ? 'active' : 'inactive'}
                      </Badge>
                    </td>
                                         <td className="px-4 py-2 flex gap-2">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleEditMember(member)}
                         title="Edit member"
                       >
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleDeleteMember(member)}
                         disabled={deleteLoading === member.id.toString()}
                         title="Delete member"
                       >
                         {deleteLoading === member.id.toString() ? (
                           <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                         ) : (
                           <Trash2 className="w-4 h-4 text-red-500" />
                         )}
                       </Button>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Team Member</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInviteModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <Input
                    value={inviteData.first_name}
                    onChange={(e) => setInviteData({...inviteData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <Input
                    value={inviteData.last_name}
                    onChange={(e) => setInviteData({...inviteData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  value={inviteData.username}
                  onChange={(e) => setInviteData({...inviteData, username: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="flex gap-2">
                  <PasswordInput
                    value={inviteData.password}
                    onChange={(value) => setInviteData({...inviteData, password: value})}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteData({...inviteData, password: generateStrongPassword()})}
                    className="text-xs"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="inhouse_sales">In-house Sales</option>
                  <option value="tele_calling">Tele-calling</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1"
                >
                  {inviteLoading ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
                     </div>
         </div>
       )}

       {/* Edit Member Modal */}
       {showEditModal && selectedMember && (
         <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">Edit Team Member</h2>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => {
                   setShowEditModal(false);
                   setSelectedMember(null);
                 }}
               >
                 <X className="w-4 h-4" />
               </Button>
             </div>

             <form onSubmit={handleUpdateMember} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-1">First Name</label>
                   <Input
                     value={editData.first_name}
                     onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1">Last Name</label>
                   <Input
                     value={editData.last_name}
                     onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                     required
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1">Email</label>
                 <Input
                   type="email"
                   value={editData.email}
                   onChange={(e) => setEditData({...editData, email: e.target.value})}
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1">Phone</label>
                 <PhoneInputComponent
                   value={editData.phone || ''}
                   onChange={(value) => setEditData({...editData, phone: value})}
                   placeholder="Enter phone number"
                   defaultCountry="IN"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1">Address</label>
                 <Input
                   value={editData.address}
                   onChange={(e) => setEditData({...editData, address: e.target.value})}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1">Role</label>
                 <select
                   value={editData.role}
                   onChange={(e) => setEditData({...editData, role: e.target.value})}
                   className="w-full p-2 border border-gray-300 rounded-md"
                   required
                 >
                   <option value="inhouse_sales">In-house Sales</option>
                   <option value="tele_calling">Tele-calling</option>
                   <option value="marketing">Marketing</option>
                   <option value="manager">Manager</option>
                 </select>
               </div>

               <div className="flex gap-2 pt-4">
                 <Button
                   type="submit"
                   disabled={editLoading}
                   className="flex-1"
                 >
                   {editLoading ? 'Updating...' : 'Update Member'}
                 </Button>
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => {
                     setShowEditModal(false);
                     setSelectedMember(null);
                   }}
                   disabled={editLoading}
                 >
                   Cancel
                 </Button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && memberToDelete && (
         <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-red-600">Delete Team Member</h2>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => {
                   setShowDeleteConfirm(false);
                   setMemberToDelete(null);
                 }}
               >
                 <X className="w-4 h-4" />
               </Button>
             </div>

             <div className="space-y-4">
               <p className="text-gray-700">
                 Are you sure you want to delete <strong>{memberToDelete.first_name} {memberToDelete.last_name}</strong>?
               </p>
               <p className="text-sm text-gray-500">
                 This action cannot be undone. The team member will be permanently removed from the system.
               </p>

               <div className="flex gap-2 pt-4">
                 <Button
                   onClick={confirmDelete}
                   disabled={deleteLoading === memberToDelete.id.toString()}
                   className="flex-1 bg-red-600 hover:bg-red-700"
                 >
                   {deleteLoading === memberToDelete.id.toString() ? 'Deleting...' : 'Delete Member'}
                 </Button>
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => {
                     setShowDeleteConfirm(false);
                     setMemberToDelete(null);
                   }}
                   disabled={deleteLoading === memberToDelete.id.toString()}
                 >
                   Cancel
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Import Team Modal */}
       {showImportModal && (
         <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-[600px] max-h-[80vh] overflow-y-auto mx-4">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">Import Team Members</h2>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => { setShowImportModal(false); resetImport(); }}
               >
                 <X className="w-4 h-4" />
               </Button>
             </div>
             
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
                   <strong>Roles:</strong> inhouse_sales, marketing, tele_calling
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
                   <p className="text-xs text-gray-400 mb-3">CSV files only</p>
                   <Button variant="outline" size="sm" asChild>
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
                               <tr key={index} className={status?.status === 'error' ? 'bg-red-50' : status?.status === 'success' ? 'bg-green-50' : ''}>
                                 <td className="px-3 py-2">
                                   {status?.status === 'pending' && <span className="text-gray-400 text-lg">●</span>}
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
                                   <Badge variant="outline" className="text-xs capitalize">{member.role.replace('_', ' ')}</Badge>
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
                       <div className="flex items-center gap-2">
                         <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                         <p className="text-sm text-blue-800">
                           Creating accounts... {importStatus.filter(s => s.status === 'success').length} of {importData.length} completed
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {/* Results Summary */}
                   {!isImporting && importStatus.some(s => s.status === 'success' || s.status === 'error') && (
                     <div className="flex gap-4 text-sm">
                       <span className="text-green-600 flex items-center gap-1">
                         <CheckCircle2 className="w-4 h-4" />
                         {importStatus.filter(s => s.status === 'success').length} created
                       </span>
                       {importStatus.filter(s => s.status === 'error').length > 0 && (
                         <span className="text-red-600 flex items-center gap-1">
                           <XCircle className="w-4 h-4" />
                           {importStatus.filter(s => s.status === 'error').length} failed
                         </span>
                       )}
                     </div>
                   )}
                 </>
               )}
               
               {importError && (
                 <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                   {importError}
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
           </div>
         </div>
       )}
     </div>
  );
}
