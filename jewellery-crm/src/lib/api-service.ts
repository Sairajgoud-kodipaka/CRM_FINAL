// API Service for connecting to Django backend
import { config, getApiUrl } from './config'
import { performanceMonitor } from './performance-monitor'
import { globalDateParameterService } from './global-date-parameters'

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: Record<string, string[]>;
}

// Performance optimization interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<ApiResponse<T>>;
  timestamp: number;
}

// Type definitions based on backend models
interface User {
  id: number;
  user_id?: number; // For team members, this is the user ID
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
  tenant?: number;
  store?: number;
  tenant_name?: string;
  store_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  customer_type: string;
  status?: string;
  pipeline_stage?: string;
  address?: string;
  full_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  pincode?: string;
  date_of_birth?: string;
  anniversary_date?: string;
  preferred_metal?: string;
  preferred_stone?: string;
  ring_size?: string;
  budget_range?: string;
  lead_source?: string;
  assigned_to?: number;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  notes?: string;
  community?: string;
  mother_tongue?: string;
  reason_for_visit?: string;
  age_of_end_user?: string;
  saving_scheme?: string;
  catchment_area?: string;
  next_follow_up?: string;
  summary_notes?: string;
  customer_interests: Array<{
    id: number;
    category: {
      id: number;
      name: string;
    } | null;
    product: {
      id: number;
      name: string;
    } | null;
    revenue: number;
    notes?: string;
    preferences?: {
      designSelected: boolean;
      wantsDiscount: boolean;
      checkingOthers: boolean;
      lessVariety: boolean;
      purchased: boolean;
      other: string;
    };
    status?: 'interested' | 'negotiation' | 'closed_won';
  }>;
  // Add simple product preferences fields to match AddCustomerModal
  customer_interests_simple?: string[]; // Simple array of interest strings
  product_type?: string;
  style?: string;
  weight_range?: string;
  customer_preference?: string;
  design_number?: string;

  // Additional fields from AddCustomerModal
  sales_person?: string;
  sales_person_id?: number;
  customer_status?: string;
  material_type?: string;
  material_weight?: number;
  material_value?: number;
  material_unit?: string;
  product_subtype?: string;
  gold_range?: string;
  diamond_range?: string;
  customer_preferences?: string;
  design_selected?: string;
  wants_more_discount?: string;
  checking_other_jewellers?: string;
  let_him_visit?: string;
  add_to_pipeline?: boolean;

  tenant?: number;
  store?: number;
  store_name?: string;
  tags: number[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

interface AuditLog {
  id: number;
  client: number;
  action: 'create' | 'update' | 'delete' | 'restore';
  user?: number;
  timestamp: string;
  before?: any;
  after?: any;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  category?: number;
  category_name?: string;
  brand?: string;
  cost_price: number;
  selling_price: number;
  discount_price?: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  weight?: number;
  dimensions?: string;
  material?: string;
  color?: string;
  size?: string;
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
  main_image?: string;
  main_image_url?: string;
  additional_images: string[];
  meta_title?: string;
  meta_description?: string;
  tags: string[];
  tenant: number;
  store?: number;
  store_name?: string;
  scope: 'global' | 'store';
  created_at: string;
  updated_at: string;
  is_in_stock?: boolean;
  is_low_stock?: boolean;
  current_price?: number;
  profit_margin?: number;
  variant_count?: number;
}

interface ProductInventory {
  id: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  store: number;
  store_name?: string;
  quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  max_stock: number;
  location?: string;
  last_updated: string;
  available_quantity?: number;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
}

interface StockTransfer {
  id: number;
  from_store: number;
  from_store_name?: string;
  to_store: number;
  to_store_name?: string;
  product: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  reason: string;
  requested_by: number;
  requested_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  transfer_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Sale {
  id: number;
  order_number: string;
  client: number;
  sales_representative: number;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  shipping_address?: string;
  shipping_method?: string;
  shipping_cost: number;
  tracking_number?: string;
  notes?: string;
  internal_notes?: string;
  tenant: number;
  created_at: string;
  updated_at: string;
  order_date: string;
  delivery_date?: string;
}

interface SalesPipeline {
  id: number;
  title: string;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  sales_representative: {
    id: number;
    username: string;
    full_name: string;
  } | null;
  stage: string;
  probability: number;
  expected_value: number;
  actual_value: number;
  expected_close_date?: string;
  actual_close_date?: string;
  notes?: string;
  next_action?: string;
  next_action_date?: string;
  tenant: number;
  created_at: string;
  updated_at: string;
}

interface Appointment {
  id: number;
  client: number;
  client_name?: string;
  client_phone?: string;
  tenant: number;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
  status: string;
  reminder_sent: boolean;
  reminder_date?: string;
  requires_follow_up: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  duration: number;
  location?: string;
  outcome_notes?: string;
  next_action?: string;
  created_by?: number;
  created_by_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  parent?: number;
  tenant: number;
  store?: number;
  store_name?: string;
  scope: 'global' | 'store';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_customers: number;
  total_sales: number;
  total_products: number;
  total_revenue: number;
  customers_change: string;
  sales_change: string;
  products_change: string;
  revenue_change: string;
  recent_activities: any[];
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  refresh: string;
  user: User;
}

interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  timezone: string;
  manager?: number;
  tenant: number;
  is_active: boolean;
  created_at: string;
}

interface SupportTicket {
  id: number;
  ticket_id: string;
  title: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
  created_by: number;
  assigned_to?: number;
  tenant: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  is_urgent: boolean;
  requires_callback: boolean;
  callback_phone?: string;
  callback_preferred_time?: string;
}

class ApiService {
  // Performance optimization properties
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly DEFAULT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes (reduced for real-time updates)
  private readonly REQUEST_DEDUP_WINDOW = 1000; // 1 second
  // Configurable per-endpoint TTLs (pattern-based)
  private readonly endpointTtlMap: Array<{ pattern: RegExp; ttlMs: number }> = [
    { pattern: /\/analytics\//, ttlMs: 60 * 1000 }, // dynamic analytics
    { pattern: /\/products\/categories\//, ttlMs: 10 * 60 * 1000 }, // semi-static
    { pattern: /\/stores\//, ttlMs: 5 * 60 * 1000 },
    { pattern: /\/clients\/clients\//, ttlMs: 60 * 1000 },
  ];

  // Real-time update system
  private cacheInvalidationListeners = new Set<(keys: string[]) => void>();
  private mutationCallbacks = new Map<string, Set<(data: any) => void>>();

  private getAuthToken(): string | null {
    // Get token from localStorage or sessionStorage
    if (typeof window !== 'undefined') {
      try {
        // Get from auth-storage (Zustand persist)
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);

          // Try different possible structures - prioritize state.token
          const token = parsed.state?.token || parsed.token || null;
          if (token) {
            return token;
          }
        }

        // Also try to get from Zustand store directly
        try {
          const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          if (authStore.state?.token) {
            return authStore.state.token;
          }
        } catch (e) {
          // Ignore parsing errors for Zustand store
        }

        return null;
      } catch (error) {
        // Error parsing auth storage
        return null;
      }
    }
    return null;
  }

  // Cache management methods
  private getCacheKey(endpoint: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private getFromCache<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(cacheKey: string, data: T, ttl?: number): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_CACHE_TTL
    });
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Real-time update methods
  private invalidateCache(pattern: string | string[]): void {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const keysToInvalidate: string[] = [];

    for (const [key] of this.cache) {
      if (patterns.some(p => key.includes(p))) {
        keysToInvalidate.push(key);
        this.cache.delete(key);
      }
    }

    if (keysToInvalidate.length > 0) {
      this.cacheInvalidationListeners.forEach(listener => listener(keysToInvalidate));
    }
  }

  private notifyMutationListeners(mutationType: string, data: any): void {
    const listeners = this.mutationCallbacks.get(mutationType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          // Error in mutation listener
        }
      });
    }
  }

