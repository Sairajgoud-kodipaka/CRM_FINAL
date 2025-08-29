# 🚀 Performance Optimization Implementation Guide

## 🎯 Phase 1: Critical Performance Fixes (Week 1)

### 1.1 Remove Unused Imports & Variables

#### Before (Current State)
```typescript
// src/app/business-admin/products/page.tsx
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge, 
  Plus, 
  Filter, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  // ... many more unused imports
} from '@/components/ui';
```

#### After (Optimized)
```typescript
// src/app/business-admin/products/page.tsx
import { 
  Card, 
  CardContent, 
  Button, 
  Badge, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal 
} from '@/components/ui';
```

**Action**: Run this command to find all unused imports:
```bash
npm run lint:fix
```

### 1.2 Replace `<img>` Tags with Next.js `<Image>`

#### Before (Performance Issue)
```typescript
// src/components/customer/ProductGrid.tsx
<img
  src={product.main_image_url}
  alt={product.name}
  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    target.nextElementSibling?.classList.remove('hidden');
  }}
/>
```

#### After (Optimized)
```typescript
// src/components/customer/ProductGrid.tsx
import Image from 'next/image';

<Image
  src={product.main_image_url || '/placeholder-product.jpg'}
  alt={product.name}
  width={300}
  height={300}
  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
  onError={() => {
    // Fallback handled by placeholder
  }}
/>
```

### 1.3 Implement API Request Batching

#### Before (Sequential API Calls)
```typescript
// src/app/store/[tenant]/page.tsx
useEffect(() => {
  const loadStoreData = async () => {
    try {
      setLoading(true);
      
      // Sequential API calls - SLOW!
      const categoriesResponse = await apiService.getTenantCategories(tenant);
      const productsResponse = await apiService.getTenantProducts(tenant);
      
      // Process responses...
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (tenant) {
    loadStoreData();
  }
}, [tenant]);
```

#### After (Batched API Calls)
```typescript
// src/app/store/[tenant]/page.tsx
useEffect(() => {
  const loadStoreData = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls - FAST!
      const [categoriesResponse, productsResponse] = await Promise.all([
        apiService.getTenantCategories(tenant),
        apiService.getTenantProducts(tenant)
      ]);
      
      // Process responses...
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (tenant) {
    loadStoreData();
  }
}, [tenant]);
```

### 1.4 Add Request Caching with SWR

#### Before (No Caching)
```typescript
// src/lib/api-service.ts
async getTenantProducts(tenant: string): Promise<ApiResponse<Product[]>> {
  const response = await fetch(`${this.baseUrl}/api/tenants/${tenant}/products/`);
  return response.json();
}
```

#### After (With SWR Caching)
```typescript
// src/hooks/useAPI.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const useTenantProducts = (tenant: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    tenant ? `/api/tenants/${tenant}/products/` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  return {
    products: data?.data || [],
    isLoading,
    error,
    mutate
  };
};

// Usage in component
const { products, isLoading, error } = useTenantProducts(tenant);
```

### 1.5 Fix TypeScript `any` Types

#### Before (Type Safety Issues)
```typescript
// src/components/customers/EditCustomerModal.tsx
const handleSubmit = async (formData: any) => {
  try {
    const response = await apiService.updateCustomer(customerId, formData);
    if (response.success) {
      onSuccess(response.data);
    }
  } catch (error: any) {
    console.error('Error updating customer:', error);
  }
};
```

#### After (Type Safe)
```typescript
// src/types/customer.ts
interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  customer_type: string;
  preferred_metal?: string;
  preferred_stone?: string;
  budget_range?: string;
}

// src/components/customers/EditCustomerModal.tsx
const handleSubmit = async (formData: CustomerFormData) => {
  try {
    const response = await apiService.updateCustomer(customerId, formData);
    if (response.success) {
      onSuccess(response.data);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating customer:', error.message);
    } else {
      console.error('Unknown error updating customer:', error);
    }
  }
};
```

## 🎯 Phase 2: Advanced Optimizations (Week 2-3)

### 2.1 Dynamic Imports for Heavy Components

#### Before (Static Import)
```typescript
// src/app/business-admin/dashboard/page.tsx
import { BusinessAdminDashboard } from '@/components/dashboards/BusinessAdminDashboard';
import { AnalyticsChart } from '@/components/charts/AnalyticsChart';
import { DataTable } from '@/components/tables/DataTable';

export default function DashboardPage() {
  return (
    <div>
      <BusinessAdminDashboard />
      <AnalyticsChart />
      <DataTable />
    </div>
  );
}
```

#### After (Dynamic Import)
```typescript
// src/app/business-admin/dashboard/page.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic imports with loading states
const BusinessAdminDashboard = dynamic(
  () => import('@/components/dashboards/BusinessAdminDashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false
  }
);

const AnalyticsChart = dynamic(
  () => import('@/components/charts/AnalyticsChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

const DataTable = dynamic(
  () => import('@/components/tables/DataTable'),
  {
    loading: () => <TableSkeleton />,
    ssr: false
  }
);

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<DashboardSkeleton />}>
        <BusinessAdminDashboard />
      </Suspense>
      
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}

// Skeleton components
const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);
```

