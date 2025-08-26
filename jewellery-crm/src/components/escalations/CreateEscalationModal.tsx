'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/lib/api-service';
import { AlertTriangle, Plus, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface CreateEscalationModalProps {
  onSuccess?: () => void;
}

interface EscalationFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  client: string;
  sla_hours: number;
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export default function CreateEscalationModal({ onSuccess }: CreateEscalationModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<EscalationFormData>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    client: '',
    sla_hours: 24,
  });

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      const response = await apiService.getClients();
      if (response.success) {
        setClients(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.client) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.createEscalation({
        ...formData,
        client: parseInt(formData.client),
      });

      if (response.success) {
        toast.success('Escalation created successfully!');
        setOpen(false);
        setFormData({
          title: '',
          description: '',
          category: 'other',
          priority: 'medium',
          client: '',
          sla_hours: 24,
        });
        onSuccess?.();
      } else {
        toast.error('Failed to create escalation');
      }
    } catch (error) {
      console.error('Error creating escalation:', error);
      toast.error('Failed to create escalation');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EscalationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Escalation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Create New Escalation
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of the issue"
              rows={4}
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_issue">Product Issue</SelectItem>
                  <SelectItem value="service_quality">Service Quality</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={formData.client}
              onValueChange={(value) => handleInputChange('client', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {client.first_name} {client.last_name}
                      {client.email && (
                        <span className="text-xs text-gray-500">({client.email})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SLA Hours */}
          <div className="space-y-2">
            <Label htmlFor="sla_hours">SLA Hours</Label>
            <div className="flex items-center gap-2">
              <Input
                id="sla_hours"
                type="number"
                min="1"
                max="168"
                value={formData.sla_hours}
                onChange={(e) => handleInputChange('sla_hours', parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-500">hours</span>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              Time limit for resolving this escalation
            </p>
          </div>

          {/* Priority Indicator */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${getPriorityColor(formData.priority)}`} />
              <span className={`font-medium ${getPriorityColor(formData.priority)}`}>
                {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This escalation will be due in {formData.sla_hours} hours
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Escalation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 