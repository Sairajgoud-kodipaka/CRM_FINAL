import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../lib/api-service';

interface UseOptimizedFetchOptions<T> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  cacheKey?: string;
  cacheTTL?: number;
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  dependencies?: any[];
}

interface UseOptimizedFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

export function useOptimizedFetch<T>({
  endpoint,
  method = 'GET',
  data,
  cacheKey,
  cacheTTL,
  immediate = true,
  onSuccess,
  onError,
  dependencies = []
}: UseOptimizedFetchOptions<T>): UseOptimizedFetchReturn<T> {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Create a unique cache key for this request
  const requestCacheKey = cacheKey || `${method}:${endpoint}:${JSON.stringify(data || {})}`;

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!endpoint) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check cache first for GET requests
      if (method === 'GET') {
        try {
          // Access cache through public method or use a workaround
          const cachedData = (apiService as any).getFromCache?.(requestCacheKey);
          if (cachedData) {

            setState(prev => ({ ...prev, data: cachedData as T, loading: false }));
            onSuccess?.(cachedData as T);
            return;
          }
        } catch (error) {

        }
      }

      // Make the API request
      let response;
      switch (method) {
        case 'GET':
          response = await apiService.get<T>(endpoint);
          break;
        case 'POST':
          response = await apiService.post<T>(endpoint, data);
          break;
        case 'PUT':
          response = await apiService.put<T>(endpoint, data);
          break;
        case 'DELETE':
          response = await apiService.delete<T>(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      if (signal?.aborted) return;

      if (response.success && response.data) {
        setState(prev => ({ ...prev, data: response.data, loading: false }));
        onSuccess?.(response.data);
      } else {
        const errorMsg = response.message || 'Request failed';
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
        onError?.(errorMsg);
      }
    } catch (error) {
      if (signal?.aborted) return;

      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      onError?.(errorMsg);
    }
  }, [endpoint, method, data, requestCacheKey, onSuccess, onError]);

  const refetch = useCallback(async () => {
    // Invalidate cache for this request
    try {
      (apiService as any).invalidateCache?.(requestCacheKey);
    } catch (error) {

    }
    await fetchData();
  }, [fetchData, requestCacheKey]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const invalidateCache = useCallback(() => {
    try {
      (apiService as any).invalidateCache?.(requestCacheKey);
    } catch (error) {

    }
  }, [requestCacheKey]);

  // Effect for immediate fetch
  useEffect(() => {
    if (immediate) {
      abortControllerRef.current = new AbortController();
      fetchData(abortControllerRef.current.signal);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [immediate, fetchData, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    ...state,
    refetch,
    clearError,
    invalidateCache
  };
}

// Specialized hooks for common use cases
export function useOptimizedGet<T>(
  endpoint: string,
  options?: Omit<UseOptimizedFetchOptions<T>, 'endpoint' | 'method'>
) {
  return useOptimizedFetch<T>({ endpoint, method: 'GET', ...options });
}

export function useOptimizedPost<T>(
  endpoint: string,
  data?: any,
  options?: Omit<UseOptimizedFetchOptions<T>, 'endpoint' | 'method' | 'data'>
) {
  return useOptimizedFetch<T>({ endpoint, method: 'POST', data, ...options });
}

export function useOptimizedPut<T>(
  endpoint: string,
  data?: any,
  options?: Omit<UseOptimizedFetchOptions<T>, 'endpoint' | 'method' | 'data'>
) {
  return useOptimizedFetch<T>({ endpoint, method: 'PUT', data, ...options });
}

export function useOptimizedDelete<T>(
  endpoint: string,
  options?: Omit<UseOptimizedFetchOptions<T>, 'endpoint' | 'method'>
) {
  return useOptimizedFetch<T>({ endpoint, method: 'DELETE', ...options });
}
