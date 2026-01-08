/**
 * Main Application Layout Component
 *
 * This component provides the overall layout structure for the CRM application,
 * featuring a HubSpot-inspired design with a dark navy sidebar and main content area.
 *
 * Key Features:
 * - Responsive design that adapts to mobile and desktop
 * - Fixed sidebar navigation
 * - Role-based content rendering
 * - Mobile-friendly bottom navigation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar, useSidebarState } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
// Performance dashboard removed from UI

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppLayout Component
 *
 * Provides the main layout structure with sidebar navigation and content area.
 * Automatically handles responsive behavior and mobile navigation.
 *
 * @param children - The main content to render
 * @param className - Additional CSS classes
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const { sidebarOpen, toggleSidebar, isDesktop } = useSidebarState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  return (
    <div className={cn('min-h-screen bg-background overflow-x-hidden', className)}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className={cn(
        'transition-all duration-300 ease-in-out min-h-0 flex flex-col flex-1',
        'lg:ml-60'
      )}>
        {/* Header */}
        <Header
          onSidebarToggle={toggleSidebar}
          showSidebarToggle={isMobile || isTablet}
        />

        {/* Main Content */}
        <main className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          'p-3 sm:p-5 md:p-6',
          isMobile ? 'pb-20' : 'pb-6',
          'scrollbar-hide'
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      {mounted && isMobile && (
        <MobileNav />
      )}

      {/* Performance Dashboard removed as per requirement */}
    </div>
  );
}

/**
 * Dashboard Layout Wrapper
 *
 * A specialized layout for dashboard pages with consistent spacing and styling.
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground text-sm sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Container Component
 *
 * Provides consistent spacing and max-width for content sections.
 */
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({
  children,
  className,
  size = 'full'
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Card Container Component
 *
 * A reusable card component following HubSpot design patterns.
 */
interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardContainer({
  children,
  className,
  title,
  subtitle,
  actions,
  padding = 'md'
}: CardContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(
      'bg-card border border-border rounded-lg shadow-sm',
      className
    )}>
      {/* Card Header */}
      {(title || subtitle || actions) && (
        <div className={cn(
          'border-b border-border',
          padding === 'none' ? 'p-6 pb-4' : paddingClasses[padding]
        )}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <h3 className="text-lg font-medium text-card-foreground">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
}

/**
 * Page Loading Component
 *
 * Displays a loading state with skeleton UI elements.
 */
export function PageLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 *
 * Displays when there's no data to show.
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}
