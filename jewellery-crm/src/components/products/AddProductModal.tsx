'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CustomDropdown } from '@/components/ui/custom-dropdown';
import { DimensionsInput } from '@/components/ui/dimensions-input';
import { WeightDropdown } from '@/components/ui/weight-dropdown';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { Skeleton } from '@/components/ui/skeleton';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  discount_percentage: number;
  price_after_discount: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  weight: number;
  dimensions: string;
  material: string;
  color: string;
  size: string;
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const { user, isAuthenticated, isLoading: authLoading, isHydrated } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [categories, setCategories] = useState<Category[]>([]);

  // Predefined options for dropdowns
  const materialOptions = [
    'Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Yellow Gold',
    'Diamond', 'Pearl', 'Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst',
    'Sterling Silver', 'Titanium', 'Stainless Steel', 'Brass', 'Copper'
  ];

  const colorOptions = [
    'Yellow', 'White', 'Rose', 'Gold', 'Silver', 'Platinum', 'Black',
    'Blue', 'Red', 'Green', 'Purple', 'Pink', 'Orange', 'Brown',
    'Multi-color', 'Clear', 'Transparent'
  ];

  const karatsOptions = [
    '9K', '10K', '14K', '18K', '22K', '24K', '925', '950', '999',
    '10K Gold', '14K Gold', '18K Gold', '22K Gold', '24K Gold',
    'Sterling Silver', 'Platinum', 'Palladium'
  ];

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: 0,
    discount_percentage: 0,
    price_after_discount: 0,
    quantity: 0,
    min_quantity: 1,
    max_quantity: 100,
    weight: 0,
    dimensions: '',
    material: '',
    color: '',
    size: '',
    status: 'active',
    is_featured: false,
    is_bestseller: false,
  });
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuantityDetails, setShowQuantityDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Wait for hydration to complete before checking authentication
      if (!isHydrated) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        setError('Please log in to add products.');
        return;
      }

      fetchCategories();
    }
  }, [isOpen, isHydrated, isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {

    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if authentication is still loading or not hydrated
    if (!isHydrated || authLoading || !isAuthenticated || !user) {
      setError('Please wait for authentication to complete or contact administrator.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('description', formData.description);
      if (formData.category) {
        formDataToSend.append('category', formData.category);
      }
      // Map pricing fields to backend
      formDataToSend.append('cost_price', formData.price.toString());
      formDataToSend.append('selling_price', formData.price_after_discount.toString());
      formDataToSend.append('discount_price', formData.price_after_discount.toString());
      formDataToSend.append('quantity', formData.quantity.toString());
      formDataToSend.append('min_quantity', formData.min_quantity.toString());
      formDataToSend.append('max_quantity', formData.max_quantity.toString());
      formDataToSend.append('weight', formData.weight.toString());
      formDataToSend.append('dimensions', formData.dimensions);
      formDataToSend.append('material', formData.material);
      formDataToSend.append('color', formData.color);
      formDataToSend.append('size', formData.size);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('is_featured', formData.is_featured.toString());
      formDataToSend.append('is_bestseller', formData.is_bestseller.toString());

      // Add store ID from authenticated user (always send store field)
      formDataToSend.append('store', user.store ? user.store.toString() : '');

      // Add main image if provided
      if (mainImage) {
        formDataToSend.append('main_image', mainImage);
      }

      // Add additional images if provided
      additionalImages.forEach((image, index) => {
        formDataToSend.append(`additional_images_${index}`, image);
      });

      const response = await apiService.createProduct(formDataToSend);
      if (response.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: '',
          sku: '',
          description: '',
          category: '',
          price: 0,
          discount_percentage: 0,
          price_after_discount: 0,
          quantity: 0,
          min_quantity: 1,
          max_quantity: 100,
          weight: 0,
          dimensions: '',
          material: '',
          color: '',
          size: '',
          status: 'active',
          is_featured: false,
          is_bestseller: false,
        });
        setMainImage(null);
        setAdditionalImages([]);
        setError(null);
      } else {
        setError(response.message || 'Failed to create product');
      }
    } catch (error) {

      setError('An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceAfterDiscount = (price: number, discountPercentage: number) => {
    if (price <= 0 || discountPercentage <= 0) return price;
    return price - (price * discountPercentage / 100);
  };

  const calculateDiscountPercentage = (price: number, discountedPrice: number) => {
    if (price <= 0 || discountedPrice >= price) return 0;
    return ((price - discountedPrice) / price) * 100;
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate price after discount when price or discount percentage changes
      if (field === 'price' || field === 'discount_percentage') {
        newData.price_after_discount = calculatePriceAfterDiscount(
          field === 'price' ? value as number : newData.price,
          field === 'discount_percentage' ? value as number : newData.discount_percentage
        );
      }

      // Auto-calculate discount percentage when price after discount changes
      if (field === 'price_after_discount') {
        newData.discount_percentage = calculateDiscountPercentage(newData.price, value as number);
      }

      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Add New Product"
      description={!isHydrated ? 'Loading...' :
                 authLoading ? 'Loading user information...' :
                 'Create a new jewelry product for your inventory'}
      size={isMobile ? "full" : isTablet ? "lg" : "xl"}
      showCloseButton={true}
      actions={
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.category}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Skeleton className="w-4 h-4 mr-2 rounded" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      }
    >
          <form onSubmit={handleSubmit} className="space-y-8" style={{ pointerEvents: (!isHydrated || authLoading) ? 'none' : 'auto', opacity: (!isHydrated || authLoading) ? 0.6 : 1 }}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <X className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-medium text-gray-700">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter SKU"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="price"
                      type="text"
                      value={formData.price === 0 ? '' : formData.price.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        handleInputChange('price', value ? parseFloat(value) : 0);
                      }}
                      placeholder="0.00"
                      className="pl-8 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_percentage" className="text-sm font-medium text-gray-700">Discount (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_after_discount" className="text-sm font-medium text-gray-700">Final Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="price_after_discount"
                      type="text"
                      value={formData.price_after_discount === 0 ? '' : formData.price_after_discount.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        handleInputChange('price_after_discount', value ? parseFloat(value) : 0);
                      }}
                      placeholder="0.00"
                      className="pl-8 h-10 bg-gray-100"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Specifications</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <CustomDropdown
                  label="Material"
                  value={formData.material}
                  onChange={(value) => handleInputChange('material', value)}
                  options={materialOptions}
                  placeholder="Select material"
                />

                <CustomDropdown
                  label="Color"
                  value={formData.color}
                  onChange={(value) => handleInputChange('color', value)}
                  options={colorOptions}
                  placeholder="Select color"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <WeightDropdown
                  label="Weight"
                  value={formData.weight}
                  onChange={(value) => handleInputChange('weight', value)}
                />

                <CustomDropdown
                  label="Karats"
                  value={formData.size}
                  onChange={(value) => handleInputChange('size', value)}
                  options={karatsOptions}
                  placeholder="Select karats"
                />

                <DimensionsInput
                  label="Dimensions"
                  value={formData.dimensions}
                  onChange={(value) => handleInputChange('dimensions', value)}
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>

              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    required
                    className="h-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuantityDetails(!showQuantityDetails)}
                  className="ml-4 h-10 px-4"
                >
                  {showQuantityDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {showQuantityDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="min_quantity" className="text-sm font-medium text-gray-700">Minimum Quantity</Label>
                    <Input
                      id="min_quantity"
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => handleInputChange('min_quantity', parseInt(e.target.value) || 0)}
                      placeholder="1"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_quantity" className="text-sm font-medium text-gray-700">Maximum Quantity</Label>
                    <Input
                      id="max_quantity"
                      type="number"
                      value={formData.max_quantity}
                      onChange={(e) => handleInputChange('max_quantity', parseInt(e.target.value) || 0)}
                      placeholder="100"
                      className="h-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
              <ImageUpload
                onMainImageChange={setMainImage}
                onAdditionalImagesChange={setAdditionalImages}
              />
            </div>

            {/* Status & Features */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Features</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                  <Label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Featured Product</Label>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  <Switch
                    id="is_bestseller"
                    checked={formData.is_bestseller}
                    onCheckedChange={(checked) => handleInputChange('is_bestseller', checked)}
                  />
                  <Label htmlFor="is_bestseller" className="text-sm font-medium text-gray-700">Bestseller</Label>
                </div>
              </div>
            </div>
          </form>
    </ResponsiveDialog>
  );
}