  // Public methods for real-time updates
  public onCacheInvalidation(callback: (keys: string[]) => void): () => void {
    this.cacheInvalidationListeners.add(callback);
    return () => this.cacheInvalidationListeners.delete(callback);
  }

  public onMutation(mutationType: string, callback: (data: any) => void): () => void {
    if (!this.mutationCallbacks.has(mutationType)) {
      this.mutationCallbacks.set(mutationType, new Set());
    }
    this.mutationCallbacks.get(mutationType)!.add(callback);

    return () => {
      const listeners = this.mutationCallbacks.get(mutationType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.mutationCallbacks.delete(mutationType);
        }
      }
    };
  }

  public forceRefresh(pattern: string): void {
    this.invalidateCache(pattern);
  }

  // Request deduplication
  private async deduplicateRequest<T>(
    cacheKey: string,
    requestFn: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    const pending = this.pendingRequests.get(cacheKey);

    if (pending && Date.now() - pending.timestamp < this.REQUEST_DEDUP_WINDOW) {
      return pending.promise;
    }

    const promise = requestFn();
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Timeout and retry configuration
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

  private async requestWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number = this.REQUEST_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    // Add global date parameters to GET requests
    let url = getApiUrl(endpoint);
    if (!options.method || options.method === 'GET') {
      const dateParams = globalDateParameterService.getDateParameters();
      if (Object.keys(dateParams).length > 0) {
        const urlObj = new URL(url);
        Object.entries(dateParams).forEach(([key, value]) => {
          urlObj.searchParams.set(key, value);
        });
        url = urlObj.toString();
      }
    }

    const cacheKey = this.getCacheKey(endpoint, options);

    // Start performance monitoring
    performanceMonitor.startTiming(endpoint);

    // Determine TTL based on endpoint patterns
    const ttlOverride = this.endpointTtlMap.find(e => e.pattern.test(endpoint))?.ttlMs;

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) {
        performanceMonitor.recordCacheHit();
        performanceMonitor.endTiming(endpoint, true);
        return { data: cachedData, success: true };
      }
    }

    const token = this.getAuthToken();

    // Check if the request body is FormData
    const isFormData = options.body instanceof FormData;

    const defaultHeaders: Record<string, string> = {
      // Only set Content-Type for JSON requests, let browser set it for FormData
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // Only include Authorization header for non-login requests
      ...(token && !endpoint.includes('/login/') && { 'Authorization': `Bearer ${token}` }),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      // Offline queue: if offline and write request, enqueue and return success stub
      if (typeof window !== 'undefined' && !navigator.onLine && (options.method && options.method !== 'GET')) {
        try {
          const q = JSON.parse(localStorage.getItem('offline-queue') || '[]');
          q.push({ endpoint, options });
          localStorage.setItem('offline-queue', JSON.stringify(q));
        } catch {}
        return { data: null as any, success: true, message: 'Queued offline' };
      }

      // Use timeout wrapper for the fetch request
      const response = await this.requestWithTimeout(url, config, this.REQUEST_TIMEOUT);

      if (!response.ok) {
        // Try to get the error response body
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        let errorData: any = null;

        try {
          const errorBody = await response.text();

          // Try to parse the error body as JSON
          try {
            errorData = JSON.parse(errorBody);
            if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.messages && errorData.messages.length > 0) {
              errorMessage = errorData.messages[0].message;
            }
          } catch (parseError) {
            // If it's not JSON, use the raw text
            if (errorBody.trim()) {
              errorMessage = errorBody;
            }
          }
        } catch (e) {
          // Could not read error response body
        }

        // Only redirect for 401 errors that are NOT login attempts
        if (response.status === 401 && !url.includes('/login/')) {
          // Token expired or invalid: notify UI, then redirect
          if (typeof window !== 'undefined') {
            try {
              window.dispatchEvent(new CustomEvent('sessionExpired', {
                detail: { message: 'Your session has expired. Please sign in again.' }
              }));
            } catch {}
            localStorage.removeItem('auth-storage');
            setTimeout(() => {
            window.location.href = '/';
            }, 1200);
          }
        }

        // For 400 validation errors, return them in the response instead of throwing
        if (response.status === 400 && errorData && typeof errorData === 'object') {
          return {
            data: null as any,
            success: false,
            message: this.humanizeError(errorMessage),
            errors: errorData
          };
        }

        throw new Error(this.humanizeError(errorMessage));
      }

      // Check if response is a file download
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');



      // Check if this is a file download response
      if (contentDisposition && contentDisposition.includes('attachment')) {
        // This is a file download, return the blob
        const blob = await response.blob();
        return {
          data: blob as any,
          success: true,
        };
      }

      // Also check for specific content types that indicate file downloads
      if (contentType && (
        contentType.includes('text/csv') ||
        contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      )) {
        // This is a file download, return the blob
        const blob = await response.blob();
        return {
          data: blob as any,
          success: true,
        };
      }

      // Regular JSON response
      let data;
      try {
        const responseText = await response.text();

        if (responseText.trim() === '') {
          // Empty response, return success
          data = null;
        } else {
          data = JSON.parse(responseText);
        }
      } catch (error) {
        // If JSON parsing fails, return success with empty data
        data = null;
      }

      // Check if the response is already in ApiResponse format
      let result: ApiResponse<T>;
      if (data && typeof data === 'object' && 'success' in data) {
        // Response is already in ApiResponse format
        result = data;
      } else {
        // Response is direct data, wrap it in ApiResponse format
        result = {
          data,
          success: true,
        };
      }

      // Cache successful GET responses
      if ((!options.method || options.method === 'GET') && result.success) {
        this.setCache(cacheKey, result.data, ttlOverride);
      }

      // End performance monitoring for successful requests
      performanceMonitor.endTiming(endpoint, false);
      return result;
    } catch (error: any) {
      // End performance monitoring for failed requests
      performanceMonitor.endTiming(endpoint, false);
      
      // Implement retry logic for network errors and 500/503 errors
      const isRetryableError = 
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('fetch');
      
      // Check if we should retry
      if (isRetryableError && retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, retryCount); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry(endpoint, options, retryCount + 1);
      }
      
      // Check for HTTP errors that should be retried
      if (error.status === 500 || error.status === 503) {
        if (retryCount < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithRetry(endpoint, options, retryCount + 1);
        }
      }
      
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Start with retry count 0
    return this.requestWithRetry<T>(endpoint, options, 0);
  }

  // Humanize common technical error messages
  private humanizeError(msg: string): string {
    if (!msg) return 'Something went wrong. Please try again.';
    const m = msg.toLowerCase();
    if (m.includes('network') || m.includes('failed to fetch')) return 'Network error. Please check your connection.';
    if (m.includes('timeout')) return 'Request timed out. Please try again.';
    if (m.includes('unauthorized') || m.includes('401')) return 'You are not authorized. Please sign in again.';
    if (m.includes('internal server error') || m.includes('500')) return 'Server error. Please try again later.';
    return msg;
  }

  // Generic HTTP methods with deduplication
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, { method: 'GET' });
    return this.deduplicateRequest(cacheKey, () =>
      this.request<T>(endpoint, { method: 'GET' })
    );
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
    return this.deduplicateRequest(cacheKey, () =>
      this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
    return this.deduplicateRequest(cacheKey, () =>
      this.request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, { method: 'DELETE' });
    return this.deduplicateRequest(cacheKey, () =>
      this.request<T>(endpoint, { method: 'DELETE' })
    );
  }

  // Cache management public methods

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async loginSalesPin(username: string, pin: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/login/sales-pin/', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    });
  }

  async checkUsernameRole(username: string): Promise<ApiResponse<{ exists: boolean; role: string | null; is_sales_role: boolean }>> {
    const qp = new URLSearchParams();
    qp.append('username', username);
    return this.request(`/check-username-role/?${qp.toString()}`);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/profile/');
  }

  async changePassword(data: {
    old_password: string;
    new_password: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<ApiResponse<User>> {
    return this.request('/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Note: Tenant and store names are now included in user profile data
  // These methods are kept for backward compatibility but may not be needed
  async getTenant(id: string): Promise<ApiResponse<any>> {
    return this.request(`/tenants/${id}/`);
  }

  async updateTenant(id: string, tenantData: Partial<any>): Promise<ApiResponse<any>> {
    return this.request(`/tenants/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async createTenant(tenantData: any): Promise<ApiResponse<any>> {
    return this.request('/tenants/create/', {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  }

  async getTenants(): Promise<ApiResponse<any[]>> {
    return this.request('/tenants/');
  }

  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    return this.request(`/tenants/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    const token = this.getAuthToken();
    if (token) {
      try {
        await this.request('/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: token }),
        });
      } catch (error) {
        // Logout error
      }
    }

    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
    }

    return { data: undefined, success: true };
  }

  // Password Reset
  async requestPasswordReset(email: string): Promise<ApiResponse<{ detail: string }>> {
    return this.request('/password-reset/request/', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<ApiResponse<{ detail: string }>> {
    return this.request('/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({ uid, token, new_password: newPassword })
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/analytics/dashboard/');
  }

  async getBusinessAdminDashboard(params?: {
    start_date?: string;
    end_date?: string;
    filter_type?: string;
    year?: number;
    month?: number;
    month_name?: string;
    timezone?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.filter_type) queryParams.append('filter_type', params.filter_type);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.month_name) queryParams.append('month_name', params.month_name);
    if (params?.timezone) queryParams.append('timezone', params.timezone);

    // Enhanced cache-busting with month-specific timestamp
    const cacheKey = `${params?.year || 'current'}_${params?.month || 'current'}_${Date.now()}`;
    queryParams.append('_cache', cacheKey);
    queryParams.append('_t', Date.now().toString());

    const url = `/tenants/dashboard/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(url);
  }

  async getPlatformAdminDashboard(): Promise<ApiResponse<any>> {
    return this.request('/tenants/platform-dashboard/');
  }

  async getManagerDashboard(params?: {
    start_date?: string;
    end_date?: string;
    filter_type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.filter_type) queryParams.append('filter_type', params.filter_type);

    const url = `/tenants/manager-dashboard/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(url);
  }

  async getSalesDashboard(params?: {
    start_date?: string;
    end_date?: string;
    filter_type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.filter_type) queryParams.append('filter_type', params.filter_type);

    const url = `/sales/dashboard/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(url);
  }

  // Clients (Customers) API
  async getClients(params?: {
    page?: number;
    search?: string;
    status?: string;
    assigned_to?: string;
    start_date?: string;
    end_date?: string;
    store?: string;
  }): Promise<ApiResponse<Client[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.store) queryParams.append('store', params.store);

    const queryString = queryParams.toString();
    return this.request(`/clients/clients/${queryString ? `?${queryString}` : ''}`);
  }

  async getClient(id: string, forceRefresh: boolean = false, crossStore: boolean = false): Promise<ApiResponse<Client>> {
    if (forceRefresh) {
      this.invalidateCache(`/clients/clients/${id}/`);
    }
    
    // Use cross-store endpoint if needed (for fetching customers from different stores)
    if (crossStore) {
      const response = await this.request<{ success: boolean; data: Client }>(`/clients/clients/${id}/cross-store/`);
      console.log('🔍 getClient (cross-store) - Full response:', JSON.stringify(response, null, 2));
      
      // The backend returns { success: True, data: serializer.data }
      // The request method wraps it, so we get { success: true, data: { success: true, data: Client } }
      if (response.success && response.data) {
        const responseData = response.data as any;
        console.log('🔍 getClient (cross-store) - Response data:', responseData);
        
        // Check if response.data itself has a nested structure
        if (responseData && typeof responseData === 'object') {
          // If responseData has 'data' property, it's nested: { success: true, data: { success: true, data: Client } }
          if ('data' in responseData && responseData.data) {
            console.log('🔍 getClient (cross-store) - Nested data found, extracting:', responseData.data);
            return {
              success: true,
              data: responseData.data as Client,
              errors: undefined
            };
          }
          // If responseData has 'id' property, it's the Client object directly: { success: true, data: Client }
          else if ('id' in responseData) {
            console.log('🔍 getClient (cross-store) - Direct Client object found');
            return {
              success: true,
              data: responseData as Client,
              errors: undefined
            };
          }
        }
      }
      
      console.error('❌ getClient (cross-store) - Unexpected response structure:', response);
      return response as any;
    }
    
    return this.request(`/clients/clients/${id}/`);
  }

  async markInterestPurchased(clientId: string, interestId: string): Promise<ApiResponse<any>> {
    // Invalidate cache for this client to force refresh
    this.invalidateCache(`/clients/clients/${clientId}`);
    return this.request(`/clients/clients/${clientId}/interests/${interestId}/mark-purchased/`, {
      method: 'POST',
    });
  }

  async markInterestNotPurchased(clientId: string, interestId: string): Promise<ApiResponse<any>> {
    // Invalidate cache for this client to force refresh
    this.invalidateCache(`/clients/clients/${clientId}`);
    return this.request(`/clients/clients/${clientId}/interests/${interestId}/mark-not-purchased/`, {
      method: 'POST',
    });
  }

  async checkPhoneExists(phone: string): Promise<ApiResponse<{
    exists: boolean;
    customer?: {
      id: number;
      name: string;
      email: string;
      status: string;
      phone: string;
      total_visits: number;
      last_visit?: string;
      store_name?: string;
      store_id?: number;
    };
    is_different_store?: boolean;
    message: string;
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('phone', phone);
    // DRF default router requires a trailing slash for actions like check_phone/
    return this.request(`/clients/clients/check_phone/?${queryParams.toString()}`.replace('check_phone?', 'check_phone/?'));
  }

  async getCustomerJourney(customerId: string): Promise<ApiResponse<{
    success: boolean;
    data: Array<{
      type: 'interest' | 'interaction' | 'appointment' | 'pipeline' | 'sale' | 'followup';
      id: number;
      date: string | null;
      title: string;
      description: string;
      details: any;
    }>;
    customer: {
      id: number;
      name: string;
      phone: string;
    };
  }>> {
    return this.request(`/clients/clients/${customerId}/journey/`);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${id}/`);
  }

  async createClient(clientData: Partial<Client>): Promise<ApiResponse<Client>> {
    // Clean payload: remove undefined/null and empty string values to avoid serializer issues
    // BUT preserve created_at even if it seems like an empty string (it's for historical imports)
    // AND preserve customer_interests_input arrays (even if empty, backend will handle it)
    const cleaned: Record<string, any> = {};
    const preservedCreatedAt = clientData.created_at;
    const preservedInterests = clientData.customer_interests_input;
    
    Object.entries(clientData || {}).forEach(([key, value]) => {
      // Special handling for customer_interests_input - always include it (even if empty array)
      if (key === 'customer_interests_input') {
        cleaned[key] = value !== undefined ? value : [];
        return;
      }
      
      if (value === undefined || value === null) return;
      
      // Don't filter out created_at - it's needed for historical date imports
      if (key === 'created_at') {
        cleaned[key] = value;
        return;
      }
      
      if (typeof value === 'string' && value.trim() === '') return;
      cleaned[key] = value;
    });
    // Ensure created_at is included if it was present
    if (preservedCreatedAt && !cleaned.created_at) {
      cleaned.created_at = preservedCreatedAt;
    }
    // Ensure customer_interests_input is always included (even if empty array)
    if (!('customer_interests_input' in cleaned)) {
      cleaned.customer_interests_input = preservedInterests !== undefined ? preservedInterests : [];
    }
    
    console.log('🔍 createClient - Request body:', {
      ...cleaned,
      customer_interests_input: cleaned.customer_interests_input,
      customer_interests_input_length: Array.isArray(cleaned.customer_interests_input) ? cleaned.customer_interests_input.length : 0
    });

    const response = await this.request<Client>('/clients/clients/', {
      method: 'POST',
      body: JSON.stringify(cleaned),
    });

    // Invalidate cache and notify listeners on success
    if (response.success) {
      this.invalidateCache(['/clients/clients/', '/clients/audit-logs/']);
      this.notifyMutationListeners('client:created', response.data);

      // Dispatch custom event for backward compatibility
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshCustomerDetails', {
          detail: { customerId: (response.data as any)?.id }
        }));
      }
    }

    return response;
  }

  async updateClient(id: string, clientData: Partial<Client>, crossStore: boolean = false): Promise<ApiResponse<Client>> {
    // Use cross-store endpoint if needed (for updating customers from different stores)
    // Use cross-store endpoint if needed (for updating customers from different stores)
    let endpoint: string;
    if (crossStore) {
      endpoint = `/clients/clients/${id}/cross-store/`;
    } else {
      endpoint = `/clients/clients/${id}/`;
    }
    
    console.log('🔍 updateClient - ID:', id, 'crossStore:', crossStore, 'Endpoint:', endpoint);
    
    const response = await this.request<Client>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
    
    console.log('🔍 updateClient - Response:', response);

    // Handle cross-store response format
    if (crossStore && response.success && response.data) {
      const responseData = response.data as any;
      if (responseData && responseData.data) {
        // Response is { success: true, data: { data: Client } }
        return {
          success: true,
          data: responseData.data as Client,
          errors: undefined
        };
      } else if (responseData && typeof responseData === 'object' && 'id' in responseData) {
        // Response is { success: true, data: Client }
        return {
          success: true,
          data: responseData as Client,
          errors: undefined
        };
      }
    }

    // Invalidate cache and notify listeners on success
    if (response.success) {
      this.invalidateCache([`/clients/clients/${id}/`, '/clients/clients/', '/clients/audit-logs/']);
      this.notifyMutationListeners('client:updated', response.data);

      // Dispatch custom event for backward compatibility
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshCustomerDetails', {
          detail: { customerId: id }
        }));
      }
    }

    return response;
  }

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    const response = await this.request<void>(`/clients/clients/${id}/`, {
      method: 'DELETE',
    });

    // Invalidate cache and notify listeners on success
    if (response.success) {
      this.invalidateCache([`/clients/clients/${id}/`, '/clients/clients/', '/clients/audit-logs/']);
      this.notifyMutationListeners('client:deleted', { id });

      // Dispatch custom event for backward compatibility
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshCustomerDetails', {
          detail: { customerId: id }
        }));
      }
    }

    return response;
  }

  // Note: Hard delete is now implemented, so trash functionality is removed

  async restoreClient(id: string): Promise<ApiResponse<void>> {
    return this.request(`/clients/${id}/restore/`, {
      method: 'POST',
    });
  }

  async getClientAuditLogs(clientId: string): Promise<ApiResponse<AuditLog[]>> {
    return this.request(`/clients/audit-logs/?client=${clientId}`);
  }

  async getCustomerDropdownOptions(): Promise<ApiResponse<any>> {
    return this.request('/clients/dropdown_options/');
  }

  // Customer Tags and Segmentation
  async getCustomerTags(): Promise<ApiResponse<any[]>> {
    return this.request('/tags/');
  }

  async getCustomerTagCategories(): Promise<ApiResponse<any[]>> {
    return this.request('/tags/categories/');
  }

  async getCustomerTagsByCategory(category?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    return this.request(`/tags/by_category/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Customer Segmentation API methods
  async getSegmentationAnalytics(viewType: 'buckets' | 'filters' = 'buckets', tenantId?: number): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append('view_type', viewType);
    if (tenantId) queryParams.append('tenant_id', tenantId.toString());
    return this.request(`/clients/segmentation/analytics/?${queryParams}`);
  }

  async getSegmentCustomers(segmentName: string, viewType: 'buckets' | 'filters' = 'buckets', page: number = 1, pageSize: number = 20, tenantId?: number): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append('view_type', viewType);
    queryParams.append('page', page.toString());
    queryParams.append('page_size', pageSize.toString());
    if (tenantId) queryParams.append('tenant_id', tenantId.toString());
    return this.request(`/clients/segmentation/customers/${segmentName}/?${queryParams}`);
  }

  async getSegmentationRules(): Promise<ApiResponse<any>> {
    return this.request('/clients/segmentation/rules/');
  }

  async createCustomSegment(segmentData: {
    name: string;
    description?: string;
    rules: any;
    category?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/clients/segmentation/custom-segment/', {
      method: 'POST',
      body: JSON.stringify(segmentData),
    });
  }

  async getSegmentationInsights(tenantId?: number): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (tenantId) queryParams.append('tenant_id', tenantId.toString());
    return this.request(`/clients/segmentation/insights/?${queryParams}`);
  }

  // Exhibition Lead Management
  async getExhibitionLeads(): Promise<ApiResponse<Client[]>> {
    return this.request('/exhibition/exhibition-leads/');
  }

  async getExhibitionStats(): Promise<ApiResponse<any>> {
    return this.request('/exhibition/exhibition-leads/stats/');
  }

  async promoteExhibitionLead(clientId: string): Promise<ApiResponse<any>> {
    return this.request(`/exhibition/exhibition-leads/${clientId}/promote/`, {
      method: 'POST',
    });
  }

  async bulkPromoteExhibitionLeads(clientIds: number[]): Promise<ApiResponse<any>> {
    return this.request('/exhibition/exhibition-leads/bulk_promote/', {
      method: 'POST',
      body: JSON.stringify({ client_ids: clientIds }),
    });
  }

  async createExhibitionLead(leadData: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone: string;
    city?: string;
    notes?: string;
    customer_type?: string;
    exhibition_name?: string;
    exhibition_date?: string;
    exhibition_tag?: number;
    customer_interests_input?: string[];
  }): Promise<ApiResponse<Client>> {
    // First, create or get the exhibition if provided
    let exhibitionId: number | undefined;
    
    if (leadData.exhibition_name && leadData.exhibition_date) {
      try {
        // Try to find existing exhibition
        const exhibitionsResponse = await this.request('/exhibition/exhibitions/', {
          method: 'GET',
        });
        
        if (exhibitionsResponse.success && Array.isArray(exhibitionsResponse.data)) {
          const existing = exhibitionsResponse.data.find(
            (ex: any) => ex.name === leadData.exhibition_name && ex.date === leadData.exhibition_date
          );
          
          if (existing) {
            exhibitionId = existing.id;
          } else {
            // Create new exhibition
            const createExhibitionResponse = await this.request('/exhibition/exhibitions/', {
              method: 'POST',
              body: JSON.stringify({
                name: leadData.exhibition_name,
                date: leadData.exhibition_date,
                tag: leadData.exhibition_tag || null,
                is_active: true
              }),
            });
            
            if (createExhibitionResponse.success) {
              exhibitionId = createExhibitionResponse.data.id;
            }
          }
        }
      } catch (error) {
        console.error('Error creating/finding exhibition:', error);
      }
    }
    
    // Set lead_source to include exhibition name if provided
    let leadSource = 'exhibition';
    if (leadData.exhibition_name) {
      leadSource = leadData.exhibition_name;
    }
    
    const requestBody = {
      ...leadData,
      status: 'exhibition',
      lead_source: leadSource,
      customer_type: leadData.customer_type || 'individual',
      exhibition: exhibitionId || null,
      // Always ensure customer_interests_input is an array (never undefined)
      customer_interests_input: Array.isArray(leadData.customer_interests_input) 
        ? leadData.customer_interests_input 
        : (leadData.customer_interests_input ? [leadData.customer_interests_input] : [])
    };
    
    console.log('🔍 createExhibitionLead - Request body:', {
      ...requestBody,
      customer_interests_input: requestBody.customer_interests_input,
      customer_interests_input_length: requestBody.customer_interests_input?.length || 0
    });
    
    return this.request('/clients/clients/', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // Exhibition management
  async getExhibitions(date?: string): Promise<ApiResponse<any[]>> {
    const url = date 
      ? `/exhibition/exhibitions/?date=${date}`
      : '/exhibition/exhibitions/';
    return this.request(url, {
      method: 'GET',
    });
  }

  async createExhibition(exhibitionData: {
    name: string;
    date: string;
    tag?: number;
    description?: string;
    location?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/exhibition/exhibitions/', {
      method: 'POST',
      body: JSON.stringify({
        ...exhibitionData,
        is_active: true
      }),
    });
  }

  async updateExhibition(id: number, exhibitionData: Partial<{
    name: string;
    date: string;
    tag?: number;
    description?: string;
    location?: string;
    is_active?: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/exhibition/exhibitions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(exhibitionData),
    });
  }

  async deleteExhibition(id: number): Promise<ApiResponse<any>> {
    return this.request(`/exhibition/exhibitions/${id}/`, {
      method: 'DELETE',
    });
  }

  // Exhibition Tag management
  async getExhibitionTags(): Promise<ApiResponse<any[]>> {
    return this.request('/exhibition/exhibition-tags/', {
      method: 'GET',
    });
  }

  async createExhibitionTag(tagData: {
    name: string;
    color?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/exhibition/exhibition-tags/', {
      method: 'POST',
      body: JSON.stringify({
        ...tagData,
        is_active: true
      }),
    });
  }

  async updateExhibitionTag(id: number, tagData: Partial<{
    name: string;
    color?: string;
    is_active?: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/exhibition/exhibition-tags/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(tagData),
    });
  }

  async deleteExhibitionTag(id: number): Promise<ApiResponse<any>> {
    return this.request(`/exhibition/exhibition-tags/${id}/`, {
      method: 'DELETE',
    });
  }

  // Products
  async getProducts(params?: {
    page?: number;
    category?: string;
    search?: string;
    status?: string;
    scope?: string;
    tenantId?: string; // Add tenantId parameter for public access
  }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.scope) queryParams.append('scope', params.scope);
    // Request more products per page to get all products
    queryParams.append('page_size', '200');

    // If tenantId is provided, use public API (no auth required)
    if (params?.tenantId) {
      return this.request(`/products/public/${params.tenantId}/products/${queryParams.toString() ? `?${queryParams}` : ''}`);
    }

    // Otherwise use authenticated API
    return this.request(`/products/list/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Categories
  async getCategories(params?: {
    scope?: string;
    tenantId?: string; // Add tenantId parameter for public access
  }): Promise<ApiResponse<Category[]>> {
    const queryParams = new URLSearchParams();
    if (params?.scope) queryParams.append('scope', params.scope);

    // If tenantId is provided, use public API (no auth required)
    if (params?.tenantId) {
      return this.request(`/products/public/${params.tenantId}/categories/`);
    }

    // Otherwise use authenticated API
    return this.request(`/products/categories/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Public Categories (no authentication required)
  async getPublicCategories(tenantId: string): Promise<ApiResponse<Category[]>> {
    return this.request(`/products/public/${tenantId}/categories/`);
  }

  // Public Products (no authentication required)
  async getPublicProducts(tenantId: string, params?: {
    page?: number;
    category?: string;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    queryParams.append('page_size', '200');

    return this.request(`/products/public/${tenantId}/products/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async createCategory(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request('/products/categories/create/', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request(`/products/categories/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.request(`/products/categories/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  async getMyProducts(params?: {
    page?: number;
    category?: string;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    // Request more products per page to get all products
    queryParams.append('page_size', '200');

    return this.request(`/products/list/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}/`);
  }

  async createProduct(productData: Partial<Product> | FormData): Promise<ApiResponse<Product>> {
    const isFormData = productData instanceof FormData;

    return this.request('/products/create/', {
      method: 'POST',
      body: isFormData ? productData : JSON.stringify(productData),
      headers: isFormData ? {
        // Don't set Content-Type for FormData, let the browser set it
      } : undefined,
    });
  }

  async updateProduct(id: string, productData: Partial<Product> | FormData): Promise<ApiResponse<Product>> {
    const isFormData = productData instanceof FormData;

    return this.request(`/products/${id}/update/`, {
      method: 'PUT',
      body: isFormData ? productData : JSON.stringify(productData),
      headers: isFormData ? {
        // Don't set Content-Type for FormData, let the browser set it
      } : undefined,
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return this.request(`/products/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  async getProductCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/products/categories/');
  }

  // Tenant-specific methods for customer stores
  async getTenantProducts(tenantId: string, params?: {
    page?: number;
    category?: string;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    queryParams.append('page_size', '200');

    return this.request(`/products/public/${tenantId}/products/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getTenantCategories(tenantId: string): Promise<ApiResponse<Category[]>> {
    return this.request(`/products/public/${tenantId}/categories/`);
  }

  async getProductStats(): Promise<ApiResponse<any>> {
    return this.request('/products/stats/');
  }

  async createProductCategory(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request('/products/categories/create/', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateProductCategory(id: string, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request(`/products/categories/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteProductCategory(id: string): Promise<ApiResponse<void>> {
    return this.request(`/products/categories/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  // Inventory Management
  async getInventory(params?: {
    page?: number;
    store?: string;
    low_stock?: string;
    out_of_stock?: string;
  }): Promise<ApiResponse<ProductInventory[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.store) queryParams.append('store', params.store);
    if (params?.low_stock) queryParams.append('low_stock', params.low_stock);
    if (params?.out_of_stock) queryParams.append('out_of_stock', params.out_of_stock);

    return this.request(`/products/inventory/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async updateInventory(id: string, inventoryData: Partial<ProductInventory>): Promise<ApiResponse<ProductInventory>> {
    return this.request(`/products/inventory/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData),
    });
  }

  // Stock Transfers
  async getStockTransfers(params?: {
    page?: number;
    status?: string;
    store?: string;
  }): Promise<ApiResponse<StockTransfer[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.store) queryParams.append('store', params.store);

    const queryString = queryParams.toString();
    return this.request(`/products/transfers/${queryString ? `?${queryString}` : ''}`);
  }

  async createStockTransfer(transferData: Partial<StockTransfer>): Promise<ApiResponse<StockTransfer>> {
    return this.request('/products/transfers/create/', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async getStockTransfer(id: string): Promise<ApiResponse<StockTransfer>> {
    return this.request(`/products/transfers/${id}/`);
  }

  async approveStockTransfer(id: string): Promise<ApiResponse<any>> {
    return this.request(`/products/transfers/${id}/approve/`, {
      method: 'POST',
    });
  }

  async completeStockTransfer(id: string): Promise<ApiResponse<any>> {
    return this.request(`/products/transfers/${id}/complete/`, {
      method: 'POST',
    });
  }

  async cancelStockTransfer(id: string): Promise<ApiResponse<any>> {
    return this.request(`/products/transfers/${id}/cancel/`, {
      method: 'POST',
    });
  }

  // Global Catalogue (Business Admin only)
  async getGlobalCatalogue(): Promise<ApiResponse<any>> {
    return this.request('/products/global-catalogue/');
  }

  async importProducts(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/products/import/', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
      },
    });
  }

  // Sales
  async getSales(params?: {
    page?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<Sale[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    return this.request(`/sales/list/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getSale(id: string): Promise<ApiResponse<Sale>> {
    return this.request(`/sales/${id}/`);
  }

  async createSale(saleData: Partial<Sale>): Promise<ApiResponse<Sale>> {
    return this.request('/sales/create/', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(id: string, saleData: Partial<Sale>): Promise<ApiResponse<Sale>> {
    return this.request(`/sales/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  // Sales Pipeline
  async getSalesPipeline(params?: {
    page?: number;
    stage?: string;
    assigned_to?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<SalesPipeline[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await this.request<SalesPipeline[]>(`/sales/pipeline/${queryParams.toString() ? `?${queryParams}` : ''}`);
    return response;
  }

  // Platform-wide sales pipeline (for platform admin to see all tenants)
  async getPlatformSalesPipeline(params?: {
    page?: number;
    stage?: string;
    tenant?: string;
  }): Promise<ApiResponse<SalesPipeline[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.tenant) queryParams.append('tenant', params.tenant);
    // Add platform flag to indicate this is a platform-wide request
    queryParams.append('platform', 'true');

    const response = await this.request<SalesPipeline[]>(`/sales/pipeline/${queryParams.toString() ? `?${queryParams}` : ''}`);
    return response;
  }

  // CRM sales pipeline (for platform admin to sell the CRM platform)
  async getCRMSalesPipeline(params?: {
    page?: number;
    stage?: string;
    source?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.stage) queryParams.append('stage', params.stage);
      if (params?.source) queryParams.append('source', params.source);

      const response = await this.request<any[]>(`/crm/sales/pipeline/${queryParams.toString() ? `?${queryParams}` : ''}`);
      return response;
    } catch (error) {
      // Silently handle missing endpoint - this is expected until backend is implemented
      return {
        success: true,
        data: [],
        message: 'CRM sales pipeline data not available yet'
      };
    }
  }

  // My Sales Pipeline (for salespeople to see only their own pipeline)
  async getMySalesPipeline(params?: {
    page?: number;
    stage?: string;
  }): Promise<ApiResponse<SalesPipeline[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.stage) queryParams.append('stage', params.stage);

    const response = await this.request<SalesPipeline[]>(`/sales/pipeline/my/${queryParams.toString() ? `?${queryParams}` : ''}`);
    return response;
  }

  async getMyPipeline(id: string): Promise<ApiResponse<SalesPipeline>> {
    return this.request(`/sales/pipeline/my/${id}/`);
  }

  async createSalesPipeline(pipelineData: Partial<SalesPipeline>): Promise<ApiResponse<SalesPipeline>> {
    return this.request('/sales/pipeline/create/', {
      method: 'POST',
      body: JSON.stringify(pipelineData),
    });
  }

  async updatePipelineStage(id: string, stageData: { stage: string }): Promise<ApiResponse<SalesPipeline>> {
    return this.request(`/sales/pipeline/${id}/transition/`, {
      method: 'POST',
      body: JSON.stringify(stageData),
    });
  }

  async getPipeline(id: string): Promise<ApiResponse<SalesPipeline>> {
    return this.request(`/sales/pipeline/${id}/`);
  }

  async updatePipeline(id: string, pipelineData: Partial<SalesPipeline>): Promise<ApiResponse<SalesPipeline>> {
    return this.request(`/sales/pipeline/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(pipelineData),
    });
  }

  async deletePipeline(id: string): Promise<ApiResponse<void>> {
    return this.request(`/sales/pipeline/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  async getPipelineStats(): Promise<ApiResponse<any>> {
    return this.request('/sales/pipeline/stats/');
  }

  async getPipelineStages(): Promise<ApiResponse<any>> {
    return this.request('/sales/pipeline/stages/');
  }

  // Appointments
  async getAppointments(params?: {
    page?: number;
    status?: string;
    date?: string;
    client?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Appointment[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.client) queryParams.append('client', params.client);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    return this.request(`/clients/appointments/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getAppointmentSlots(params?: {
    start_date?: string;
    end_date?: string;
    duration?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.duration) queryParams.append('duration', params.duration.toString());

    return this.request(`/clients/appointments/slots/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async createAppointment(appointmentData: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    return this.request('/clients/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id: string, appointmentData: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    return this.request(`/clients/appointments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async confirmAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return this.request(`/clients/appointments/${id}/confirm/`, {
      method: 'POST',
    });
  }

  async completeAppointment(id: string, outcomeNotes?: string): Promise<ApiResponse<Appointment>> {
    return this.request(`/clients/appointments/${id}/complete/`, {
      method: 'POST',
      body: JSON.stringify({ outcome_notes: outcomeNotes }),
    });
  }

  async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    return this.request(`/clients/appointments/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleAppointment(id: string, newDate: string, newTime: string, reason?: string): Promise<ApiResponse<Appointment>> {
    return this.request(`/clients/appointments/${id}/reschedule/`, {
      method: 'POST',
      body: JSON.stringify({
        new_date: newDate,
        new_time: newTime,
        reason
      }),
    });
  }

  async editAppointment(id: string, appointmentData: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    return this.request(`/clients/appointments/${id}/`, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  // Users/Team

  async createTeamMember(memberData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
    store?: number;
  }): Promise<ApiResponse<User>> {
    const response = await this.request<User>('/users/team-members/', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });

    // Invalidate cache for team members and related data
    if (response.success) {
      this.invalidateCache(['/users/team-members/', '/users/', '/stores/']);
    }

    return response;
  }

  async updateTeamMember(id: string, memberData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.request<User>(`/users/team-members/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });

    // Invalidate cache for team members and related data
    if (response.success) {
      this.invalidateCache([`/users/team-members/${id}/`, '/users/team-members/', '/users/', '/stores/']);
    }

    return response;
  }

  async deleteTeamMember(id: string): Promise<ApiResponse<void>> {
    const response = await this.request<void>(`/users/team-members/${id}/delete/`, {
      method: 'DELETE',
    });

    // Invalidate cache for team members and related data
    if (response.success) {
      this.invalidateCache([`/users/team-members/${id}/`, '/users/team-members/', '/users/', '/stores/']);
    }

    return response;
  }

  // Analytics
  async getAnalytics(params?: {
    period?: string;
    type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.type) queryParams.append('type', params.type);

    return this.request(`/analytics/dashboard/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Store Analytics (for managers and store staff)
  async getStoreAnalytics(params?: {
    period?: string;
    type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.type) queryParams.append('type', params.type);

    return this.request(`/analytics/store/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Support Tickets
  async getSupportTickets(params?: {
    page?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<SupportTicket[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/support/tickets/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getSupportTicket(id: string): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>(`/support/tickets/${id}/`);
  }

  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    return this.request('/support/tickets/', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async updateSupportTicket(id: string, ticketData: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    return this.request(`/support/tickets/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(ticketData),
    });
  }

  async deleteSupportTicket(id: string): Promise<ApiResponse<void>> {
    return this.request(`/support/tickets/${id}/`, {
      method: 'DELETE',
    });
  }

  // Ticket Actions
  async assignTicketToMe(id: string): Promise<ApiResponse<any>> {
    return this.request(`/support/tickets/${id}/assign_to_me/`, {
      method: 'POST',
    });
  }

  async resolveTicket(id: string): Promise<ApiResponse<any>> {
    return this.request(`/support/tickets/${id}/resolve/`, {
      method: 'POST',
    });
  }

  async closeTicket(id: string): Promise<ApiResponse<any>> {
    return this.request(`/support/tickets/${id}/close/`, {
      method: 'POST',
    });
  }

  async reopenTicket(id: string): Promise<ApiResponse<any>> {
    return this.request(`/support/${id}/reopen/`, {
      method: 'POST',
    });
  }

  // Ticket Messages
  async getTicketMessages(ticketId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/support/messages/?ticket=${ticketId}`);
  }

  async createTicketMessage(ticketId: string, messageData: {
    content: string;
    is_internal?: boolean;
    message_type?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/support/messages/', {
      method: 'POST',
      body: JSON.stringify({
        ...messageData,
        ticket: ticketId
      }),
    });
  }

  // Marketing
  async getMarketingCampaigns(): Promise<ApiResponse<any[]>> {
    return this.request('/marketing/campaigns/');
  }

  async createMarketingCampaign(campaignData: any): Promise<ApiResponse<any>> {
    return this.request('/marketing/campaigns/', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  // Stores
  async getStores(): Promise<ApiResponse<Store[]>> {
    return this.request<Store[]>('/stores/');
  }

  async getStore(id: string): Promise<ApiResponse<Store>> {
    return this.request<Store>(`/stores/${id}/`);
  }

  async createStore(storeData: Partial<Store>): Promise<ApiResponse<Store>> {
    const response = await this.request<Store>('/stores/', {
      method: 'POST',
      body: JSON.stringify(storeData),
    });

    // Invalidate cache for stores and related data
    if (response.success) {
      this.invalidateCache(['/stores/', '/users/team-members/', '/users/']);
    }

    return response;
  }

  async updateStore(id: string, storeData: Partial<Store>): Promise<ApiResponse<Store>> {
    const response = await this.request<Store>(`/stores/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });

    // Invalidate cache for stores and related data
    if (response.success) {
      this.invalidateCache([`/stores/${id}/`, '/stores/', '/users/team-members/', '/users/']);
    }

    return response;
  }

  async deleteStore(id: string): Promise<ApiResponse<void>> {
    const response = await this.request<void>(`/stores/${id}/`, {
      method: 'DELETE',
    });

    // Invalidate cache for stores and related data
    if (response.success) {
      this.invalidateCache([`/stores/${id}/`, '/stores/', '/users/team-members/', '/users/']);
    }

    return response;
  }

  async getStoreTeam(storeId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/stores/${storeId}/team/`);
  }

  async getStorePerformance(storeId: string): Promise<ApiResponse<any>> {
    return this.request(`/stores/${storeId}/performance/`);
  }

  async getStoreStaff(storeId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/stores/${storeId}/staff/`);
  }

  async getStoreRecentSales(storeId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/stores/${storeId}/recent-sales/`);
  }

  async assignStoreTeam(storeId: string, assignments: any[]): Promise<ApiResponse<void>> {
    return this.request(`/stores/${storeId}/assign-team/`, {
      method: 'PATCH',
      body: JSON.stringify({ assignments }),
    });
  }

  // Integrations
  async getIntegrations(): Promise<ApiResponse<any[]>> {
    return this.request('/integrations/');
  }

  // Tasks
  async getTasks(params?: {
    page?: number;
    status?: string;
    assigned_to?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);

    return this.request(`/tasks/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async createTask(taskData: any): Promise<ApiResponse<any>> {
    return this.request('/tasks/', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  // Follow-ups
  async getFollowUps(params?: {
    page?: number;
    status?: string;
    client?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.client) queryParams.append('client', params.client);

    return this.request(`/follow-ups/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async createFollowUp(followUpData: any): Promise<ApiResponse<any>> {
    return this.request('/follow-ups/', {
      method: 'POST',
      body: JSON.stringify(followUpData),
    });
  }

  // Customer Import/Export
  async importCustomers(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/clients/import/', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
    });
  }

  async exportCustomers(params: {
    format: string;
    fields: string[];
    start_date?: string;
    end_date?: string;
    status?: string;
    store?: string;
  }): Promise<ApiResponse<any>> {
    // Use the correct endpoint based on format
    // Custom path in urls.py: 'clients/export/csv/' 
    // Included at 'api/clients/' in core/urls.py
    // Full path: /api/clients/clients/export/csv/
    // getApiUrl adds '/api', so we use '/clients/clients/export/csv/'
    let endpoint: string;
    switch (params.format) {
      case 'csv':
        endpoint = '/clients/clients/export/csv/';
        break;
      case 'xlsx':
        // Temporarily redirect XLSX to CSV since XLSX is not implemented yet
        endpoint = '/clients/clients/export/csv/';
        break;
      default:
        endpoint = '/clients/clients/export/json/';
    }

    // Add query parameters
    const queryParams = new URLSearchParams();
    if (params.fields && params.fields.length > 0) {
      queryParams.append('fields', params.fields.join(','));
    }
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.store) {
      queryParams.append('store', params.store);
    }

    const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    
    // For export, we need to handle blob response directly
    const token = this.getAuthToken();
    const apiUrl = getApiUrl(url);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const blob = await response.blob();
    return {
      data: blob as any,
      success: true,
    };
  }

  // Announcements
  async getAnnouncements(params?: {
    page?: number;
    priority?: string;
    type?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.type) queryParams.append('type', params.type);

    return this.request(`/announcements/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async markAnnouncementAsRead(announcementId: number): Promise<ApiResponse<any>> {
    return this.request(`/announcements/${announcementId}/mark_as_read/`, {
      method: 'POST',
    });
  }

  async acknowledgeAnnouncement(announcementId: number): Promise<ApiResponse<any>> {
    return this.request(`/announcements/${announcementId}/acknowledge/`, {
      method: 'POST',
    });
  }

  // Team Messages
  async getTeamMessages(params?: {
    page?: number;
    type?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.type) queryParams.append('type', params.type);

    return this.request(`/announcements/messages/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async markMessageAsRead(messageId: number): Promise<ApiResponse<any>> {
    return this.request(`/announcements/messages/${messageId}/mark_as_read/`, {
      method: 'POST',
    });
  }

  async createAnnouncement(announcementData: any): Promise<ApiResponse<any>> {
    return this.request('/announcements/', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  }

  async replyToMessage(messageId: number, replyData: {
    content: string;
    message_type: string;
    is_internal?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request(`/announcements/messages/${messageId}/reply/`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    });
  }

  async createTeamMessage(messageData: any): Promise<ApiResponse<any>> {
    return this.request('/announcements/messages/', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Escalations
  async getEscalations(params?: {
    page?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/escalation/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getEscalation(id: string): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${id}/`);
  }

  async createEscalation(escalationData: any): Promise<ApiResponse<any>> {
    return this.request('/escalation/', {
      method: 'POST',
      body: JSON.stringify(escalationData),
    });
  }

  async updateEscalation(id: string, escalationData: any): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(escalationData),
    });
  }

  async assignEscalation(id: string, userId: number): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${id}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to: userId }),
    });
  }

  async changeEscalationStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${id}/change_status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async resolveEscalation(id: string): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${id}/resolve/`, {
      method: 'POST',
    });
  }

  async closeEscalation(id: string): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${id}/close/`, {
      method: 'POST',
    });
  }

  async getEscalationNotes(escalationId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/escalation/${escalationId}/notes/`);
  }

  async createEscalationNote(escalationId: string, noteData: {
    content: string;
    is_internal?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request(`/escalation/${escalationId}/notes/`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  async getEscalationStats(): Promise<ApiResponse<any>> {
    return this.request('/escalation/stats/');
  }

  async getMyEscalations(params?: {
    page?: number;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);

    return this.request(`/escalation/my-escalations/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // ================================
  // NOTIFICATION API ENDPOINTS
  // ================================

  // Get user notifications
  async getNotifications(params?: {
    page?: number;
    status?: string;
    type?: string;
    priority?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.priority) queryParams.append('priority', params.priority);

    return this.request(`/notifications/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.request(`/notifications/${notificationId}/mark_as_read/`, {
      method: 'POST',
    });
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/notifications/mark_all_as_read/', {
      method: 'POST',
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${notificationId}/`, {
      method: 'DELETE',
    });
  }

  // Create notification
  async createNotification(notificationData: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  // Get notification settings
  async getNotificationSettings(): Promise<ApiResponse<any>> {
    return this.request('/notifications/settings/');
  }

  // Update notification settings
  async updateNotificationSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Get notification templates
  async getNotificationTemplates(): Promise<ApiResponse<any[]>> {
    return this.request('/notifications/templates/');
  }

  // Create notification template
  async createNotificationTemplate(templateData: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/templates/', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  // Update notification template
  async updateNotificationTemplate(templateId: string, templateData: any): Promise<ApiResponse<any>> {
    return this.request(`/notifications/templates/${templateId}/`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  // Delete notification template
  async deleteNotificationTemplate(templateId: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/templates/${templateId}/`, {
      method: 'DELETE',
    });
  }

  // Get notification statistics
  async getNotificationStats(): Promise<ApiResponse<any>> {
    return this.request('/notifications/stats/');
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(subscription: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/subscribe_push/', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(endpoint: string): Promise<ApiResponse<any>> {
    return this.request('/notifications/unsubscribe_push/', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  // Get VAPID public key
  async getVapidPublicKey(): Promise<ApiResponse<{ public_key: string }>> {
    return this.request('/notifications/vapid_public_key/');
  }

  // ================================
  // WHATSAPP INTEGRATION ENDPOINTS
  // ================================

  // Get WhatsApp connection status
  async getWhatsAppStatus(): Promise<ApiResponse<any>> {
    return this.request('/integrations/whatsapp/');
  }

  // Start WhatsApp session
  async startWhatsAppSession(): Promise<ApiResponse<any>> {
    return this.request('/integrations/whatsapp/session/', {
      method: 'POST',
    });
  }

  // Send single WhatsApp message
  async sendWhatsAppMessage(data: {
    phone: string;
    message: string;
    type?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/integrations/whatsapp/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Send bulk WhatsApp messages
  async sendBulkWhatsAppMessages(data: {
    recipients: string[];
    message: string;
    template_type?: string;
    template_data?: any;
  }): Promise<ApiResponse<any>> {
    return this.request('/integrations/whatsapp/bulk/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get WhatsApp templates
  async getWhatsAppTemplates(): Promise<ApiResponse<any[]>> {
    return this.request('/integrations/whatsapp/templates/');
  }

  // ================================
  // PURCHASES ENDPOINTS
  // ================================

  // Get all purchases
  async getPurchases(): Promise<ApiResponse<any[]>> {
    return this.request('/clients/purchases/');
  }

  // Create a new purchase
  async createPurchase(purchaseData: any): Promise<ApiResponse<any>> {
    return this.request('/clients/purchases/', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  // Update a purchase
  async updatePurchase(purchaseId: string, purchaseData: any): Promise<ApiResponse<any>> {
    return this.request(`/clients/purchases/${purchaseId}/`, {
      method: 'PUT',
      body: JSON.stringify(purchaseData),
    });
  }

  // Delete a purchase
  async deletePurchase(purchaseId: string): Promise<ApiResponse<void>> {
    return this.request(`/clients/purchases/${purchaseId}/`, {
      method: 'DELETE',
    });
  }

  // ================================
  // SALES PIPELINE ENDPOINTS
  // ================================

  // Get all sales pipelines (different from existing pipeline methods)
  async getSalesPipelines(): Promise<ApiResponse<any[]>> {
    return this.request('/sales/pipeline/');
  }

  // ================================
  // ROLE-BASED SALESPERSON ASSIGNMENT
  // ================================

  // List team members (filtered by current user's context)
  async listTeamMembers(): Promise<ApiResponse<User[]>> {
    return this.request('/users/team-members/list/');
  }

  // Get team members for a manager
  async getTeamMembers(managerId: number): Promise<ApiResponse<User[]>> {
    return this.request(`/users/team-members/${managerId}/`);
  }

  // Get sales users in a specific tenant
  async getTenantSalesUsers(tenantId: number): Promise<ApiResponse<User[]>> {
    return this.request(`/users/tenant/${tenantId}/sales-users/`);
  }

  // Get all sales users (platform admin only)
  async getAllSalesUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/users/sales-users/');
  }

  // Get salespersons for current user's tenant and store context
  async getSalesPersonsForContext(): Promise<ApiResponse<User[]>> {
    return this.request('/users/salespersons/context/');
  }

  // Log assignment override for audit trail
  async logAssignmentOverride(audit: {
    assignedByUserId: number;
    assignedByRole: string;
    assignedToUserId: number;
    assignedToName: string;
    assignmentType: 'self' | 'manager' | 'admin';
    assignmentScope: 'self' | 'team' | 'tenant' | 'global';
    timestamp: string;
    overrideReason?: string;
    teamViolation?: boolean;
  }): Promise<ApiResponse<void>> {
    return this.request('/audit/assignment-override/', {
      method: 'POST',
      body: JSON.stringify(audit)
    });
  }

  // Platform Admin - Billing Overview
  async getBillingOverview(): Promise<ApiResponse<{
    total_revenue: number;
    monthly_revenue: number;
    active_subscriptions: number;
    pending_payments: number;
    revenue_growth: number;
    subscription_plans: {
      basic: number;
      professional: number;
      enterprise: number;
    };
    recent_transactions: Array<{
      id: number;
      tenant_name: string;
      amount: number;
      plan: string;
      status: string;
      date: string;
    }>;
  }>> {
    return this.request('/tenants/billing/');
  }

  // Platform Admin - Export Billing Report
  async exportBillingReport(): Promise<Blob> {
    const token = this.getAuthToken();
    const url = getApiUrl('/tenants/billing/export/');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Platform Admin - Toggle Tenant Status
  async toggleTenantStatus(tenantId: number): Promise<ApiResponse<{
    id: number;
    name: string;
    subscription_status: string;
  }>> {
    return this.request(`/tenants/${tenantId}/toggle-status/`, {
      method: 'PATCH',
    });
  }
}

export const apiService = new ApiService();
export { ApiService };
export type { User, Client, Product, ProductInventory, StockTransfer, Sale, SalesPipeline, Appointment, Category, DashboardStats, Store, SupportTicket };