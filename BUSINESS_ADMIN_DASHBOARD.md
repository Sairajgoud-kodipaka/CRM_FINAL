# Business Admin Dashboard

## Overview

The Business Admin Dashboard has been redesigned to match the wireframe requirements with three main sections:

1. **Key Performance Indicators (KPIs)** - Top row
2. **Store-wise Performance** - Middle section  
3. **Top Performers** - Bottom section

## Role-Based Access

The dashboard now supports role-based access with different data visibility:

### Business Admin
- **Access**: All combined data across all stores
- **Scope**: Can view data from all stores in the tenant
- **Description**: "All combined data across all stores"

### Manager
- **Access**: Data for their assigned store only
- **Scope**: Can view data from their specific store
- **Description**: "Data for [store name]"

### In-house Sales
- **Access**: Data for their assigned store only
- **Scope**: Can view data from their specific store
- **Description**: "Data for [store name]"

## Dashboard Structure

### 1. Key Performance Indicators (KPIs)

The top row contains four main KPI cards:

#### Total Sales
- **Display**: Shows monthly total sales amount
- **Sub-info**: Today and week sales amounts
- **Description**: "All combined closed won"
- **Icon**: Dollar sign with green background

#### Revenue in Pipeline
- **Display**: Shows potential revenue from pending deals
- **Description**: "All combined pending deal - revenue"
- **Icon**: Target icon with blue background

#### Closed Won Pipeline (Moved to Sales)
- **Display**: Count of successfully closed pipeline deals
- **Description**: "All combined deal count: closed won number"
- **Icon**: Shopping bag with purple background
- **Note**: This metric has been moved from pipeline to sales section

#### How Many in Pipeline
- **Display**: Count of active deals in pipeline
- **Description**: "All combined deal count: pending deals"
- **Icon**: Trending up with orange background

### 2. Store-wise Performance

The middle section displays performance metrics for each store:

- **Store cards**: Each store shows as a separate card
- **Revenue metrics**: Total revenue and closed won revenue
- **Description**: "All combined closed won - Revenue"
- **Layout**: Responsive grid (1-3 columns based on screen size)

### 3. Top Performers

The bottom section is split into two columns:

#### Top Performing Managers
- **Display**: List of top managers by revenue
- **Metrics**: Revenue and deals closed count
- **Icon**: Users icon with blue background
- **Empty state**: Shows message when no data available
- **Access**: Only visible to Business Admin and Manager roles

#### Top Performing Salesmen
- **Display**: List of top salesmen by revenue
- **Metrics**: Revenue and deals closed count
- **Icon**: Users icon with green background
- **Empty state**: Shows message when no data available

## Backend API

### Endpoint
```
GET /api/tenants/dashboard/
```

### Response Structure
```json
{
  "total_sales": {
    "today": 25000.00,
    "week": 150000.00,
    "month": 450000.00
  },
  "pipeline_revenue": 350000.00,
  "closed_won_pipeline_count": 25,
  "pipeline_deals_count": 18,
  "store_performance": [
    {
      "id": 1,
      "name": "Main Store",
      "revenue": 250000.00,
      "closed_won_revenue": 200000.00
    }
  ],
  "top_managers": [
    {
      "id": 1,
      "name": "Rajesh Kumar",
      "revenue": 120000.00,
      "deals_closed": 8
    }
  ],
  "top_salesmen": [
    {
      "id": 3,
      "name": "Amit Patel",
      "revenue": 85000.00,
      "deals_closed": 12
    }
  ]
}
```

## Data Sources

### Sales Data
- **Total Sales**: Aggregated from `Sale` model + `SalesPipeline` closed won revenue
- **Time periods**: Today, week (7 days), month (30 days)
- **Filters**: Confirmed and delivered sales only
- **Combined Revenue**: Sales revenue + Closed won pipeline revenue (using `expected_value`)

