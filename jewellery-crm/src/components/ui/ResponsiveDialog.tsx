/**
 * ResponsiveDialog Component
 * 
 * A responsive dialog component that adapts to different screen sizes:
 * - Mobile (≤768px): Full-screen modal
 * - Tablet (768px-1024px): Centered modal with proper sizing
 * - Desktop (≥1024px): Standard modal with max-width
 * 
 * Features:
 * - Touch-optimized interactions
 * - Proper backdrop handling
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Smooth animations and transitions
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';
import { useModal } from '@/contexts/ModalContext';

export interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  // Mobile-specific props
  fullScreen?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  // Size variants
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  // Action buttons
  actions?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

// Backdrop Component
function Backdrop({ 
  onClick, 
  className 
}: { 
  onClick?: () => void; 
  className?: string; 
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-background/80 backdrop-blur-sm',
        'transition-opacity duration-300',
        className
      )}
      onClick={onClick}
    />
  );
}

// Dialog Content Component
function DialogContent({ 
  children, 
  className, 
  size = 'md',
  isMobile,
  isTablet,
  isDesktop 
}: { 
  children: React.ReactNode; 
  className?: string; 
  size: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}) {
  const getSizeClasses = () => {
    if (isMobile) {
      return 'w-full h-full max-w-none max-h-none rounded-none';
    }
    
    if (isTablet) {
      switch (size) {
        case 'sm':
          return 'w-full max-w-md';
        case 'lg':
          return 'w-full max-w-2xl';
        case 'xl':
          return 'w-full max-w-4xl';
        case 'full':
          return 'w-full h-full max-w-none max-h-none rounded-none';
        default:
          return 'w-full max-w-lg';
      }
    }
    
    // Desktop
    switch (size) {
      case 'sm':
        return 'w-full max-w-sm';
      case 'lg':
        return 'w-full max-w-3xl';
      case 'xl':
          return 'w-full max-w-5xl';
      case 'full':
        return 'w-full h-full max-w-none max-h-none rounded-none';
      default:
        return 'w-full max-w-lg';
    }
  };

  return (
    <div
      className={cn(
        'bg-background border border-border shadow-lg',
        'transition-all duration-300',
        getSizeClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}

// Main ResponsiveDialog Component
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  fullScreen = false,
  showCloseButton = true,
  closeOnBackdrop = true,
  size = 'md',
  actions,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { openModal, closeModal } = useModal();

  // Handle escape key and modal state
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      // Notify that a modal is open
      openModal();
    } else {
      // Notify that modal is closed
      closeModal();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      // Clean up modal state when component unmounts
      if (open) {
        closeModal();
      }
    };
  }, [open, onOpenChange, openModal, closeModal]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onOpenChange(false);
    }
  };

  // Handle confirm action
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onOpenChange(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  // Determine if dialog should be full screen
  const shouldBeFullScreen = fullScreen || (isMobile && size === 'full');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <Backdrop onClick={handleBackdropClick} />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-50 flex flex-col',
          shouldBeFullScreen 
            ? 'w-full h-full' 
            : 'max-h-[90vh]',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        <DialogContent
          size={size}
          isMobile={isMobile}
          isTablet={isTablet}
          isDesktop={isDesktop}
          className={cn(
            'flex flex-col',
            shouldBeFullScreen ? 'h-full' : 'max-h-full overflow-hidden'
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={cn(
              'flex items-center justify-between p-4 border-b border-border',
              shouldBeFullScreen && 'p-6'
            )}>
              <div className="flex-1 min-w-0">
                {title && (
                  <h2 
                    id="dialog-title"
                    className={cn(
                      'font-semibold text-foreground',
                      shouldBeFullScreen ? 'text-xl' : 'text-lg'
                    )}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p 
                    id="dialog-description"
                    className="text-sm text-muted-foreground mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex-shrink-0',
                    shouldBeFullScreen ? 'h-10 w-10' : 'h-8 w-8'
                  )}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            shouldBeFullScreen ? 'p-6' : 'p-4',
            // Add bottom padding to ensure content doesn't hide behind sticky buttons
            'pb-20'
          )}>
            {children}
          </div>

          {/* Actions - Sticky at Bottom */}
          {(actions || onConfirm || onCancel) && (
            <div className={cn(
              'sticky bottom-0 bg-background border-t border-border',
              'flex items-center justify-end gap-3 p-4',
              shouldBeFullScreen ? 'p-6' : 'p-4',
              // Ensure buttons are always visible
              'z-10 shadow-lg'
            )}>
              {actions || (
                <>
                  {onCancel && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      {cancelLabel}
                    </Button>
                  )}
                  {onConfirm && (
                    <Button
                      onClick={handleConfirm}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : confirmLabel}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </div>
    </div>
  );
}

export default ResponsiveDialog;
