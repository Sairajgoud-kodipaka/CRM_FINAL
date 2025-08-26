'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, Plus, Loader2, MoreHorizontal, Trash2, Users } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddStoreModal from '@/components/stores/AddStoreModal';
import StoreTeamModal from '@/components/stores/StoreTeamModal';

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

export default function StoreSettingsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Store>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedStoreForTeam, setSelectedStoreForTeam] = useState<Store | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStores();
      if (response.success) {
        const data = response.data as any;
        setStores(Array.isArray(data) ? data : data.results || []);
      } else {
        setError('Failed to load stores');
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setError('Failed to load stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store.id);
    setEditData({
      name: store.name,
      code: store.code,
      address: store.address,
      city: store.city,
      state: store.state,
      timezone: store.timezone,
      is_active: store.is_active,
    });
  };

  const handleSave = async (storeId: number) => {
    try {
      const response = await apiService.updateStore(storeId.toString(), editData);
      if (response.success) {
        setEditingStore(null);
        setEditData({});
        fetchStores(); // Refresh the list
      } else {
        setError('Failed to update store');
      }
    } catch (error) {
      console.error('Failed to update store:', error);
      setError('Failed to update store');
    }
  };

  const handleCancel = () => {
    setEditingStore(null);
    setEditData({});
  };

  const handleAddStoreSuccess = () => {
    fetchStores(); // Refresh the stores list
  };

  const handleDelete = async (store: Store) => {
    // Prevent deletion of the main store (usually the first store or one with specific code)
    if (store.code === 'MJ001' || store.name.toLowerCase().includes('main store')) {
      alert('Cannot delete the main store. This is your primary business location.');
      return;
    }

    // Check if store is active and has potential dependencies
    if (store.is_active) {
      const confirmActive = window.confirm(
        `Warning: "${store.name}" is currently active. Deleting an active store may affect ongoing operations. Are you sure you want to continue?`
      );
      if (!confirmActive) return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${store.name}"?\n\nThis will permanently remove:\n• Store location and details\n• Associated staff assignments\n• Store-specific settings\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await apiService.deleteStore(store.id.toString());
      if (response.success) {
        console.log('Store deleted successfully');
        // Remove the deleted store from the local state
        setStores(prevStores => prevStores.filter(s => s.id !== store.id));
        // Show success message
        alert('Store deleted successfully!');
      } else {
        console.error('Failed to delete store:', response);
        alert('Failed to delete store. Please try again.');
      }
    } catch (error: any) {
      console.error('Error deleting store:', error);
      
      // Handle specific error messages
      if (error.message && error.message.includes('cannot delete')) {
        alert(error.message);
      } else if (error.message && error.message.includes('permission')) {
        alert('You do not have permission to delete this store. Please contact your administrator.');
      } else if (error.message && error.message.includes('dependencies')) {
        alert('Cannot delete this store because it has active customers, staff, or other dependencies. Please reassign or deactivate them first.');
      } else {
        alert('Failed to delete store. Please try again.');
      }
    }
  };

  const handleManageTeam = (store: Store) => {
    setSelectedStoreForTeam(store);
    setIsTeamModalOpen(true);
  };

  const handleTeamModalClose = () => {
    setIsTeamModalOpen(false);
    setSelectedStoreForTeam(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading stores...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStores}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Store Settings</h1>
        <p className="text-text-secondary mt-1">Manage your store details and locations</p>
      </div>
      
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-text-primary">Stores</div>
          <Button 
            className="btn-primary text-sm flex items-center gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Store
          </Button>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Store Name</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Code</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Address</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">City</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Created</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    No stores found. Add your first store to get started.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">
                      {editingStore === store.id ? (
                        <Input
                          value={editData.name || ''}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        store.name
                      )}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {editingStore === store.id ? (
                        <Input
                          value={editData.code || ''}
                          onChange={(e) => setEditData({...editData, code: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        store.code
                      )}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {editingStore === store.id ? (
                        <Input
                          value={editData.address || ''}
                          onChange={(e) => setEditData({...editData, address: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        store.address
                      )}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {editingStore === store.id ? (
                        <Input
                          value={editData.city || ''}
                          onChange={(e) => setEditData({...editData, city: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        store.city
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingStore === store.id ? (
                        <select
                          value={editData.is_active ? 'true' : 'false'}
                          onChange={(e) => setEditData({...editData, is_active: e.target.value === 'true'})}
                          className="w-full p-1 border rounded"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        getStatusBadge(store.is_active)
                      )}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {formatDate(store.created_at)}
                    </td>
                    <td className="px-4 py-2">
                      {editingStore === store.id ? (
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSave(store.id)}
                          >
                            <Save className="w-4 h-4 mr-1" /> Save
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCancel}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(store)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageTeam(store)}>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Team
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(store)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <AddStoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddStoreSuccess}
      />

      <StoreTeamModal
        isOpen={isTeamModalOpen}
        onClose={handleTeamModalClose}
        store={selectedStoreForTeam}
      />
    </div>
  );
}
 
 