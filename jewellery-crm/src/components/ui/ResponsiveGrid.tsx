/**
 * ResponsiveGrid Component
 * 
 * A responsive grid component that adapts to different screen sizes:
 * - Mobile (≤768px): Single column or 2 columns for small items
 * - Tablet (768px-1024px): 2-3 columns based on content
 * - Desktop (≥1024px): 3-4 columns based on content
 * 
 * Features:
 * - Automatic responsive breakpoints
 * - Gap control
 * - Item sizing options
 * - Accessibility compliant
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  // Grid configuration
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  // Item sizing
  itemSize?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  // Layout options
  equalHeight?: boolean;
  centerItems?: boolean;
}

export function ResponsiveGrid({
  children,
  className,
  cols = {},
  gap = 'md',
  itemSize = 'auto',
  equalHeight = false,
  centerItems = false,
}: ResponsiveGridProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Determine number of columns based on screen size
  const getCols = () => {
    if (isMobile) return cols.mobile || 1;
    if (isTablet) return cols.tablet || 2;
    return cols.desktop || 3;
  };

  // Get gap classes
  const getGapClasses = () => {
    switch (gap) {
      case 'sm':
        return 'gap-2';
      case 'lg':
        return 'gap-6';
      case 'xl':
        return 'gap-8';
      default:
        return 'gap-4';
    }
  };

  // Get item size classes
  const getItemSizeClasses = () => {
    if (itemSize === 'auto') return '';
    
    const sizeMap = {
      sm: 'min-h-[100px]',
      md: 'min-h-[150px]',
      lg: 'min-h-[200px]',
      xl: 'min-h-[250px]',
    };
    
    return sizeMap[itemSize];
  };

  const numCols = getCols();

  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${numCols}`,
        getGapClasses(),
        equalHeight && 'items-stretch',
        centerItems && 'justify-items-center',
        className
      )}
    >
      {React.Children.map(children, (child) => (
        <div
          className={cn(
            getItemSizeClasses(),
            equalHeight && 'h-full'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export default ResponsiveGrid;