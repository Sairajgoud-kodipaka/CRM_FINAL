/**
 * Application Constants for Jewellery CRM System
 * This file contains all the constants used throughout the application
 */

// ================================
// USER ROLES & PERMISSIONS
// ================================

export const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  BUSINESS_ADMIN: 'business_admin',
  STORE_MANAGER: 'store_manager',
  SALES_TEAM: 'sales_team',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.PLATFORM_ADMIN]: [
    'manage_tenants',
    'view_system_analytics',
    'manage_billing',
    'manage_users',
    'access_all_data',
  ],
  [USER_ROLES.BUSINESS_ADMIN]: [
    'manage_business_settings',
    'manage_stores',
    'manage_team_members',
    'view_business_analytics',
    'manage_products',
    'manage_ecommerce',
    'manage_whatsapp',
  ],
  [USER_ROLES.STORE_MANAGER]: [
    'manage_store_customers',
    'assign_leads',
    'view_store_analytics',
    'manage_appointments',
    'manage_store_inventory',
    'process_orders',
    'manage_promotions',
  ],
  [USER_ROLES.SALES_TEAM]: [
    'manage_customers',
    'book_appointments',
    'track_sales',
    'send_whatsapp',
    'view_performance',
    'access_catalog',
    'create_quotes',
    'process_orders',
  ],
} as const;

// ================================
// SALES PIPELINE
// ================================

export const SALES_STAGES = {
  EXHIBITION: 'exhibition',
  SOCIAL_MEDIA: 'social_media',
  INTERESTED: 'interested',
  STORE_WALKIN: 'store_walkin',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
  FUTURE_PROSPECT: 'future_prospect',
  NOT_QUALIFIED: 'not_qualified',
} as const;

export const SALES_STAGE_LABELS = {
  [SALES_STAGES.EXHIBITION]: 'Exhibition',
  [SALES_STAGES.SOCIAL_MEDIA]: 'Social Media',
  [SALES_STAGES.INTERESTED]: 'Interested',
  [SALES_STAGES.STORE_WALKIN]: 'Store - Walkin',
  [SALES_STAGES.NEGOTIATION]: 'Negotiation',
  [SALES_STAGES.CLOSED_WON]: 'Closed Won',
  [SALES_STAGES.CLOSED_LOST]: 'Closed Lost',
  [SALES_STAGES.FUTURE_PROSPECT]: 'Future Prospect',
  [SALES_STAGES.NOT_QUALIFIED]: 'Not Qualified',
} as const;

export const SALES_STAGE_COLORS = {
  [SALES_STAGES.LEAD]: '#94A3B8', // slate-400
  [SALES_STAGES.QUALIFIED]: '#60A5FA', // blue-400
  [SALES_STAGES.PROPOSAL]: '#A78BFA', // violet-400
  [SALES_STAGES.NEGOTIATION]: '#FBBF24', // amber-400
  [SALES_STAGES.CLOSED_WON]: '#34D399', // emerald-400
  [SALES_STAGES.CLOSED_LOST]: '#F87171', // red-400
} as const;

// ================================
// CUSTOMER MANAGEMENT
// ================================

export const CUSTOMER_TYPES = {
  VIP: 'vip',
  REGULAR: 'regular',
  NEW_LEAD: 'new_lead',
} as const;

export const CUSTOMER_SOURCES = {
  WALK_IN: 'walk_in',
  ONLINE: 'online',
  REFERRAL: 'referral',
  SOCIAL_MEDIA: 'social_media',
  ADVERTISEMENT: 'advertisement',
} as const;

export const METAL_TYPES = {
  GOLD: 'gold',
  SILVER: 'silver',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
} as const;

export const STYLE_PREFERENCES = {
  TRADITIONAL: 'traditional',
  MODERN: 'modern',
  FUSION: 'fusion',
  ANTIQUE: 'antique',
} as const;

export const OCCASIONS = {
  WEDDING: 'wedding',
  ANNIVERSARY: 'anniversary',
  FESTIVAL: 'festival',
  PERSONAL: 'personal',
  GIFT: 'gift',
} as const;

// ================================
// PRODUCT CATEGORIES
// ================================

