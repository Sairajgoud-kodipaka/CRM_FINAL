/**
 * Mobile Navigation Component
 *
 * Bottom navigation bar for mobile devices with key CRM actions.
 * Provides quick access to essential features on mobile screens.
 *
 * Key Features:
 * - Fixed bottom navigation for mobile
 * - Touch-friendly 44px minimum touch targets
 * - Active state highlighting
 * - Badge notifications for important items
 * - Smooth animations
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  TrendingUp,
  Calendar,
  Menu,
  BarChart3,
  Store,
  Package,
  Phone,
  CreditCard,
  Settings,
  User,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/contexts/ModalContext';

interface MobileNavProps {
  className?: string;
}

/**
 * Get mobile navigation items based on user role
 */
const getMobileNavItems = (role: string) => {
  switch (role) {
    case 'business_admin':
      return [
        {
          title: 'Dashboard',
          href: '/business-admin/dashboard',
          icon: Home,
        },
        {
          title: 'Customers',
          href: '/business-admin/customers',
          icon: Users,
        },
        {
          title: 'Pipeline',
          href: '/business-admin/pipeline',
          icon: TrendingUp,
          badge: '12',
        },
        // Replace Settings with Appointments in Business Admin mobile nav
        {
          title: 'Appointments',
          href: '/business-admin/appointments',
          icon: Calendar,
          badge: '3',
        },
      ];

    case 'manager':
      return [
        {
          title: 'Dashboard',
          href: '/manager/dashboard',
          icon: Home,
        },
        {
          title: 'Customers',
          href: '/manager/customers',
          icon: Users,
        },
        {
          title: 'Pipeline',
          href: '/manager/pipeline',
          icon: TrendingUp,
          badge: '8',
        },
        {
          title: 'Appointments',
          href: '/manager/appointments',
          icon: Calendar,
          badge: '3',
        },
        {
          title: 'Profile',
          href: '/manager/profile',
          icon: User,
        },
      ];

    case 'sales':
    case 'inhouse_sales':
      return [
        {
          title: 'Dashboard',
          href: '/sales/dashboard',
          icon: Home,
        },
        {
          title: 'Customers',
          href: '/sales/customers',
          icon: Users,
        },
        {
          title: 'Pipeline',
          href: '/sales/pipeline',
          icon: TrendingUp,
          badge: '12',
        },
        {
          title: 'Appointments',
          href: '/sales/appointments',
          icon: Calendar,
          badge: '3',
        },
        {
          title: 'Profile',
          href: '/sales/profile',
          icon: User,
        },
      ];

    case 'telecaller':
      return [
        {
          title: 'Dashboard',
          href: '/telecaller/dashboard',
          icon: Home,
        },
        {
          title: 'Leads',
          href: '/telecaller/customers',
          icon: Users,
        },
        {
          title: 'Call Center',
          href: '/telecaller/call',
          icon: Phone,
        },
        {
          title: 'Pipeline',
          href: '/telecaller/pipeline',
          icon: TrendingUp,
          badge: '5',
        },
        {
          title: 'Profile',
          href: '/telecaller/profile',
          icon: User,
        },
      ];

    case 'marketing':
      return [
        {
          title: 'Dashboard',
          href: '/marketing/dashboard',
          icon: Home,
        },
        // Analytics removed from mobile nav for Marketing
        {
          title: 'Store',
          href: '/marketing/store',
          icon: Store,
        },
        {
          title: 'Products',
          href: '/marketing/products',
          icon: Package,
        },
        {
          title: 'Support',
          href: '/marketing/support',
          icon: MessageSquare,
        },
      ];

    case 'platform_admin':
      return [
        {
          title: 'Dashboard',
          href: '/platform/dashboard',
          icon: Home,
        },
        {
          title: 'Tenants',
          href: '/platform/tenants',
          icon: Users,
        },
        {
          title: 'Pipeline',
          href: '/platform/pipeline',
          icon: TrendingUp,
        },
        {
          title: 'Billing',
          href: '/platform/billing',
          icon: CreditCard,
        },
        {
          title: 'Settings',
          href: '/platform/settings',
          icon: Settings,
        },
      ];

    default:
      return [
        {
          title: 'Dashboard',
          href: '/sales/dashboard',
          icon: Home,
        },
        {
          title: 'Customers',
          href: '/sales/customers',
          icon: Users,
        },
        {
          title: 'Pipeline',
          href: '/sales/pipeline',
          icon: TrendingUp,
        },
        {
          title: 'Appointments',
          href: '/sales/appointments',
          icon: Calendar,
        },
        {
          title: 'Profile',
          href: '/sales/profile',
          icon: User,
        },
      ];
  }
};

