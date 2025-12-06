'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiService } from '@/lib/api-service';
import { X, Plus, ArrowLeft, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInputComponent } from '@/components/ui/phone-input';
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

interface CreateManagerData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
  phone: string;
}

// Helper function to generate store code from name
function generateStoreCode(storeName: string, existingCodes: string[]): string {
  if (!storeName.trim()) return '';
  
  // Split the name into words
  const words = storeName.trim().split(/\s+/);
  
  let baseCode = '';
  
  if (words.length === 1) {
    // Single word: take first 3-4 consonants/characters
    const word = words[0].toUpperCase();
    // Try to get consonants first
    const consonants = word.replace(/[AEIOU]/gi, '');
    if (consonants.length >= 3) {
      baseCode = consonants.substring(0, 3);
    } else {
      // Fall back to first 3 characters
      baseCode = word.substring(0, 3);
    }
  } else {
    // Multiple words: take first letter of each word (up to 4)
    baseCode = words
      .slice(0, 4)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
  
  // Find next available number
  let counter = 1;
  let finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
  
  while (existingCodes.includes(finalCode.toUpperCase())) {
    counter++;
    finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
  }
  
  return finalCode;
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
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  
  // Create Manager state
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [creatingManager, setCreatingManager] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerFormData, setManagerFormData] = useState<CreateManagerData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'manager',
    phone: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
      fetchExistingStoreCodes();
    }
  }, [isOpen]);

  const fetchExistingStoreCodes = async () => {
    try {
      const response = await apiService.getStores();
      if (response.success && response.data) {
        const stores = Array.isArray(response.data) ? response.data : 
                       (response.data as any).results || [];
        const codes = stores.map((s: any) => s.code?.toUpperCase() || '');
        setExistingCodes(codes);
      }
    } catch (error) {
      // Silently fail - we'll generate without checking duplicates
      setExistingCodes([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await apiService.listTeamMembers();

      if (response.success) {
        const teamMembersData = response.data;

        if (Array.isArray(teamMembersData)) {
          setTeamMembers(teamMembersData);
        } else if (teamMembersData && typeof teamMembersData === 'object' && 'results' in teamMembersData) {
          const results = (teamMembersData as any).results;
          if (Array.isArray(results)) {
            setTeamMembers(results);
          } else {
            setTeamMembers([]);
          }
        } else if (teamMembersData && typeof teamMembersData === 'object' && 'team_members' in teamMembersData) {
          const members = (teamMembersData as any).team_members;
          if (Array.isArray(members)) {
            setTeamMembers(members);
          } else {
            setTeamMembers([]);
          }
        } else {
          setTeamMembers([]);
        }
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Auto-generate code when store name changes
  const handleStoreNameChange = useCallback((name: string) => {
    setFormData(prev => {
      const newCode = generateStoreCode(name, existingCodes);
      return {
        ...prev,
        name,
        code: newCode,
      };
    });
  }, [existingCodes]);

  // Regenerate code manually
  const handleRegenerateCode = () => {
    if (formData.name.trim()) {
      const newCode = generateStoreCode(formData.name, existingCodes);
      setFormData(prev => ({ ...prev, code: newCode }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Only require store name and code
    if (!formData.name.trim()) {
      setError('Store name is required');
      setLoading(false);
      return;
    }

    if (!formData.code.trim()) {
      setError('Store code is required');
      setLoading(false);
      return;
    }

    try {
      const cleanFormData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        address: formData.address.trim() || 'Not specified',
        city: formData.city.trim() || 'Not specified',
        state: formData.state.trim() || 'Not specified',
        manager: formData.manager || undefined,
        is_active: formData.is_active,
        timezone: 'Asia/Kolkata',
      };

      const response = await apiService.createStore(cleanFormData);
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
        setShowCreateManager(false);
      } else {
        setError(response.message || 'Failed to create store');
      }
    } catch (error: any) {
      if (error.status === 405) {
        setError('Store creation method not allowed. Please contact support.');
      } else if (error.status === 400) {
        setError('Invalid store data. Please check all required fields.');
      } else if (error.status === 403) {
        setError('You do not have permission to create stores.');
      } else if (error.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to create store: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StoreFormData, value: string | boolean | number | undefined) => {
    if (field === 'name') {
      handleStoreNameChange(value as string);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Manager form handlers
  const handleManagerInputChange = (field: keyof CreateManagerData, value: string) => {
    setManagerFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate username from email
    if (field === 'email' && value.includes('@')) {
      const username = value.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      setManagerFormData(prev => ({
        ...prev,
        username: username
      }));
    }
  };

  const handleCreateManager = async () => {
    setManagerError(null);
    
    // Validate required fields
    if (!managerFormData.username.trim()) {
      setManagerError('Username is required');
      return;
    }
    if (!managerFormData.email.trim()) {
      setManagerError('Email is required');
      return;
    }
    if (!managerFormData.first_name.trim()) {
      setManagerError('First name is required');
      return;
    }
    if (!managerFormData.password.trim()) {
      setManagerError('Password is required');
      return;
    }

    try {
      setCreatingManager(true);
      const response = await apiService.createTeamMember({
        ...managerFormData,
        phone: managerFormData.phone || undefined,
      });

      if (response.success) {
        // Get the new manager's ID and set it
        const newManager = response.data;
        if (newManager?.id) {
          setFormData(prev => ({ ...prev, manager: newManager.id }));
        }
        
        // Refresh team members list
        await fetchTeamMembers();
        
        // Reset manager form and go back
        setManagerFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          role: 'manager',
          phone: '',
        });
        setShowCreateManager(false);
      } else {
        setManagerError(response.message || 'Failed to create manager');
      }
    } catch (error: any) {
      setManagerError(error.message || 'Failed to create manager');
    } finally {
      setCreatingManager(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          {showCreateManager ? (
            <>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCreateManager(false)}
                  className="p-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-text-primary">Create Manager</h2>
              </div>
            </>
          ) : (
            <h2 className="text-xl font-semibold text-text-primary">Add New Store</h2>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {showCreateManager ? (
          // Create Manager Form
          <div className="space-y-4">
            {managerError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {managerError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="manager_first_name" className="text-sm">First Name *</Label>
                <Input
                  id="manager_first_name"
                  value={managerFormData.first_name}
                  onChange={(e) => handleManagerInputChange('first_name', e.target.value)}
                  placeholder="John"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manager_last_name" className="text-sm">Last Name</Label>
                <Input
                  id="manager_last_name"
                  value={managerFormData.last_name}
                  onChange={(e) => handleManagerInputChange('last_name', e.target.value)}
                  placeholder="Doe"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="manager_email" className="text-sm">Email *</Label>
                <Input
                  id="manager_email"
                  type="email"
                  value={managerFormData.email}
                  onChange={(e) => handleManagerInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manager_username" className="text-sm">Username *</Label>
                <Input
                  id="manager_username"
                  value={managerFormData.username}
                  onChange={(e) => handleManagerInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="johndoe"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manager_phone" className="text-sm">Phone</Label>
              <PhoneInputComponent
                value={managerFormData.phone}
                onChange={(value) => handleManagerInputChange('phone', value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manager_password" className="text-sm">Password *</Label>
              <PasswordInput
                id="manager_password"
                value={managerFormData.password}
                onChange={(value) => handleManagerInputChange('password', value)}
                placeholder="Create a password"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateManager(false)}
                className="flex-1"
                disabled={creatingManager}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleCreateManager}
                className="flex-1"
                disabled={creatingManager || !managerFormData.email || !managerFormData.first_name || !managerFormData.password}
              >
                {creatingManager ? (
                  <>
                    <Skeleton className="mr-2 h-4 w-4 rounded animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Manager'
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Store Form
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
                placeholder="e.g., CG Road Branch"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Store Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="Auto-generated"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  disabled={!formData.name.trim()}
                  title="Regenerate code"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated from store name. You can edit if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address
                <span className="text-xs text-muted-foreground ml-1">(optional)</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter store address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  State
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Select
                value={formData.manager?.toString() || 'none'}
                onValueChange={(value) => {
                  if (value === 'create_new') {
                    setShowCreateManager(true);
                  } else {
                    handleInputChange('manager', value && value !== 'none' ? parseInt(value) : undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {loadingMembers ? (
                    <SelectItem value="loading" disabled>
                      Loading managers...
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">No Manager</SelectItem>
                      {Array.isArray(teamMembers) && teamMembers.length > 0 && (
                        <>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.first_name} {member.last_name} ({member.role})
                            </SelectItem>
                          ))}
                        </>
                      )}
                      <SelectItem value="create_new" className="text-primary font-medium">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create New Manager
                        </span>
                      </SelectItem>
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
                    <Skeleton className="mr-2 h-4 w-4 rounded" />
                    Creating...
                  </>
                ) : (
                  'Create Store'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
