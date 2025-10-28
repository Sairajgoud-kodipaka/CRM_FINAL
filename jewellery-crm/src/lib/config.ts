// Configuration file for environment-based settings
export const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : 'http://localhost:8000/api',

  // WebSocket Configuration
  WS_BASE_URL: process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
    : 'ws://localhost:8000',

  // Site Configuration
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Environment
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.API_BASE_URL}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (endpoint: string): string => {
  return `${config.WS_BASE_URL}${endpoint}`;
};
