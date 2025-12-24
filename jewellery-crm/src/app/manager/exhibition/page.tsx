"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Gift, Users, TrendingUp, ArrowUp, RefreshCw, Search, Filter, AlertTriangle, Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import CaptureLeadModal from '@/components/exhibition/CaptureLeadModal';

interface ExhibitionLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  customer_type?: string;
  status?: string;
  created_at: string;
  notes?: string;
  city?: string;
  store?: number;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

// Add proper API response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function ManagerExhibitionPage() {
  const [leads, setLeads] = useState<ExhibitionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [exhibitionTags, setExhibitionTags] = useState<Array<{ id: number; name: string; color: string }>>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: number; name: string; color: string } | null>(null);
  const [tagFormData, setTagFormData] = useState({ name: '', color: '#3B82F6' });
  
  // Exhibition management state
  const [exhibitions, setExhibitions] = useState<Array<{ id: number; name: string; date: string; tag?: number; description?: string; location?: string }>>([]);
  const [isExhibitionModalOpen, setIsExhibitionModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<{ id: number; name: string; date: string; tag?: number; description?: string; location?: string } | null>(null);
  const [exhibitionFormData, setExhibitionFormData] = useState({ name: '', date: '', tag: '', description: '', location: '' });

  useEffect(() => {
    fetchExhibitionLeads();
    fetchExhibitionTags();
    fetchExhibitions();
  }, []);

  const fetchExhibitionTags = async () => {
    try {
      const response = await apiService.getExhibitionTags();
      console.log('Exhibition tags response:', response);
      
      if (response.success) {
        // Handle different response formats
        let tags = [];
        if (Array.isArray(response.data)) {
          tags = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          // Paginated response
          tags = response.data.results;
        } else if (response.data && typeof response.data === 'object') {
          // Try to extract array from response
          tags = Object.values(response.data).find(Array.isArray) || [];
        }
        
        console.log('Parsed tags:', tags);
        setExhibitionTags(tags);
      } else {
        console.error('Failed to fetch tags:', response);
        setExhibitionTags([]);
      }
    } catch (error) {
      console.error('Error fetching exhibition tags:', error);
      setExhibitionTags([]);
    }
  };

  const handleCreateTag = async () => {
    if (!tagFormData.name.trim()) {
      setError('Tag name is required');
      return;
    }

    try {
      setError(null);
      if (editingTag) {
        const response = await apiService.updateExhibitionTag(editingTag.id, tagFormData);
        if (response.success) {
          await fetchExhibitionTags();
          setIsTagModalOpen(false);
          setEditingTag(null);
          setTagFormData({ name: '', color: '#3B82F6' });
          setError(null);
        } else {
          const errorMsg = response.message || response.errors || 'Failed to update tag';
          setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
      } else {
        const response = await apiService.createExhibitionTag(tagFormData);
        console.log('Create tag response:', response);
        if (response.success) {
          // Small delay to ensure backend has processed
          setTimeout(async () => {
            await fetchExhibitionTags();
          }, 100);
          setIsTagModalOpen(false);
          setTagFormData({ name: '', color: '#3B82F6' });
          setError(null);
        } else {
          const errorMsg = response.message || response.errors || 'Failed to create tag';
          setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
      }
    } catch (error: any) {
      console.error('Tag creation error:', error);
      let errorMessage = 'Failed to save tag';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.name && Array.isArray(errorData.name)) {
          errorMessage = errorData.name[0];
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    }
  };

  const handleEditTag = (tag: { id: number; name: string; color: string }) => {
    setEditingTag(tag);
    setTagFormData({ name: tag.name, color: tag.color });
    setIsTagModalOpen(true);
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    try {
      const response = await apiService.deleteExhibitionTag(tagId);
      if (response.success) {
        await fetchExhibitionTags();
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to delete tag');
    }
  };

  const fetchExhibitions = async () => {
    try {
      const response = await apiService.getExhibitions();
      if (response.success) {
        let exhibitionsData = [];
        if (Array.isArray(response.data)) {
          exhibitionsData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          exhibitionsData = response.data.results;
        } else if (response.data && typeof response.data === 'object') {
          exhibitionsData = Object.values(response.data).find(Array.isArray) || [];
        }
        setExhibitions(exhibitionsData);
      } else {
        setExhibitions([]);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      setExhibitions([]);
    }
  };

  const handleCreateExhibition = async () => {
    if (!exhibitionFormData.name.trim() || !exhibitionFormData.date.trim()) {
      setError('Exhibition name and date are required');
      return;
    }

    try {
      setError(null);
      if (editingExhibition) {
        const response = await apiService.updateExhibition(editingExhibition.id, {
          name: exhibitionFormData.name,
          date: exhibitionFormData.date,
          tag: exhibitionFormData.tag ? parseInt(exhibitionFormData.tag) : undefined,
          description: exhibitionFormData.description || undefined,
          location: exhibitionFormData.location || undefined
        });
        if (response.success) {
          await fetchExhibitions();
          setIsExhibitionModalOpen(false);
          setEditingExhibition(null);
          setExhibitionFormData({ name: '', date: '', tag: '', description: '', location: '' });
        }
      } else {
        const response = await apiService.createExhibition({
          name: exhibitionFormData.name,
          date: exhibitionFormData.date,
          tag: exhibitionFormData.tag ? parseInt(exhibitionFormData.tag) : undefined,
          description: exhibitionFormData.description || undefined,
          location: exhibitionFormData.location || undefined
        });
        if (response.success) {
          await fetchExhibitions();
          setIsExhibitionModalOpen(false);
          setExhibitionFormData({ name: '', date: '', tag: '', description: '', location: '' });
        }
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to save exhibition');
    }
  };

  const handleEditExhibition = (exhibition: { id: number; name: string; date: string; tag?: number; description?: string; location?: string }) => {
    setEditingExhibition(exhibition);
    setExhibitionFormData({ 
      name: exhibition.name, 
      date: exhibition.date,
      tag: exhibition.tag?.toString() || '',
      description: exhibition.description || '',
      location: exhibition.location || ''
    });
    setIsExhibitionModalOpen(true);
  };

  const handleDeleteExhibition = async (exhibitionId: number) => {
    if (!window.confirm('Are you sure you want to delete this exhibition?')) return;

    try {
      const response = await apiService.deleteExhibition(exhibitionId);
      if (response.success) {
        await fetchExhibitions();
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to delete exhibition');
    }
  };

  const testAPI = async () => {
    try {

      const response = await apiService.getExhibitionLeads();

      alert(`API Test Result: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {

      alert(`API Test Error: ${error}`);
    }
  };

  const fetchExhibitionLeads = async () => {
    try {
      setLoading(true);
      setError(null);


      // Fetch exhibition leads for the manager's store
      const response = await apiService.getExhibitionLeads();


      // Handle the actual API response format with proper typing
      if (response && typeof response === 'object') {
        if ('success' in response && response.success && 'data' in response) {
          // Handle ApiResponse<ExhibitionLead[]> format
          if (Array.isArray(response.data)) {

            setLeads(response.data);
          } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
            // Handle paginated response format with type assertion
            const resultsData = (response.data as { results: ExhibitionLead[] }).results;
            if (Array.isArray(resultsData)) {

              setLeads(resultsData);
            } else {

              setLeads([]);
              setError(`Invalid response.data.results format: ${JSON.stringify(resultsData)}`);
            }
          } else {

            setLeads([]);
            setError(`Invalid response.data format: ${JSON.stringify(response.data)}`);
          }
        } else if (Array.isArray(response)) {
          // Handle direct array response

          setLeads(response);
        } else {

          setLeads([]);
          setError(`Invalid API response format: ${JSON.stringify(response)}`);
        }
      } else {

        setLeads([]);
        setError(`Invalid API response: ${JSON.stringify(response)}`);
      }
    } catch (error) {

      setLeads([]);
      setError(`API Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const promoteLead = async (leadId: number) => {
    try {
      const response = await apiService.promoteExhibitionLead(leadId.toString());
      if (response.success) {
        // Refresh the leads list
        await fetchExhibitionLeads();
      }
    } catch (error) {

    }
  };

  const handleCaptureLead = async (leadData: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone: string;
    city?: string;
    notes?: string;
    customer_type: string;
    exhibition_name?: string;
    exhibition_date?: string;
    exhibition_tag?: number;
    customer_interests_input?: string[];
  }) => {
    try {
      const response = await apiService.createExhibitionLead(leadData);
      if (response.success) {
        // Refresh the leads list
        await fetchExhibitionLeads();

        setError(null); // Clear any previous errors
      } else {


        // Extract detailed error message from response
        let errorMessage = 'Failed to capture lead. Please try again.';

        if (response.errors) {
          if (typeof response.errors === 'string') {
            errorMessage = response.errors;
          } else if (response.errors.email && Array.isArray(response.errors.email)) {
            errorMessage = response.errors.email[0]; // Get the first email error
          } else if (response.errors.detail && typeof response.errors.detail === 'string') {
            errorMessage = response.errors.detail;
          }
        }

        setError(errorMessage);
      }
    } catch (error: any) {


      // Handle API error responses with detailed error messages
      let errorMessage = 'Error capturing lead. Please try again.';

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.email && Array.isArray(errorData.email)) {
          errorMessage = errorData.email[0]; // Get the first email error
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    }
  };

  const filteredLeads = Array.isArray(leads) ? leads.filter(lead => {
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (lead.phone && lead.phone.includes(searchTerm)) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const readyToPromote = Array.isArray(leads) ? leads.filter(lead => lead.status === 'exhibition').length : 0;
  const alreadyPromoted = Array.isArray(leads) ? leads.filter(lead => lead.status === 'promoted').length : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exhibition Leads</h1>
          <p className="text-gray-600 mt-2">Manage and promote exhibition leads to your main customer database.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setEditingTag(null);
              setTagFormData({ name: '', color: '#3B82F6' });
              setIsTagModalOpen(true);
            }}
          >
            <Tag className="w-4 h-4 mr-2" />
            Manage Tags
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingExhibition(null);
              setExhibitionFormData({ name: '', date: '', tag: '', description: '', location: '' });
              setIsExhibitionModalOpen(true);
            }}
          >
            <Gift className="w-4 h-4 mr-2" />
            Manage Exhibitions
          </Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsCaptureModalOpen(true)}
          >
            <Gift className="w-4 h-4 mr-2" />
            + Capture Lead
          </Button>
          <Button variant="outline" onClick={fetchExhibitionLeads}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exhibition Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                <p className="text-xs text-gray-500 mt-1">All leads captured during exhibitions</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Promote</p>
                <p className="text-2xl font-bold text-gray-900">{readyToPromote}</p>
                <p className="text-xs text-gray-500 mt-1">Leads still in exhibition status</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Already Promoted</p>
                <p className="text-2xl font-bold text-green-600">{alreadyPromoted}</p>
                <p className="text-xs text-gray-500 mt-1">Successfully moved to main system</p>
              </div>
              <ArrowUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="exhibition">Exhibition</option>
                <option value="promoted">Promoted</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibition Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Exhibition Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exhibition leads found.
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(filteredLeads) && filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{lead.first_name} {lead.last_name}</h3>
                      <Badge variant="secondary">Exhibition Lead</Badge>
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        {lead.email}
                      </span>
                      <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lead.status === 'exhibition' && (
                      <Button
                        onClick={() => promoteLead(lead.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Promote to Main Customer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capture Lead Modal */}
      <CaptureLeadModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onSubmit={handleCaptureLead}
        exhibitionTags={exhibitionTags}
      />

      {/* Tag Management Modal */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Exhibition Tag' : 'Create Exhibition Tag'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="tag_name">Tag Name *</Label>
              <Input
                id="tag_name"
                value={tagFormData.name}
                onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                placeholder="e.g., Spring 2024, Wedding Collection"
              />
            </div>
            <div>
              <Label htmlFor="tag_color">Tag Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tag_color"
                  type="color"
                  value={tagFormData.color}
                  onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={tagFormData.color}
                  onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsTagModalOpen(false);
              setEditingTag(null);
              setTagFormData({ name: '', color: '#3B82F6' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag} className="bg-orange-600 hover:bg-orange-700">
              {editingTag ? 'Update Tag' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Exhibition Tags
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchExhibitionTags}
                title="Refresh tags"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTag(null);
                  setTagFormData({ name: '', color: '#3B82F6' });
                  setIsTagModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exhibitionTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {exhibitionTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-1 rounded-full border"
                  style={{ borderColor: tag.color, backgroundColor: `${tag.color}20` }}
                >
                  <span className="text-sm font-medium" style={{ color: tag.color }}>
                    {tag.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleEditTag(tag)}
                    title="Edit tag"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTag(tag.id)}
                    title="Delete tag"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">No tags created yet</p>
              <p className="text-xs text-gray-400 mb-4">Create tags to categorize your exhibitions</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTag(null);
                  setTagFormData({ name: '', color: '#3B82F6' });
                  setIsTagModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Tag
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exhibition Management Modal */}
      <Dialog open={isExhibitionModalOpen} onOpenChange={setIsExhibitionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExhibition ? 'Edit Exhibition' : 'Create Exhibition'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="exhibition_name">Exhibition Name *</Label>
              <Input
                id="exhibition_name"
                value={exhibitionFormData.name}
                onChange={(e) => setExhibitionFormData({ ...exhibitionFormData, name: e.target.value })}
                placeholder="e.g., Spring Collection 2024"
              />
            </div>
            <div>
              <Label htmlFor="exhibition_date">Exhibition Date *</Label>
              <Input
                id="exhibition_date"
                type="date"
                value={exhibitionFormData.date}
                onChange={(e) => setExhibitionFormData({ ...exhibitionFormData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="exhibition_tag">Exhibition Tag</Label>
              <select
                id="exhibition_tag"
                value={exhibitionFormData.tag}
                onChange={(e) => setExhibitionFormData({ ...exhibitionFormData, tag: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">No Tag</option>
                {exhibitionTags.map((tag) => (
                  <option key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="exhibition_description">Description</Label>
              <textarea
                id="exhibition_description"
                value={exhibitionFormData.description}
                onChange={(e) => setExhibitionFormData({ ...exhibitionFormData, description: e.target.value })}
                placeholder="Exhibition description..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="exhibition_location">Location</Label>
              <Input
                id="exhibition_location"
                value={exhibitionFormData.location}
                onChange={(e) => setExhibitionFormData({ ...exhibitionFormData, location: e.target.value })}
                placeholder="e.g., Mumbai, Delhi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsExhibitionModalOpen(false);
              setEditingExhibition(null);
              setExhibitionFormData({ name: '', date: '', tag: '', description: '', location: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateExhibition} className="bg-orange-600 hover:bg-orange-700">
              {editingExhibition ? 'Update Exhibition' : 'Create Exhibition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exhibitions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Exhibitions
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchExhibitions}
                title="Refresh exhibitions"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingExhibition(null);
                  setExhibitionFormData({ name: '', date: '', tag: '', description: '', location: '' });
                  setIsExhibitionModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exhibition
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exhibitions.length > 0 ? (
            <div className="space-y-2">
              {exhibitions.map((exhibition) => (
                <div
                  key={exhibition.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{exhibition.name}</div>
                    <div className="text-sm text-gray-600">
                      Date: {new Date(exhibition.date).toLocaleDateString()}
                      {exhibition.location && ` • Location: ${exhibition.location}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExhibition(exhibition)}
                      title="Edit exhibition"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteExhibition(exhibition.id)}
                      title="Delete exhibition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">No exhibitions created yet</p>
              <p className="text-xs text-gray-400 mb-4">Create exhibitions to organize leads by date</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingExhibition(null);
                  setExhibitionFormData({ name: '', date: '', tag: '', description: '', location: '' });
                  setIsExhibitionModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Exhibition
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
