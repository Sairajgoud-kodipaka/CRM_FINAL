# Scoped Visibility Implementation

## Overview

This document describes the implementation of scoped visibility logic for the multi-tenant CRM system, ensuring that users can only access data appropriate to their role and store affiliations.

## Requirements Met

### 1. Store Manager Visibility
- **Scope**: Store-specific data only
- **Filter**: Based on `store_id` from user's store affiliation
- **Access**: Team members and customers belonging to their store

### 2. Salesperson Visibility  
- **Scope**: Own sales pipeline only
- **Filter**: Based on `salesperson_id = current_user_id`
- **Access**: Only records where they are the assigned sales representative

### 3. Manager & Business Admin Visibility
- **Scope**: Complete sales pipeline across all stores
- **Filter**: No restrictions (full access)
- **Access**: All data within their tenant

## Implementation Architecture

### Backend Implementation

#### 1. Middleware (`backend/apps/users/middleware.py`)

**ScopedVisibilityMiddleware**: Adds scoping methods to request objects
- `get_scoped_queryset()`: Returns filtered queryset based on user role
- `get_user_scope()`: Returns scope configuration for current user
- `can_access_all_data()`: Checks if user has full access
- `can_access_store_data()`: Checks if user can access store data
- `can_access_own_data()`: Checks if user can access own data

**ScopedVisibilityMixin**: Provides scoping methods to ViewSets and APIViews
- Inherits from middleware functionality
- Simplifies integration with existing views

#### 2. Role-Based Filtering Logic

```python
# Platform/Business Admin: No restrictions
if user.role in ['platform_admin', 'business_admin']:
    # Full access - no additional filtering

# Store Manager: Filter by store_id
elif user.role == 'manager':
    if user.store and hasattr(model_class, 'store'):
        queryset = queryset.filter(store=user.store)
    elif user.store and hasattr(model_class, 'assigned_to'):
        queryset = queryset.filter(assigned_to__store=user.store)

# Salesperson: Filter by user_id (own data only)
elif user.role in ['inhouse_sales', 'tele_calling']:
    if hasattr(model_class, 'assigned_to'):
        queryset = queryset.filter(assigned_to=user)
    elif hasattr(model_class, 'sales_representative'):
        queryset = queryset.filter(sales_representative=user)
```

#### 3. Updated Views

**Sales Views** (`backend/apps/sales/views.py`):
- All sales and pipeline views now inherit from `ScopedVisibilityMixin`
- Automatic filtering based on user role and store affiliation
- Maintains existing search and filtering functionality

**Client Views** (`backend/apps/clients/views.py`):
- ClientViewSet, AppointmentViewSet, FollowUpViewSet updated
- TaskViewSet and other views use scoped visibility
- Preserves soft delete and other business logic

### Frontend Implementation

#### 1. Scoped Visibility Hook (`src/lib/scoped-visibility.ts`)

**useScopedVisibility()**: React hook providing scope configuration
```typescript
interface ScopedVisibilityConfig {
  canAccessAllData: boolean;
  canAccessStoreData: boolean;
  canAccessOwnData: boolean;
  userScope: UserScope;
}
```

**Utility Functions**:
- `filterDataByScope()`: Client-side data filtering
- `getScopeQueryParams()`: API query parameter generation
- `canPerformAction()`: Permission checking for UI actions
- `getScopeDisplayText()`: Human-readable scope descriptions

#### 2. Scope Indicator Component (`src/components/ui/ScopeIndicator.tsx`)

Visual indicator showing current user's access scope:
- Badge display for compact view
- Detailed card view with permissions breakdown
- Color-coded by scope type (all/store/own/none)

#### 3. API Service Updates (`src/lib/api-service.ts`)

Added scoped endpoints:
- `getMySalesPipeline()`: For salespeople to see own pipeline
- Maintains backward compatibility with existing endpoints

## Usage Examples

### Backend Usage

