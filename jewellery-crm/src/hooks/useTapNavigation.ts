/**
 * useTapNavigation Hook
 * 
 * Custom hook for handling single tap (view) and double tap (edit) navigation on mobile devices.
 * Provides consistent tap detection logic across all table-based pages.
 * 
 * @param onView - Callback for single tap/view action
 * @param onEdit - Callback for double tap/edit action
 * @param isMobile - Whether the device is mobile (from useIsMobile hook)
 * @returns Object with handleRowClick and handleRowDoubleClick handlers
 * 
 * @example
 * ```tsx
 * const { handleRowClick, handleRowDoubleClick } = useTapNavigation(
 *   (item) => handleViewItem(item),
 *   (item) => handleEditItem(item),
 *   isMobile
 * );
 * 
 * <tr onClick={() => handleRowClick(item)} onDoubleClick={() => handleRowDoubleClick(item)}>
 * ```
 */

'use client';

import { useRef, useCallback } from 'react';

export function useTapNavigation<T>(
  onView: (item: T) => void,
  onEdit: (item: T) => void,
  isMobile: boolean
) {
  const clickTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const isEditModeRef = useRef<boolean>(false);

  const handleRowClick = useCallback((item: T) => {
    if (isMobile) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      
      if (timeSinceLastTap > 0 && timeSinceLastTap < 300) {
        // Double tap detected - cancel single tap and open edit
        lastTapRef.current = 0;
        if (clickTimeoutRef.current) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        // Set flag immediately to prevent view from opening
        isEditModeRef.current = true;
        // Open edit
        onEdit(item);
        return;
      }

      // First tap - set timeout for single tap
      lastTapRef.current = now;
      // Reset flag for new tap sequence
      isEditModeRef.current = false;
      
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = window.setTimeout(() => {
        // Only open view if we haven't already opened edit (double tap didn't happen)
        if (!isEditModeRef.current) {
          onView(item);
        }
        clickTimeoutRef.current = null;
        lastTapRef.current = 0;
      }, 300);
    } else {
      // Desktop: single click opens view
      onView(item);
    }
  }, [onView, onEdit, isMobile]);

  const handleRowDoubleClick = useCallback((item: T) => {
    // Cancel any pending single tap
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    lastTapRef.current = 0;
    isEditModeRef.current = true;
    // Open edit
    onEdit(item);
  }, [onEdit]);

  return {
    handleRowClick,
    handleRowDoubleClick,
  };
}