export const JEWELLERY_CATEGORIES = {
  RINGS: 'rings',
  NECKLACES: 'necklaces',
  EARRINGS: 'earrings',
  BRACELETS: 'bracelets',
  BANGLES: 'bangles',
  PENDANTS: 'pendants',
  CHAINS: 'chains',
  ANKLETS: 'anklets',
  NOSE_PINS: 'nose_pins',
  MANGALSUTRA: 'mangalsutra',
  SETS: 'sets',
  WATCHES: 'watches',
  CUFFLINKS: 'cufflinks',
  BROOCHES: 'brooches',
} as const;

export const METAL_PURITIES = {
  GOLD: ['14K', '18K', '22K', '24K'],
  SILVER: ['925 Sterling', '999 Pure'],
  PLATINUM: ['950 Platinum', '999 Platinum'],
} as const;

export const STONE_TYPES = {
  DIAMOND: 'diamond',
  RUBY: 'ruby',
  EMERALD: 'emerald',
  SAPPHIRE: 'sapphire',
  PEARL: 'pearl',
  TOPAZ: 'topaz',
  GARNET: 'garnet',
  AMETHYST: 'amethyst',
  CITRINE: 'citrine',
  ONYX: 'onyx',
} as const;

// ================================
// APPOINTMENTS
// ================================

export const APPOINTMENT_TYPES = {
  CONSULTATION: 'consultation',
  DELIVERY: 'delivery',
  FITTING: 'fitting',
  REPAIR: 'repair',
  VALUATION: 'valuation',
  CUSTOM_DESIGN: 'custom_design',
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const APPOINTMENT_DURATIONS = {
  [APPOINTMENT_TYPES.CONSULTATION]: 60, // minutes
  [APPOINTMENT_TYPES.DELIVERY]: 30,
  [APPOINTMENT_TYPES.FITTING]: 45,
  [APPOINTMENT_TYPES.REPAIR]: 15,
  [APPOINTMENT_TYPES.VALUATION]: 30,
  [APPOINTMENT_TYPES.CUSTOM_DESIGN]: 90,
} as const;

// ================================
// ORDER MANAGEMENT
// ================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY: 'ready',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.READY]: 'Ready for Pickup',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
  EMI: 'emi',
  CREDIT: 'credit',
} as const;

// ================================
// INDIAN MARKET SPECIFICS
// ================================

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep', 'Andaman and Nicobar Islands',
] as const;

export const INDIAN_FESTIVALS = {
  DIWALI: { name: 'Diwali', date: '2024-11-01', category: 'Hindu' },
  KARVA_CHAUTH: { name: 'Karva Chauth', date: '2024-11-01', category: 'Hindu' },
  DHANTERAS: { name: 'Dhanteras', date: '2024-10-29', category: 'Hindu' },
  AKSHAYA_TRITIYA: { name: 'Akshaya Tritiya', date: '2024-05-10', category: 'Hindu' },
  NAVRATRI: { name: 'Navratri', date: '2024-10-03', category: 'Hindu' },
  RAKSHA_BANDHAN: { name: 'Raksha Bandhan', date: '2024-08-19', category: 'Hindu' },
  VALENTINE: { name: "Valentine's Day", date: '2024-02-14', category: 'International' },
  MOTHER_DAY: { name: "Mother's Day", date: '2024-05-12', category: 'International' },
  CHRISTMAS: { name: 'Christmas', date: '2024-12-25', category: 'Christian' },
} as const;

export const GST_RATES = {
  GOLD: 3,
  SILVER: 3,
  DIAMOND: 0.25,
  MAKING_CHARGES: 5,
} as const;

// ================================
// UI CONSTANTS
// ================================

export const SIDEBAR_WIDTH = 250; // pixels

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const COLORS = {
  PRIMARY: '#FF7A59', // HubSpot Orange
  SECONDARY: '#0091AE', // Deep Navy
  SIDEBAR: '#1B2A4E', // Dark Navy
  ACCENT: '#FFB84D', // Light Orange
  SUCCESS: '#00BDA5',
  WARNING: '#F5A623',
  ERROR: '#E74C3C',
  INFO: '#4A90E2',
} as const;

