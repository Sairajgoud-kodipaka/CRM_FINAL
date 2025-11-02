"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, Client } from "@/lib/api-service";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Calendar, Phone, Mail, MapPin, User, Clock, Edit, Trash2, X as XIcon, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";

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
  const [customer, setCustomer] = useState<Client | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

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
    if (customer && onDelete && window.confirm(`Are you sure you want to delete ${customer.first_name} ${customer.last_name}? This action cannot be undone.`)) {
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
  const markBought = async () => {
    if (!customer) return;
    try {
      const response = await apiService.updateClient(customer.id.toString(), { status: 'closed_won' });
      if (response.success) {
        await fetchCustomerDetails();
        alert('Marked as Bought successfully.');
      }
    } catch (e) {
      alert('Failed to mark as Bought');
    }
  };

  const markLost = async () => {
    if (!customer) return;
    const reason = window.prompt('Reason for no conversion? e.g., Wanted more variety/discount, bought from other store, etc.');
    try {
      const response = await apiService.updateClient(customer.id.toString(), { status: 'closed_lost', summary_notes: reason || customer.summary_notes });
      if (response.success) {
        // Optionally log a follow-up note via announcements/tasks if needed later
        await fetchCustomerDetails();
        alert('Marked as Lost successfully.');
      }
    } catch (e) {
      alert('Failed to mark as Lost');
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto mx-4 px-2">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Loading customer information...</DialogDescription>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!customer) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto mx-4 px-2">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Customer not found</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Customer information could not be loaded.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto mx-4 px-2"
        showCloseButton={false}
      >
        <DialogHeader className="text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View and manage customer information
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {customer.status === 'exhibition' && (
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      const response = await apiService.promoteExhibitionLead(customer.id.toString());

                      if (response.success) {
                        // Refresh customer details
                        fetchCustomerDetails();
                        // Show success message
                        alert('Customer promoted to main customer database!');
                      }
                    } catch (error) {

                      alert('Failed to promote customer');
                    }
                  }}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Promote to Main Customer
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                onClick={() => onEdit(customer)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {/* Bought / Lost quick actions */}
              <Button
                variant="default"
                size="sm"
                className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={markBought}
                  title="Mark as Bought"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Bought
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                onClick={markLost}
                title="Mark as Lost"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Lost
              </Button>
              {canDeleteCustomers && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-2 ml-2"
                onClick={onClose}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
            <TabsTrigger value="interests" className="text-xs sm:text-sm">Interests</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 md:space-y-8">
            {/* Basic Information */}
            <Card className="p-4 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-2xl font-semibold truncate">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 flex-wrap">
                      <Badge variant={getStatusBadgeVariant(customer.status || '')} className="capitalize text-xs sm:text-sm">
                        {customer.status || 'unknown'}
                      </Badge>
                      <span className="text-xs sm:text-sm text-gray-500">ID: {customer.id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-500">Customer Type</p>
                  <p className="font-medium text-sm sm:text-base">{customer.customer_type || 'Individual'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
                <div className="space-y-4 md:space-y-8">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{customer.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-sm sm:text-base break-all">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Created By</p>
                      <p className="font-medium text-sm sm:text-base break-all">
                        {customer.created_by ?
                          `${customer.created_by.first_name || ''} ${customer.created_by.last_name || ''}`.trim() || customer.created_by.username || 'Unknown User'
                          : 'System'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-8">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Address</p>
                      <p className="font-medium text-sm sm:text-base break-words">
                        {customer.address ? `${customer.address}, ${customer.city || ''}, ${customer.state || ''}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Catchment Area</p>
                      <p className="font-medium text-sm sm:text-base break-words">{customer.catchment_area || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-8">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Created At</p>
                      <p className="font-medium text-sm sm:text-base">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Not available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="font-medium text-sm sm:text-base">
                        {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'Not available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Customer Type</p>
                      <p className="font-medium text-sm sm:text-base">{customer.customer_type || 'Individual'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">City</p>
                      <p className="font-medium text-sm sm:text-base break-words">{customer.city || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Visit Information */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Visit Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Reason for Visit</p>
                  <p className="font-medium">{customer.reason_for_visit || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lead Source</p>
                  <p className="font-medium">{customer.lead_source || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age of End User</p>
                  <p className="font-medium">{customer.age_of_end_user || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saving Scheme</p>
                  <p className="font-medium">{customer.saving_scheme || 'Not specified'}</p>
                </div>
              </div>
            </Card>

            {/* Summary Notes */}
            {customer.summary_notes && (
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Summary Notes</h4>
                <p className="text-gray-700">{customer.summary_notes}</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="interests" className="space-y-4 md:space-y-6">
            <Card className="p-6 max-h-[60vh] overflow-y-auto">
              <h4 className="font-semibold mb-4">Customer Interests</h4>
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
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4 md:space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Audit Log</h4>
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
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
