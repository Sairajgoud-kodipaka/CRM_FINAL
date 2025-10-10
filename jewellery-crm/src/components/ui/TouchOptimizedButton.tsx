/**
 * TouchOptimizedButton Component
 * 
 * A touch-optimized button component designed for mobile devices:
 * - Minimum 44px touch target (Apple HIG compliance)
 * - Proper spacing and sizing for different screen sizes
 * - Touch feedback and animations
 * - Accessibility compliant (WCAG 2.1 AA)
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

export interface TouchOptimizedButtonProps extends Omit<ButtonProps, 'size'> {
  // Touch-specific props
  touchTarget?: 'sm' | 'md' | 'lg' | 'xl';
  // Size variants
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // Mobile-specific
  fullWidth?: boolean;
  // Animation options
  hapticFeedback?: boolean;
  pressAnimation?: boolean;
}

export function TouchOptimizedButton({
  children,
  className,
  touchTarget = 'md',
  size = 'md',
  fullWidth = false,
  hapticFeedback = true,
  pressAnimation = true,
  onClick,
  ...props
}: TouchOptimizedButtonProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Get touch target size classes
  const getTouchTargetClasses = () => {
    if (!isMobile && !isTablet) return ''; // Desktop doesn't need touch targets
    
    switch (touchTarget) {
      case 'sm':
        return 'min-h-[44px] min-w-[44px]';
      case 'lg':
        return 'min-h-[56px] min-w-[56px]';
      case 'xl':
        return 'min-h-[64px] min-w-[64px]';
      default:
        return 'min-h-[48px] min-w-[48px]';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    if (isMobile) {
      switch (size) {
        case 'sm':
          return 'px-3 py-2 text-sm';
        case 'lg':
          return 'px-6 py-4 text-lg';
        case 'xl':
          return 'px-8 py-5 text-xl';
        default:
          return 'px-4 py-3 text-base';
      }
    }
    
    if (isTablet) {
      switch (size) {
        case 'sm':
          return 'px-3 py-2 text-sm';
        case 'lg':
          return 'px-5 py-3 text-lg';
        case 'xl':
          return 'px-6 py-4 text-xl';
        default:
          return 'px-4 py-2 text-base';
      }
    }
    
    // Desktop
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-lg';
      case 'xl':
        return 'px-6 py-3 text-xl';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  // Handle click with haptic feedback
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback for mobile devices
    if (hapticFeedback && isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10); // Short vibration
    }
    
    onClick?.(e);
  };

  const buttonClasses = cn(
    // Base classes
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    
    // Touch target classes
    getTouchTargetClasses(),
    
    // Size classes
    getSizeClasses(),
    
    // Full width
    fullWidth && 'w-full',
    
    // Press animation
    pressAnimation && 'active:scale-[0.98]',
    
    // Mobile-specific optimizations
    isMobile && 'touch-manipulation', // Optimize for touch
    
    className
  );

  return (
    <Button
      {...props}
      className={buttonClasses}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}

export default TouchOptimizedButton;
