/**
 * Core TypeScript types for Jewellery CRM System
 * This file contains all the essential types used throughout the application
 */

// ================================
// USER MANAGEMENT TYPES
// ================================

/**
 * User roles in the multi-tenant system
 * Each role has specific permissions and access levels
 */
export type UserRole = 'platform_admin' | 'business_admin' | 'store_manager' | 'sales_team' | 'marketing_team' | 'telecaller';

/**
 * User interface representing a system user
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  storeId?: string; // Only for store_manager and sales_team
  isActive: boolean;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant (jewellery business) information
 */
export interface Tenant {
  id: string;
  name: string;
  domain: string; // Subdomain for multi-tenant access
  businessType: 'traditional' | 'contemporary' | 'wedding_specialist' | 'general';
  logo?: string;
  address: Address;
  phone: string;
  email: string;
  gstNumber?: string;
  isActive: boolean;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant-specific configuration settings
 */
export interface TenantSettings {
  currency: 'INR' | 'USD';
  timezone: string;
  dateFormat: string;
  businessHours: BusinessHours;
  whatsappIntegration?: WhatsAppSettings;
  ecommerceEnabled: boolean;
  theme: {
    primaryColor: string;
    logo?: string;
  };
}

// ================================
// CUSTOMER MANAGEMENT TYPES
// ================================

/**
 * Customer information with jewellery-specific preferences
 */
export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  avatar?: string;
  
  // Address information
  addresses: Address[];
  
  // Jewellery preferences
  preferences: CustomerPreferences;
  
  // Customer classification
  type: 'vip' | 'regular' | 'new_lead';
  tags: string[];
  
  // Tracking
  source: 'walk_in' | 'online' | 'referral' | 'social_media' | 'advertisement';
  assignedTo?: string; // Sales team member ID
  
  // Financial
  creditLimit?: number;
  totalPurchases: number;
  averageOrderValue: number;
  
  // Metadata
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Customer's jewellery preferences and requirements
 */
export interface CustomerPreferences {
  preferredMetal: ('gold' | 'silver' | 'platinum' | 'diamond')[];
  stylePreference: ('traditional' | 'modern' | 'fusion' | 'antique')[];
  occasions: ('wedding' | 'anniversary' | 'festival' | 'personal' | 'gift')[];
  budgetRange: {
    min: number;
    max: number;
  };
  sizes: {
    ringSize?: string;
    braceletSize?: string;
    necklaceLength?: string;
  };
  allergies?: string[];
  specialRequirements?: string;
}

/**
 * Address structure supporting Indian address formats
 */
export interface Address {
  id: string;
  type: 'home' | 'office' | 'billing' | 'shipping';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
}

// ================================
// SALES PIPELINE TYPES
// ================================

/**
 * Sales pipeline stages
 */
export type SalesPipelineStage = 'exhibition' | 'social_media' | 'interested' | 'store_walkin' | 'negotiation' | 'closed_won' | 'closed_lost' | 'future_prospect' | 'not_qualified';

/**
 * Deal/Opportunity in the sales pipeline
 */
export interface Deal {
  id: string;
  tenantId: string;
  customerId: string;
  title: string;
  description?: string;
  stage: SalesPipelineStage;
  value: number;
  probability: number; // 0-100 percentage
  
  // Product details
  products: DealProduct[];
  
  // Timeline
  expectedCloseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  
  // Assignment
  assignedTo: string; // Sales team member ID
  
  // Activity tracking
  lastActivityDate?: Date;
  nextFollowUp?: Date;
  
  // Additional info
  source: string;
  tags: string[];
  notes?: string;
  
  // Custom fields for jewellery business
  occasion?: string;
  urgency: 'low' | 'medium' | 'high';
  customizations?: string;
}

/**
 * Product details within a deal
 */
export interface DealProduct {
  productId: string;
  quantity: number;
  unitPrice: number;
  customizations?: string;
  notes?: string;
}

// ================================
// PRODUCT CATALOG TYPES
// ================================

/**
 * Product category structure
 */
export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentId?: string; // For subcategories
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product information for jewellery items
 */
export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  
  // Pricing
  basePrice: number;
  salePrice?: number;
  costPrice: number;
  
  // Jewellery specifications
  specifications: ProductSpecifications;
  
  // Media
  images: ProductImage[];
  has360View: boolean;
  
  // Variants (size, metal, stone)
  variants: ProductVariant[];
  
  // Inventory
  inventory: ProductInventory[];
  
  // Metadata
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  weight?: number; // in grams
  
  // SEO for e-commerce
  seoTitle?: string;
  seoDescription?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Detailed jewellery specifications
 */
export interface ProductSpecifications {
  metalType: 'gold' | 'silver' | 'platinum' | 'diamond' | 'other';
  purity?: string; // e.g., "14K", "18K", "22K" for gold
  grossWeight?: number;
  netWeight?: number;
  stoneDetails?: StoneDetail[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  craftsmanship?: string;
  certification?: string[];
  origin?: string;
}

/**
 * Stone details for jewellery
 */
export interface StoneDetail {
  type: 'diamond' | 'ruby' | 'emerald' | 'sapphire' | 'pearl' | 'other';
  quantity: number;
  weight: number; // in carats
  clarity?: string;
  color?: string;
  cut?: string;
  shape?: string;
}

/**
 * Product variant for different options
 */
export interface ProductVariant {
  id: string;
  name: string;
  type: 'size' | 'metal' | 'stone' | 'color';
  value: string;
  priceAdjustment: number; // +/- amount from base price
  isAvailable: boolean;
}

/**
 * Product image with metadata
 */
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  type: 'main' | 'detail' | '360' | 'lifestyle';
}

/**
 * Inventory tracking per store
 */
export interface ProductInventory {
  storeId: string;
  quantity: number;
  reserved: number; // Items reserved for pending orders
  reorderPoint: number;
  maxStock: number;
  location?: string; // Specific location within store
  lastUpdated: Date;
}

// ================================
// APPOINTMENT SYSTEM TYPES
// ================================

/**
 * Appointment types for jewellery business
 */
export type AppointmentType = 'consultation' | 'delivery' | 'fitting' | 'repair' | 'valuation' | 'custom_design';

/**
 * Appointment status
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/**
 * Appointment booking information
 */
export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  storeId: string;
  
