'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenant-config';

export default function HeroSection() {
  const params = useParams();
  const tenant = params.tenant as string;
  const tenantConfig = getTenantConfig(tenant);

  return (
    <section className="relative bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Welcome to {tenantConfig.displayName}
                <span className="block text-gold">Jewelleries</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                {tenantConfig.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href={`/store/${tenant}/collections`}
                className="bg-gold hover:bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 inline-flex items-center justify-center"
              >
                Shop Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                href={`/store/${tenant}/collections/rings`}
                className="border-2 border-white hover:border-gold text-white hover:text-gold px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 inline-flex items-center justify-center"
              >
                View Rings
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm">Certified Quality</h3>
                <p className="text-xs text-gray-400">BIS Hallmarked</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm">Free Shipping</h3>
                <p className="text-xs text-gray-400">Above ₹999</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm">30-Day Returns</h3>
                <p className="text-xs text-gray-400">Easy Exchange</p>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-gold to-yellow-500 rounded-full w-80 h-80 mx-auto flex items-center justify-center shadow-2xl">
                <div className="text-center text-gray-900">
                  <div className="text-6xl mb-4">💎</div>
                  <h3 className="text-2xl font-bold">Exquisite Collection</h3>
                  <p className="text-lg">Handcrafted with Love</p>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-2xl">💍</span>
            </div>
            <div className="absolute bottom-20 right-10 w-12 h-12 bg-gold rounded-full shadow-lg flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div className="absolute top-1/2 -left-5 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-sm">💎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-auto">
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            opacity=".25" 
            className="fill-white"
          />
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19.84,81.84-31.12,126.2-31.12,36.2,0,72.1,8.75,106.84,25.86,35.07,17.19,68.73,42.13,102.08,64.73,39.59,27.69,79.82,41.18,121.11,41.18,26.56,0,52.85-5.37,78.84-15.49,28.81-11.05,55.31-26.07,80.17-43.59,30.93-21.69,60.5-47.13,88.22-74.51,26.13-25.93,50.88-53.67,74.19-82.69V0Z" 
            opacity=".5" 
            className="fill-white"
          />
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-white"
          />
        </svg>
      </div>
    </section>
  );
} 