/**
 * MobileNav Component
 *
 * Renders bottom navigation for mobile devices with essential CRM actions.
 */
export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isAnyModalOpen, hideMobileNav } = useModal();

  // Get role-based navigation items
  const mobileNavItems = getMobileNavItems(user?.role || 'sales');

  /**
   * Check if the current route matches a nav item
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname?.startsWith(href) ?? false;
  };

  // Fully unmount when explicit hide flag is enabled (e.g., Add Customer full-screen modal)
  if (hideMobileNav) {
    return null;
  }

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border',
      'safe-area-bottom',
      'shadow-lg',
      'transition-transform duration-300 ease-in-out',
      isAnyModalOpen ? 'translate-y-full' : 'translate-y-0',
      className
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center',
                'min-w-[44px] min-h-[44px] px-3 py-2',
                'text-xs font-medium transition-colors duration-200',
                'relative group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Icon with badge */}
              <div className="relative">
                <item.icon className={cn(
                  'h-5 w-5 mb-1 transition-transform duration-200',
                  'group-active:scale-95'
                )} />

                {/* Badge for notifications */}
                {item.badge && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      'absolute -top-2 -right-2 h-4 w-4 text-xs p-0',
                      'flex items-center justify-center',
                      'min-w-[16px] rounded-full'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                'text-xs leading-none truncate max-w-[60px]',
                isActive && 'font-semibold'
              )}>
                {item.title}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile Menu Overlay Component
 *
 * Full-screen overlay menu for mobile "More" section
 */
interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenuOverlay({ isOpen, onClose }: MobileMenuOverlayProps) {
  if (!isOpen) return null;

  const { user } = useAuth();
  const userRole = user?.role || 'sales';

  // Get role-specific menu items
  const getMenuItems = (role: string) => {
    const basePath = role === 'business_admin' ? '/business-admin' :
                    role === 'manager' ? '/manager' :
                    role === 'sales' || role === 'inhouse_sales' ? '/sales' :
                    role === 'telecaller' ? '/telecaller' :
                    role === 'marketing' ? '/marketing' :
                    role === 'platform_admin' ? '/platform' : '/sales';

    return [
      { title: 'Products', href: `${basePath}/products`, icon: '📦' },
      { title: 'E-commerce', href: `${basePath}/ecommerce`, icon: '🌐' },
      // Analytics removed from mobile menu overlay
      { title: 'WhatsApp', href: `${basePath}/whatsapp`, icon: '💬' },
      { title: 'Payments', href: `${basePath}/payments`, icon: '💳' },
      { title: 'Settings', href: `${basePath}/settings`, icon: '⚙️' },
    ];
  };

  const menuItems = getMenuItems(userRole);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Menu Content */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-lg">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-8 h-1 bg-muted rounded-full" />
        </div>

        {/* Menu Items */}
        <div className="px-4 pb-8">
          <h3 className="text-lg font-semibold mb-4">Menu</h3>

          <div className="grid grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'p-4 rounded-lg border border-border',
                  'bg-card hover:bg-accent transition-colors',
                  'min-h-[80px] text-center'
                )}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
