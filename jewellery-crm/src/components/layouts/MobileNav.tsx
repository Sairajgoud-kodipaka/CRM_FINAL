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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobileNavProps {
  className?: string;
}

/**
 * Mobile navigation items
 * Limited to 5 items for optimal mobile UX
 */
const mobileNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: TrendingUp,
    badge: '12',
  },
  {
    title: 'Calendar',
    href: '/appointments',
    icon: Calendar,
    badge: '3',
  },
  {
    title: 'More',
    href: '/menu',
    icon: Menu,
  },
];

/**
 * MobileNav Component
 * 
 * Renders bottom navigation for mobile devices with essential CRM actions.
 */
export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  /**
   * Check if the current route matches a nav item
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (href === '/menu') {
      // Menu is active for routes not covered by other nav items
      const coveredRoutes = ['/dashboard', '/customers', '/sales', '/appointments'];
      return !coveredRoutes.some(route => 
        route === '/dashboard' 
          ? (pathname === '/dashboard' || pathname === '/') 
          : pathname.startsWith(route)
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={cn(
      'bg-background border-t border-border',
      'safe-area-bottom', // Handle devices with home indicator
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

  const menuItems = [
    { title: 'Products', href: '/products', icon: '📦' },

    { title: 'E-commerce', href: '/ecommerce', icon: '🌐' },
    { title: 'Analytics', href: '/analytics', icon: '📊' },
    { title: 'WhatsApp', href: '/whatsapp', icon: '💬' },
    { title: 'Payments', href: '/payments', icon: '💳' },
    { title: 'Settings', href: '/settings', icon: '⚙️' },
  ];

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