import { useAuth } from '@/hooks/useAuth';

export interface UserScope {
  type: 'all' | 'store' | 'own' | 'none';
  filters: Record<string, any>;
  description: string;
}

export interface ScopedVisibilityConfig {
  canAccessAllData: boolean;
  canAccessStoreData: boolean;
  canAccessOwnData: boolean;
  userScope: UserScope;
}

/**
 * Hook to get scoped visibility configuration for the current user
 */
export const useScopedVisibility = (): ScopedVisibilityConfig => {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canAccessAllData: false,
      canAccessStoreData: false,
      canAccessOwnData: false,
      userScope: {
        type: 'none',
        filters: {},
        description: 'No access - user not authenticated'
      }
    };
  }

  // Determine user scope based on role
  let userScope: UserScope;
  
  if (user.role === 'platform_admin' || user.role === 'business_admin') {
    userScope = {
      type: 'all',
      filters: {},
      description: 'Full access to all data'
    };
  } else if (user.role === 'manager') {
    userScope = {
      type: 'store',
      filters: { store_id: user.store },
      description: 'Access to store-specific data'
    };
  } else if (user.role === 'inhouse_sales' || user.role === 'tele_calling') {
    userScope = {
      type: 'own',
      filters: { user_id: user.id },
      description: 'Access to own data only'
    };
  } else {
    userScope = {
      type: 'none',
      filters: {},
      description: 'No access'
    };
  }

  return {
    canAccessAllData: user.role === 'platform_admin' || user.role === 'business_admin',
    canAccessStoreData: ['manager', 'platform_admin', 'business_admin'].includes(user.role),
    canAccessOwnData: ['inhouse_sales', 'tele_calling', 'manager', 'platform_admin', 'business_admin'].includes(user.role),
    userScope
  };
};

/**
 * Utility to filter data based on user scope
 */
export const filterDataByScope = <T extends Record<string, any>>(
  data: T[],
  scope: UserScope,
  options?: {
    storeField?: string;
    userField?: string;
    assignedToField?: string;
    salesRepField?: string;
  }
): T[] => {
  if (scope.type === 'all') {
    return data;
  }

  if (scope.type === 'store' && scope.filters.store_id) {
    const storeField = options?.storeField || 'store_id';
    return data.filter(item => item[storeField] === scope.filters.store_id);
  }

  if (scope.type === 'own') {
    const userField = options?.userField || 'user_id';
    const assignedToField = options?.assignedToField || 'assigned_to';
    const salesRepField = options?.salesRepField || 'sales_representative';
    
    return data.filter(item => 
      item[userField] === scope.filters.user_id ||
      item[assignedToField] === scope.filters.user_id ||
      item[salesRepField] === scope.filters.user_id
    );
  }

  return [];
};

/**
 * Utility to get API query parameters based on user scope
 */
export const getScopeQueryParams = (scope: UserScope): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (scope.type === 'store' && scope.filters.store_id) {
    params.store_id = scope.filters.store_id.toString();
  }
  
  if (scope.type === 'own' && scope.filters.user_id) {
    params.user_id = scope.filters.user_id.toString();
  }
  
  return params;
};

/**
 * Utility to check if user can perform specific actions
 */
export const canPerformAction = (
  action: string,
  scope: UserScope,
  item?: Record<string, any>
): boolean => {
  switch (action) {
    case 'view_all':
      return scope.type === 'all';
    
    case 'view_store':
      return scope.type === 'all' || scope.type === 'store';
    
    case 'view_own':
      return scope.type === 'all' || scope.type === 'store' || scope.type === 'own';
    
    case 'edit_own':
      if (scope.type === 'all' || scope.type === 'store') return true;
      if (scope.type === 'own' && item) {
        return item.user_id === scope.filters.user_id ||
               item.assigned_to === scope.filters.user_id ||
               item.sales_representative === scope.filters.user_id;
      }
      return false;
    
    case 'delete_own':
      return canPerformAction('edit_own', scope, item);
    
    default:
      return false;
  }
};

/**
 * Utility to get display text for user scope
 */
export const getScopeDisplayText = (scope: UserScope): string => {
  switch (scope.type) {
    case 'all':
      return 'All Data';
    case 'store':
      return 'Store Data';
    case 'own':
      return 'My Data';
    case 'none':
      return 'No Access';
    default:
      return 'Unknown';
  }
};

/**
 * Utility to get scope-based API endpoints
 */
export const getScopedEndpoint = (
  baseEndpoint: string,
  scope: UserScope
): string => {
  if (scope.type === 'own') {
    // For own data, use the "my" endpoint if available
    const myEndpoint = baseEndpoint.replace('/list/', '/my/');
    return myEndpoint;
  }
  
  return baseEndpoint;
}; 