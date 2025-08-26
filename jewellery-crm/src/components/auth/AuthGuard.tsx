'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for hydration to complete
    if (!isHydrated) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // If role is required and user doesn't have it, redirect to appropriate dashboard
    if (requiredRole && user.role !== requiredRole) {
      switch (user.role) {
        case 'platform_admin':
          router.push('/platform/dashboard');
          break;
        case 'business_admin':
          router.push('/business-admin/dashboard');
          break;
        case 'manager':
          router.push('/manager/dashboard');
          break;
        case 'sales_team':
        case 'inhouse_sales':
          router.push('/sales/dashboard');
          break;
        case 'marketing':
          router.push('/marketing/dashboard');
          break;
        case 'tele_calling':
          router.push('/telecaller/dashboard');
          break;
        default:
          router.push('/sales/dashboard');
      }
      return;
    }
  }, [isAuthenticated, user, isHydrated, requiredRole, router]);

  // Show loading while checking authentication
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!isAuthenticated || !user) {
    return null;
  }

  // If role is required and user doesn't have it, don't render children
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
} 