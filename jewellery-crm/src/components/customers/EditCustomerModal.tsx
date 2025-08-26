"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiService, Client } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

interface EditCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer: Client | null;
  onCustomerUpdated: () => void;
}

interface ProductInterest {
  mainCategory: string;
  products: { product: string; revenue: string }[];
  preferences: {
    designSelected: boolean;
    wantsDiscount: boolean;
    checkingOthers: boolean;
    lessVariety: boolean;
    other: string;
  };
}

export function EditCustomerModal({ open, onClose, customer, onCustomerUpdated }: EditCustomerModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    date_of_birth: "",
    anniversary_date: "",
    community: "",
    mother_tongue: "",
    reason_for_visit: "",
    lead_source: "",
    age_of_end_user: "",
    saving_scheme: "",
    catchment_area: "",
    next_follow_up: "",
    summary_notes: "",
    status: "",
  });

  const [interests, setInterests] = useState<ProductInterest[]>([
    {
      mainCategory: "",
      products: [{ product: "", revenue: "" }],
      preferences: {
        designSelected: false,
        wantsDiscount: false,
        checkingOthers: false,
        lessVariety: false,
        other: "",
      },
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // State for sales pipeline
  const [showPipelineSection, setShowPipelineSection] = useState(false);
  const [pipelineOpportunities, setPipelineOpportunities] = useState<any[]>([]);
  const [showDesignSelectedNotification, setShowDesignSelectedNotification] = useState(false);
  const [pipelineCreated, setPipelineCreated] = useState(false); // Track if pipeline was already created

  useEffect(() => {
    if (customer && open) {
      // Reset pipeline creation flag for new customer
      setPipelineCreated(false);
      
             // Format dates properly for input fields - extract only the date part
       const formatDateForInput = (dateString: string | null | undefined) => {
         if (!dateString) return "";
         try {
           // If the date string contains time (like "4 October 2004 at 05:30 am"), extract just the date
           if (dateString.includes(' at ')) {
             // Extract the date part before " at "
             const datePart = dateString.split(' at ')[0];
             const date = new Date(datePart);
             if (isNaN(date.getTime())) return "";
             return date.toISOString().split('T')[0];
           } else {
             // Regular date string, parse normally
             const date = new Date(dateString);
             if (isNaN(date.getTime())) return "";
             return date.toISOString().split('T')[0];
           }
         } catch {
           return "";
         }
       };

      setFormData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "India",
        date_of_birth: formatDateForInput(customer.date_of_birth),
        anniversary_date: formatDateForInput(customer.anniversary_date),
        community: customer.community || "",
        mother_tongue: customer.mother_tongue || "",
        reason_for_visit: customer.reason_for_visit || "",
        lead_source: customer.lead_source || "",
        age_of_end_user: customer.age_of_end_user || "",
        saving_scheme: customer.saving_scheme || "",
        catchment_area: customer.catchment_area || "",
        next_follow_up: formatDateForInput(customer.next_follow_up),
        summary_notes: customer.summary_notes || "",
        status: customer.status || "",
      });

      // Parse customer interests if they exist
      if (customer.customer_interests && Array.isArray(customer.customer_interests)) {
        try {
          const parsedInterests = customer.customer_interests.map((interest: any) => {
            let parsedInterest;
            if (typeof interest === 'string') {
              parsedInterest = JSON.parse(interest);
            } else {
              parsedInterest = interest;
            }
            
            // Ensure the parsed interest has the complete structure
            return {
              mainCategory: parsedInterest.mainCategory || parsedInterest.category || "",
              products: Array.isArray(parsedInterest.products) ? parsedInterest.products : [{ product: "", revenue: "" }],
              preferences: {
                designSelected: parsedInterest.preferences?.designSelected || false,
                wantsDiscount: parsedInterest.preferences?.wantsDiscount || false,
                checkingOthers: parsedInterest.preferences?.checkingOthers || false,
                lessVariety: parsedInterest.preferences?.lessVariety || false,
                other: parsedInterest.preferences?.other || "",
              },
            };
          });
          setInterests(parsedInterests);
        } catch (e) {
          console.log('Could not parse customer interests, using default');
          // Set default interests structure
          setInterests([{
            mainCategory: "",
            products: [{ product: "", revenue: "" }],
            preferences: {
              designSelected: false,
              wantsDiscount: false,
              checkingOthers: false,
              lessVariety: false,
              other: "",
            },
          }]);
        }
      } else {
        // Set default interests structure if no interests exist
        setInterests([{
          mainCategory: "",
          products: [{ product: "", revenue: "" }],
          preferences: {
            designSelected: false,
            wantsDiscount: false,
            checkingOthers: false,
            lessVariety: false,
            other: "",
          },
        }]);
      }

      // Fetch categories and products
      fetchCategoriesAndProducts();
    }
  }, [customer, open]);

  const fetchCategoriesAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        const categoriesData = Array.isArray(categoriesResponse.data) 
          ? categoriesResponse.data 
          : (categoriesResponse.data as any).results || (categoriesResponse.data as any).data || [];
        setCategories(categoriesData);
      }
      
      // Fetch products
      const productsResponse = await apiService.getProducts();
      if (productsResponse.success && productsResponse.data) {
        const productsData = Array.isArray(productsResponse.data) 
          ? productsResponse.data 
          : (productsResponse.data as any).results || (productsResponse.data as any).data || [];
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInterest = () => {
    console.log('➕ Adding new interest...');
    const newInterest = {
        mainCategory: "",
        products: [{ product: "", revenue: "" }],
        preferences: {
          designSelected: false,
          wantsDiscount: false,
          checkingOthers: false,
          lessVariety: false,
          other: "",
        },
    };
    console.log('🆕 New interest structure:', newInterest);
    setInterests(prev => {
      const newInterests = [...prev, newInterest];
      console.log('📊 Updated interests array:', newInterests);
      return newInterests;
    });
  };

  const addProductToInterest = (idx: number) => {
    console.log(`➕ Adding product to interest ${idx}`);
    setInterests((prev) => {
      const copy = [...prev];
      const newProduct = { product: "", revenue: "" };
      copy[idx].products.push(newProduct);
      console.log(`   Interest ${idx} now has ${copy[idx].products.length} products:`, copy[idx].products);
      return copy;
    });
  };

  const removeProductFromInterest = (interestIdx: number, productIdx: number) => {
    setInterests((prev) => {
      const copy = [...prev];
      copy[interestIdx].products.splice(productIdx, 1);
      return copy;
    });
  };

  const createPipelineOpportunities = async (customerId: number) => {
    try {
      console.log('🚀 Creating pipeline opportunities...');
      console.log('Number of opportunities to create:', pipelineOpportunities.length);
      console.log('Opportunities:', pipelineOpportunities);
      
      // Since we now have only ONE consolidated opportunity, just create that single entry
      if (pipelineOpportunities.length === 1) {
        const opportunity = pipelineOpportunities[0];
        const pipelineData = {
          title: opportunity.title,
          client_id: customerId,
          sales_representative: { id: 1, username: 'current_user', full_name: 'Current User' },
          stage: opportunity.stage,
          probability: opportunity.probability,
          expected_value: opportunity.expected_value,
          notes: opportunity.notes,
          next_action: opportunity.next_action,
          next_action_date: opportunity.next_action_date
        };
        
        console.log('🎯 Creating consolidated pipeline with data:', pipelineData);
        const response = await apiService.createSalesPipeline(pipelineData);
        if (response.success) {
          console.log('✅ Consolidated pipeline opportunity created:', response.data);
        } else {
          console.error('❌ Failed to create consolidated pipeline opportunity:', response);
          console.error('Response details:', response);
        }
      } else {
        console.warn('⚠️ Expected exactly 1 consolidated opportunity, but found:', pipelineOpportunities.length);
        console.warn('This should not happen with the new consolidated approach!');
      }
    } catch (error) {
      console.error('💥 Error creating consolidated pipeline opportunity:', error);
    }
  };

  const generatePipelineOpportunities = () => {
    // Prevent regeneration if pipeline is already created
    if (pipelineCreated) {
      console.log('✅ Pipeline already created, skipping regeneration');
      return;
    }
    
    console.log('🔄 Generating pipeline opportunities...');
    console.log('Current interests:', interests);
    
    // Consolidate all interests into one pipeline opportunity per customer
    const allInterests = interests.filter(interest => 
      interest.mainCategory && interest.products.length > 0
    );
    
    console.log('Filtered interests:', allInterests);
    
    if (allInterests.length === 0) {
      console.log('No valid interests found, clearing opportunities');
      setPipelineOpportunities([]);
      setShowPipelineSection(false);
      return;
    }
    
    // Calculate total revenue across all interests
    const totalRevenue = allInterests.reduce((sum, interest) => {
      const interestRevenue = interest.products.reduce((productSum, product) => {
        return productSum + (parseFloat(product.revenue) || 0);
      }, 0);
      return sum + interestRevenue;
    }, 0);
    
    // Determine overall stage and probability based on all interests
    const hasDesignSelected = allInterests.some(interest => interest.preferences?.designSelected);
    // Default to store_walkin for customers from store, not exhibition
    const stage = hasDesignSelected ? 'closed_won' : 'store_walkin';
    const probability = hasDesignSelected ? 100 : 50;
    
    // Create consolidated notes with all interests
    const interestDetails = allInterests.map(interest => {
      const categoryName = categories.find(cat => 
        cat.id?.toString() === interest.mainCategory || cat.name === interest.mainCategory
      )?.name || `Category ${interest.mainCategory}`;
      
      const products = interest.products.map(p => p.product).join(', ');
      const designStatus = interest.preferences?.designSelected ? ' - Design Selected!' : '';
      
      return `${categoryName}: ${products}${designStatus}`;
    }).join('\n');
    
    // Create single consolidated opportunity
    const consolidatedOpportunity = {
      title: `${customer?.first_name || 'Customer'} - Complete Opportunity`,
      probability: probability,
      expected_value: totalRevenue,
      stage: stage,
      notes: `Consolidated customer interests:\n${interestDetails}`,
      next_action: hasDesignSelected ? 'Process complete order' : 'Follow up with customer on all interests',
      next_action_date: formData.next_follow_up || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    console.log('🎯 Created consolidated opportunity:', consolidatedOpportunity);
    console.log('Setting pipeline opportunities to:', [consolidatedOpportunity]);
    
    setPipelineOpportunities([consolidatedOpportunity]);
    setShowPipelineSection(true);
  };

  // Watch for design selection changes and update pipeline opportunities
  useEffect(() => {
    // Only run when modal is open and customer is loaded
    if (!open || !customer) {
      return;
    }
    
    if (showPipelineSection && pipelineOpportunities.length > 0) {
      // Only regenerate if we don't already have a consolidated opportunity
      if (pipelineOpportunities.length !== 1) {
        generatePipelineOpportunities();
      }
    }
  }, [interests, open, customer]);

  // Prevent pipeline regeneration if already created
  useEffect(() => {
    // Only run when modal is open and customer is loaded
    if (!open || !customer) {
      return;
    }
    
    if (pipelineCreated && pipelineOpportunities.length === 1) {
      console.log('✅ Pipeline already created, preventing regeneration');
      return;
    }
    
    // Only generate if we have valid interests and haven't created pipeline yet
    if (interests.some(interest => interest.mainCategory && interest.products.length > 0) && !pipelineCreated) {
      generatePipelineOpportunities();
    }
  }, [interests, pipelineCreated, open, customer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!customer) return;

    console.log('🚀 Starting customer update process...');
    console.log('📊 Current interests state:', interests);

    // Validate required fields
    if (!formData.first_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the customer's first name.",
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

    try {
      setSaving(true);
      
      // Validate interests before submission - only if user has added interests
      console.log('🔍 Validating interests before submission...');
      const hasInterests = interests.length > 0;
      const hasInterestData = interests.some(interest => 
        interest.mainCategory || 
        (interest.products && interest.products.length > 0)
      );
      
      console.log(`   Has interests array: ${hasInterests}, Has interest data: ${hasInterestData}`);
      
      // Only validate interests if user has actually added some interest data
      let customerInterestsInput: string[] = [];
      
      if (hasInterestData) {
        const validInterests = interests.filter(interest => {
          const hasCategory = interest.mainCategory && 
            (typeof interest.mainCategory === 'string' ? interest.mainCategory.trim() : String(interest.mainCategory));
          const hasValidProducts = interest.products.some(p => {
            const hasProduct = p.product && (typeof p.product === 'string' ? p.product.trim() : String(p.product));
            const hasRevenue = p.revenue && (typeof p.revenue === 'string' ? p.revenue.trim() : String(p.revenue));
            return hasProduct && hasRevenue;
          });
          
          console.log(`   Interest validation:`, {
            mainCategory: interest.mainCategory,
            hasCategory,
            productsCount: interest.products.length,
            hasValidProducts,
            products: interest.products
          });
          
          return hasCategory && hasValidProducts;
        });
        
        console.log(`✅ Valid interests found: ${validInterests.length}/${interests.length}`);
        
        if (validInterests.length === 0) {
          toast({
            title: "Validation Error",
            description: "Please add at least one valid interest with category, product, and revenue, or remove all interests.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        
        // Use valid interests for API
        customerInterestsInput = validInterests.map(interest => {
          console.log(`🔄 Processing validated interest for API:`, interest);
          
          // Only include products that have both name and revenue
          const validProducts = interest.products.filter(p => {
            const hasProduct = p.product && (typeof p.product === 'string' ? p.product.trim() : String(p.product));
            const hasRevenue = p.revenue && (typeof p.revenue === 'string' ? p.revenue.trim() : String(p.revenue));
            console.log(`   Product validation:`, {
              product: p.product,
              revenue: p.revenue,
              hasProduct,
              hasRevenue
            });
            return hasProduct && hasRevenue;
          });
          
          console.log(`   Valid products found:`, validProducts.length);
          
          const interestData = {
            category: interest.mainCategory,
            products: validProducts,
            preferences: interest.preferences
          };
          
          console.log(`   ✅ Creating interest data:`, interestData);
          return JSON.stringify(interestData);
        });
      } else {
        // No interest data provided, send empty array
        console.log(`📝 No interest data provided, sending empty interests array`);
        customerInterestsInput = [];
      }
      
      // Prepare data for API - convert empty date strings to undefined
      const customerData = {
        ...formData,
        // Convert empty date strings to undefined for backend validation
        date_of_birth: formData.date_of_birth?.trim() || undefined,
        anniversary_date: formData.anniversary_date?.trim() || undefined,
        next_follow_up: formData.next_follow_up?.trim() || undefined,
        customer_interests_input: customerInterestsInput
      };

      console.log('📤 Final customer data to send:', customerData);
      console.log('📊 customer_interests_input count:', customerData.customer_interests_input.length);
      
      const response = await apiService.updateClient(customer.id.toString(), customerData);
      
      console.log('📥 Backend response received:', response);
      
      if (response.success) {
        console.log('✅ Customer updated successfully:', response.data);
        console.log('📊 Response data details:', {
          id: response.data?.id,
          first_name: response.data?.first_name,
          customer_interests: response.data?.customer_interests,
          interests_count: response.data?.customer_interests?.length
        });
        
        // Create sales pipeline opportunities if customer is interested (only once)
        if (showPipelineSection && pipelineOpportunities.length > 0 && !pipelineCreated) {
          console.log('🔄 Creating pipeline opportunities for customer:', customer.id);
          await createPipelineOpportunities(customer.id);
          setPipelineCreated(true); // Mark as created to prevent duplicates
          toast({
            title: "Success!",
            description: `Customer updated successfully! 1 consolidated sales pipeline opportunity has been created.`,
            variant: "success",
          });
        } else if (pipelineCreated) {
          console.log('✅ Pipeline already created for this customer, skipping...');
        } else {
        toast({
          title: "Success!",
          description: "Customer updated successfully!",
          variant: "success",
        });
        }
        
        // Check if follow-up date was provided and show appropriate message
        if (formData.next_follow_up) {
          toast({
            title: "Success!",
            description: `Customer updated successfully! A follow-up appointment has been scheduled for ${formData.next_follow_up}.`,
            variant: "success",
          });
        }
        
        onCustomerUpdated();
        onClose();
      } else {
        console.error('Failed to update customer:', response);
        toast({
          title: "Error",
          description: "Failed to update customer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error during customer update:', error);
              toast({
          title: "Error",
        description: "Failed to update customer. Please try again.",
          variant: "destructive",
        });
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer information and details. Only First Name and Phone are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Basic Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <Input 
                  placeholder="First name" 
                  required 
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input 
                  placeholder="Last name" 
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  type="email"
                  placeholder="email@example.com" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <Input 
                  placeholder="+91 98XXXXXX00" 
                  required 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Address</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <Input 
                  placeholder="e.g., 123, Diamond Lane" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input 
                  placeholder="e.g., Mumbai" 
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MH">Maharashtra</SelectItem>
                    <SelectItem value="TG">Telangana</SelectItem>
                    <SelectItem value="KA">Karnataka</SelectItem>
                    <SelectItem value="AP">Andhra Pradesh</SelectItem>
                    <SelectItem value="DL">Delhi</SelectItem>
                    <SelectItem value="GJ">Gujarat</SelectItem>
                    <SelectItem value="RJ">Rajasthan</SelectItem>
                    <SelectItem value="TN">Tamil Nadu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Input value="India" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catchment Area</label>
                <Input 
                  placeholder="e.g., South Mumbai, Bandra West" 
                  value={formData.catchment_area}
                  onChange={(e) => handleInputChange('catchment_area', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Personal Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <Input 
                  type="date" 
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Anniversary Date</label>
                <Input 
                  type="date" 
                  value={formData.anniversary_date}
                  onChange={(e) => handleInputChange('anniversary_date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Community</label>
                <Select value={formData.community} onValueChange={(value) => handleInputChange('community', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hindu">Hindu</SelectItem>
                    <SelectItem value="muslim">Muslim</SelectItem>
                    <SelectItem value="sikh">Sikh</SelectItem>
                    <SelectItem value="christian">Christian</SelectItem>
                    <SelectItem value="jain">Jain</SelectItem>
                    <SelectItem value="buddhist">Buddhist</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mother Tongue</label>
                <Input 
                  placeholder="e.g., Gujarati, Marwari Jain" 
                  value={formData.mother_tongue}
                  onChange={(e) => handleInputChange('mother_tongue', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Visit Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Visit</label>
                <Select value={formData.reason_for_visit} onValueChange={(value) => handleInputChange('reason_for_visit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lead Source</label>
                <Select value={formData.lead_source} onValueChange={(value) => handleInputChange('lead_source', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkin">Walk-in</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age of End User</label>
                <Select value={formData.age_of_end_user} onValueChange={(value) => handleInputChange('age_of_end_user', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Age Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36-50">36-50</SelectItem>
                    <SelectItem value="51-65">51-65</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Saving Scheme</label>
                <Select value={formData.saving_scheme} onValueChange={(value) => handleInputChange('saving_scheme', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Customer Interests */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Product Interests</div>
              <Button variant="outline" size="sm" onClick={addInterest}>+ Add Interest</Button>
            </div>
            {interests.map((interest, idx) => {
              // Safety check to ensure interest has the required structure
              if (!interest || !interest.preferences) {
                return null;
              }
              
              return (
              <div key={idx} className="border rounded p-3 mb-4">
                <div className="mb-2 font-medium">Interest Item #{idx + 1}</div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Main Category</label>
                  <Select value={interest.mainCategory} onValueChange={val => {
                    console.log(`🎯 Category selected for interest ${idx}:`, val);
                    setInterests(prev => {
                      const copy = [...prev];
                      copy[idx].mainCategory = val;
                      console.log(`   Updated interest ${idx} mainCategory:`, copy[idx].mainCategory);
                      return copy;
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading categories..." : "Select Main Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : categories.length > 0 ? (
                        categories.map((category) => {
                          const categoryValue = String(category.id || category.name || `category-${category.id}`);
                          const categoryName = category.name || `Category ${category.id}`;
                          return (
                            <SelectItem key={category.id} value={categoryValue}>
                              {categoryName}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {interest.mainCategory && (
                  <>
                    {interest.products.map((prod, pidx) => (
                      <div key={pidx} className="border rounded p-2 mb-2 flex flex-col md:flex-row gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1">Product</label>
                          <Select 
                            value={prod.product}
                            onValueChange={(value) => {
                              console.log(`🎯 Product selected for interest ${idx}, product ${pidx}:`, value);
                              setInterests(prev => {
                                const copy = [...prev];
                                copy[idx].products[pidx].product = value;
                                console.log(`   Updated product ${pidx} in interest ${idx}:`, copy[idx].products[pidx]);
                                return copy;
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={loading ? "Loading products..." : "Select Product"} />
                            </SelectTrigger>
                            <SelectContent>
                              {loading ? (
                                <SelectItem value="loading-products" disabled>Loading products...</SelectItem>
                              ) : products.length > 0 ? (
                                products.map((product) => {
                                  const productValue = product.id?.toString() || product.name || `product-${product.id}`;
                                  const productName = product.name || `Product ${product.id}`;
                                  return (
                                    <SelectItem key={product.id} value={productValue}>
                                      {productName}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                <SelectItem value="no-products" disabled>No products available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1">Revenue Opportunity (₹)</label>
                          <Input 
                            placeholder="e.g., 50000" 
                            value={prod.revenue}
                            onChange={(e) => {
                              console.log(`💰 Revenue entered for interest ${idx}, product ${pidx}:`, e.target.value);
                              setInterests(prev => {
                                const copy = [...prev];
                                copy[idx].products[pidx].revenue = e.target.value;
                                console.log(`   Updated revenue for product ${pidx} in interest ${idx}:`, copy[idx].products[pidx]);
                                return copy;
                              });
                            }}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="self-end text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeProductFromInterest(idx, pidx)}
                          type="button"
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                    <Button variant="link" size="sm" className="text-orange-600" onClick={() => addProductToInterest(idx)}>
                      + Add Product to this Interest
                    </Button>
                  </>
                )}
                
                {/* Customer Preferences */}
                <div className="border rounded p-3 mt-3">
                  <div className="font-semibold mb-2">Customer Preferences</div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2">
                      <Checkbox 
                        checked={interest.preferences?.designSelected || false}
                        onCheckedChange={(checked) => {
                          setInterests(prev => {
                            const copy = [...prev];
                            if (!copy[idx].preferences) {
                              copy[idx].preferences = {
                                designSelected: false,
                                wantsDiscount: false,
                                checkingOthers: false,
                                lessVariety: false,
                                other: "",
                              };
                            }
                            copy[idx].preferences.designSelected = checked as boolean;
                            return copy;
                          });
                          
                          // If design is selected, automatically generate/update pipeline opportunities
                          if (checked && !pipelineCreated) {
                            setTimeout(() => {
                              generatePipelineOpportunities();
                              setShowDesignSelectedNotification(true);
                              // Hide notification after 5 seconds
                              setTimeout(() => setShowDesignSelectedNotification(false), 5000);
                            }, 100);
                          }
                        }}
                      /> 
                      Design Selected?
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox 
                        checked={interest.preferences?.wantsDiscount || false}
                        onCheckedChange={(checked) => {
                          setInterests(prev => {
                            const copy = [...prev];
                            if (!copy[idx].preferences) {
                              copy[idx].preferences = {
                                designSelected: false,
                                wantsDiscount: false,
                                checkingOthers: false,
                                lessVariety: false,
                                other: "",
                              };
                            }
                            copy[idx].preferences.wantsDiscount = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Wants More Discount
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox 
                        checked={interest.preferences?.checkingOthers || false}
                        onCheckedChange={(checked) => {
                          setInterests(prev => {
                            const copy = [...prev];
                            if (!copy[idx].preferences) {
                              copy[idx].preferences = {
                                designSelected: false,
                                wantsDiscount: false,
                                checkingOthers: false,
                                lessVariety: false,
                                other: "",
                              };
                            }
                            copy[idx].preferences.checkingOthers = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Checking Other Jewellers
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox 
                        checked={interest.preferences?.lessVariety || false}
                        onCheckedChange={(checked) => {
                          setInterests(prev => {
                            const copy = [...prev];
                            if (!copy[idx].preferences) {
                              copy[idx].preferences = {
                                designSelected: false,
                                wantsDiscount: false,
                                checkingOthers: false,
                                lessVariety: false,
                                other: "",
                              };
                            }
                            copy[idx].preferences.lessVariety = checked as boolean;
                            return copy;
                          });
                        }}
                      /> 
                      Felt Less Variety
                    </label>
                    <Input 
                      placeholder="Other Preferences (if any)" 
                      className="mt-2"
                      value={interest.preferences?.other || ""}
                      onChange={(e) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].preferences) {
                            copy[idx].preferences = {
                              designSelected: false,
                              wantsDiscount: false,
                              checkingOthers: false,
                              lessVariety: false,
                              other: "",
                            };
                          }
                          copy[idx].preferences.other = e.target.value;
                          return copy;
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Sales Pipeline Opportunities */}
          {interests.some(interest => interest.mainCategory && interest.products.some(p => p.product && p.revenue)) && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Sales Pipeline Opportunities</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (!pipelineCreated) {
                      generatePipelineOpportunities();
                    } else {
                      toast({
                        title: "Pipeline Already Created",
                        description: "Sales pipeline has already been created for this customer. No need to regenerate.",
                        variant: "default",
                      });
                    }
                  }}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                  disabled={pipelineCreated}
                >
                  {pipelineCreated ? '✅ Pipeline Created' : '🎯 Generate Opportunities'}
                </Button>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Create sales pipeline opportunities based on customer interests and revenue potential
              </div>
              
              {/* Design Selected Notification */}
              {showDesignSelectedNotification && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🎉</span>
                    <span className="text-green-800 font-medium">
                      Design Selected! Pipeline opportunities have been automatically updated to "Closed Won" stage.
                    </span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Revenue will be reflected in the sales pipeline as a won deal.
                  </div>
                </div>
              )}
              
              {showPipelineSection && pipelineOpportunities.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-green-700 mb-2">
                    ✅ 1 consolidated opportunity will be created in the sales pipeline
                  </div>
                  {pipelineOpportunities.map((opportunity, idx) => (
                    <div key={idx} className={`border rounded p-3 ${opportunity.stage === 'closed_won' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="font-medium text-green-800 flex items-center gap-2">
                        {opportunity.title}
                        {opportunity.stage === 'closed_won' && (
                          <Badge variant="default" className="bg-green-600 text-white">
                            🎉 Closed Won
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Expected Value:</span> ₹{opportunity.expected_value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Probability:</span> {opportunity.probability}%
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Stage:</span> {opportunity.stage === 'closed_won' ? 'Closed Won' : opportunity.stage === 'store_walkin' ? 'Store Walkin' : 'Exhibition'}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Next Action:</span> {opportunity.next_action}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {opportunity.notes}
                </div>
              </div>
            ))}
          </div>
              )}
            </div>
          )}

          {/* Follow-up & Summary */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-4">Follow-up & Summary</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Next Follow-up Date</label>
                <Input 
                  type="date" 
                  value={formData.next_follow_up}
                  onChange={(e) => handleInputChange('next_follow_up', e.target.value)}
                />
                <div className="text-xs text-blue-600 mt-1">
                  Setting a follow-up date will automatically create an appointment
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary Notes</label>
                <Textarea 
                  placeholder="Key discussion points, items shown, next steps..." 
                  rows={3}
                  value={formData.summary_notes}
                  onChange={(e) => handleInputChange('summary_notes', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 