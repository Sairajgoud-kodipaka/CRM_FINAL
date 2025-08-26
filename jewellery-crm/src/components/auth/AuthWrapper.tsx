'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function AuthWrapper({ children, requiredRole }: AuthWrapperProps) {
  const { user, isLoading, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthWrapper state:', { user, isLoading, isHydrated });
    
    if (isHydrated && !isLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        console.log(`User role ${user.role} doesn't match required role ${requiredRole}, redirecting`);
        // Redirect to appropriate dashboard based on user role
        const roleRoutes = {
          platform_admin: '/platform/dashboard',
          business_admin: '/business-admin/dashboard',
          store_manager: '/manager/dashboard',
          sales_team: '/sales/dashboard',
          marketing_team: '/marketing/dashboard',
          telecaller: '/telecaller/dashboard',
        };
        
        const redirectPath = roleRoutes[user.role as keyof typeof roleRoutes] || '/dashboard';
        router.push(redirectPath);
        return;
      }
    }
  }, [user, isLoading, isHydrated, requiredRole, router]);

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requiredRole && user.role !== requiredRole) {
    return null; // Will redirect to appropriate dashboard
  }

  return <>{children}</>;
} 