### 2.2 Optimized State Management

#### Before (Inefficient State Updates)
```typescript
// src/components/customers/CustomerList.tsx
const [customers, setCustomers] = useState<Customer[]>([]);
const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  // This runs on every search term change
  const filtered = customers.filter(customer =>
    customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  setFilteredCustomers(filtered);
}, [customers, searchTerm]);
```

#### After (Optimized State Management)
```typescript
// src/components/customers/CustomerList.tsx
import { useMemo, useCallback } from 'react';

const [customers, setCustomers] = useState<Customer[]>([]);
const [searchTerm, setSearchTerm] = useState('');

// Memoized filtered customers
const filteredCustomers = useMemo(() => {
  if (!searchTerm) return customers;
  
  return customers.filter(customer =>
    customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [customers, searchTerm]);

// Debounced search
const debouncedSearch = useCallback(
  debounce((term: string) => {
    setSearchTerm(term);
  }, 300),
  []
);

// Optimized customer update
const updateCustomer = useCallback((customerId: number, updates: Partial<Customer>) => {
  setCustomers(prev => 
    prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, ...updates }
        : customer
    )
  );
}, []);
```

### 2.3 Virtual Scrolling for Large Lists

#### Before (Rendering All Items)
```typescript
// src/components/customers/CustomerList.tsx
return (
  <div className="space-y-2">
    {customers.map(customer => (
      <CustomerCard key={customer.id} customer={customer} />
    ))}
  </div>
);
```

#### After (Virtual Scrolling)
```typescript
// src/components/customers/CustomerList.tsx
import { FixedSizeList as List } from 'react-window';

const CustomerList = ({ customers }: { customers: Customer[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <CustomerCard customer={customers[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={customers.length}
      itemSize={80} // Height of each customer card
      width="100%"
      overscanCount={5} // Render 5 extra items for smooth scrolling
    >
      {Row}
    </List>
  );
};
```

## 🎯 Phase 3: UX/UI Optimizations (Week 4)

### 3.1 Progressive Loading States

```typescript
// src/components/ui/ProgressiveLoading.tsx
export const ProgressiveLoading = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
    <div className="h-16 bg-gray-200 rounded w-3/4"></div>
    <div className="h-24 bg-gray-200 rounded w-1/2"></div>
  </div>
);

// Usage in components
const CustomerList = ({ customers, isLoading }: { customers: Customer[], isLoading: boolean }) => {
  if (isLoading) {
    return <ProgressiveLoading />;
  }

  return (
    <div className="space-y-2">
      {customers.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
};
```

### 3.2 Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but something unexpected happened.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in app
export default function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 3.3 Responsive Design Hooks

```typescript
// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

// Usage in components
const CustomerGrid = ({ customers }: { customers: Customer[] }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    if (isDesktop) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid ${getGridCols()} gap-4`}>
      {customers.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
};
```

## 🚀 Performance Monitoring Implementation

### Web Vitals Monitoring
```typescript
// src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service (Google Analytics, etc.)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// Add to _app.tsx or layout.tsx
import { reportWebVitals } from '@/lib/web-vitals';

if (typeof window !== 'undefined') {
  reportWebVitals();
}
```

### Performance Budget Monitoring
```typescript
// src/lib/performance-budget.ts
export const checkPerformanceBudget = () => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navigationEntry = entry as PerformanceNavigationTiming;
        
        // Check against performance budget
        if (navigationEntry.loadEventEnd > 3000) {
          console.warn('Page load time exceeded 3s budget:', navigationEntry.loadEventEnd);
        }
        
        if (navigationEntry.domContentLoadedEventEnd > 1500) {
          console.warn('DOM content loaded exceeded 1.5s budget:', navigationEntry.domContentLoadedEventEnd);
        }
      }
    }
  });

  observer.observe({ entryTypes: ['navigation'] });
};
```

## 📋 Quick Wins Checklist

### Immediate Actions (Today)
- [ ] Remove unused imports from top 10 largest files
- [ ] Replace `<img>` tags with Next.js `<Image>` in ProductGrid
- [ ] Add loading states to main dashboard pages
- [ ] Implement API request batching in store page

### This Week
- [ ] Fix TypeScript `any` types in API service
- [ ] Add error boundaries to main app routes
- [ ] Implement SWR caching for product data
- [ ] Add skeleton loading states

### Next Week
- [ ] Dynamic imports for admin dashboard components
- [ ] Virtual scrolling for customer lists
- [ ] Performance monitoring setup
- [ ] Bundle size optimization

---

*This implementation guide provides practical code examples for the most critical performance optimizations. Start with Phase 1 items for immediate performance gains, then proceed with advanced optimizations for long-term improvement.*
