'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiService } from '@/lib/api-service';
import { Loader2, X } from 'lucide-react';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StoreFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  manager?: number;
  is_active: boolean;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function AddStoreModal({ isOpen, onClose, onSuccess }: AddStoreModalProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    manager: undefined,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await apiService.getTeamMembers();
      console.log('Team members API response:', response);
      
      if (response.success) {
        // Handle different possible response formats
        let teamMembersData = response.data;
        
        // Check if data is directly an array
        if (Array.isArray(teamMembersData)) {
          setTeamMembers(teamMembersData);
        } 
        // Check if data has a results property (paginated response)
        else if (teamMembersData && typeof teamMembersData === 'object' && 'results' in teamMembersData) {
          const results = (teamMembersData as any).results;
          if (Array.isArray(results)) {
            console.log('Using paginated results:', results);
            setTeamMembers(results);
          } else {
            console.error('Team members results is not an array:', results);
            setTeamMembers([]);
          }
        }
        // Check if data is an object with team members in a different property
        else if (teamMembersData && typeof teamMembersData === 'object' && 'team_members' in teamMembersData) {
          const teamMembers = (teamMembersData as any).team_members;
          if (Array.isArray(teamMembers)) {
            console.log('Using team_members property:', teamMembers);
            setTeamMembers(teamMembers);
          } else {
            console.error('Team members from team_members property is not an array:', teamMembers);
            setTeamMembers([]);
          }
        }
        // If none of the above, log the actual structure and set empty array
        else {
          console.error('Team members data is not in expected format:', teamMembersData);
          console.log('Data type:', typeof teamMembersData);
          console.log('Data keys:', teamMembersData && typeof teamMembersData === 'object' ? Object.keys(teamMembersData) : 'N/A');
          setTeamMembers([]);
        }
      } else {
        console.error('Failed to fetch team members:', response.message);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createStore(formData);
      if (response.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: '',
          code: '',
          address: '',
          city: '',
          state: '',
          manager: undefined,
          is_active: true,
        });
      } else {
        setError(response.message || 'Failed to create store');
      }
    } catch (error) {
      console.error('Failed to create store:', error);
      setError('Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StoreFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Add New Store</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Store Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter store name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Store Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Enter store code"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter store address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select
              value={formData.manager?.toString() || 'none'}
              onValueChange={(value) => handleInputChange('manager', value && value !== 'none' ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {loadingMembers ? (
                  <SelectItem value="loading" disabled>
                    Loading managers...
                  </SelectItem>
                ) : !Array.isArray(teamMembers) || teamMembers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No managers available
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">No Manager</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.first_name} {member.last_name} ({member.role})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Store</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Store'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 