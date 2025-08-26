"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, Client } from "@/lib/api-service";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Phone, Mail, MapPin, User, Clock, Edit, Trash2, X as XIcon, ArrowUpRight } from "lucide-react";

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  onEdit: (customer: Client) => void;
  onDelete: (customerId: string) => void;
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

  // Check if user can delete customers (managers and higher roles)
  const canDeleteCustomers = user?.role && ['platform_admin', 'business_admin', 'manager'].includes(user.role);

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails();
    }
  }, [open, customerId]);

  // Listen for refresh events from parent components
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      if (event.detail?.customerId === customerId) {
        console.log('🔄 Refreshing customer details due to update event');
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
    
    console.log('🔍 Fetching customer details for ID:', customerId);
    
    try {
      setLoading(true);
      const response = await apiService.getClient(customerId);
      
      if (response.success && response.data) {
        console.log('✅ Customer data fetched successfully:', response.data);
        console.log('📊 Customer interests count:', response.data.customer_interests?.length || 0);
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
          console.error('Error fetching audit logs:', auditError);
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
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (customer && window.confirm(`Are you sure you want to delete ${customer.first_name} ${customer.last_name}? This action cannot be undone.`)) {
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

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View and manage customer information
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {customer.status === 'exhibition' && (
                <Button 
                  variant="default" 
                  size="sm" 
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
                      console.error('Error promoting customer:', error);
                      alert('Failed to promote customer');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Promote to Main Customer
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
                variant="outline" 
                size="sm" 
                onClick={fetchCustomerDetails}
                disabled={loading}
              >
                <Clock className="w-4 h-4 mr-2" />
                {loading ? 'Refreshing...' : 'Refresh'}
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="ml-2"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(customer.status || '')} className="capitalize">
                      {customer.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  ID: {customer.id}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{customer.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {customer.date_of_birth ? formatDate(customer.date_of_birth) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Anniversary</p>
                      <p className="font-medium">
                        {customer.anniversary_date ? formatDate(customer.anniversary_date) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium">
                        {customer.created_by ? 
                          `${customer.created_by.first_name || ''} ${customer.created_by.last_name || ''}`.trim() || customer.created_by.username || 'Unknown User'
                          : 'System'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">
                        {customer.address ? `${customer.address}, ${customer.city || ''}, ${customer.state || ''}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Community</p>
                    <p className="font-medium">{customer.community || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother Tongue</p>
                    <p className="font-medium">{customer.mother_tongue || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catchment Area</p>
                    <p className="font-medium">{customer.catchment_area || 'Not specified'}</p>
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

          <TabsContent value="interests" className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Customer Interests</h4>
              {(() => {
                // Debug logging
                console.log('🔍 Customer interests debug:', {
                  hasInterests: !!customer.customer_interests,
                  interestsLength: customer.customer_interests?.length,
                  interests: customer.customer_interests,
                  customerId: customer.id
                });
                
                return customer.customer_interests && customer.customer_interests.length > 0 ? (
                <div className="space-y-4">
                    {customer.customer_interests.map((interest, index) => {
                      // Parse the interest if it's a JSON string
                      let parsedInterest;
                      try {
                        if (typeof interest === 'string') {
                          parsedInterest = JSON.parse(interest);
                        } else {
                          parsedInterest = interest;
                        }
                      } catch (e) {
                        console.error('Error parsing interest:', e);
                        parsedInterest = interest;
                      }

                      console.log(`🔍 Interest ${index + 1}:`, {
                        original: interest,
                        parsed: parsedInterest,
                        category: parsedInterest.category || parsedInterest.mainCategory,
                        products: parsedInterest.products,
                        preferences: parsedInterest.preferences
                      });

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
                    <div key={index} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Interest #{index + 1}</h5>
                          
                          {/* Product Summary - More Prominent Display */}
                          {displayProducts && displayProducts.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Product</p>
                                  <p className="font-semibold text-blue-800">
                                    {typeof displayProducts[0]?.product === 'object' && displayProducts[0]?.product?.name 
                                      ? displayProducts[0].product.name 
                                      : typeof displayProducts[0]?.product === 'string' 
                                        ? displayProducts[0].product 
                                        : 'Product Name'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Revenue</p>
                                  <p className="font-semibold text-green-600">
                                    ₹{typeof revenue === 'number' ? revenue.toLocaleString() : revenue}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium">
                                  {typeof category === 'object' && category?.name 
                                    ? category.name 
                                    : typeof category === 'string' 
                                      ? category 
                                      : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Revenue Opportunity</p>
                          <p className="font-medium text-green-600">
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
                                    console.log(`🔍 Product ${pIndex + 1}:`, {
                                      product,
                                      productType: typeof product.product,
                                      productName: product.product?.name || product.product,
                                      revenue: product.revenue
                                    });
                                    
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

                            {/* Preferences Section */}
                            {preferences && Object.keys(preferences).length > 0 && (
                          <div>
                                <p className="text-sm text-gray-500 mb-2">Preferences</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {preferences.designSelected && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✅ Design Selected
                                    </span>
                                  )}
                                  {preferences.wantsDiscount && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      💰 Wants Discount
                                    </span>
                                  )}
                                  {preferences.checkingOthers && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      🔍 Checking Others
                                    </span>
                                  )}
                                  {preferences.lessVariety && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      ⚠️ Less Variety
                                    </span>
                                  )}
                                  {preferences.other && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      📝 {preferences.other}
                                    </span>
                                  )}
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
                    </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500">No interests recorded</p>
                );
              })()}
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
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