```python
# In a ViewSet
class SalesPipelineViewSet(viewsets.ModelViewSet, ScopedVisibilityMixin):
    def get_queryset(self):
        # Automatically applies role-based filtering
        return self.get_scoped_queryset(SalesPipeline)
    
    def get_user_scope(self):
        # Get current user's scope configuration
        return self.request.get_user_scope(self.request)
```

### Frontend Usage

```typescript
// In a React component
const { userScope, canAccessAllData } = useScopedVisibility();

// Filter data based on scope
const filteredData = filterDataByScope(rawData, userScope, {
  storeField: 'store_id',
  assignedToField: 'assigned_to'
});

// Check permissions
const canEdit = canPerformAction('edit_own', userScope, item);
```

## Security Considerations

### 1. Multi-Layer Protection
- **Backend**: Primary filtering at database level
- **Frontend**: Secondary filtering for UI consistency
- **API**: Query parameter validation

### 2. Tenant Isolation
- All queries filtered by tenant first
- Role-based filtering applied after tenant filtering
- Ensures complete data isolation between tenants

### 3. Audit Trail
- All data access logged through existing audit system
- Scope changes tracked for compliance
- User actions tied to their scope

## Performance Optimizations

### 1. Database Indexing
- Indexes on `tenant`, `store`, `assigned_to`, `sales_representative`
- Composite indexes for common query patterns
- Efficient filtering at database level

### 2. Caching Strategy
- Scope configuration cached per user session
- Query results cached with scope-specific keys
- Cache invalidation on scope changes

### 3. Query Optimization
- Single query with proper joins
- Avoids N+1 query problems
- Uses database-level filtering over application-level

## Testing Strategy

### 1. Unit Tests
- Test each role's scope configuration
- Verify filtering logic for each model
- Test edge cases (null stores, missing tenants)

### 2. Integration Tests
- Test complete user workflows
- Verify data isolation between roles
- Test API endpoint behavior

### 3. Security Tests
- Verify users cannot access unauthorized data
- Test boundary conditions
- Penetration testing for scope bypass attempts

## Future Extensions

### 1. Additional Roles
- Marketing team: Campaign-specific data
- Tele-calling: Lead assignment filtering
- Support: Ticket assignment scoping

### 2. Advanced Scoping
- Time-based scoping (historical data access)
- Department-based scoping
- Project-based scoping

### 3. Dynamic Permissions
- Runtime permission changes
- Temporary access grants
- Delegated permissions

## Configuration

### Environment Variables
```bash
# Enable/disable scoped visibility
SCOPED_VISIBILITY_ENABLED=true

# Debug mode for scope logging
SCOPE_DEBUG_MODE=false

# Cache scope configuration
SCOPE_CACHE_TTL=3600
```

### Database Configuration
```sql
-- Ensure proper indexing
CREATE INDEX idx_sales_tenant_store ON sales(tenant_id, store_id);
CREATE INDEX idx_pipeline_sales_rep ON sales_pipeline(sales_representative_id);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to_id);
```

## Monitoring and Logging

### 1. Scope Access Logs
- Log all scope-filtered queries
- Track scope changes and their impact
- Monitor performance metrics

### 2. Alerting
- Alert on scope bypass attempts
- Monitor unusual access patterns
- Track scope-related errors

### 3. Analytics
- Scope usage analytics
- Performance impact measurement
- User behavior analysis

## Migration Guide

### 1. Existing Data
- No data migration required
- Existing queries automatically scoped
- Backward compatibility maintained

### 2. Code Updates
- Add `ScopedVisibilityMixin` to ViewSets
- Update frontend components to use scope utilities
- Test all user workflows

### 3. Rollback Plan
- Feature flag to disable scoped visibility
- Gradual rollout by role
- Monitoring and alerting in place

## Conclusion

The scoped visibility implementation provides a robust, secure, and scalable solution for role-based data access in the multi-tenant CRM system. It maintains business logic integrity while ensuring proper data isolation and access control. 