"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { Gift, User, Phone, Mail, MapPin, MessageSquare } from "lucide-react";

interface ExhibitionLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExhibitionLeadModal({ open, onClose, onSuccess }: ExhibitionLeadModalProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    summaryNotes: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.fullName.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter the customer's full name.",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.phone.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter the customer's phone number.",
          variant: "destructive",
        });
        return;
      }
      
      setLoading(true);
      
      // Prepare customer data for exhibition lead
      const customerData = {
        first_name: formData.fullName.split(' ')[0] || formData.fullName,
        last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
        email: formData.email.trim() || '',
        phone: formData.phone,
        city: formData.city.trim() || '',
        lead_source: 'exhibition',
        status: 'exhibition', // Set status as exhibition
        summary_notes: formData.summaryNotes.trim() || '',
      };

      console.log('Creating exhibition lead:', customerData);
      
      // Call API to create customer
      const response = await apiService.createClient(customerData);
      
      if (response.success) {
        console.log('Exhibition lead created successfully:', response.data);
        
        toast({
          title: "Success!",
          description: "Exhibition lead captured successfully!",
          variant: "success",
        });
        
        // Reset form
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          city: "",
          summaryNotes: "",
        });
        
        onClose();
        
        // Notify parent component
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('Failed to create exhibition lead:', response);
        
        toast({
          title: "Error",
          description: `Failed to capture lead: ${response.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating exhibition lead:', error);
      
      toast({
        title: "Error",
        description: `Error capturing lead: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Capture Exhibition Lead</DialogTitle>
              <DialogDescription>
                Quick lead capture during exhibition
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="e.g., Priya Sharma" 
                required 
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="+91 98XXXXXX00" 
                required 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="e.g., priya.sharma@example.com" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="e.g., Mumbai" 
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Summary Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Notes</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <Textarea 
                placeholder="What interested them? Budget? Timeline?" 
                rows={3}
                value={formData.summaryNotes}
                onChange={(e) => handleInputChange('summaryNotes', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? "Capturing..." : "Capture Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