  // Appointment details
  type: AppointmentType;
  status: AppointmentStatus;
  title: string;
  description?: string;
  
  // Scheduling
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  
  // Staff assignment
  assignedTo: string; // Staff member ID
  
  // Related records
  dealId?: string;
  productIds?: string[];
  
  // Customer preferences
  customerNotes?: string;
  internalNotes?: string;
  
  // Reminders
  reminderSent: boolean;
  reminderTime?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ================================
// ORDER MANAGEMENT TYPES
// ================================

/**
 * Order status for both online and offline orders
 */
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

/**
 * Order information
 */
export interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  customerId: string;
  storeId?: string; // For offline orders
  
  // Order details
  status: OrderStatus;
  type: 'online' | 'offline';
  
  // Items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  
  // Addresses
  billingAddress: Address;
  shippingAddress?: Address;
  
  // Payment
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentTransactionId?: string;
  
  // Delivery
  expectedDeliveryDate?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Individual order item
 */
export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string;
  notes?: string;
}

// ================================
// ANALYTICS & REPORTING TYPES
// ================================

/**
 * Dashboard metrics interface
 */
export interface DashboardMetrics {
  revenue: {
    today: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    growth: number; // percentage
  };
  customers: {
    total: number;
    newThisMonth: number;
    activeCustomers: number;
    growth: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    pending: number;
    averageOrderValue: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
}

// ================================
// COMMON UTILITY TYPES
// ================================

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

/**
 * Daily schedule
 */
export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  breaks?: {
    startTime: string;
    endTime: string;
  }[];
}

/**
 * WhatsApp integration settings
 */
export interface WhatsAppSettings {
  isEnabled: boolean;
  phoneNumber: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookUrl?: string;
  templateMessages: WhatsAppTemplate[];
}

/**
 * WhatsApp message template
 */
export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  components: Record<string, unknown>[]; // WhatsApp template structure
  status: 'approved' | 'pending' | 'rejected';
}

/**
 * Filter and search parameters
 */
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  assignedTo?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * File upload information
 */
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// ================================
// FORM VALIDATION TYPES
// ================================

/**
 * Form validation error structure
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * Form state for complex forms
 */
export interface FormState<T> {
  data: T;
  errors: FormError[];
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// ================================
// NOTIFICATION SYSTEM TYPES
// ================================

/**
 * Notification types for different system events
 */
export type NotificationType = 
  | 'appointment_reminder'
  | 'deal_update'
  | 'new_customer'
  | 'order_status'
  | 'inventory_alert'
  | 'task_due'
  | 'announcement'
  | 'escalation'
  | 'system_alert'
  | 'marketing_campaign'
  | 'follow_up_reminder'
  | 'payment_received'
  | 'low_stock'
  | 'high_demand'
  | 'stock_transfer_request'
  | 'stock_transfer_approved'
  | 'stock_transfer_completed'
  | 'stock_transfer_cancelled'
  | 'stock_transfer_rejected'
  | 'custom';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Notification status
 */
export type NotificationStatus = 'unread' | 'read' | 'archived';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  
  // Related data
  relatedId?: string; // ID of related entity (deal, appointment, etc.)
  relatedType?: string; // Type of related entity
  
  // User and tenant info
  userId: string;
  tenantId: string;
  storeId?: string; // Store ID for store-specific notifications
  
  // Timing
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  
  // Action data
  actionUrl?: string;
  actionText?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  isPersistent: boolean; // Whether notification should persist until manually dismissed
}

/**
 * Notification settings for user preferences
 */
export interface NotificationSettings {
  userId: string;
  tenantId: string;
  
  // Email notifications
  emailNotifications: {
    enabled: boolean;
    types: NotificationType[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  
  // Push notifications
  pushNotifications: {
    enabled: boolean;
    types: NotificationType[];
  };
  
  // In-app notifications
  inAppNotifications: {
    enabled: boolean;
    types: NotificationType[];
    sound: boolean;
    desktop: boolean;
  };
  
  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  
  // Custom preferences
  preferences: {
    appointmentReminders: boolean;
    dealUpdates: boolean;
    orderNotifications: boolean;
    inventoryAlerts: boolean;
    taskReminders: boolean;
    announcements: boolean;
    escalations: boolean;
    marketingUpdates: boolean;
  };
}

/**
 * Notification template for system-generated notifications
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  
  // Template variables
  variables: string[];
  
  // Default settings
  defaultSettings: {
    isPersistent: boolean;
    expiresIn?: number; // seconds
    actionUrl?: string;
    actionText?: string;
  };
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification batch for bulk operations
 */
export interface NotificationBatch {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

// All types are already exported above as individual exports