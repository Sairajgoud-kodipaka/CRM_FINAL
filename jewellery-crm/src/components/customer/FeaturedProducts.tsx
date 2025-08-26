'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Product } from '@/lib/api-service';
import { Heart, ShoppingCart, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const params = useParams();
  const tenant = params.tenant as string;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlist, setWishlist] = useState<number[]>([]);

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product: Product) => {
    console.log('Adding to cart:', product);
  };

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / 4));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(products.length / 4)) % Math.ceil(products.length / 4));
  };

  const startIndex = currentSlide * 4;
  const visibleProducts = products.slice(startIndex, startIndex + 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {products.length > 4 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleProducts.map((product) => {
          const isWishlisted = wishlist.includes(product.id);
          const discountPercentage = getDiscountPercentage(product.selling_price, product.discount_price);
          const displayPrice = product.discount_price || product.selling_price;

          return (
            <div key={product.id} className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                {product.main_image_url ? (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                  <span className="text-6xl">
                    {product.category_name === 'Rings' ? '💍' : 
                     product.category_name === 'Necklaces' ? '📿' : 
                     product.category_name === 'Earrings' ? '👂' : 
                     product.category_name === 'Crowns' ? '👑' : '💎'}
                  </span>
                </div>
                
                {/* Image overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isWishlisted 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  
                  <Link
                    href={`/store/${tenant}/product/${product.id}`}
                    className="w-10 h-10 rounded-full bg-white text-gray-600 hover:bg-gold hover:text-white flex items-center justify-center transition-all duration-200"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>

                {/* Featured badge */}
                <div className="absolute top-3 left-3 bg-gold text-gray-900 text-xs font-semibold px-2 py-1 rounded-full">
                  Featured
                </div>

                {/* Discount badge */}
                {discountPercentage > 0 && (
                  <div className="absolute top-3 left-12 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    -{discountPercentage}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Category */}
                {product.category_name && (
                  <div className="text-xs text-gray-500 mb-1">{product.category_name}</div>
                )}

                {/* Product Name */}
                <Link href={`/store/${tenant}/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-gold transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">(4.8)</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </span>
                  {product.discount_price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.selling_price)}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.is_in_stock}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    product.is_in_stock
                      ? 'bg-gold hover:bg-yellow-500 text-gray-900 hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots indicator */}
      {products.length > 4 && (
        <div className="flex justify-center mt-8 space-x-2">
          {[...Array(Math.ceil(products.length / 4))].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide ? 'bg-gold' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 