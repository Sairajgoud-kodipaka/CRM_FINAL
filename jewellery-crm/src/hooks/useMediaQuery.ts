/**
 * useMediaQuery Hook
 * 
 * Custom React hook for responsive design that listens to CSS media queries.
 * Provides a clean way to conditionally render components based on screen size.
 * 
 * Key Features:
 * - SSR-safe with proper hydration handling
 * - Automatic cleanup of event listeners
 * - TypeScript support
 * - Performance optimized
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to track media query matches
 * 
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean - Whether the media query currently matches
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isLarge = useMediaQuery('(min-width: 1024px)');
 * 
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to prevent hydration mismatch
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define the event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    // Use both methods for broader browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query, mounted]);

  // Return false during SSR and initial render to prevent hydration issues
  return mounted ? matches : false;
}

/**
 * Predefined breakpoint hooks for common use cases
 * These match the Tailwind CSS breakpoints
 */

/**
 * Hook to detect mobile screens (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect tablet screens (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to detect desktop screens (>= 768px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/**
 * Hook to detect large desktop screens (>= 1024px)
 */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to detect extra large screens (>= 1280px)
 */
export function useIsExtraLarge(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/**
 * Hook to detect if the user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect if the user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook to detect touch devices
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

/**
 * Hook to detect high resolution displays
 */
export function useIsHighResolution(): boolean {
  return useMediaQuery('(min-resolution: 2dppx)');
}

/**
 * Comprehensive responsive hook that returns current breakpoint
 */
export function useBreakpoint() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();
  const isExtraLarge = useIsExtraLarge();

  if (isExtraLarge) return 'xl';
  if (isLargeDesktop) return 'lg';
  if (isDesktop) return 'md';
  if (isTablet) return 'sm';
  if (isMobile) return 'xs';
  
  return 'unknown';
}

/**
 * Type for breakpoint values
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'unknown';