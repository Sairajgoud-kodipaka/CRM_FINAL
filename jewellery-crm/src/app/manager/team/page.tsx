'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService, User } from '@/lib/api-service';
import { useRouter } from 'next/navigation';

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
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
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

  // Generate a strong default password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  useEffect(() => {
    // Check if user is logged in first
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
      console.log('User not logged in, attempting auto-login...');
      // Try to auto-login with demo credentials
      const autoLogin = async () => {
        try {
          const loginResponse = await apiService.login('rara', 'password123');
          if (loginResponse.success) {
            console.log('Auto-login successful');
            fetchTeam();
            fetchCurrentUser();
          } else {
            console.log('Auto-login failed, redirecting to login page');
            router.push('/login');
          }
        } catch (error) {
          console.error('Auto-login error:', error);
          router.push('/login');
        }
      };
      autoLogin();
      return;
    }
    
    fetchTeam();
    fetchCurrentUser();
  }, [router]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchCurrentUser = async () => {
    try {
      console.log('Attempting to fetch current user...');
      
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        setCurrentUser(response.data);
        console.log('Current user:', response.data);
      } else {
        console.log('Failed to get current user:', response);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);
      console.log('Fetching team members...');
      
      const response = await apiService.getTeamMembers();
      console.log('Team members response:', response);
      
      if (response.success && response.data) {
        // Handle paginated response
        let teamMembers: User[] = [];
        if (Array.isArray(response.data)) {
          teamMembers = response.data;
        } else if (typeof response.data === 'object' && response.data !== null && 'results' in response.data && Array.isArray((response.data as any).results)) {
          teamMembers = (response.data as any).results;
        }
        
        console.log('Setting team members:', teamMembers);
        setTeam(teamMembers);
      } else {
        console.warn('Team members response is not valid:', response.data);
        setTeam([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      console.log('Inviting member with data:', inviteData);
      // Remove store field since backend will auto-assign it
      const { store, ...memberData } = inviteData;
      const response = await apiService.createTeamMember(memberData);
      
      if (response.success) {
        console.log('Member invited successfully:', response.data);
        setShowInviteModal(false);
        setInviteData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: generateStrongPassword(),
          role: 'inhouse_sales'
        });
        setNotification({type: 'success', message: 'Team member invited successfully!'});
        // Refresh team members
        await fetchTeam();
      } else {
        console.error('Failed to invite member:', response);
        setNotification({type: 'error', message: 'Failed to invite member. Please try again.'});
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      setNotification({type: 'error', message: 'Error inviting member. Please try again.'});
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditMember = (member: User) => {
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
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    setEditLoading(true);
    try {
      console.log('Updating member with data:', editData);
      // Use user_id for updates, fallback to id if user_id is not available
      const memberId = selectedMember.user_id || selectedMember.id;
      const response = await apiService.updateTeamMember(memberId.toString(), editData);
      
      if (response.success) {
        console.log('Member updated successfully:', response.data);
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
        setNotification({type: 'success', message: 'Team member updated successfully!'});
        // Refresh team members
        await fetchTeam();
      } else {
        console.error('Failed to update member:', response);
        setNotification({type: 'error', message: 'Failed to update member. Please try again.'});
      }
    } catch (error) {
      console.error('Error updating member:', error);
      setNotification({type: 'error', message: 'Error updating member. Please try again.'});
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
      console.log('Deleting member:', memberToDelete.id);
      // Use the user_id from the API response, not the team member ID
      const memberId = memberToDelete.user_id || memberToDelete.id;
      const response = await apiService.deleteTeamMember(memberId.toString());
      
      if (response.success) {
        console.log('Member deleted successfully');
        setNotification({type: 'success', message: 'Team member deleted successfully!'});
        // Refresh team members
        await fetchTeam();
      } else {
        console.error('Failed to delete member:', response);
        setNotification({type: 'error', message: 'Failed to delete member. Please try again.'});
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      setNotification({type: 'error', message: 'Error deleting member. Please try again.'});
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotification(null)}
              className="text-white hover:text-white/80"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
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
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Member
        </Button>
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Loading team members...</span>
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
                  <tr key={i} className="border-t border-border hover:bg-gray-50">
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
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
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
              <h2 className="text-xl font-semibold">Invite Team Member</h2>
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
                   <Input
                     type="password"
                     value={inviteData.password}
                     onChange={(e) => setInviteData({...inviteData, password: e.target.value})}
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
                  {inviteLoading ? 'Inviting...' : 'Invite Member'}
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
                 <Input
                   value={editData.phone}
                   onChange={(e) => setEditData({...editData, phone: e.target.value})}
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
     </div>
   );
}