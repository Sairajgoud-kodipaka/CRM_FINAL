"use client";
import React, { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { apiService, Client } from "@/lib/api-service";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { Plus, Calendar, DollarSign, User, Building } from "lucide-react";

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onDealCreated: () => void;
}

interface DealFormData {
  title: string;
  client: string;
  expected_value: string;
  probability: string;
  stage: string;
  expected_close_date: string;
  notes: string;
  next_action: string;
  next_action_date: string;
}

export function AddDealModal({ open, onClose, onDealCreated }: AddDealModalProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    client: '',
    expected_value: '',
    probability: '10',
    stage: 'exhibition',
    expected_close_date: '',
    notes: '',
    next_action: '',
    next_action_date: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClients();
      
      if (response.success && response.data) {
        const clientsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.results || (response.data as any)?.data || [];
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DealFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.client || !formData.expected_value) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
             const pipelineData = {
         title: formData.title,
         client_id: parseInt(formData.client),
         expected_value: parseFloat(formData.expected_value),
         probability: parseInt(formData.probability),
         stage: formData.stage,
         expected_close_date: formData.expected_close_date || undefined,
         notes: formData.notes || undefined,
         next_action: formData.next_action || undefined,
         next_action_date: formData.next_action_date || undefined,
       };

      const response = await apiService.createSalesPipeline(pipelineData);
      
      if (response.success) {
        console.log('Deal created successfully');
        onDealCreated();
        onClose();
        // Reset form
        setFormData({
          title: '',
          client: '',
          expected_value: '',
          probability: '10',
          stage: 'exhibition',
          expected_close_date: '',
          notes: '',
          next_action: '',
          next_action_date: '',
        });
      } else {
        console.error('Failed to create deal:', response);
        alert('Failed to create deal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Error creating deal. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  const stages = [
    { value: 'exhibition', label: 'Exhibition', color: 'bg-blue-500' },
    { value: 'social_media', label: 'Social Media', color: 'bg-purple-500' },
    { value: 'interested', label: 'Interested', color: 'bg-yellow-500' },
    { value: 'store_walkin', label: 'Store - Walkin', color: 'bg-green-500' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
    { value: 'purchased', label: 'Purchased', color: 'bg-emerald-500' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
    { value: 'future_prospect', label: 'Future Prospect', color: 'bg-indigo-500' },
    { value: 'not_qualified', label: 'Not Qualified', color: 'bg-gray-500' },
  ];

  const probabilityOptions = [
    { value: '5', label: '5% - Exhibition' },
    { value: '10', label: '10% - Social Media' },
    { value: '20', label: '20% - Interested' },
    { value: '30', label: '30% - Store - Walkin' },
    { value: '80', label: '80% - Negotiation' },
    { value: '100', label: '100% - Purchased' },
    { value: '0', label: '0% - Closed Lost' },
  ];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onClose}
      title="Add New Deal"
      description="Create a new sales pipeline deal to track your opportunities"
      size={isMobile ? "full" : isTablet ? "lg" : "xl"}
      showCloseButton={true}
      actions={
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saving || !formData.title || !formData.client}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      }
    >

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Deal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Deal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter deal title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={formData.client} onValueChange={(value) => handleInputChange('client', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                    ) : clients.length === 0 ? (
                      <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Financial Information */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected_value">Expected Value (₹) *</Label>
                <Input
                  id="expected_value"
                  type="number"
                  value={formData.expected_value}
                  onChange={(e) => handleInputChange('expected_value', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Select value={formData.probability} onValueChange={(value) => handleInputChange('probability', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select probability" />
                  </SelectTrigger>
                  <SelectContent>
                    {probabilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Stage and Dates */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Stage & Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Current Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          {stage.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Actions and Notes */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Actions & Notes
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="next_action">Next Action</Label>
                <Input
                  id="next_action"
                  value={formData.next_action}
                  onChange={(e) => handleInputChange('next_action', e.target.value)}
                  placeholder="e.g., Schedule follow-up call"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_action_date">Next Action Date</Label>
                <Input
                  id="next_action_date"
                  type="datetime-local"
                  value={formData.next_action_date}
                  onChange={(e) => handleInputChange('next_action_date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this deal..."
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </form>
    </ResponsiveDialog>
  );
} 
