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
import { useToast } from "@/hooks/use-toast";

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

export function CustomerDetailModal({ open, onClose, customerId, onEdit, onDelete }: CustomerDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [customer, setCustomer] = useState<Client | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Dialog states
  const [showBoughtConfirm, setShowBoughtConfirm] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [processing, setProcessing] = useState(false);

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
      const response = await apiService.getClient(customerId);

      if (response.success && response.data) {

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    if (!customer) return;
    setProcessing(true);
    try {
      const response = await apiService.updateClient(customer.id.toString(), { status: 'closed_won' });
      if (response.success) {
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
          description: "Failed to mark as Bought. Please try again.",
          variant: "destructive",
        });
      }
    } catch (e) {
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
    if (!customer) return;
    setProcessing(true);
    try {
      const response = await apiService.updateClient(customer.id.toString(), { 
        status: 'closed_lost', 
        summary_notes: lostReason || customer.summary_notes 
      });
      if (response.success) {
        await fetchCustomerDetails();
        setShowLostDialog(false);
        setLostReason("");
        toast({
          title: "Success",
          description: "Customer marked as Lost successfully.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to mark as Lost. Please try again.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to mark as Lost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
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
                      {customer.status ? (
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
                  {!customer.address && !customer.city && !customer.state && (
                    <div className="text-center py-4 text-gray-500">No address information available</div>
                  )}
                </div>
              </div>

              {/* Sales Information */}
              <div className="border rounded-lg p-4 mb-4">
                <div className="font-semibold mb-3 text-lg">💼 Sales Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Sales Person</div><div className="text-sm font-medium text-gray-900">{customer.sales_person || 'Not provided'}</div></div>
                  <div className="p-3 rounded-md bg-gray-50 border"><div className="text-xs text-gray-600">Customer Status</div><div className="text-sm font-medium text-gray-900">{customer.customer_status || 'Not provided'}</div></div>
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
                      <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-900 min-h-[80px]">
                        {customer.summary_notes}
                      </div>
                  </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="interests" className="space-y-6 mt-0">
            <div className="border rounded-lg p-4 mb-4">
              <div className="font-semibold mb-3 text-lg">💎 Product Interest</div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {customer.customer_interests && customer.customer_interests.length > 0 ? (
                <div className="space-y-4">
                  {customer.customer_interests.map((interest, index) => {
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

                    // Handle new backend format (single product per interest)
                    const singleProduct = parsedInterest.product;
                    const hasSingleProduct = singleProduct && (singleProduct.name || singleProduct);

                    // Determine if we should show single product or products array
                    const shouldShowSingleProduct = hasSingleProduct && (!products || products.length === 0);
                    const displayProducts = shouldShowSingleProduct ? [{ product: singleProduct, revenue: revenue }] : products;

                    return (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-lg">Interest #{index + 1}</h5>
                          {parsedInterest.status && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                              parsedInterest.status === 'closed_won' ? 'bg-green-100 text-green-800 border-green-200' :
                              parsedInterest.status === 'negotiation' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              parsedInterest.status === 'interested' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                               {parsedInterest.status === 'closed_won' ? 'Bought' :
                                parsedInterest.status === 'closed_lost' ? 'Lost' :
                                parsedInterest.status === 'negotiation' ? 'Under Negotiation' :
                                parsedInterest.status === 'interested' ? 'Interested' : 'Unknown'}
                            </span>
                          )}
                        </div>

                        {/* Product Summary - More Prominent Display */}
                        {displayProducts && displayProducts.length > 0 && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Product</p>
                                <p className="font-semibold text-blue-800 text-lg break-words">
                                  {typeof displayProducts[0]?.product === 'object' && displayProducts[0]?.product?.name
                                    ? displayProducts[0].product.name
                                    : typeof displayProducts[0]?.product === 'string'
                                      ? displayProducts[0].product
                                      : 'Product Name'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                                <p className="font-semibold text-green-600 text-lg">
                                  ₹{typeof revenue === 'number' ? revenue.toLocaleString() : revenue}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-sm text-gray-500 mb-1">Category</p>
                            <p className="font-medium text-lg break-words">
                              {typeof category === 'object' && category?.name
                                ? category.name
                                : typeof category === 'string'
                                  ? category
                                  : 'Not specified'}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-sm text-gray-500 mb-1">Revenue Opportunity</p>
                            <p className="font-medium text-green-600 text-lg">
                              ₹{typeof revenue === 'number' ? revenue.toLocaleString() : revenue}
                            </p>
                          </div>
                        </div>

                        {/* Products Section */}
                        {displayProducts && displayProducts.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Products</p>
                            <div className="space-y-2">
                              {displayProducts.map((product: any, pIndex: number) => {


                                return (
                                  <div key={pIndex} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {typeof product.product === 'object' && product.product?.name
                                          ? product.product.name
                                          : typeof product.product === 'string'
                                            ? product.product
                                            : 'Product'}
                                      </p>
                                    </div>
                                    {product.revenue && (
                                      <div className="text-sm text-green-600">
                                        ₹{typeof product.revenue === 'number' ? product.revenue.toLocaleString() : product.revenue}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

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

                        {/* Customer Preferences */}
                        <div className="mt-4 p-3 bg-white rounded-lg border">
                          <p className="text-sm text-gray-500 mb-2">Customer Preferences</p>
                          <div className="space-y-2">
                            {preferences.designSelected && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-green-700 font-medium">Design Selected</span>
                              </div>
                            )}
                            {preferences.wantsDiscount && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-yellow-700 font-medium">Wants Discount</span>
                              </div>
                            )}
                            {preferences.checkingOthers && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span className="text-sm text-orange-700 font-medium">Checking Others</span>
                              </div>
                            )}
                            {preferences.lessVariety && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-red-700 font-medium">Less Variety</span>
                              </div>
                            )}
                            {preferences.purchased && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-blue-700 font-medium">Purchased</span>
                              </div>
                            )}
                            {preferences.other && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                <span className="text-sm text-gray-700 font-medium">Other: {preferences.other}</span>
                              </div>
                            )}
                            {!preferences.designSelected && !preferences.wantsDiscount && !preferences.checkingOthers && !preferences.lessVariety && !preferences.purchased && !preferences.other && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                <span className="text-sm text-gray-500">No specific preferences</span>
                              </div>
                            )}
                          </div>
                        </div>

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Bought</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this customer as Bought? This will update their status to "closed_won".
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBoughtConfirm(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={markBought} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Lost Reason Dialog */}
    <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
          <DialogDescription>
            Please provide a reason for no conversion. This will update the customer status to "closed_lost".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g., Wanted more variety/discount, bought from other store, etc."
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={4}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLostDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={markLost} 
            variant="destructive"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Mark as Lost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
