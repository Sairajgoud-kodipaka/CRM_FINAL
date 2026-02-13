"use client";
import React, { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, Client } from "@/lib/api-service";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { formatCustomerName } from "@/utils/name-utils";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { Calendar, Phone, Mail, MapPin, User, Clock, Edit, Trash2, X as XIcon, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SALES_STAGES, SALES_STAGE_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  onEdit: (customer: Client) => void;
  onDelete?: (customerId: string) => void;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

interface SummaryImageReference {
  url?: string;
  thumb?: string;
}

export function CustomerDetailModal({ open, onClose, customerId, onEdit, onDelete }: CustomerDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [customer, setCustomer] = useState<Client | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [journeyData, setJourneyData] = useState<Array<{
    type: 'interest' | 'interaction' | 'appointment' | 'pipeline' | 'sale' | 'followup' | 'store_visit';
    id: number;
    date: string | null;
    title: string;
    description: string;
    details: any;
  }>>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Dialog states
  const [showBoughtConfirm, setShowBoughtConfirm] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [updatingStage, setUpdatingStage] = useState(false);
  const [updatingInterest, setUpdatingInterest] = useState<string | null>(null);

  // Check if user can delete customers (only business admin)
  const canDeleteCustomers = user?.role === 'business_admin';

  // Real-time updates for this specific customer
  useCustomerRealtimeUpdates(
    undefined, // No need to refresh customer list from detail modal
    (updatedCustomerId) => {
      if (updatedCustomerId === customerId) {

        fetchCustomerDetails();
      }
    }
  );

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails();
    }
  }, [open, customerId]);

  // Set selected stage when customer data is loaded
  useEffect(() => {
    if (customer) {
      setSelectedStage(customer.pipeline_stage || customer.status || "");
    }
  }, [customer]);

  // Listen for refresh events from parent components
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      if (event.detail?.customerId === customerId) {

        fetchCustomerDetails();
      }
    };

    window.addEventListener('refreshCustomerDetails', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('refreshCustomerDetails', handleRefresh as EventListener);
    };
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      // Always try cross-store endpoint first for CustomerDetailModal
      // This ensures we can view customers from any store within the tenant
      let response: any = null;
      
      try {
        response = await apiService.getClient(customerId, false, true);
      } catch (crossStoreError) {
        try {
          response = await apiService.getClient(customerId);
        } catch (regularError) {
          console.error('❌ CustomerDetailModal - Both endpoints failed:', regularError);
          throw regularError;
        }
      }
      
      // If cross-store fails, try regular endpoint as fallback
      if (!response || !response.success || !response.data) {
        try {
          response = await apiService.getClient(customerId);
        } catch (regularError) {
          console.error('❌ CustomerDetailModal - Regular endpoint also failed:', regularError);
        }
      }

      if (response && response.success && response.data) {

        setCustomer(response.data);

        // Fetch real audit logs from the API
        try {
          const auditResponse = await apiService.getClientAuditLogs(customerId);
          if (auditResponse.success && auditResponse.data) {
            const auditData = Array.isArray(auditResponse.data)
              ? auditResponse.data
              : (auditResponse.data as any)?.results || (auditResponse.data as any)?.data || [];

            // Transform audit logs to match our interface
            const transformedLogs = auditData.map((log: any) => ({
              id: log.id.toString(),
              action: log.action === 'create' ? 'Customer Created' :
                      log.action === 'update' ? 'Profile Updated' :
                      log.action === 'delete' ? 'Customer Deleted' :
                      log.action === 'restore' ? 'Customer Restored' : 'Action Performed',
              details: log.action === 'create' ? 'New customer profile created' :
                      log.action === 'update' ? 'Customer information updated' :
                      log.action === 'delete' ? 'Customer marked as deleted' :
                      log.action === 'restore' ? 'Customer restored from trash' : 'Action performed on customer',
              timestamp: log.timestamp,
              user: log.user ? `User ${log.user}` : 'System'
            }));
            setAuditLogs(transformedLogs);
          }
        } catch (auditError) {

          // Fallback to mock data if audit logs fail
          setAuditLogs([
            {
              id: "1",
              action: "Customer Created",
              details: "New customer profile created",
              timestamp: response.data.created_at || new Date().toISOString(),
              user: "System"
            }
          ]);
        }
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (customer && onDelete && window.confirm(`Are you sure you want to delete ${formatCustomerName(customer)}? This action cannot be undone.`)) {
      onDelete(customer.id.toString());
      onClose();
    }
  };

  const fetchCustomerJourney = async () => {
    if (!customerId) return;
    
    try {
      setJourneyLoading(true);
      const response = await apiService.getCustomerJourney(customerId);
      
      if (response.success && response.data) {
        // Backend may return: { data: journey_items } or { journey_items } or direct array
        const raw = response.data as { data?: typeof journeyData; journey_items?: typeof journeyData };
        let journeyItems: typeof journeyData = [];
        if (Array.isArray(response.data)) {
          journeyItems = response.data as typeof journeyData;
        } else if (raw && typeof raw === 'object') {
          if (Array.isArray(raw.data)) journeyItems = raw.data;
          else if (Array.isArray(raw.journey_items)) journeyItems = raw.journey_items;
        }
        
        setJourneyData(journeyItems);
      } else {
        console.warn('⚠️ Journey response not successful:', response);
        setJourneyData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching customer journey:', error);
      setJourneyData([]);
    } finally {
      setJourneyLoading(false);
    }
  };

  // Fetch journey when journey tab is activated
  useEffect(() => {
    if (activeTab === 'journey' && customerId && !journeyLoading) {
      fetchCustomerJourney();
    }
  }, [activeTab, customerId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const extractImagesFromNotes = (notes?: string): SummaryImageReference[] => {
    if (!notes) return [];

    const lines = notes.split(/\n/);
    const images: SummaryImageReference[] = [];
    let lastImage: SummaryImageReference | null = null;

    for (const line of lines) {
      const imageMatch = line.match(/^\s*\[image\]:\s*(https?:\S+)/i);
      if (imageMatch) {
        lastImage = { url: imageMatch[1] };
        images.push(lastImage);
        continue;
      }

      const thumbMatch = line.match(/^\s*\[thumb\]:\s*(https?:\S+)/i);
      if (thumbMatch) {
        if (lastImage && !lastImage.thumb) {
          lastImage.thumb = thumbMatch[1];
        } else {
          images.push({ thumb: thumbMatch[1] });
        }
        continue;
      }

      lastImage = null;
    }

    return images.filter((image) => image.url || image.thumb);
  };

  const stripImageTags = (notes?: string): string => {
    if (!notes) return '';
    // Remove lines like "[image]: <url>" and "[thumb]: <url>"
    return notes
      .replace(/\n?\[image\]:\s*https?:[^\n]+/gi, '')
      .replace(/\n?\[thumb\]:\s*https?:[^\n]+/gi, '')
      .trim();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'customer':
        return 'default';
      case 'lead':
        return 'secondary';
      case 'prospect':
        return 'outline';
      case 'inactive':
        return 'destructive';
      case 'exhibition':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Handle mark as Bought or Lost with optional reason
  const handleBoughtClick = () => {
    setShowBoughtConfirm(true);
  };

  const markBought = async () => {
    if (!customer || !user) return;
    setProcessing(true);
    try {
      // First, try to find the customer's pipeline entry
      const pipelineResponse = await apiService.getSalesPipeline({});
      
      if (pipelineResponse.success) {
        const pipelineData = pipelineResponse.data;
        const dataArray = Array.isArray(pipelineData) ? pipelineData :
                         (pipelineData as any)?.results ? (pipelineData as any).results :
                         (pipelineData as any)?.data ? (pipelineData as any).data : [];
        
        // Find pipeline entry for this customer
        let pipeline = dataArray.find((p: any) => p.client?.id === customer.id);
        
        if (pipeline) {
          // Update the existing pipeline stage to closed_won
          const updateResponse = await apiService.updatePipelineStage(pipeline.id.toString(), { stage: 'closed_won' });
          
          if (updateResponse.success) {
            await fetchCustomerDetails();
            setShowBoughtConfirm(false);
            toast({
              title: "Success",
              description: "Customer marked as Bought successfully.",
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to update pipeline stage. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // No pipeline entry found - create one with closed_won stage
          const createResponse = await apiService.createSalesPipeline({
            client_id: customer.id,
            title: `${formatCustomerName(customer)} - Purchase`,
            stage: 'closed_won',
            probability: 100,
            expected_value: 0,
            sales_representative: user.id,
          } as unknown as Parameters<typeof apiService.createSalesPipeline>[0]);
          
          if (createResponse.success) {
            await fetchCustomerDetails();
            setShowBoughtConfirm(false);
            toast({
              title: "Success",
              description: "Customer marked as Bought successfully.",
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to create pipeline entry. Please try again.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pipeline data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Error marking as bought:', e);
      toast({
        title: "Error",
        description: "Failed to mark as Bought. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleLostClick = () => {
    setLostReason("");
    setShowLostDialog(true);
  };

  const markLost = async () => {
    if (!customer || !user) return;
    
    // Require a reason before marking as lost
    if (!lostReason || lostReason.trim() === '') {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for marking this customer as Lost.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    try {
      // First, try to find the customer's pipeline entry
      const pipelineResponse = await apiService.getSalesPipeline({});
      
      if (pipelineResponse.success) {
        const pipelineData = pipelineResponse.data;
        const dataArray = Array.isArray(pipelineData) ? pipelineData :
                         (pipelineData as any)?.results ? (pipelineData as any).results :
                         (pipelineData as any)?.data ? (pipelineData as any).data : [];
        
        // Find pipeline entry for this customer
        let pipeline = dataArray.find((p: any) => p.client?.id === customer.id);
        
        // Format the lost reason with a prefix
        const formattedReason = `Lost Reason: ${lostReason.trim()}`;
        const updatedNotes = customer.summary_notes 
          ? `${customer.summary_notes}\n\n${formattedReason}`
          : formattedReason;
        
        if (pipeline) {
          // Update the existing pipeline stage to closed_lost and add notes
          const updateStageResponse = await apiService.updatePipelineStage(pipeline.id.toString(), { stage: 'closed_lost' });
          
          if (updateStageResponse.success) {
            // Also update pipeline notes with the lost reason
            try {
              await apiService.updatePipeline(pipeline.id.toString(), { 
                notes: pipeline.notes 
                  ? `${pipeline.notes}\n\n${formattedReason}`
                  : formattedReason
              });
            } catch (e) {
              console.warn('Failed to update pipeline notes:', e);
            }
            
            // Update customer summary_notes with the lost reason
            try {
              await apiService.updateClient(customer.id.toString(), { 
                summary_notes: updatedNotes 
              });
            } catch (e) {
              console.warn('Failed to update customer notes:', e);
            }
            
            await fetchCustomerDetails();
            setShowLostDialog(false);
            setLostReason("");
            toast({
              title: "Success",
              description: "Customer marked as Lost successfully. Reason saved in notes.",
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to update pipeline stage. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // No pipeline entry found - create one with closed_lost stage
          const createResponse = await apiService.createSalesPipeline({
            client_id: customer.id,
            title: `${formatCustomerName(customer)} - Lost`,
            stage: 'closed_lost',
            probability: 0,
            expected_value: 0,
            sales_representative: user.id,
            notes: formattedReason,
          } as unknown as Parameters<typeof apiService.createSalesPipeline>[0]);
          
          if (createResponse.success) {
            // Update customer summary_notes with the lost reason
            try {
              await apiService.updateClient(customer.id.toString(), { 
                summary_notes: updatedNotes 
              });
            } catch (e) {
              console.warn('Failed to update customer notes:', e);
            }
            
            await fetchCustomerDetails();
            setShowLostDialog(false);
            setLostReason("");
            toast({
              title: "Success",
              description: "Customer marked as Lost successfully. Reason saved in notes.",
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to create pipeline entry. Please try again.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pipeline data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Error marking as lost:', e);
      toast({
        title: "Error",
        description: "Failed to mark as Lost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle pipeline stage change
  const handleStageChange = async (newStage: string) => {
    if (!customer || !user || newStage === selectedStage) return;

    setUpdatingStage(true);
    try {
      // First, try to find the customer's pipeline entry
      const pipelineResponse = await apiService.getSalesPipeline({});
      
      if (pipelineResponse.success) {
        const pipelineData = pipelineResponse.data;
        const dataArray = Array.isArray(pipelineData) ? pipelineData :
                         (pipelineData as any)?.results ? (pipelineData as any).results :
                         (pipelineData as any)?.data ? (pipelineData as any).data : [];
        
        // Find pipeline entry for this customer
        let pipeline = dataArray.find((p: any) => p.client?.id === customer.id);
        
        if (pipeline) {
          // Update the existing pipeline stage
          const updateResponse = await apiService.updatePipelineStage(pipeline.id.toString(), { stage: newStage });
          
          if (updateResponse.success) {
            // Dispatch event to refresh parent components immediately
            // Use setTimeout to ensure event is dispatched after state updates
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshCustomerDetails', { 
                detail: { customerId: customer.id, newStage: newStage } 
              }));
            }, 0);
            
            // Refresh customer details to get updated status
            await fetchCustomerDetails();
            
            toast({
              title: "Success",
              description: `Customer moved to ${SALES_STAGE_LABELS[newStage as keyof typeof SALES_STAGE_LABELS] || newStage} stage successfully.`,
              variant: "default",
            });
            
            // Close modal after successful update
            setTimeout(() => {
              onClose();
            }, 500);
          } else {
            toast({
              title: "Error",
              description: "Failed to update pipeline stage. Please try again.",
              variant: "destructive",
            });
            setSelectedStage(customer.pipeline_stage || customer.status || "");
          }
        } else {
          // No pipeline entry found - create one with the new stage
          const createResponse = await apiService.createSalesPipeline({
            client_id: customer.id,
            title: `${formatCustomerName(customer)} - ${SALES_STAGE_LABELS[newStage as keyof typeof SALES_STAGE_LABELS] || newStage}`,
            stage: newStage,
            probability: 0,
            expected_value: 0,
            sales_representative: user.id,
          } as unknown as Parameters<typeof apiService.createSalesPipeline>[0]);
          
          if (createResponse.success) {
            // Dispatch event to refresh parent components immediately
            // Use setTimeout to ensure event is dispatched after state updates
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshCustomerDetails', { 
                detail: { customerId: customer.id, newStage: newStage } 
              }));
            }, 0);
            
            // Refresh customer details
            await fetchCustomerDetails();
            
            toast({
              title: "Success",
              description: `Customer moved to ${SALES_STAGE_LABELS[newStage as keyof typeof SALES_STAGE_LABELS] || newStage} stage successfully.`,
              variant: "default",
            });
            
            // Close modal after successful update
            setTimeout(() => {
              onClose();
            }, 500);
          } else {
            toast({
              title: "Error",
              description: "Failed to create pipeline entry. Please try again.",
              variant: "destructive",
            });
            setSelectedStage(customer.pipeline_stage || customer.status || "");
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pipeline data. Please try again.",
          variant: "destructive",
        });
        setSelectedStage(customer.pipeline_stage || customer.status || "");
      }
    } catch (e) {
      console.error('Error updating stage:', e);
      toast({
        title: "Error",
        description: "Failed to update stage. Please try again.",
        variant: "destructive",
      });
      setSelectedStage(customer.pipeline_stage || customer.status || "");
    } finally {
      setUpdatingStage(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={onClose}
        title="Customer Details"
        description="Loading customer information..."
        size={isMobile ? "full" : isTablet ? "lg" : "xl"}
        showCloseButton={true}
        className="bg-white"
      >
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
      </ResponsiveDialog>
    );
  }

  if (!customer) {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={onClose}
        title="Customer Details"
        description="Customer not found"
        size={isMobile ? "full" : isTablet ? "lg" : "xl"}
        showCloseButton={true}
        className="bg-white"
      >
          <div className="text-center py-8">
            <p className="text-gray-500">Customer information could not be loaded.</p>
          </div>
      </ResponsiveDialog>
    );
  }

  return (
    <>
    <ResponsiveDialog
      open={open}
      onOpenChange={onClose}
      title="Customer Details"
      description="View and manage customer information"
      size={isMobile ? "full" : isTablet ? "lg" : "xl"}
      showCloseButton={true}
      hideMobileNav={true}
      fullScreen={isMobile}
      className="bg-white"
      actions={
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              {customer.status === 'exhibition' && (
                <Button
                  variant="default"
                  size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      const response = await apiService.promoteExhibitionLead(customer.id.toString());
                      if (response.success) {
                        fetchCustomerDetails();
                        alert('Customer promoted to main customer database!');
                      }
                    } catch (error) {
                      alert('Failed to promote customer');
                    }
                  }}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
              Promote
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleBoughtClick}
            title="Mark as Bought"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Bought
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLostClick}
            title="Mark as Lost"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Lost
          </Button>
              {canDeleteCustomers && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
          <Button variant="outline" onClick={onClose}>
            Close
              </Button>
            </div>
      }
    >

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-4`}>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <div className="space-y-6">
              {/* Basic Customer Information */}
              <div className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'} mb-4`}>
                <div className={`font-semibold ${isMobile ? 'mb-2 text-base' : 'mb-3 text-lg'}`}>👤 Basic Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-gray-50 border">
                    <div className="text-xs text-gray-600">First Name</div>
                    <div className="text-sm font-medium text-gray-900 break-words">{customer.first_name || 'Not provided'}</div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border">
                    <div className="text-xs text-gray-600">Last Name</div>
                    <div className="text-sm font-medium text-gray-900 break-words">{customer.last_name || 'Not provided'}</div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border">
                    <div className="text-xs text-gray-600">Email</div>
                    <div className="text-sm font-medium text-gray-900 break-words">{customer.email || 'Not provided'}</div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border">
                    <div className="text-xs text-gray-600">Phone</div>
                    <div className="text-sm font-medium text-gray-900 break-words">{customer.phone || 'Not provided'}</div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border">
                    <div className="text-xs text-gray-600">Status</div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.pipeline_stage ? (
                        <Badge variant={getStatusBadgeVariant(customer.pipeline_stage)} className="capitalize">
                          {SALES_STAGE_LABELS[customer.pipeline_stage as keyof typeof SALES_STAGE_LABELS] || customer.pipeline_stage}
                        </Badge>
                      ) : customer.status ? (
                        <Badge variant={getStatusBadgeVariant(customer.status)} className="capitalize">
                          {customer.status}
                        </Badge>
                      ) : 'Not provided'}
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border">
                    <div className="text-xs text-gray-600">Customer Type</div>
                    <div className="text-sm font-medium text-gray-900">{customer.customer_type || 'individual'}</div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border rounded-lg p-4 mb-4">
                <div className="font-semibold mb-3 text-lg">📍 Address</div>
                <div className="space-y-2">
                  {customer.full_address && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                      <div className="text-xs text-blue-600 font-medium mb-1">Full Address</div>
                      <p className="text-gray-900 font-medium whitespace-pre-wrap">{customer.full_address}</p>
                    </div>
                  )}
                  {customer.address && (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 font-medium">{customer.address}</p>
                      <p className="text-gray-600 text-sm mt-1">{[customer.city, customer.state].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">City</div><div className="text-sm font-medium text-gray-900">{customer.city || 'Not provided'}</div></div>
                    <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">State</div><div className="text-sm font-medium text-gray-900">{customer.state || 'Not provided'}</div></div>
                    <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Country</div><div className="text-sm font-medium text-gray-900">{customer.country || 'India'}</div></div>
                    <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Pincode</div><div className="text-sm font-medium text-gray-900">{customer.pincode || 'Not provided'}</div></div>
                    <div className="p-3 rounded-md bg-gray-50 border md:col-span-2"><div className="text-xs text-gray-600">Catchment Area</div><div className="text-sm font-medium text-gray-900 break-words">{customer.catchment_area || 'Not provided'}</div></div>
                  </div>
                  {!customer.full_address && !customer.address && !customer.city && !customer.state && (
                    <div className="text-center py-4 text-gray-500">No address information available</div>
                  )}
                </div>
              </div>

              {/* Sales Information */}
              <div className="border rounded-lg p-4 mb-4">
                <div className="font-semibold mb-3 text-lg">💼 Sales Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* All Sales Reps from All Stores */}
                  <div className="p-3 rounded-md bg-gray-50 border md:col-span-2">
                    <div className="text-xs text-gray-600 mb-2">Sales Representatives</div>
                    {(() => {
                      // Get all unique sales reps from journey data (pipeline entries)
                      const salesRepsMap = new Map<string, { name: string; store: string }>();
                      
                      journeyData.forEach((item) => {
                        if (item.type === 'pipeline' && item.details?.sales_rep && item.details?.store) {
                          const key = `${item.details.sales_rep}_${item.details.store}`;
                          if (!salesRepsMap.has(key)) {
                            salesRepsMap.set(key, {
                              name: item.details.sales_rep,
                              store: item.details.store
                            });
                          }
                        }
                      });
                      
                      // Also include the current sales_person if available
                      if (customer.sales_person && customer.sales_person !== 'Not provided') {
                        const currentStore = customer.store_name || 'Current Store';
                        const key = `${customer.sales_person}_${currentStore}`;
                        if (!salesRepsMap.has(key)) {
                          salesRepsMap.set(key, {
                            name: customer.sales_person,
                            store: currentStore
                          });
                        }
                      }
                      
                      const salesReps = Array.from(salesRepsMap.values());
                      
                      if (salesReps.length === 0) {
                        return <div className="text-sm font-medium text-gray-900">{customer.sales_person || 'Not provided'}</div>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {salesReps.map((rep, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{rep.name}</span>
                                <span className="text-xs text-gray-500">({rep.store})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border md:col-span-2">
                    <div className="text-xs text-gray-600 mb-2">Move to Different Stage</div>
                    <Select
                      value={selectedStage}
                      onValueChange={handleStageChange}
                      disabled={updatingStage}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={updatingStage ? "Updating..." : "Select stage..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SALES_STAGE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {customer.pipeline_stage && (
                      <div className="text-xs text-gray-500 mt-2">
                        Current: <Badge variant={getStatusBadgeVariant(customer.pipeline_stage)} className="capitalize text-xs">
                          {SALES_STAGE_LABELS[customer.pipeline_stage as keyof typeof SALES_STAGE_LABELS] || customer.pipeline_stage}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-md bg-gray-50 border md:col-span-2"><div className="text-xs text-gray-600">Lead Source</div><div className="text-sm font-medium text-gray-900">{customer.lead_source || 'Not provided'}</div></div>
                </div>
              </div>

            {/* Visit Information */}
              <div className="border rounded-lg p-4 mb-4">
              <div className="font-semibold mb-3 text-lg">👥 Visit Information</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Reason for Visit</div><div className="text-sm font-medium text-gray-900 break-words">{customer.reason_for_visit || 'Not provided'}</div></div>
                <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Age of End User</div><div className="text-sm font-medium text-gray-900">{customer.age_of_end_user || 'Not provided'}</div></div>
                <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Saving Scheme</div><div className="text-sm font-medium text-gray-900">{customer.saving_scheme || 'Not provided'}</div></div>
              </div>
              </div>

              {/* Cross-Store Visits Information */}
              {journeyData.length > 0 && (
                <div className="border rounded-lg p-4 mb-4 bg-blue-50 border-blue-200">
                  <div className="font-semibold mb-3 text-lg">🏪 Store Visits & Sales Representatives</div>
                  <div className="space-y-2">
                    {(() => {
                      // Group activities by store
                      const storeGroups = new Map<string, Array<{store: string, sales_rep: string, date: string, type: string}>>();
                      
                      journeyData.forEach((item) => {
                        const store = item.details?.store || 'Unknown Store';
                        const salesRep = item.details?.sales_rep || item.details?.user || 'Unknown';
                        const date = item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date';
                        
                        if (!storeGroups.has(store)) {
                          storeGroups.set(store, []);
                        }
                        storeGroups.get(store)!.push({
                          store,
                          sales_rep: salesRep,
                          date,
                          type: item.type
                        });
                      });
                      
                      return Array.from(storeGroups.entries()).map(([store, activities]) => {
                        // Get unique sales reps for this store
                        const uniqueSalesReps = Array.from(new Set(activities.map(a => a.sales_rep))).filter(rep => rep !== 'Unknown');
                        const firstDate = activities[0]?.date || 'Unknown';
                        const lastDate = activities[activities.length - 1]?.date || 'Unknown';
                        
                        return (
                          <div key={store} className="p-3 bg-white rounded border border-blue-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-base">🏪 {store}</div>
                              <div className="text-xs text-gray-500">
                                {firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`}
                              </div>
                            </div>
                            {uniqueSalesReps.length > 0 && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Sales Reps: </span>
                                {uniqueSalesReps.join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Follow-up & Summary */}
            {(customer.next_follow_up || customer.summary_notes) && (
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Follow-up & Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.next_follow_up && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Next Follow-up Date</label>
                      <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-900">
                        {customer.next_follow_up ? new Date(customer.next_follow_up).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not scheduled'}
                      </div>
                    </div>
                  )}
                  {customer.summary_notes && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Summary Notes</label>
                      <div className="px-3 py-3 border rounded-md bg-gray-50 text-gray-900 whitespace-pre-wrap min-h-[80px]">
                        {stripImageTags(customer.summary_notes)}
                      </div>
                      {(() => {
                        const images = extractImagesFromNotes(customer.summary_notes);
                        if (!images.length) return null;
                        return (
                          <div className="mt-3">
                            <div className="text-sm text-gray-600 mb-2">Uploaded Images</div>
                            <div className="flex flex-wrap gap-3">
                              {images.map((image, index) => {
                                const src = image.thumb || image.url;
                                const fullSrc = image.url || image.thumb;
                                if (!src) return null;
                                return (
                                  <img
                                    key={`${image.url || image.thumb || index}`}
                                    src={src}
                                    alt={`Uploaded reference ${index + 1}`}
                                    className="w-40 max-w-full h-auto rounded shadow cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedImage(fullSrc || "")}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="interests" className="space-y-6 mt-0">
            <div className={cn("border rounded-lg mb-4", isMobile ? "p-3" : "p-4")}>
              <div className={cn("font-semibold mb-3", isMobile ? "text-base" : "text-lg")}>💎 Product Interest</div>
              <div className={cn(
                "space-y-4 overflow-y-auto",
                isMobile ? "max-h-[calc(100vh-350px)]" : "max-h-[60vh]"
              )}>
              {customer.customer_interests && customer.customer_interests.length > 0 ? (
                <div className="space-y-4">
                  {[...customer.customer_interests]
                    .sort((a, b) => {
                      // Sort by created_at date (oldest first)
                      let dateA: Date | null = null;
                      let dateB: Date | null = null;
                      
                      // Extract created_at from interest
                      const getCreatedAt = (interest: any): Date | null => {
                        let parsed = interest;
                        if (typeof interest === 'string') {
                          try {
                            parsed = JSON.parse(interest);
                          } catch {
                            return null;
                          }
                        }
                        if (parsed.created_at) {
                          return new Date(parsed.created_at);
                        }
                        return null;
                      };
                      
                      dateA = getCreatedAt(a);
                      dateB = getCreatedAt(b);
                      
                      // If both have dates, sort by date (oldest first)
                      if (dateA && dateB) {
                        return dateA.getTime() - dateB.getTime();
                      }
                      // If only one has a date, put it first
                      if (dateA && !dateB) return -1;
                      if (!dateA && dateB) return 1;
                      // If neither has a date, maintain original order
                      return 0;
                    })
                    .map((interest, index) => {
                    // Interest is now a structured object from the API
                    const interestData = interest;
                    let parsedInterest;
                    try {
                      if (typeof interest === 'string') {
                        parsedInterest = JSON.parse(interest);
                      } else {
                        parsedInterest = interest;
                      }
                    } catch (e) {

                      parsedInterest = interest;
                    }



                    // Handle both old and new interest formats
                    const category = parsedInterest.category || parsedInterest.mainCategory || 'Not specified';
                    const products = parsedInterest.products || [];
                    const preferences = parsedInterest.preferences || {};
                    const revenue = parsedInterest.revenue || '0';
                    const designNumber = parsedInterest.designNumber || '';
                    const images = parsedInterest.images || [];

                    // Handle new backend format (single product per interest)
                    const singleProduct = parsedInterest.product;
                    const hasSingleProduct = singleProduct && (singleProduct.name || singleProduct);

                    // Determine if we should show single product or products array
                    const shouldShowSingleProduct = hasSingleProduct && (!products || products.length === 0);
                    const displayProducts = shouldShowSingleProduct ? [{ product: singleProduct, revenue: revenue }] : products;

                    // Check purchase status
                    const isPurchased = parsedInterest.is_purchased || false;
                    const isNotPurchased = parsedInterest.is_not_purchased || false;

                    return (
                      <div key={index} className={`border rounded-lg p-3 mb-3 ${
                        isPurchased ? 'bg-green-50 border-green-200' :
                        isNotPurchased ? 'bg-red-50 border-red-200' :
                        'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-sm">Interest #{index + 1}</h5>
                            {parsedInterest.created_at && (
                              <span className="text-xs text-gray-500">
                                {new Date(parsedInterest.created_at).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </span>
                            )}
                            {parsedInterest.status && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                parsedInterest.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                                parsedInterest.status === 'closed_lost' ? 'bg-red-100 text-red-800' :
                                parsedInterest.status === 'negotiation' ? 'bg-yellow-100 text-yellow-800' :
                                parsedInterest.status === 'interested' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                 {parsedInterest.status === 'closed_won' ? 'Bought' :
                                  parsedInterest.status === 'closed_lost' ? 'Lost' :
                                  parsedInterest.status === 'negotiation' ? 'Negotiating' :
                                  parsedInterest.status === 'interested' ? 'Interested' : 'Unknown'}
                              </span>
                            )}
                            {isPurchased && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                ✓ Purchased
                              </span>
                            )}
                            {isNotPurchased && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                ✗ Not Purchased
                              </span>
                            )}
                          </div>
                          {!isPurchased && !isNotPurchased && parsedInterest.id && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 text-xs"
                                onClick={async () => {
                                  if (!customer?.id || !parsedInterest.id) return;
                                  setUpdatingInterest(parsedInterest.id.toString());
                                  try {
                                    const response = await apiService.markInterestPurchased(
                                      customer.id.toString(),
                                      parsedInterest.id.toString()
                                    );
                                    if (response && response.success) {
                                      apiService.forceRefresh(`/clients/clients/${customer.id}`);
                                      await new Promise(resolve => setTimeout(resolve, 150));
                                      const freshResponse = await apiService.getClient(customer.id.toString(), true);
                                      if (freshResponse.success && freshResponse.data) {
                                        setCustomer(freshResponse.data);
                                      }
                                      toast({
                                        title: "Success",
                                        description: "Interest marked as purchased",
                                        variant: "default",
                                      });
                                    } else {
                                      const errorMsg = response?.message || (response?.errors && Object.values(response.errors).flat().join(', ')) || "Failed to mark interest as purchased";
                                      toast({
                                        title: "Error",
                                        description: errorMsg,
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error: any) {
                                    console.error('Error marking interest as purchased:', error);
                                    toast({
                                      title: "Error",
                                      description: error?.message || "Failed to mark interest as purchased",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setUpdatingInterest(null);
                                  }
                                }}
                                disabled={updatingInterest === parsedInterest.id.toString()}
                              >
                                {updatingInterest === parsedInterest.id.toString() ? '...' : '✓'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-300 text-xs"
                                onClick={async () => {
                                  if (!customer?.id || !parsedInterest.id) return;
                                  setUpdatingInterest(parsedInterest.id.toString());
                                  try {
                                    const response = await apiService.markInterestNotPurchased(
                                      customer.id.toString(),
                                      parsedInterest.id.toString()
                                    );
                                    if (response && response.success) {
                                      apiService.forceRefresh(`/clients/clients/${customer.id}`);
                                      await new Promise(resolve => setTimeout(resolve, 150));
                                      const freshResponse = await apiService.getClient(customer.id.toString(), true);
                                      if (freshResponse.success && freshResponse.data) {
                                        setCustomer(freshResponse.data);
                                      }
                                      toast({
                                        title: "Success",
                                        description: "Interest marked as not purchased",
                                        variant: "default",
                                      });
                                    } else {
                                      const errorMsg = response?.message || (response?.errors && Object.values(response.errors).flat().join(', ')) || "Failed to mark interest as not purchased";
                                      toast({
                                        title: "Error",
                                        description: errorMsg,
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error: any) {
                                    console.error('Error marking interest as not purchased:', error);
                                    toast({
                                      title: "Error",
                                      description: error?.message || "Failed to mark interest as not purchased",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setUpdatingInterest(null);
                                  }
                                }}
                                disabled={updatingInterest === parsedInterest.id.toString()}
                              >
                                {updatingInterest === parsedInterest.id.toString() ? '...' : '✗'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Store Name - Show on interest card */}
                        {(() => {
                          // Get store from interest data (now included in serializer)
                          const storeName = parsedInterest.store || null;
                          
                          if (storeName) {
                            return (
                              <div className="mb-2">
                                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                                  <p className="text-xs text-blue-600 mb-0.5">Store</p>
                                  <p className="font-semibold text-sm text-blue-800">🏪 {storeName}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Compact Product Info */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-white rounded p-2 border">
                            <p className="text-xs text-gray-500 mb-0.5">Product</p>
                            <p className="font-semibold text-sm text-blue-800 break-words">
                              {typeof displayProducts[0]?.product === 'object' && displayProducts[0]?.product?.name
                                ? displayProducts[0].product.name
                                : typeof displayProducts[0]?.product === 'string'
                                  ? displayProducts[0].product
                                  : singleProduct?.name || 'N/A'}
                            </p>
                          </div>
                          <div className="bg-white rounded p-2 border">
                            <p className="text-xs text-gray-500 mb-0.5">Category</p>
                            <p className="font-semibold text-sm break-words">
                              {typeof category === 'object' && category?.name
                                ? category.name
                                : typeof category === 'string'
                                  ? category
                                  : 'Not specified'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-white rounded p-2 border">
                            <p className="text-xs text-gray-500 mb-0.5">Revenue</p>
                            <p className="font-semibold text-sm text-green-600">
                              ₹{typeof revenue === 'number' ? revenue.toLocaleString() : revenue}
                            </p>
                          </div>
                          {designNumber && (
                            <div className="bg-white rounded p-2 border">
                              <p className="text-xs text-gray-500 mb-0.5">Design Number</p>
                              <p className="font-semibold text-sm text-gray-900">{designNumber}</p>
                            </div>
                          )}
                        </div>

                        {/* Debug info for products */}
                        {(!displayProducts || displayProducts.length === 0) && (
                          <div className="text-sm text-gray-500 italic">
                            No products found in this interest. Debug: {JSON.stringify({
                              products,
                              productsLength: products?.length,
                              singleProduct,
                              hasSingleProduct,
                              shouldShowSingleProduct,
                              displayProducts
                            })}
                          </div>
                        )}

                        {/* Customer Preferences - Compact */}
                        {(preferences.designSelected || preferences.wantsDiscount || preferences.checkingOthers || 
                          preferences.lessVariety || preferences.purchased || preferences.other) && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Preferences</p>
                            <div className="flex flex-wrap gap-1.5">
                              {preferences.designSelected && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Design Selected</span>
                              )}
                              {preferences.wantsDiscount && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">Wants Discount</span>
                              )}
                              {preferences.checkingOthers && (
                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Checking Others</span>
                              )}
                              {preferences.lessVariety && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">Less Variety</span>
                              )}
                              {preferences.purchased && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Purchased</span>
                              )}
                              {preferences.other && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">Other: {preferences.other}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Design Number - Show if exists, otherwise show in grid above */}
                        {!designNumber && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-0.5">Design Number</p>
                            <p className="text-xs text-gray-400 italic">Not specified</p>
                          </div>
                        )}

                        {/* Images - Compact Grid */}
                        {images && images.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Product Images</p>
                            <div className="grid grid-cols-2 gap-2">
                              {images.map((img: any, imgIdx: number) => {
                                const imageUrl = img.thumbUrl || img.url || img.thumb || img;
                                const fullImageUrl = img.url || img.thumbUrl || img.thumb || img;
                                return (
                                  <div 
                                    key={imgIdx} 
                                    className="relative cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedImage(fullImageUrl)}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Product image ${imgIdx + 1}`}
                                      className="w-full h-24 object-cover rounded border"
                                    />
                                    {designNumber && (
                                      <div className="absolute bottom-0.5 left-0.5 bg-black bg-opacity-60 text-white text-[10px] px-1 rounded">
                                        {designNumber}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Fallback for old format */}
                        {!products && !preferences && (
                          <div className="text-sm text-gray-600">
                            {typeof interest === 'string' ? interest : 'Interest details'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No interests recorded</p>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="journey" className="space-y-6 mt-0">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4 text-lg">📅 Customer Journey</div>
              
              {journeyLoading ? (
                <div className="text-center py-8 text-gray-500">Loading journey...</div>
              ) : journeyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No journey data available</div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {journeyData.map((item, index) => {
                      const getIcon = () => {
                        switch (item.type) {
                          case 'interest':
                            return '💎';
                          case 'store_visit':
                            return '🏪';
                          case 'interaction':
                            return item.details?.interaction_type === 'call' ? '📞' :
                                   item.details?.interaction_type === 'email' ? '📧' :
                                   item.details?.interaction_type === 'visit' ? '🏪' :
                                   item.details?.interaction_type === 'whatsapp' ? '💬' : '📝';
                          case 'appointment':
                            return '📅';
                          case 'pipeline':
                            return '🚀';
                          case 'sale':
                            return '💰';
                          case 'followup':
                            return '⏰';
                          default:
                            return '📌';
                        }
                      };

                      const getColor = () => {
                        switch (item.type) {
                          case 'interest':
                            return 'bg-blue-100 text-blue-600';
                          case 'store_visit':
                            return 'bg-teal-100 text-teal-600';
                          case 'interaction':
                            return 'bg-green-100 text-green-600';
                          case 'appointment':
                            return 'bg-purple-100 text-purple-600';
                          case 'pipeline':
                            return 'bg-orange-100 text-orange-600';
                          case 'sale':
                            return 'bg-yellow-100 text-yellow-600';
                          case 'followup':
                            return 'bg-pink-100 text-pink-600';
                          default:
                            return 'bg-gray-100 text-gray-600';
                        }
                      };

                      return (
                        <div key={`${item.type}-${item.id}`} className="relative flex gap-4">
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-16 h-16 rounded-full ${getColor()} flex items-center justify-center text-xl flex-shrink-0`}>
                            {getIcon()}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 pb-6">
                            <div className="bg-white border rounded-lg p-4 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-base">{item.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                  {formatDateTime(item.date)}
                                </span>
                              </div>
                              
                              {/* Details based on type */}
                              <div className="mt-3 space-y-2 text-sm">
                                {item.type === 'interest' && (
                                  <>
                                    {item.details.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details.sales_rep && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Sales Rep:</span>
                                        <span className="text-gray-700">{item.details.sales_rep}</span>
                                      </div>
                                    )}
                                    {item.details.revenue > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Revenue:</span>
                                        <span className="text-gray-700">₹{item.details.revenue.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}
                                    {item.details.design_number && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Design Number:</span>
                                        <span className="text-gray-700">{item.details.design_number}</span>
                                      </div>
                                    )}
                                    {item.details.images && item.details.images.length > 0 && (
                                      <div className="mt-2">
                                        <div className="flex gap-2 flex-wrap">
                                          {item.details.images.map((img: any, imgIdx: number) => (
                                            <img
                                              key={imgIdx}
                                              src={img.thumbUrl || img.url || img.thumb || img}
                                              alt={`Product ${imgIdx + 1}`}
                                              className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                                              onClick={() => setSelectedImage(img.url || img.thumbUrl || img)}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {(item.details.is_purchased || item.details.is_not_purchased) && (
                                      <div className="mt-2">
                                        {item.details.is_purchased && (
                                          <Badge className="bg-green-100 text-green-800">✓ Purchased</Badge>
                                        )}
                                        {item.details.is_not_purchased && (
                                          <Badge className="bg-red-100 text-red-800">✗ Not Purchased</Badge>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}

                                {item.type === 'store_visit' && (
                                  <>
                                    {item.details?.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details?.attended_by && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Attended by:</span>
                                        <span className="text-gray-700">{item.details.attended_by}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {item.type === 'interaction' && (
                                  <>
                                    {item.details.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details.user && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">By:</span>
                                        <span className="text-gray-700">{item.details.user}</span>
                                      </div>
                                    )}
                                    {item.details.outcome && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Outcome:</span>
                                        <Badge className={
                                          item.details.outcome === 'positive' ? 'bg-green-100 text-green-800' :
                                          item.details.outcome === 'negative' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }>
                                          {item.details.outcome}
                                        </Badge>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {item.type === 'appointment' && (
                                  <>
                                    {item.details.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details.assigned_to && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Assigned to:</span>
                                        <span className="text-gray-700">{item.details.assigned_to}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Status:</span>
                                      <Badge className={
                                        item.details.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        item.details.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {item.details.status}
                                      </Badge>
                                    </div>
                                  </>
                                )}
                                
                                {item.type === 'pipeline' && (
                                  <>
                                    {item.details.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details.sales_rep && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Sales Rep:</span>
                                        <span className="text-gray-700">{item.details.sales_rep}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Stage:</span>
                                      <Badge>{item.details.stage}</Badge>
                                    </div>
                                    {item.details.expected_value > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Expected Value:</span>
                                        <span className="text-gray-700">₹{item.details.expected_value.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}
                                    {item.details.probability > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Probability:</span>
                                        <span className="text-gray-700">{item.details.probability}%</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {item.type === 'sale' && (
                                  <>
                                    {item.details.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details.sales_rep && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Sales Rep:</span>
                                        <span className="text-gray-700">{item.details.sales_rep}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Order:</span>
                                      <span className="text-gray-700">{item.details.order_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Amount:</span>
                                      <span className="text-gray-700 font-semibold">₹{item.details.total_amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Status:</span>
                                      <Badge className={
                                        item.details.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        item.details.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {item.details.status}
                                      </Badge>
                                    </div>
                                  </>
                                )}
                                
                                {item.type === 'followup' && (
                                  <>
                                    {item.details.store && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Store:</span>
                                        <span className="text-gray-700">🏪 {item.details.store}</span>
                                      </div>
                                    )}
                                    {item.details.assigned_to && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Assigned to:</span>
                                        <span className="text-gray-700">{item.details.assigned_to}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Status:</span>
                                      <Badge className={
                                        item.details.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        item.details.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }>
                                        {item.details.status}
                                      </Badge>
                                    </div>
                                    {item.details.priority && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Priority:</span>
                                        <Badge>{item.details.priority}</Badge>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 mt-0">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4 text-lg">📋 Audit Log</div>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                      <p className="text-xs text-gray-400">By: {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
    </ResponsiveDialog>

    {/* Bought Confirmation Dialog */}
    <Dialog open={showBoughtConfirm} onOpenChange={setShowBoughtConfirm}>
      <DialogContent className="z-[200] max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark as Bought</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this customer as Bought? This will update their status to "closed_won".
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={`flex-col-reverse gap-2 ${isMobile ? 'sm:flex-row' : 'sm:flex-row'} sm:justify-end`}>
          <Button variant="outline" onClick={() => setShowBoughtConfirm(false)} disabled={processing} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={markBought} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Lost Reason Dialog */}
    <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
      <DialogContent className="z-[200] max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
          <DialogDescription>
            Please provide a reason for no conversion. This will update the pipeline stage to "closed_lost" and save the reason in the customer notes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g., Wanted more variety/discount, bought from other store, etc. (Required)"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={isMobile ? 3 : 4}
            className="w-full text-sm sm:text-base"
            required
          />
          {lostReason.trim() === '' && (
            <p className="text-sm text-red-500 mt-2">Please provide a reason before marking as Lost.</p>
          )}
        </div>
        <DialogFooter className={`flex-col-reverse gap-2 ${isMobile ? 'sm:flex-row' : 'sm:flex-row'} sm:justify-end`}>
          <Button variant="outline" onClick={() => setShowLostDialog(false)} disabled={processing} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={markLost} 
            variant="destructive"
            disabled={processing || lostReason.trim() === ''}
            className="w-full sm:w-auto"
          >
            {processing ? 'Processing...' : 'Mark as Lost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Image Viewer Modal */}
    {selectedImage && (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]"
        onClick={() => setSelectedImage(null)}
      >
        <div
          className="relative max-w-5xl max-h-[90vh] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedImage(null)}
            className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/30 text-white"
          >
            <XIcon className="h-6 w-6" />
          </Button>
          <img
            src={selectedImage}
            alt="Enlarged product image"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </div>
    )}
  </>
  );
}
