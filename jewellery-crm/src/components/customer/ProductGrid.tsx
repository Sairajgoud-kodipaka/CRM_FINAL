'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Product } from '@/lib/api-service';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const params = useParams();
  const tenant = params.tenant as string;
  const [wishlist, setWishlist] = useState<number[]>([]);

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product: Product) => {
    // This will be connected to cart state management
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

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💎</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const isWishlisted = wishlist.includes(product.id);
        const discountPercentage = getDiscountPercentage(product.selling_price, product.discount_price);
        const displayPrice = product.discount_price || product.selling_price;

        return (
          <div key={product.id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
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

              {/* Discount badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  -{discountPercentage}%
                </div>
              )}

              {/* Out of stock badge */}
              {!product.is_in_stock && (
                <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  Out of Stock
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
                <span className="text-xs text-gray-500">(4.5)</span>
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

              {/* Quick info */}
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                {product.weight && <div>Weight: {product.weight}g</div>}
                {product.material && <div>Material: {product.material}</div>}
                {product.is_low_stock && (
                  <div className="text-orange-600 font-medium">Only few left!</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 