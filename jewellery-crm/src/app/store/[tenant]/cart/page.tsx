'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/lib/api-service';
import CustomerLayout from '@/components/customer/CustomerLayout';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { Trash2, Plus, Minus, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart items from localStorage or state management
    const loadCartItems = () => {
      // This would typically load from a cart state management system
      // For now, we'll use mock data
      setCartItems([
        {
          product: {
            id: 1,
            name: "Diamond Ring",
            sku: "DR001",
            description: "Beautiful diamond ring",
            category: 1,
            category_name: "Rings",
            brand: "Premium Jewellery",
            cost_price: 50000,
            selling_price: 75000,
            discount_price: 65000,
            quantity: 10,
            min_quantity: 1,
            max_quantity: 10,
            weight: 5.2,
            dimensions: "18mm x 18mm",
            material: "18K Gold",
            color: "Yellow Gold",
            size: "18",
            is_featured: true,
            is_bestseller: true,
            main_image: "ring1.jpg",
            additional_images: ["ring1_2.jpg", "ring1_3.jpg"],
            meta_title: "Diamond Ring",
            meta_description: "Beautiful diamond ring",
            tags: ["diamond", "ring", "gold"],
            tenant: 1,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
            is_in_stock: true,
            is_low_stock: false,
            current_price: 65000,
            profit_margin: 30,
            variant_count: 1
          },
          quantity: 1
        },
        {
          product: {
            id: 2,
            name: "Gold Necklace",
            sku: "GN001",
            description: "Elegant gold necklace",
            category: 2,
            category_name: "Necklaces",
            brand: "Premium Jewellery",
            cost_price: 30000,
            selling_price: 45000,
            discount_price: 40000,
            quantity: 5,
            min_quantity: 1,
            max_quantity: 5,
            weight: 12.5,
            dimensions: "45cm",
            material: "22K Gold",
            color: "Yellow Gold",
            size: "Standard",
            is_featured: false,
            is_bestseller: true,
            main_image: "necklace1.jpg",
            additional_images: ["necklace1_2.jpg"],
            meta_title: "Gold Necklace",
            meta_description: "Elegant gold necklace",
            tags: ["gold", "necklace"],
            tenant: 1,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
            is_in_stock: true,
            is_low_stock: true,
            current_price: 40000,
            profit_margin: 25,
            variant_count: 1
          },
          quantity: 2
        }
      ]);
      setLoading(false);
    };

    loadCartItems();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product.discount_price || item.product.selling_price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getShippingCost = () => {
    const subtotal = getSubtotal();
    return subtotal >= 999 ? 0 : 200;
  };

  const getTotal = () => {
    return getSubtotal() + getShippingCost();
  };

  const proceedToCheckout = () => {
    router.push(`/store/${tenant}/checkout`);
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
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Continue Shopping</span>
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some beautiful jewellery to your cart!</p>
              <button
                onClick={() => router.push(`/store/${tenant}`)}
                className="bg-gold hover:bg-yellow-500 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const price = item.product.discount_price || item.product.selling_price;
                  const originalPrice = item.product.selling_price;
                  const discountPercentage = originalPrice && item.product.discount_price 
                    ? Math.round(((originalPrice - item.product.discount_price) / originalPrice) * 100)
                    : 0;

                  return (
                    <div key={item.product.id} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-3xl">{item.product.main_image ? '🖼️' : '💎'}</span>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">
                                {item.product.category_name} • SKU: {item.product.sku}
                              </p>
                              
                              {/* Price */}
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-lg font-bold text-gray-900">
                                  {formatPrice(price)}
                                </span>
                                {item.product.discount_price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(originalPrice)}
                                  </span>
                                )}
                                {discountPercentage > 0 && (
                                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                    -{discountPercentage}%
                                  </span>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => removeItem(item.product.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Total Price */}
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatPrice(price * item.quantity)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} × {formatPrice(price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(getSubtotal())}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {getShippingCost() === 0 ? 'Free' : formatPrice(getShippingCost())}
                      </span>
                    </div>
                    
                    {getShippingCost() > 0 && (
                      <div className="text-sm text-gray-500">
                        Add ₹{999 - getSubtotal()} more for free shipping
                      </div>
                    )}
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatPrice(getTotal())}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Inclusive of all taxes</p>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={proceedToCheckout}
                    className="w-full bg-gold hover:bg-yellow-500 text-gray-900 py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 mt-6 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Proceed to Checkout</span>
                  </button>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Truck className="w-5 h-5 text-gold" />
                      <span>Free shipping on orders above ₹999</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Shield className="w-5 h-5 text-gold" />
                      <span>Secure payment processing</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="text-gold">✓</span>
                      <span>30-day easy returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <CustomerFooter />
    </CustomerLayout>
  );
} 