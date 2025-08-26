'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService } from '@/lib/api-service';
import { getAllTenants, TenantConfig } from '@/lib/tenant-config';

const apiService = new ApiService();

export default function HomePage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load tenant configurations
    const tenantConfigs = getAllTenants();
    setTenants(tenantConfigs);
    setLoading(false);
  }, []);

  const handleTenantSelect = (tenantCode: string) => {
    router.push(`/store/${tenantCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">💎</div>
          <h1 className="text-4xl font-bold mb-4">Jewellery CRM</h1>
          <p className="text-xl mb-8">Loading stores...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <div className="text-6xl mb-4">💎</div>
          <h1 className="text-5xl font-bold mb-4">Jewellery Stores</h1>
          <p className="text-xl text-gray-300">Select a store to browse</p>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center text-white">
            <p className="text-xl mb-4">No stores available</p>
            <p className="text-gray-400">Please contact your administrator to set up stores.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant.id)}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/20 border border-white/20"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{tenant.logo}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tenant.displayName}</h3>
                  {tenant.description && (
                    <p className="text-gray-300 mb-4">{tenant.description}</p>
                  )}
                  <div className="bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium">
                    {tenant.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Demo stores for testing */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Demo Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div
              onClick={() => handleTenantSelect('mandeep')}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/20 border border-white/20"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💍</div>
                <h3 className="text-2xl font-bold text-white mb-2">Mandeep Jewelleries</h3>
                <p className="text-gray-300 mb-4">Premium jewellery collection</p>
                <div className="bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium">
                  mandeep
                </div>
              </div>
            </div>

            <div
              onClick={() => handleTenantSelect('royal')}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/20 border border-white/20"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">👑</div>
                <h3 className="text-2xl font-bold text-white mb-2">Royal Jewellers</h3>
                <p className="text-gray-300 mb-4">Luxury jewellery boutique</p>
                <div className="bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium">
                  royal
                </div>
              </div>
            </div>

            <div
              onClick={() => handleTenantSelect('diamond')}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/20 border border-white/20"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-2xl font-bold text-white mb-2">Diamond Palace</h3>
                <p className="text-gray-300 mb-4">Exclusive diamond collection</p>
                <div className="bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium">
                  diamond
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
