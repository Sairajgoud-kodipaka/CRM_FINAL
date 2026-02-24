'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CustomDropdown } from '@/components/ui/custom-dropdown';
import { DimensionsInput } from '@/components/ui/dimensions-input';
import { WeightDropdown } from '@/components/ui/weight-dropdown';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { X, Edit, Trash2, Eye, Copy, Archive } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
  action: 'view' | 'edit' | 'delete' | null;
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

export default function ProductActionsModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  action
}: ProductActionsModalProps) {
  const { user, isAuthenticated, isLoading: authLoading, isHydrated } = useAuth();
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  React.useEffect(() => {
    if (isOpen && product) {
      // Wait for hydration to complete before checking authentication
      if (!isHydrated) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        setError('Please log in to edit products.');
        return;
      }

      fetchCategories();
      // Populate form data when editing
      if (action === 'edit') {
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          category: product.category?.id?.toString() || '',
          price: product.selling_price || 0,
          discount_percentage: product.discount_percentage || 0,
          price_after_discount: product.discount_price || product.selling_price || 0,
          quantity: product.quantity || 0,
          min_quantity: product.min_quantity || 1,
          max_quantity: product.max_quantity || 100,
          weight: product.weight || 0,
          dimensions: product.dimensions || '',
          material: product.material || '',
          color: product.color || '',
          size: product.size || '',
          status: product.status || 'active',
          is_featured: product.is_featured || false,
          is_bestseller: product.is_bestseller || false,
        });
      }
    }
  }, [isOpen, product, action, isHydrated, isAuthenticated, user]);

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

      const response = await apiService.updateProduct(product.id, formDataToSend);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to update product');
      }
    } catch (error) {

      setError('An error occurred while updating the product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteProduct(product.id);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (error) {

      setError('An error occurred while deleting the product');
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

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage('');
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    if (imageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageModalOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {action === 'view' && 'View Product'}
                {action === 'edit' && 'Edit Product'}
                {action === 'delete' && 'Delete Product'}
              </h2>
              <p className="text-gray-600 mt-1">
                {action === 'view' && 'Product details and specifications'}
                {action === 'edit' && 'Update product information'}
                {action === 'delete' && 'Confirm product deletion'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <X className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {action === 'view' && (
            <div className="space-y-6">
              {/* Product Images */}
              {(product.main_image_url || (product.additional_images_urls && product.additional_images_urls.length > 0)) && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.main_image_url && (
                      <div className="relative group cursor-pointer" onClick={() => openImageModal(product.main_image_url)}>
                        <img
                          src={product.main_image_url}
                          alt="Main product image"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                    {product.additional_images_urls?.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group cursor-pointer" onClick={() => openImageModal(imageUrl)}>
                        <img
                          src={imageUrl}
                          alt={`Additional image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Product Name</Label>
                    <p className="text-gray-900 font-medium">{product.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">SKU</Label>
                    <p className="text-gray-900 font-medium">{product.sku}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-gray-900">{product.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Category</Label>
                    <p className="text-gray-900 font-medium">{product.category?.name || 'No category'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <Badge variant={getStatusBadgeVariant(product.status)} className="mt-1">
                      {product.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Selling Price</Label>
                    <p className="text-gray-900 font-medium text-lg">{formatCurrency(product.selling_price || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cost Price</Label>
                    <p className="text-gray-900 font-medium text-lg">{formatCurrency(product.cost_price || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Discount Price</Label>
                    <p className="text-gray-900 font-medium text-lg">{formatCurrency(product.discount_price || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Material</Label>
                    <p className="text-gray-900 font-medium">{product.material || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Color</Label>
                    <p className="text-gray-900 font-medium">{product.color || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Karats</Label>
                    <p className="text-gray-900 font-medium">{product.size || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Weight</Label>
                    <p className="text-gray-900 font-medium">{product.weight ? `${product.weight}g` : 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Dimensions</Label>
                    <p className="text-gray-900 font-medium">{product.dimensions || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              {/* Inventory hidden as per client request */}
              {/* <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Quantity</Label>
                    <p className="text-gray-900 font-medium text-lg">{product.quantity || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Minimum Quantity</Label>
                    <p className="text-gray-900 font-medium">{product.min_quantity || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Maximum Quantity</Label>
                    <p className="text-gray-900 font-medium">{product.max_quantity || 0}</p>
                  </div>
                </div>
              </div> */}

              {/* Features */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Features</h3>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${product.is_featured ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Featured Product</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${product.is_bestseller ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">Bestseller</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {action === 'edit' && (
            <form onSubmit={handleSubmit} className="space-y-8">
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
              {/* Inventory hidden */}
              {/* <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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
              </div> */}

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

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-6"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Skeleton className="mr-2 h-4 w-4 rounded" />
                      Updating Product...
                    </>
                  ) : (
                    'Update Product'
                  )}
                </Button>
              </div>
            </form>
          )}

          {action === 'delete' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-6"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="h-10 px-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Skeleton className="mr-2 h-4 w-4 rounded" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal for Enlarged View */}
      {imageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={closeImageModal}
              className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Enlarged product image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