### Pipeline Data
- **Pipeline Revenue**: Sum of `expected_value` from active pipeline stages
- **Deals Count**: Count of pipeline records by stage
- **Active stages**: lead, contacted, qualified, proposal, negotiation
- **Closed stages**: closed_won, closed_lost
- **Store filtering**: Through client relationship (`client__store`)

### Store Performance
- **Store data**: From `Store` model
- **Revenue calculation**: Sales within date range per store + Closed won pipeline revenue
- **Closed won**: Pipeline deals with closed_won stage (using `expected_value`)
- **Role-based filtering**: Managers and sales see only their store
- **Combined Revenue**: Total revenue = Sales revenue + Closed won pipeline revenue

### Top Performers
- **Managers**: Users with `business_admin` or `manager` roles
- **Salesmen**: Users with `inhouse_sales` role
- **Ranking**: By combined revenue (sales + closed won pipeline) (highest first)
- **Limit**: Top 5 performers each
- **Store filtering**: Based on user's assigned store

## Permissions

- **Access**: Business admin, manager, and inhouse sales users
- **Authentication**: Required
- **Role check**: `business_admin`, `manager`, or `inhouse_sales` roles required
- **Tenant scoped**: Data filtered by user's tenant
- **Store scoped**: Managers and sales see only their store data

## Role-Based Data Filtering

### Business Admin
```python
# No additional filters - sees all data
base_sales_filter = {'tenant': tenant}
base_pipeline_filter = {'tenant': tenant}
```

### Manager
```python
# Filter by assigned store
base_sales_filter = {'tenant': tenant, 'client__store': user.store}
base_pipeline_filter = {'tenant': tenant, 'client__store': user.store}
```

### In-house Sales
```python
# Filter by assigned store
base_sales_filter = {'tenant': tenant, 'client__store': user.store}
base_pipeline_filter = {'tenant': tenant, 'client__store': user.store}
```

## Error Handling

- **No tenant**: Returns 400 Bad Request
- **Database errors**: Returns mock data
- **Authentication**: Returns 401 Unauthorized
- **Permission**: Returns 403 Forbidden

## Testing

The dashboard includes comprehensive tests:

- **Structure validation**: Ensures all required fields are present
- **Authentication**: Verifies authentication is required
- **Authorization**: Confirms proper role-based access
- **Data types**: Validates response data types
- **Role access**: Tests access for business_admin, manager, and inhouse_sales
- **Role denial**: Tests that other roles cannot access

## UI Features

- **Responsive design**: Adapts to different screen sizes
- **Loading states**: Shows spinner while loading data
- **Error handling**: Displays error messages with retry option
- **Currency formatting**: Indian Rupee format with proper formatting
- **Empty states**: Shows appropriate messages when no data available
- **Icons**: Lucide React icons for visual appeal
- **Color coding**: Different colors for different metrics
- **Role display**: Shows user role and data scope in header
- **Scope description**: Clear indication of data visibility

## Key Changes

### 1. Role-Based Access
- **Before**: Only business admin could access
- **After**: Business admin, manager, and inhouse sales can access

### 2. Data Filtering
- **Before**: All data across all stores
- **After**: Role-based filtering with store-specific data for managers and sales

### 3. Closed Won Pipeline
- **Before**: Part of pipeline metrics
- **After**: Moved to sales section as "Closed Won Pipeline"

### 4. UI Enhancements
- **Role display**: Shows user role in header
- **Scope description**: Clear indication of data visibility
- **Permission handling**: Proper role-based access control

## Future Enhancements

- **Real-time updates**: WebSocket integration for live data
- **Export functionality**: PDF/Excel export of dashboard data
- **Custom date ranges**: User-selectable time periods
- **Drill-down views**: Click to see detailed breakdowns
- **Charts and graphs**: Visual representations of data
- **Notifications**: Alerts for important metrics
- **Advanced filtering**: More granular data filtering options 