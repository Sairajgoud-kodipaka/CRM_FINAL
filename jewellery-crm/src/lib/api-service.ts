// API Service for connecting to Django backend
const API_BASE_URL = 'http://localhost:8000/api';

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
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
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
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
  }>;
  tenant?: number;
  store?: number;
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
  private getAuthToken(): string | null {
    // Get token from localStorage or sessionStorage
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          
          // Try different possible structures
          const token = parsed.state?.token || parsed.token || null;
          return token;
        } catch (error) {
          console.error('Error parsing auth storage:', error);
          return null;
        }
      }
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = this.getAuthToken();
    
    // Check if the request body is FormData
    const isFormData = options.body instanceof FormData;
    
    const defaultHeaders: Record<string, string> = {
      // Only set Content-Type for JSON requests, let browser set it for FormData
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // Only include Authorization header for non-login requests
      ...(token && !endpoint.includes('/auth/login/') && { 'Authorization': `Bearer ${token}` }),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Try to get the error response body
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.text();
          console.error('API Error Response body:', errorBody);
          
          // Try to parse the error body as JSON
          try {
            const errorData = JSON.parse(errorBody);
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
          console.error('Could not read error response body');
        }
        
        // Only redirect for 401 errors that are NOT login attempts
        if (response.status === 401 && !url.includes('/auth/login/')) {
          // Token expired or invalid, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
          }
        }
        throw new Error(errorMessage);
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
        console.error('Failed to parse JSON response:', error);
        // If JSON parsing fails, return success with empty data
        data = null;
      }
      
      // Check if the response is already in ApiResponse format
      if (data && typeof data === 'object' && 'success' in data) {
        // Response is already in ApiResponse format
        return data;
      } else {
        // Response is direct data, wrap it in ApiResponse format
        return {
          data,
          success: true,
        };
      }
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/profile/');
  }

  async changePassword(data: {
    old_password: string;
    new_password: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/auth/change-password/', {
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
    return this.request('/auth/profile/update/', {
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
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: token }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
    }
    
    return { data: undefined, success: true };
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/analytics/dashboard/');
  }

  async getBusinessAdminDashboard(params?: {
    start_date?: string;
    end_date?: string;
    filter_type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.filter_type) queryParams.append('filter_type', params.filter_type);
    
    const url = `/tenants/dashboard/${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request(url);
  }

  async getPlatformAdminDashboard(): Promise<ApiResponse<any>> {
    return this.request('/tenants/platform-dashboard/');
  }

  async getManagerDashboard(): Promise<ApiResponse<any>> {
    return this.request('/tenants/manager-dashboard/');
  }

  async getSalesDashboard(): Promise<ApiResponse<any>> {
    return this.request('/sales/dashboard/');
  }

  // Clients (Customers) API
  async getClients(params?: {
    page?: number;
    search?: string;
    status?: string;
    assigned_to?: string;
  }): Promise<ApiResponse<Client[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);

    return this.request(`/clients/clients/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async getClient(id: string): Promise<ApiResponse<Client>> {
    return this.request(`/clients/clients/${id}/`);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`/auth/team-members/${id}/`);
  }

  async createClient(clientData: Partial<Client>): Promise<ApiResponse<Client>> {
    return this.request('/clients/clients/', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id: string, clientData: Partial<Client>): Promise<ApiResponse<Client>> {
    return this.request(`/clients/clients/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return this.request(`/clients/clients/${id}/`, {
      method: 'DELETE',
    });
  }

  async getTrashedClients(): Promise<ApiResponse<Client[]>> {
    return this.request('/clients/clients/trash/');
  }

  async restoreClient(id: string): Promise<ApiResponse<void>> {
    return this.request(`/clients/clients/${id}/restore/`, {
      method: 'POST',
    });
  }

  async getClientAuditLogs(clientId: string): Promise<ApiResponse<AuditLog[]>> {
    return this.request(`/clients/audit-logs/?client=${clientId}`);
  }

  async getCustomerDropdownOptions(): Promise<ApiResponse<any>> {
    return this.request('/clients/clients/dropdown_options/');
  }

  // Customer Tags and Segmentation
  async getCustomerTags(): Promise<ApiResponse<any[]>> {
    return this.request('/clients/tags/');
  }

  async getCustomerTagCategories(): Promise<ApiResponse<any[]>> {
    return this.request('/clients/tags/categories/');
  }

  async getCustomerTagsByCategory(category?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    return this.request(`/clients/tags/by_category/${queryParams.toString() ? `?${queryParams}` : ''}`);
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
    last_name: string;
    email: string;
    phone: string;
    city?: string;
    notes?: string;
    customer_type?: string;
  }): Promise<ApiResponse<Client>> {
    return this.request('/clients/clients/', {
      method: 'POST',
      body: JSON.stringify({
        ...leadData,
        status: 'exhibition',
        lead_source: 'exhibition',
        customer_type: leadData.customer_type || 'individual'
      }),
    });
  }

  // Products
  async getProducts(params?: {
    page?: number;
    category?: string;
    search?: string;
    status?: string;
    scope?: string;
  }): Promise<ApiResponse<Product[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.scope) queryParams.append('scope', params.scope);
    // Request more products per page to get all products
    queryParams.append('page_size', '200');

    return this.request(`/products/list/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  // Categories
  async getCategories(params?: {
    scope?: string;
  }): Promise<ApiResponse<Category[]>> {
    const queryParams = new URLSearchParams();
    if (params?.scope) queryParams.append('scope', params.scope);

    return this.request(`/products/categories/${queryParams.toString() ? `?${queryParams}` : ''}`);
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

    return this.request(`/products/${queryParams.toString() ? `?${queryParams}` : ''}`);
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
  }): Promise<ApiResponse<SalesPipeline[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);

    const response = await this.request<SalesPipeline[]>(`/sales/pipeline/${queryParams.toString() ? `?${queryParams}` : ''}`);
    console.log('getSalesPipeline response:', response);
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
    console.log('getPlatformSalesPipeline response:', response);
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
      console.log('getCRMSalesPipeline response:', response);
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
    console.log('getMySalesPipeline response:', response);
    return response;
  }

  async getMyPipeline(id: string): Promise<ApiResponse<SalesPipeline>> {
    return this.request(`/sales/pipeline/my/${id}/`);
  }

  async createSalesPipeline(pipelineData: Partial<SalesPipeline>): Promise<ApiResponse<SalesPipeline>> {
    console.log('Creating pipeline with data:', pipelineData);
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
  }): Promise<ApiResponse<Appointment[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.client) queryParams.append('client', params.client);

    return this.request(`/clients/appointments/${queryParams.toString() ? `?${queryParams}` : ''}`);
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
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  // Users/Team
  async getTeamMembers(): Promise<ApiResponse<User[]>> {
    return this.request('/auth/team-members/');
  }

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
    return this.request('/auth/team-members/', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateTeamMember(id: string, memberData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/auth/team-members/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  async deleteTeamMember(id: string): Promise<ApiResponse<void>> {
    return this.request(`/auth/team-members/${id}/delete/`, {
      method: 'DELETE',
    });
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
    return this.request(`/support/tickets/${id}/`);
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
    return this.request(`/support/tickets/${id}/reopen/`, {
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
    return this.request('/stores/');
  }

  async getStore(id: string): Promise<ApiResponse<Store>> {
    return this.request(`/stores/${id}/`);
  }

  async createStore(storeData: Partial<Store>): Promise<ApiResponse<Store>> {
    return this.request('/stores/', {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  }

  async updateStore(id: string, storeData: Partial<Store>): Promise<ApiResponse<Store>> {
    return this.request(`/stores/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  }

  async deleteStore(id: string): Promise<ApiResponse<void>> {
    return this.request(`/stores/${id}/`, {
      method: 'DELETE',
    });
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

    return this.request(`/tasks/tasks/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async createTask(taskData: any): Promise<ApiResponse<any>> {
    return this.request('/tasks/tasks/', {
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

    return this.request(`/clients/follow-ups/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async createFollowUp(followUpData: any): Promise<ApiResponse<any>> {
    return this.request('/clients/follow-ups/', {
      method: 'POST',
      body: JSON.stringify(followUpData),
    });
  }

  // Customer Import/Export
  async importCustomers(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/clients/clients/import/', {
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
  }): Promise<ApiResponse<any>> {
    // Use the correct endpoint based on format
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

    // Add fields as query parameter if provided
    const queryParams = new URLSearchParams();
    if (params.fields && params.fields.length > 0) {
      queryParams.append('fields', params.fields.join(','));
    }

    const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.request(url, {
      method: 'GET',
    });
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

    return this.request(`/announcements/announcements/${queryParams.toString() ? `?${queryParams}` : ''}`);
  }

  async markAnnouncementAsRead(announcementId: number): Promise<ApiResponse<any>> {
    return this.request(`/announcements/announcements/${announcementId}/mark_as_read/`, {
      method: 'POST',
    });
  }

  async acknowledgeAnnouncement(announcementId: number): Promise<ApiResponse<any>> {
    return this.request(`/announcements/announcements/${announcementId}/acknowledge/`, {
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
    return this.request('/announcements/announcements/', {
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
    return this.request(`/notifications/notifications/${notificationId}/mark_as_read/`, {
      method: 'POST',
    });
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request('/notifications/notifications/mark_all_as_read/', {
      method: 'POST',
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/notifications/${notificationId}/`, {
      method: 'DELETE',
    });
  }

  // Create notification
  async createNotification(notificationData: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/notifications/', {
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
  async subscribeToPushNotifications(subscriptionData: any): Promise<ApiResponse<any>> {
    return this.request('/notifications/push/subscribe/', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(): Promise<ApiResponse<any>> {
    return this.request('/notifications/push/unsubscribe/', {
      method: 'POST',
    });
  }

  // ================================
  // WHATSAPP INTEGRATION ENDPOINTS
  // ================================

  // Get WhatsApp connection status
  async getWhatsAppStatus(): Promise<ApiResponse<any>> {
    return this.request('/integrations/whatsapp/status/');
  }

  // Start WhatsApp session
  async startWhatsAppSession(): Promise<ApiResponse<any>> {
    return this.request('/integrations/whatsapp/session/start/', {
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
}

export const apiService = new ApiService();
export { ApiService };
export type { User, Client, Product, ProductInventory, StockTransfer, Sale, SalesPipeline, Appointment, Category, DashboardStats, Store, SupportTicket }; 