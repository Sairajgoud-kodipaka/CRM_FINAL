/**
 * ResponsiveCard Component
 * 
 * A responsive card component that adapts to different screen sizes:
 * - Mobile (≤768px): Optimized padding and spacing
 * - Tablet (768px-1024px): Medium padding and spacing
 * - Desktop (≥1024px): Full padding and spacing
 * 
 * Features:
 * - Device-aware sizing
 * - Touch-optimized interactions
 * - Accessibility compliant
 * - Flexible content areas
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

export interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  // Card sections
  header?: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  // Styling options
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // Interaction
  clickable?: boolean;
  onClick?: () => void;
  // Mobile-specific
  compact?: boolean;
  fullWidth?: boolean;
}

export function ResponsiveCard({
  children,
  className,
  header,
  title,
  description,
  footer,
  variant = 'default',
  size = 'md',
  clickable = false,
  onClick,
  compact = false,
  fullWidth = false,
}: ResponsiveCardProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'outlined':
        return 'border-2 border-border';
      case 'elevated':
        return 'shadow-lg';
      case 'flat':
        return 'shadow-none border-0';
      default:
        return 'shadow-sm';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    if (compact || isMobile) {
      switch (size) {
        case 'sm':
          return 'p-3';
        case 'lg':
          return 'p-4';
        case 'xl':
          return 'p-5';
        default:
          return 'p-3';
      }
    }
    
    if (isTablet) {
      switch (size) {
        case 'sm':
          return 'p-4';
        case 'lg':
          return 'p-6';
        case 'xl':
          return 'p-8';
        default:
          return 'p-5';
      }
    }
    
    // Desktop
    switch (size) {
      case 'sm':
          return 'p-4';
        case 'lg':
          return 'p-8';
        case 'xl':
          return 'p-10';
        default:
          return 'p-6';
    }
  };

  // Get header size classes
  const getHeaderSizeClasses = () => {
    if (compact || isMobile) {
      return 'p-3 pb-2';
    }
    if (isTablet) {
      return 'p-5 pb-3';
    }
    return 'p-6 pb-4';
  };

  // Get footer size classes
  const getFooterSizeClasses = () => {
    if (compact || isMobile) {
      return 'p-3 pt-2';
    }
    if (isTablet) {
      return 'p-5 pt-3';
    }
    return 'p-6 pt-4';
  };

  const cardClasses = cn(
    'transition-all duration-200',
    getVariantClasses(),
    fullWidth && 'w-full',
    clickable && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
    className
  );

  const contentClasses = cn(
    getSizeClasses()
  );

  const CardComponent = (
    <Card className={cardClasses} onClick={onClick}>
      {/* Header */}
      {(header || title || description) && (
        <CardHeader className={getHeaderSizeClasses()}>
          {header || (
            <>
              {title && (
                <CardTitle className={cn(
                  'text-foreground',
                  compact || isMobile ? 'text-base' : 'text-lg'
                )}>
                  {title}
                </CardTitle>
              )}
              {description && (
                <p className={cn(
                  'text-muted-foreground',
                  compact || isMobile ? 'text-sm' : 'text-base'
                )}>
                  {description}
                </p>
              )}
            </>
          )}
        </CardHeader>
      )}

      {/* Content */}
      <CardContent className={contentClasses}>
        {children}
      </CardContent>

      {/* Footer */}
      {footer && (
        <CardFooter className={getFooterSizeClasses()}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );

  return CardComponent;
}

export default ResponsiveCard;
