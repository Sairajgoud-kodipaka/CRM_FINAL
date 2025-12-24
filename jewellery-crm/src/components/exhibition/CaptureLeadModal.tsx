"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInputComponent } from '@/components/ui/phone-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Gift, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/lib/api-service';

interface ProductInterest {
  mainCategory: string;
  products: { product: string; revenue: string }[];
  preferences: {
    designSelected: boolean;
    wantsDiscount: boolean;
    checkingOthers: boolean;
    lessVariety: boolean;
    purchased: boolean;
    other: string;
  };
}

interface CaptureLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: {
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
  }) => Promise<void>;
  exhibitionTags?: Array<{ id: number; name: string; color: string }>;
}

export default function CaptureLeadModal({ isOpen, onClose, onSubmit, exhibitionTags = [] }: CaptureLeadModalProps) {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    phone: '',
    city: '',
    customer_type: 'individual',
    exhibition_name: '',
    exhibition_date: getTodayDate(),
    exhibition_tag: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Product Interests state
  const [interests, setInterests] = useState<ProductInterest[]>([
    {
      mainCategory: "",
      products: [{ product: "", revenue: "" }],
      preferences: {
        designSelected: false,
        wantsDiscount: false,
        checkingOthers: false,
        lessVariety: false,
        purchased: false,
        other: "",
      },
    },
  ]);
  const [interestDetailsOpen, setInterestDetailsOpen] = useState<boolean[]>([false]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [availableExhibitions, setAvailableExhibitions] = useState<Array<{ id: number; name: string; date: string; tag?: number }>>([]);
  const [exhibitionsLoading, setExhibitionsLoading] = useState(false);

  const loadAllExhibitions = async () => {
    try {
      setExhibitionsLoading(true);
      const response = await apiService.getExhibitions();
      console.log('Exhibitions API response:', response);
      if (response.success) {
        let exhibitionsData: Array<{ id: number; name: string; date: string; tag?: number }> = [];
        if (Array.isArray(response.data)) {
          exhibitionsData = response.data;
        } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          const dataWithResults = response.data as { results?: Array<{ id: number; name: string; date: string; tag?: number }> };
          exhibitionsData = Array.isArray(dataWithResults.results) ? dataWithResults.results : [];
        } else if (response.data && typeof response.data === 'object') {
          exhibitionsData = Object.values(response.data).find(Array.isArray) as Array<{ id: number; name: string; date: string; tag?: number }> || [];
        }
        setAvailableExhibitions(exhibitionsData);
        console.log('Loaded all exhibitions:', exhibitionsData);
        
        // Auto-fill exhibition for today's date if it exists
        const todayDate = getTodayDate();
        const todayExhibition = exhibitionsData.find(ex => ex.date === todayDate);
        if (todayExhibition) {
          setFormData(prev => ({
            ...prev,
            exhibition_name: todayExhibition.name,
            exhibition_date: todayExhibition.date,
            exhibition_tag: todayExhibition.tag ? todayExhibition.tag.toString() : ''
          }));
          console.log('Auto-filled exhibition for today:', todayExhibition);
        }
      } else {
        console.error('Failed to load exhibitions:', response);
        setAvailableExhibitions([]);
      }
    } catch (error) {
      console.error('Error loading all exhibitions:', error);
      setAvailableExhibitions([]);
    } finally {
      setExhibitionsLoading(false);
    }
  };

  // Load categories and products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadProducts();
      // Load all exhibitions when modal opens
      loadAllExhibitions();
    }
  }, [isOpen]);

  // Load exhibitions when date changes
  useEffect(() => {
    if (isOpen && formData.exhibition_date) {
      loadExhibitionsForDate(formData.exhibition_date);
    }
  }, [formData.exhibition_date, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        const categoriesData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || (response.data as any).data || [];
        setCategories(categoriesData);
      } else {
        // Fallback categories
        setCategories([
          { id: 1, name: "Necklaces" },
          { id: 2, name: "Rings" },
          { id: 3, name: "Earrings" },
          { id: 4, name: "Bracelets" },
          { id: 5, name: "Pendants" },
          { id: 6, name: "Chains" },
          { id: 7, name: "Bangles" },
          { id: 8, name: "Anklets" }
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([
        { id: 1, name: "Necklaces" },
        { id: 2, name: "Rings" },
        { id: 3, name: "Earrings" },
        { id: 4, name: "Bracelets" },
        { id: 5, name: "Pendants" },
        { id: 6, name: "Chains" },
        { id: 7, name: "Bangles" },
        { id: 8, name: "Anklets" }
      ]);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await apiService.getProducts();
      if (response.success && response.data) {
        const productsData = Array.isArray(response.data)
          ? response.data
          : (response.data as { results?: any[]; data?: any[] }).results || (response.data as { results?: any[]; data?: any[] }).data || [];
        setProducts(productsData);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const addInterest = () => {
    const newInterest: ProductInterest = {
      mainCategory: "",
      products: [{ product: "", revenue: "" }],
      preferences: {
        designSelected: false,
        wantsDiscount: false,
        checkingOthers: false,
        lessVariety: false,
        purchased: false,
        other: "",
      },
    };
    setInterests(prev => [...prev, newInterest]);
    setInterestDetailsOpen(prev => [...prev, false]);
  };

  const removeInterest = (index: number) => {
    if (interests.length > 1) {
      setInterests(prev => prev.filter((_, i) => i !== index));
      setInterestDetailsOpen(prev => prev.filter((_, i) => i !== index));
    }
  };

  const loadExhibitionsForDate = async (date: string) => {
    if (!date) {
      // If no date, load all exhibitions
      loadAllExhibitions();
      return;
    }
    
    try {
      setExhibitionsLoading(true);
      const response = await apiService.getExhibitions(date);
      console.log('Loading exhibitions for date:', date, 'Response:', response);
      
      if (response.success) {
        let exhibitionsData: Array<{ id: number; name: string; date: string; tag?: number }> = [];
        if (Array.isArray(response.data)) {
          exhibitionsData = response.data;
        } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          const dataWithResults = response.data as { results?: Array<{ id: number; name: string; date: string; tag?: number }> };
          exhibitionsData = Array.isArray(dataWithResults.results) ? dataWithResults.results : [];
        } else if (response.data && typeof response.data === 'object') {
          exhibitionsData = Object.values(response.data).find(Array.isArray) as Array<{ id: number; name: string; date: string; tag?: number }> || [];
        }
        
        console.log('Filtered exhibitions for date:', exhibitionsData);
        setAvailableExhibitions(exhibitionsData);
        
        // Auto-select if only one exhibition exists for this date
        if (exhibitionsData.length === 1) {
          const selectedExhibition = exhibitionsData[0];
          setFormData(prev => ({
            ...prev,
            exhibition_name: selectedExhibition.name,
            exhibition_date: selectedExhibition.date,
            exhibition_tag: selectedExhibition.tag ? selectedExhibition.tag.toString() : ''
          }));
        } else if (exhibitionsData.length === 0) {
          // If no exhibitions for this date, load all exhibitions so user can still select
          loadAllExhibitions();
        }
      } else {
        console.error('Failed to load exhibitions:', response);
        // Fallback: load all exhibitions
        loadAllExhibitions();
      }
    } catch (error) {
      console.error('Error loading exhibitions for date:', error);
      // Fallback: load all exhibitions
      loadAllExhibitions();
    } finally {
      setExhibitionsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    // Email is optional, but if provided, it should be valid
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null); // Clear previous errors
    try {
      // Split full name into first and last name
      const nameParts = formData.first_name.trim().split(' ');
      
      // Format interests for API - filter out empty interests
      const customer_interests_input = interests
        .filter(interest => {
          // Only include interests that have a category and at least one product with a product name
          const hasCategory = interest.mainCategory && interest.mainCategory.trim() !== '';
          const hasProducts = interest.products && interest.products.length > 0;
          const hasProductNames = interest.products.some(p => p.product && p.product.trim() !== '');
          return hasCategory && hasProducts && hasProductNames;
        })
        .map(interest => {
          const interestData = {
            category: interest.mainCategory,
            products: interest.products
              .filter(p => p.product && p.product.trim() !== '') // Filter out empty products
              .map(p => ({
                product: p.product,
                revenue: p.revenue || '0'
              })),
            preferences: interest.preferences
          };
          return JSON.stringify(interestData);
        })
        .filter(jsonStr => {
          // Double-check: parse and verify the interest has valid data
          try {
            const parsed = JSON.parse(jsonStr);
            return parsed.category && parsed.products && parsed.products.length > 0;
          } catch {
            return false;
          }
        });

      const submitData = {
        first_name: nameParts[0] || formData.first_name,
        last_name: nameParts.slice(1).join(' ') || '',
        email: formData.email || '',
        phone: formData.phone,
        city: formData.city || '',
        notes: '',
        customer_type: formData.customer_type,
        exhibition_name: formData.exhibition_name || undefined,
        exhibition_date: formData.exhibition_date || undefined,
        exhibition_tag: formData.exhibition_tag ? parseInt(formData.exhibition_tag) : undefined,
        // Always send an array (empty if no valid interests) so backend knows to process it
        customer_interests_input: customer_interests_input.length > 0 ? customer_interests_input : []
      };
      
      console.log('🔍 CaptureLeadModal - Submitting customer interests:', {
        customer_interests_input: customer_interests_input,
        customer_interests_input_length: customer_interests_input.length,
        customer_interests_input_type: typeof customer_interests_input,
        customer_interests_input_is_array: Array.isArray(customer_interests_input),
        raw_interests: interests,
        raw_interests_length: interests.length
      });
      await onSubmit(submitData);
      handleClose();
    } catch (error: any) {


      // Extract error message from the error object
      let errorMessage = 'Failed to create lead. Please try again.';

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

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      email: '',
      phone: '',
      city: '',
      customer_type: 'individual',
      exhibition_name: '',
      exhibition_date: getTodayDate(),
      exhibition_tag: ''
    });
    setInterests([{
      mainCategory: "",
      products: [{ product: "", revenue: "" }],
      preferences: {
        designSelected: false,
        wantsDiscount: false,
        checkingOthers: false,
        lessVariety: false,
        purchased: false,
        other: "",
      },
    }]);
    setInterestDetailsOpen([false]);
    setErrors({});
    setSubmitError(null); // Clear submit error when closing
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-600" />
            Capture Exhibition Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submit Error Display */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-red-500">⚠</span>
                <span className="text-sm font-medium">{submitError}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="first_name">Full Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter full name"
              className={errors.first_name ? 'border-red-500' : ''}
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <PhoneInputComponent
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              required={true}
              defaultCountry="IN"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city"
            />
          </div>

          <div>
            <Label htmlFor="customer_type">Customer Type</Label>
            <Select
              value={formData.customer_type}
              onValueChange={(value) => handleInputChange('customer_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
          </div>

            {/* Product Interests */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Product Interests</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addInterest}
                  type="button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Interest
                </Button>
              </div>

              {interests.map((interest, idx) => (
                <div key={idx} className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-medium text-sm">Interest #{idx + 1}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setInterestDetailsOpen(prev => prev.map((o, i) => i === idx ? !o : o))}
                      >
                        {interestDetailsOpen[idx] ? 'Hide Details' : 'Show Details'}
                      </Button>
                      {interests.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeInterest(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="mb-4">
                    <Label>Category</Label>
                    <Select
                      value={interest.mainCategory || ''}
                      onValueChange={(value) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          copy[idx].mainCategory = value;
                          return copy;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Selection */}
                  <div className="mb-4">
                    <Label>Product</Label>
                    <Select
                      value={interest.products[0]?.product || ''}
                      onValueChange={(value) => {
                        setInterests(prev => {
                          const copy = [...prev];
                          if (!copy[idx].products[0]) {
                            copy[idx].products[0] = { product: "", revenue: "" };
                          }
                          copy[idx].products[0].product = value;
                          
                          // Auto-populate revenue if product is selected
                          const selectedProduct = products.find(p => p.id.toString() === value);
                          if (selectedProduct) {
                            const productPrice = selectedProduct.selling_price || selectedProduct.price || 0;
                            copy[idx].products[0].revenue = productPrice.toString();
                          }
                          return copy;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">Loading products...</div>
                        ) : products.length > 0 ? (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ₹{product.selling_price?.toLocaleString('en-IN') || 'Price N/A'}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No products available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {interestDetailsOpen[idx] && (
                    <>
                      {/* Revenue */}
                      <div className="mb-4">
                        <Label>Expected Revenue (₹)</Label>
                        <Input
                          placeholder="e.g., 50000"
                          value={interest.products[0]?.revenue || ''}
                          onChange={(e) => {
                            setInterests(prev => {
                              const copy = [...prev];
                              if (!copy[idx].products[0]) {
                                copy[idx].products[0] = { product: "", revenue: "" };
                              }
                              copy[idx].products[0].revenue = e.target.value;
                              return copy;
                            });
                          }}
                        />
                      </div>

                      {/* Customer Preferences */}
                      <div className="space-y-3 mb-4">
                        <div className="text-sm font-medium text-gray-700">Customer Preferences:</div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={interest.preferences?.designSelected || false}
                              onCheckedChange={(checked) => {
                                setInterests(prev => {
                                  const copy = [...prev];
                                  copy[idx].preferences.designSelected = checked as boolean;
                                  return copy;
                                });
                              }}
                            />
                            <span className="text-sm">Design Selected</span>
                          </label>
                          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={interest.preferences?.wantsDiscount || false}
                              onCheckedChange={(checked) => {
                                setInterests(prev => {
                                  const copy = [...prev];
                                  copy[idx].preferences.wantsDiscount = checked as boolean;
                                  return copy;
                                });
                              }}
                            />
                            <span className="text-sm">Wants Discount</span>
                          </label>
                          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={interest.preferences?.checkingOthers || false}
                              onCheckedChange={(checked) => {
                                setInterests(prev => {
                                  const copy = [...prev];
                                  copy[idx].preferences.checkingOthers = checked as boolean;
                                  return copy;
                                });
                              }}
                            />
                            <span className="text-sm">Checking Others</span>
                          </label>
                          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={interest.preferences?.lessVariety || false}
                              onCheckedChange={(checked) => {
                                setInterests(prev => {
                                  const copy = [...prev];
                                  copy[idx].preferences.lessVariety = checked as boolean;
                                  return copy;
                                });
                              }}
                            />
                            <span className="text-sm">Less Variety</span>
                          </label>
                          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={interest.preferences?.purchased || false}
                              onCheckedChange={(checked) => {
                                setInterests(prev => {
                                  const copy = [...prev];
                                  copy[idx].preferences.purchased = checked as boolean;
                                  return copy;
                                });
                              }}
                            />
                            <span className="text-sm">Purchased</span>
                          </label>
                        </div>
                      </div>

                      {/* Other Preferences */}
                      <div className="mb-4">
                        <Label>Other Preferences</Label>
                        <Input
                          placeholder="Other preferences for this interest..."
                          value={interest.preferences?.other || ""}
                          onChange={(e) => {
                            setInterests(prev => {
                              const copy = [...prev];
                              copy[idx].preferences.other = e.target.value;
                              return copy;
                            });
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Exhibition Information */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Exhibition Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exhibition_date">Exhibition Date</Label>
                <Input
                  id="exhibition_date"
                  type="date"
                  value={formData.exhibition_date}
                  onChange={(e) => {
                    handleInputChange('exhibition_date', e.target.value);
                    // Load exhibitions for the new date
                    if (e.target.value) {
                      loadExhibitionsForDate(e.target.value);
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="exhibition_name">Exhibition Name</Label>
                <Select
                  value={formData.exhibition_name || undefined}
                  onValueChange={(value) => {
                    // Find the selected exhibition
                    const selectedExhibition = availableExhibitions.find(ex => ex.name === value);
                    if (selectedExhibition) {
                      // Auto-fill date and tag from the exhibition
                      setFormData(prev => ({
                        ...prev,
                        exhibition_name: selectedExhibition.name,
                        exhibition_date: selectedExhibition.date,
                        exhibition_tag: selectedExhibition.tag ? selectedExhibition.tag.toString() : ''
                      }));
                    } else {
                      handleInputChange('exhibition_name', value);
                    }
                  }}
                  disabled={exhibitionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      exhibitionsLoading 
                        ? "Loading exhibitions..." 
                        : "Select exhibition (optional)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {exhibitionsLoading ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">Loading exhibitions...</div>
                    ) : availableExhibitions.length > 0 ? (
                      availableExhibitions.map((exhibition) => {
                        const exhibitionDate = new Date(exhibition.date).toLocaleDateString();
                        const isDateMatch = formData.exhibition_date && exhibition.date === formData.exhibition_date;
                        return (
                          <SelectItem key={exhibition.id} value={exhibition.name}>
                            {exhibition.name} {!isDateMatch && `(${exhibitionDate})`}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No exhibitions available. Create one in the manager page.</div>
                    )}
                  </SelectContent>
                </Select>
                {availableExhibitions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selecting an exhibition will auto-fill the date and tag.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="exhibition_tag">Exhibition Tag</Label>
              <Select
                value={formData.exhibition_tag || undefined}
                onValueChange={(value) => handleInputChange('exhibition_tag', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exhibition tag (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {exhibitionTags.length > 0 ? (
                    exhibitionTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">No tags available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
              {isSubmitting ? (
                <>
                  <Skeleton className="w-4 h-4 mr-2 rounded" />
                  Capturing...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Capture Lead
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
