'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApiService } from '@/lib/api-service';
import { Product, Category } from '@/lib/api-service';
import { getMockProducts, getMockCategories } from '@/lib/mock-data';
// @ts-ignore
import CustomerHeader from '@/components/customer/CustomerHeader';
// @ts-ignore
import CustomerFooter from '@/components/customer/CustomerFooter';
// @ts-ignore
import HeroSection from '@/components/customer/HeroSection';
// @ts-ignore
import CategoryGrid from '@/components/customer/CategoryGrid';
// @ts-ignore
import FeaturedProducts from '@/components/customer/FeaturedProducts';
// @ts-ignore
import ProductGrid from '@/components/customer/ProductGrid';
// @ts-ignore
import CustomerLayout from '@/components/customer/CustomerLayout';

const apiService = new ApiService();

export default function CustomerStorePage() {
  const params = useParams();
  const tenant = params.tenant as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        setLoading(true);
        
        // Load categories for this tenant
        try {
          const categoriesResponse = await apiService.getTenantCategories(tenant);
          console.log('Categories response:', categoriesResponse);
          if (categoriesResponse.success && categoriesResponse.data) {
            // Handle paginated response
            let categoriesData: Category[];
            if (categoriesResponse.data && typeof categoriesResponse.data === 'object' && 'results' in categoriesResponse.data) {
              // Paginated response
              categoriesData = (categoriesResponse.data as any).results;
            } else if (Array.isArray(categoriesResponse.data)) {
              // Direct array response
              categoriesData = categoriesResponse.data;
            } else {
              categoriesData = [];
            }
            setCategories(categoriesData);
          } else {
            console.warn('Categories API failed, using mock data');
            setCategories(getMockCategories(tenant));
          }
        } catch (error) {
          console.warn('Categories API error, using mock data:', error);
          setCategories(getMockCategories(tenant));
        }

        // Load all products for this tenant
        try {
          const productsResponse = await apiService.getTenantProducts(tenant);
          console.log('Products response:', productsResponse);
          if (productsResponse.success && productsResponse.data) {
            // Handle paginated response
            let productsData: Product[];
            if (productsResponse.data && typeof productsResponse.data === 'object' && 'results' in productsResponse.data) {
              // Paginated response
              productsData = (productsResponse.data as any).results;
            } else if (Array.isArray(productsResponse.data)) {
              // Direct array response
              productsData = productsResponse.data;
            } else {
              productsData = [];
            }
            
            setProducts(productsData);
            
            // Filter featured products
            const featured = productsData.filter((product: Product) => product.is_featured);
            setFeaturedProducts(featured);
          } else {
            console.warn('Products API failed, using mock data');
            const mockProducts = getMockProducts(tenant);
            setProducts(mockProducts);
            const featured = mockProducts.filter((product: Product) => product.is_featured);
            setFeaturedProducts(featured);
          }
        } catch (error) {
          console.warn('Products API error, using mock data:', error);
          const mockProducts = getMockProducts(tenant);
          setProducts(mockProducts);
          const featured = mockProducts.filter((product: Product) => product.is_featured);
          setFeaturedProducts(featured);
        }
      } catch (error) {
        console.error('Error loading store data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tenant) {
      loadStoreData();
    }
  }, [tenant]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_name === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <main className="min-h-screen">
        <HeroSection />
        
        <section className="py-12 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Shop by Category
            </h2>
            <CategoryGrid 
              categories={categories}
              onCategorySelect={setSelectedCategory}
              selectedCategory={selectedCategory}
            />
          </div>
        </section>

        {featuredProducts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Featured Collection
              </h2>
              <FeaturedProducts products={featuredProducts} />
            </div>
          </section>
        )}

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedCategory ? `${selectedCategory} Collection` : 'All Products'}
              </h2>
              <span className="text-gray-600">
                {filteredProducts.length} products
              </span>
            </div>
            <ProductGrid products={filteredProducts} />
          </div>
        </section>
      </main>

      <CustomerFooter />
    </CustomerLayout>
  );
} 