'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Users, UserPlus, Loader2, X, User } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface StoreTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: number;
    name: string;
    code: string;
  } | null;
}

interface TeamMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  store?: number;
  created_at: string;
}

interface StoreTeamAssignment {
  id: number;
  user: number;
  store: number;
  role: string;
  can_view_all: boolean;
  user_details?: TeamMember;
}

export default function StoreTeamModal({ isOpen, onClose, store }: StoreTeamModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [storeTeam, setStoreTeam] = useState<StoreTeamAssignment[]>([]);
  const [allAvailableMembers, setAllAvailableMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningMember, setAssigningMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [canViewAll, setCanViewAll] = useState(false);

  useEffect(() => {
    if (isOpen && store) {
      fetchStoreTeam();
    }
  }, [isOpen, store]);

  // Fetch available members after store team is loaded
  useEffect(() => {
    if (store && storeTeam.length >= 0) {
      fetchAllAvailableMembers();
    }
  }, [store, storeTeam]);

  const fetchStoreTeam = async () => {
    if (!store) return;
    
    try {
      const response = await apiService.getStoreTeam(store.id.toString());
      if (response.success) {
        const teamData = response.data as any[];
        setStoreTeam(teamData.map((assignment: any) => ({
          id: assignment.id,
          user: assignment.user,
          store: store.id,
          role: assignment.role,
          can_view_all: assignment.can_view_all || false,
          user_details: assignment.user_details
        })));
      } else {
        console.error('Failed to fetch store team:', response);
        setStoreTeam([]);
      }
    } catch (error) {
      console.error('Failed to fetch store team:', error);
      setStoreTeam([]);
    }
  };

  const fetchAllAvailableMembers = async () => {
    if (!store) return;
    
    try {
      // Fetch all team members from the tenant
      const response = await apiService.getTeamMembers();
      if (response.success) {
        const data = response.data as any;
        const allMembers = Array.isArray(data) ? data : data.results || [];
        
        // Get the current store team user IDs
        const currentStoreUserIds = storeTeam.map(assignment => assignment.user);
        
        // Filter out members already assigned to this store
        const availableMembers = allMembers.filter((member: TeamMember) => {
          // Check if member is already assigned to this store
          return !currentStoreUserIds.includes(member.id);
        });
        
        console.log('Store team user IDs:', currentStoreUserIds);
        console.log('All members:', allMembers.length);
        console.log('Available members:', availableMembers.length);
        
        setAllAvailableMembers(availableMembers);
      } else {
        setAllAvailableMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch available team members:', error);
      setAllAvailableMembers([]);
    }
  };

  const handleAssignMember = async () => {
    if (!selectedMember || !selectedRole || !store) return;

    try {
      setAssigningMember(true);
      
      // Check if member is already assigned to this store
      const alreadyAssigned = storeTeam.find(assignment => assignment.user === selectedMember.id);
      if (alreadyAssigned) {
        alert('This team member is already assigned to this store.');
        return;
      }

      // Create assignment data
      const assignmentData = {
        user: selectedMember.id,
        role: selectedRole,
        can_view_all: canViewAll
      };

      const response = await apiService.assignStoreTeam(store.id.toString(), [assignmentData]);
      if (response.success) {
        // Refresh both the store team and available members
        await fetchStoreTeam();
        // Wait a bit for state to update, then refresh available members
        setTimeout(() => {
          fetchAllAvailableMembers();
        }, 100);
        setShowAssignModal(false);
        setSelectedMember(null);
        setSelectedRole('');
        setCanViewAll(false);
        
        alert('Team member assigned successfully!');
      } else {
        alert('Failed to assign team member. Please try again.');
      }
    } catch (error) {
      console.error('Failed to assign team member:', error);
      alert('Failed to assign team member. Please try again.');
    } finally {
      setAssigningMember(false);
    }
  };

  const handleRemoveMember = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this team member from the store?')) {
      return;
    }

    try {
      // Remove from local state
      setStoreTeam(prev => prev.filter(assignment => assignment.id !== assignmentId));
      // Refresh available members after removal
      setTimeout(() => {
        fetchAllAvailableMembers();
      }, 100);
      alert('Team member removed successfully!');
    } catch (error) {
      console.error('Failed to remove team member:', error);
      alert('Failed to remove team member. Please try again.');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'manager':
        return 'default';
      case 'sales':
        return 'secondary';
      case 'tele_caller':
        return 'outline';
      case 'inhouse_sales':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  // Filter available team members based on search term
  const filteredAvailableMembers = allAvailableMembers.filter(member => 
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!store) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Team - {store.name}
          </DialogTitle>
          <DialogDescription>
            Assign and manage team members for {store.name} ({store.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Team Members */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current Team Members</h3>
              <Button 
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Assign Member
              </Button>
            </div>

            {storeTeam.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No team members assigned to this store yet.</p>
                <p className="text-sm">Click "Assign Member" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {storeTeam.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {assignment.user_details?.first_name} {assignment.user_details?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{assignment.user_details?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleBadgeVariant(assignment.role)}>
                        {assignment.role}
                      </Badge>
                      {assignment.can_view_all && (
                        <Badge variant="outline">Can View All</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(assignment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Available Team Members */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Team Members</h3>
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            {filteredAvailableMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No available team members found.</p>
                <p className="text-sm">All team members are already assigned to this store.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAvailableMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      {getStatusBadge(member.is_active)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowAssignModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Assign Member Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Assign Team Member</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssignModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {selectedMember && (
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">
                      {selectedMember.first_name} {selectedMember.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedMember.email}</p>
                    <Badge variant={getRoleBadgeVariant(selectedMember.role)}>
                      {selectedMember.role}
                    </Badge>
                  </div>
                )}

                <div>
                  <Label htmlFor="role">Store Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role for this store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales">Sales Representative</SelectItem>
                      <SelectItem value="tele_caller">Tele Caller</SelectItem>
                      <SelectItem value="inhouse_sales">In-House Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="canViewAll"
                    checked={canViewAll}
                    onChange={(e) => setCanViewAll(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="canViewAll">Can view all store data</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAssignMember}
                    disabled={!selectedRole || assigningMember}
                    className="flex-1"
                  >
                    {assigningMember ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Assign Member
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
