/**
 * ProgressiveDisclosure Component
 *
 * A progressive disclosure component for complex forms and content:
 * - Shows essential information first
 * - Reveals additional details on demand
 * - Mobile-optimized with touch interactions
 * - Accessibility compliant (WCAG 2.1 AA)
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

export interface ProgressiveDisclosureProps {
  children: React.ReactNode;
  className?: string;
  // Disclosure options
  title?: string;
  description?: string;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  // Styling
  variant?: 'default' | 'card' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  // Mobile-specific
  showToggleIcon?: boolean;
  toggleIcon?: 'chevron' | 'plus' | 'custom';
  customToggleIcon?: React.ReactNode;
  // Callbacks
  onToggle?: (expanded: boolean) => void;
}

export function ProgressiveDisclosure({
  children,
  className,
  title,
  description,
  defaultExpanded = false,
  collapsible = true,
  variant = 'default',
  size = 'md',
  showToggleIcon = true,
  toggleIcon = 'chevron',
  customToggleIcon,
  onToggle,
}: ProgressiveDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Handle toggle
  const handleToggle = () => {
    if (!collapsible) return;

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'border border-border rounded-lg bg-card shadow-sm';
      case 'minimal':
        return 'border-b border-border';
      default:
        return 'bg-transparent';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    if (isMobile) {
      switch (size) {
        case 'sm':
          return 'p-3';
        case 'lg':
          return 'p-5';
        default:
          return 'p-4';
      }
    }

    if (isTablet) {
      switch (size) {
        case 'sm':
          return 'p-4';
        case 'lg':
          return 'p-6';
        default:
          return 'p-5';
      }
    }

    // Desktop
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  // Get toggle icon
  const getToggleIcon = () => {
    if (!showToggleIcon) return null;

    if (customToggleIcon) return customToggleIcon;

    switch (toggleIcon) {
      case 'plus':
        return isExpanded ? (
          <Minus className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        );
      case 'chevron':
      default:
        return isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        );
    }
  };

  const containerClasses = cn(
    'transition-all duration-200',
    getVariantClasses(),
    className
  );

  const headerClasses = cn(
    'flex items-center justify-between',
    getSizeClasses(),
    collapsible && 'cursor-pointer hover:bg-muted/50',
    'transition-colors duration-200'
  );

  const contentClasses = cn(
    'overflow-hidden transition-all duration-300',
    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
  );

  const contentInnerClasses = cn(
    getSizeClasses(),
    'pt-0'
  );

  return (
    <div className={containerClasses}>
      {/* Header */}
      {(title || description) && (
        <div
          className={headerClasses}
          onClick={handleToggle}
          role={collapsible ? 'button' : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={(e) => {
            if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={collapsible ? isExpanded : undefined}
          aria-controls={collapsible ? 'progressive-disclosure-content' : undefined}
        >
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={cn(
                'font-semibold text-foreground',
                isMobile ? 'text-base' : 'text-lg'
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn(
                'text-muted-foreground mt-1',
                isMobile ? 'text-sm' : 'text-base'
              )}>
                {description}
              </p>
            )}
          </div>

          {collapsible && (
            <div className="flex-shrink-0 ml-2">
              {getToggleIcon()}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        id="progressive-disclosure-content"
        className={contentClasses}
      >
        <div className={contentInnerClasses}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default ProgressiveDisclosure;
