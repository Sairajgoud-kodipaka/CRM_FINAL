// Tenant configuration for different jewellery stores
export interface TenantConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  theme: {
    primaryColor: string;
    accentColor: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  features: {
    hasShipping: boolean;
    hasReturns: boolean;
    hasCertification: boolean;
  };
}

export const tenantConfigs: Record<string, TenantConfig> = {
  mandeep: {
    id: 'mandeep',
    name: 'Mandeep Jewelleries',
    displayName: 'Mandeep Jewelleries',
    description: 'Premium jewellery collection with traditional and modern designs',
    logo: '💍',
    theme: {
      primaryColor: 'gold',
      accentColor: 'yellow-500',
    },
    contact: {
      phone: '+91 98765 43210',
      email: 'info@mandeepjewelleries.com',
      address: '123 Jewellery Street, Mumbai, Maharashtra',
    },
    features: {
      hasShipping: true,
      hasReturns: true,
      hasCertification: true,
    },
  },
  royal: {
    id: 'royal',
    name: 'Royal Jewellers',
    displayName: 'Royal Jewellers',
    description: 'Luxury jewellery boutique with exclusive collections',
    logo: '👑',
    theme: {
      primaryColor: 'purple-600',
      accentColor: 'purple-400',
    },
    contact: {
      phone: '+91 98765 43211',
      email: 'info@royaljewellers.com',
      address: '456 Luxury Avenue, Delhi, NCR',
    },
    features: {
      hasShipping: true,
      hasReturns: true,
      hasCertification: true,
    },
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Palace',
    displayName: 'Diamond Palace',
    description: 'Exclusive diamond collection with premium quality',
    logo: '💎',
    theme: {
      primaryColor: 'blue-600',
      accentColor: 'blue-400',
    },
    contact: {
      phone: '+91 98765 43212',
      email: 'info@diamondpalace.com',
      address: '789 Diamond Road, Bangalore, Karnataka',
    },
    features: {
      hasShipping: true,
      hasReturns: true,
      hasCertification: true,
    },
  },
  default: {
    id: 'default',
    name: 'Jewellery Store',
    displayName: 'Jewellery Store',
    description: 'Your trusted jewellery partner',
    logo: '💎',
    theme: {
      primaryColor: 'gold',
      accentColor: 'yellow-500',
    },
    contact: {
      phone: '+91 98765 43210',
      email: 'info@jewellerystore.com',
      address: 'General Jewellery Store',
    },
    features: {
      hasShipping: true,
      hasReturns: true,
      hasCertification: true,
    },
  },
};

export function getTenantConfig(tenantId: string): TenantConfig {
  return tenantConfigs[tenantId] || tenantConfigs.default;
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(tenantConfigs);
} 