// ================================
// PAGINATION & LIMITS
// ================================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const DASHBOARD_ITEMS_LIMIT = 5;

// ================================
// FILE UPLOAD CONSTANTS
// ================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ================================
// CURRENCY & FORMATTING
// ================================

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

export const CURRENCY_FORMAT_OPTIONS = {
  style: 'currency',
  currency: CURRENCY_CODE,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
} as const;

// ================================
// DATE & TIME FORMATS
// ================================

export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'dd MMM yyyy, HH:mm',
  TIME: 'HH:mm',
} as const;

// ================================
// VALIDATION CONSTANTS
// ================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  GST_REGEX: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PINCODE_REGEX: /^[1-9][0-9]{5}$/,
} as const;

// ================================
// API ENDPOINTS
// ================================

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  
  // Customers
  CUSTOMERS: '/api/customers',
  CUSTOMER_SEARCH: '/api/customers/search',
  
  // Products
  PRODUCTS: '/api/products',
  PRODUCT_CATEGORIES: '/api/products/categories',
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_ITEMS: '/api/orders/items',
  
  // Appointments
  APPOINTMENTS: '/api/appointments',
  APPOINTMENT_SLOTS: '/api/appointments/slots',
  
  // Sales
  DEALS: '/api/deals',
  PIPELINE: '/api/deals/pipeline',
  
  // Analytics
  DASHBOARD: '/api/analytics/dashboard',
  REPORTS: '/api/analytics/reports',
  
  // File uploads
  UPLOAD: '/api/upload',
  
  // WhatsApp
  WHATSAPP_SEND: '/api/whatsapp/send',
  WHATSAPP_TEMPLATES: '/api/whatsapp/templates',
} as const;

// ================================
// NOTIFICATION MESSAGES
// ================================

export const MESSAGES = {
  SUCCESS: {
    CUSTOMER_CREATED: 'Customer created successfully',
    CUSTOMER_UPDATED: 'Customer updated successfully',
    CUSTOMER_DELETED: 'Customer deleted successfully',
    ORDER_CREATED: 'Order created successfully',
    ORDER_UPDATED: 'Order updated successfully',
    APPOINTMENT_BOOKED: 'Appointment booked successfully',
    APPOINTMENT_CANCELLED: 'Appointment cancelled successfully',
    PRODUCT_CREATED: 'Product created successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    DEAL_CREATED: 'Deal created successfully',
    DEAL_UPDATED: 'Deal updated successfully',
    WHATSAPP_SENT: 'WhatsApp message sent successfully',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    VALIDATION: 'Please fix the errors and try again.',
    CUSTOMER_NOT_FOUND: 'Customer not found',
    ORDER_NOT_FOUND: 'Order not found',
    APPOINTMENT_NOT_FOUND: 'Appointment not found',
    PRODUCT_NOT_FOUND: 'Product not found',
    DEAL_NOT_FOUND: 'Deal not found',
    FILE_TOO_LARGE: 'File size is too large',
    INVALID_FILE_TYPE: 'Invalid file type',
  },
  INFO: {
    LOADING: 'Loading...',
    NO_DATA: 'No data available',
    EMPTY_SEARCH: 'No results found for your search',
    FEATURE_COMING_SOON: 'This feature is coming soon',
  },
} as const;

// ================================
// WHATSAPP TEMPLATES
// ================================

export const WHATSAPP_TEMPLATES = {
  APPOINTMENT_REMINDER: {
    name: 'appointment_reminder',
    text: 'Hi {{customer_name}}, this is a reminder for your appointment at {{store_name}} on {{date}} at {{time}}.',
  },
  ORDER_CONFIRMATION: {
    name: 'order_confirmation',
    text: 'Dear {{customer_name}}, your order #{{order_number}} has been confirmed. We will notify you once it\'s ready.',
  },
  PAYMENT_REMINDER: {
    name: 'payment_reminder',
    text: 'Dear {{customer_name}}, your payment of {{amount}} is pending for order #{{order_number}}.',
  },
  FESTIVAL_GREETINGS: {
    name: 'festival_greetings',
    text: 'Wishing you and your family a very happy {{festival_name}}! Check out our special collection.',
  },
} as const;

// Export all constants for easy importing
export * from './index';