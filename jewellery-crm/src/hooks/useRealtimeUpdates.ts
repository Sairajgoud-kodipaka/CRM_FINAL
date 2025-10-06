import { useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/lib/api-service';

interface UseRealtimeUpdatesOptions {
  onClientCreated?: (data: any) => void;
  onClientUpdated?: (data: any) => void;
  onClientDeleted?: (data: any) => void;
  onCacheInvalidated?: (keys: string[]) => void;
  patterns?: string[];
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    onClientCreated,
    onClientUpdated,
    onClientDeleted,
    onCacheInvalidated,
    patterns = ['/clients/']
  } = options;

  const listenersRef = useRef<(() => void)[]>([]);

  const handleCacheInvalidation = useCallback((keys: string[]) => {
    const relevantKeys = keys.filter(key => 
      patterns.some(pattern => key.includes(pattern))
    );
    
    if (relevantKeys.length > 0) {
      console.log('🔄 Relevant cache invalidated:', relevantKeys);
      onCacheInvalidated?.(relevantKeys);
    }
  }, [patterns, onCacheInvalidated]);

  const handleClientCreated = useCallback((data: any) => {
    console.log('🆕 Client created:', data);
    onClientCreated?.(data);
  }, [onClientCreated]);

  const handleClientUpdated = useCallback((data: any) => {
    console.log('✏️ Client updated:', data);
    onClientUpdated?.(data);
  }, [onClientUpdated]);

  const handleClientDeleted = useCallback((data: any) => {
    console.log('🗑️ Client deleted:', data);
    onClientDeleted?.(data);
  }, [onClientDeleted]);

  useEffect(() => {
    // Set up listeners
    const unsubscribeCache = apiService.onCacheInvalidation(handleCacheInvalidation);
    const unsubscribeCreated = apiService.onMutation('client:created', handleClientCreated);
    const unsubscribeUpdated = apiService.onMutation('client:updated', handleClientUpdated);
    const unsubscribeDeleted = apiService.onMutation('client:deleted', handleClientDeleted);

    listenersRef.current = [
      unsubscribeCache,
      unsubscribeCreated,
      unsubscribeUpdated,
      unsubscribeDeleted
    ];

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(unsubscribe => unsubscribe());
      listenersRef.current = [];
    };
  }, [handleCacheInvalidation, handleClientCreated, handleClientUpdated, handleClientDeleted]);

  // Utility function to force refresh specific patterns
  const forceRefresh = useCallback((pattern: string) => {
    apiService.forceRefresh(pattern);
  }, []);

  return {
    forceRefresh
  };
}

// Hook specifically for customer-related real-time updates
export function useCustomerRealtimeUpdates(
  onCustomersChanged?: () => void,
  onCustomerDetailsChanged?: (customerId: string) => void
) {
  return useRealtimeUpdates({
    onClientCreated: () => {
      console.log('🔄 Customer list needs refresh due to creation');
      onCustomersChanged?.();
    },
    onClientUpdated: (data) => {
      console.log('🔄 Customer list and details need refresh due to update');
      onCustomersChanged?.();
      onCustomerDetailsChanged?.(data.id);
    },
    onClientDeleted: (data) => {
      console.log('🔄 Customer list needs refresh due to deletion');
      onCustomersChanged?.();
    },
    onCacheInvalidated: (keys) => {
      const hasCustomerList = keys.some(key => key.includes('/clients/clients/'));
      const hasCustomerDetails = keys.some(key => key.includes('/clients/clients/') && !key.includes('/clients/clients/?'));
      
      if (hasCustomerList) {
        console.log('🔄 Customer list cache invalidated');
        onCustomersChanged?.();
      }
      
      if (hasCustomerDetails) {
        console.log('🔄 Customer details cache invalidated');
        // Extract customer ID from cache key if possible
        const detailKeys = keys.filter(key => 
          key.includes('/clients/clients/') && 
          !key.includes('/clients/clients/?') &&
          key.match(/\/clients\/clients\/\d+\//)
        );
        
        detailKeys.forEach(key => {
          const match = key.match(/\/clients\/clients\/(\d+)\//);
          if (match) {
            onCustomerDetailsChanged?.(match[1]);
          }
        });
      }
    }
  });
}
