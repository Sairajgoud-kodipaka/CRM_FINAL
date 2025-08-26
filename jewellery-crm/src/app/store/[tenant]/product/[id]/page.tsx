'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApiService } from '@/lib/api-service';
import { Product } from '@/lib/api-service';
import CustomerLayout from '@/components/customer/CustomerLayout';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Eye } from 'lucide-react';

const apiService = new ApiService();

export default function ProductDetailPage() {
  const params = useParams();
  const tenant = params.tenant as string;
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProduct(productId);
        if (response.success) {
          setProduct(response.data);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice?: number) => {
    if (!discountPrice) return 0;
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const addToCart = () => {
    if (!product) return;
    console.log('Adding to cart:', { product, quantity });
  };

  const toggleWishlist = () => {
    setWishlisted(!wishlisted);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Product not found</h3>
          <p className="text-gray-500">The product you're looking for doesn't exist.</p>
        </div>
      </CustomerLayout>
    );
  }

  const discountPercentage = getDiscountPercentage(product.selling_price, product.discount_price);
  const displayPrice = product.discount_price || product.selling_price;
  const images = product.main_image_url ? [product.main_image_url, ...product.additional_images] : product.additional_images;

  return (
    <CustomerLayout>
      <CustomerHeader 
        searchQuery=""
        onSearchChange={() => {}}
        categories={[]}
        selectedCategory={null}
        onCategoryChange={() => {}}
      />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-8">
            <ol className="flex items-center space-x-2">
              <li><a href={`/store/${tenant}`} className="hover:text-gold">Home</a></li>
              <li>/</li>
              <li><a href={`/store/${tenant}/collections`} className="hover:text-gold">Collections</a></li>
              <li>/</li>
              <li>{product.category_name}</li>
              <li>/</li>
              <li className="text-gray-900">{product.name}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden">
                {product.main_image_url ? (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback emoji when no image or image fails to load */}
                <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${product.main_image_url ? 'hidden' : ''}`}>
                  <span className="text-8xl">
                    {product.category_name === 'Rings' ? '💍' : 
                     product.category_name === 'Necklaces' ? '📿' : 
                     product.category_name === 'Earrings' ? '👂' : 
                     product.category_name === 'Crowns' ? '👑' : '💎'}
                  </span>
                </div>
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-gold' : 'border-gray-200'
                      }`}
                    >
                      {image ? (
                        <img
                          src={`http://localhost:8000${image}`}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback emoji when no image or image fails to load */}
                      <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${image ? 'hidden' : ''}`}>
                        <span className="text-2xl">
                          {product.category_name === 'Rings' ? '💍' : 
                           product.category_name === 'Necklaces' ? '📿' : 
                           product.category_name === 'Earrings' ? '👂' : 
                           product.category_name === 'Crowns' ? '👑' : '💎'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category */}
              {product.category_name && (
                <div className="text-sm text-gray-500">{product.category_name}</div>
              )}

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">(4.8 • 127 reviews)</span>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </span>
                  {product.discount_price && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.selling_price)}
                    </span>
                  )}
                  {discountPercentage > 0 && (
                    <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded-full">
                      -{discountPercentage}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Inclusive of all taxes • Free shipping on orders above ₹999
                </p>
              </div>

              {/* Stock Status */}
              <div className="space-y-2">
                {product.is_in_stock ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">In Stock</span>
                    {product.is_low_stock && (
                      <span className="text-orange-600 text-sm">• Only few left!</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-16 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={addToCart}
                  disabled={!product.is_in_stock}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    product.is_in_stock
                      ? 'bg-gold hover:bg-yellow-500 text-gray-900 hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>{product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}</span>
                </button>

                <button
                  onClick={toggleWishlist}
                  className={`w-full py-3 px-6 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    wishlisted
                      ? 'border-red-500 text-red-500 hover:bg-red-50'
                      : 'border-gray-300 text-gray-700 hover:border-gold hover:text-gold'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
                  <span>{wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gray-600">Free shipping on orders above ₹999</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gray-600">BIS Hallmarked quality</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gray-600">30-day easy returns</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gray-600">Try at home available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="mt-16 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'This exquisite piece of jewellery is crafted with precision and designed for elegance. Each piece tells a unique story and is perfect for special occasions.'}
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Specifications</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight</span>
                      <span className="font-medium">{product.weight}g</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material</span>
                      <span className="font-medium">{product.material}</span>
                    </div>
                  )}
                  {product.color && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color</span>
                      <span className="font-medium">{product.color}</span>
                    </div>
                  )}
                  {product.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size</span>
                      <span className="font-medium">{product.size}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions</span>
                      <span className="font-medium">{product.dimensions}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CustomerFooter />
    </CustomerLayout>
  );
} 