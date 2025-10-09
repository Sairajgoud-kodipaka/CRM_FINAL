# 🚀 CRM Responsive Components

A comprehensive set of responsive components designed to make your CRM application fully mobile-responsive and touch-optimized.

## 📱 Components Overview

### Core Components

1. **ResponsiveTable** - Adaptive table with mobile card view
2. **ResponsiveFormLayout** - Mobile-optimized form layouts
3. **EnhancedMobileNav** - Bottom navigation for mobile
4. **MobileDashboard** - Progressive disclosure dashboard
5. **ResponsiveDialog** - Mobile-optimized modals

### Utility Components

6. **ResponsiveGrid** - Adaptive grid system
7. **ResponsiveCard** - Device-aware card component
8. **TouchOptimizedButton** - Mobile-friendly buttons
9. **ProgressiveDisclosure** - Collapsible content sections

## 🎯 Key Features

- **Mobile-First Design**: All components prioritize mobile experience
- **Touch-Optimized**: 44px+ touch targets, proper spacing
- **Progressive Disclosure**: Show essential info first, details on demand
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Lazy loading, optimized animations
- **TypeScript**: Fully typed with proper interfaces

## 📐 Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Small mobile
  md: '768px',   // Mobile/Tablet boundary
  lg: '1024px',  // Tablet/Desktop boundary
  xl: '1280px'   // Large desktop
};
```

## 🚀 Quick Start

### 1. ResponsiveTable

Replace your existing tables with ResponsiveTable for instant mobile responsiveness:

```tsx
import { ResponsiveTable, ResponsiveColumn } from '@/components/ui/ResponsiveTable';

const columns: ResponsiveColumn<Customer>[] = [
  {
    key: 'name',
    title: 'Customer',
    priority: 'high', // Shows on all devices
    mobileLabel: 'Name',
    render: (value) => <span className="font-medium">{value}</span>,
  },
  {
    key: 'email',
    title: 'Email',
    priority: 'high',
    mobileLabel: 'Email',
  },
  {
    key: 'notes',
    title: 'Notes',
    priority: 'low', // Hidden on mobile
  },
];

<ResponsiveTable
  data={customers}
  columns={columns}
  loading={false}
  searchable={true}
  onRowClick={(customer) => handleView(customer)}
  mobileCardTitle={(customer) => customer.name}
  mobileCardSubtitle={(customer) => customer.email}
/>
```

### 2. ResponsiveFormLayout

Create mobile-friendly forms with progressive disclosure:

```tsx
import { ResponsiveFormLayout, FormSection } from '@/components/ui/ResponsiveFormLayout';

const formSections: FormSection[] = [
  {
    title: 'Basic Information',
    description: 'Enter customer details',
    fields: [
      {
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        priority: 'high',
        mobileType: 'text', // Optimized for mobile
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'tel',
        required: true,
        priority: 'high',
        mobileType: 'tel', // Native mobile keyboard
      },
    ],
    priority: 'high',
  },
  {
    title: 'Additional Details',
    fields: [
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        priority: 'low', // Hidden on mobile by default
      },
    ],
    collapsible: true,
    defaultExpanded: false,
    priority: 'medium',
  },
];

<ResponsiveFormLayout
  sections={formSections}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitLabel="Save Customer"
/>
```

### 3. EnhancedMobileNav

Add bottom navigation for mobile users:

```tsx
import { EnhancedMobileNav } from '@/components/navigation/EnhancedMobileNav';

<EnhancedMobileNav
  showSearch={true}
  showQuickAdd={true}
  quickAddItems={[
    {
      label: 'Add Customer',
      icon: Plus,
      onClick: () => setShowAddModal(true),
    },
    {
      label: 'Make Call',
      icon: Phone,
      onClick: () => handleCall(),
    },
  ]}
  onSearch={(query) => handleSearch(query)}
/>
```

### 4. MobileDashboard

Create mobile-optimized dashboards:

```tsx
import { MobileDashboard, DashboardSection } from '@/components/dashboard/MobileDashboard';

const dashboardSections: DashboardSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    metrics: [
      {
        id: 'customers',
        title: 'Total Customers',
        value: 1250,
        change: { value: 12, type: 'increase', period: 'last month' },
        format: 'number',
        priority: 'high',
      },
    ],
    priority: 'high',
  },
];

<MobileDashboard
  sections={dashboardSections}
  loading={false}
  onRefresh={handleRefresh}
  quickActions={quickActions}
  showProgress={true}
/>
```

### 5. ResponsiveDialog

Mobile-optimized modals and dialogs:

```tsx
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog';

<ResponsiveDialog
  open={showModal}
  onOpenChange={setShowModal}
  title="Add Customer"
  description="Enter customer information"
  size="md" // sm, md, lg, xl, full
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  confirmLabel="Save"
  cancelLabel="Cancel"
>
  <ResponsiveFormLayout sections={formSections} />
</ResponsiveDialog>
```

## 🎨 Utility Components

### ResponsiveGrid

```tsx
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';

<ResponsiveGrid
  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
  itemSize="md"
>
  <ResponsiveCard title="Card 1" />
  <ResponsiveCard title="Card 2" />
  <ResponsiveCard title="Card 3" />
</ResponsiveGrid>
```

### ResponsiveCard

```tsx
import { ResponsiveCard } from '@/components/ui/ResponsiveCard';

<ResponsiveCard
  title="Customer Info"
  description="Basic customer details"
  variant="elevated"
  size="md"
  clickable={true}
  onClick={handleClick}
>
  <p>Card content goes here</p>
</ResponsiveCard>
```

### TouchOptimizedButton

```tsx
import { TouchOptimizedButton } from '@/components/ui/TouchOptimizedButton';

<TouchOptimizedButton
  size="lg"
  touchTarget="lg"
  fullWidth={true}
  hapticFeedback={true}
  onClick={handleClick}
>
  Add Customer
</TouchOptimizedButton>
```

### ProgressiveDisclosure

```tsx
import { ProgressiveDisclosure } from '@/components/ui/ProgressiveDisclosure';

<ProgressiveDisclosure
  title="Advanced Settings"
  description="Configure advanced options"
  variant="card"
  collapsible={true}
  defaultExpanded={false}
>
  <div>Advanced settings content</div>
</ProgressiveDisclosure>
```

## 📱 Mobile UX Patterns

### Card-Based Layout
- Mobile tables become vertical cards
- Essential information shown first
- Progressive disclosure for details

### Bottom Navigation
- 4-5 primary actions
- Quick add functionality
- Role-based navigation

### Touch Optimization
- 44px+ touch targets
- Proper spacing (8px+)
- Native input types (tel, email, date)
- Haptic feedback

### Progressive Disclosure
- Show essential info by default
- Collapsible sections for details
- Accordion patterns for complex forms

## 🔧 Integration Guide

### 1. Replace Existing Tables

```tsx
// Before: Regular table
<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>

// After: ResponsiveTable
<ResponsiveTable
  data={data}
  columns={columns}
  mobileCardTitle={(row) => row.name}
  mobileCardSubtitle={(row) => row.email}
/>
```

### 2. Update Forms

```tsx
// Before: Regular form
<form>
  <input type="text" />
  <input type="email" />
  <textarea />
</form>

// After: ResponsiveFormLayout
<ResponsiveFormLayout
  sections={formSections}
  onSubmit={handleSubmit}
/>
```

### 3. Add Mobile Navigation

```tsx
// Add to your main layout
<EnhancedMobileNav
  showSearch={true}
  showQuickAdd={true}
  quickAddItems={quickAddItems}
/>
```

## 🎯 Best Practices

### 1. Priority System
- Use `priority: 'high'` for essential fields
- Use `priority: 'medium'` for important fields
- Use `priority: 'low'` for optional fields

### 2. Mobile-First Approach
- Design for mobile first, then enhance for desktop
- Test on actual devices, not just browser dev tools
- Use native input types for better mobile experience

### 3. Performance
- Use `loading` states for better perceived performance
- Implement lazy loading for heavy components
- Optimize images and assets for mobile

### 4. Accessibility
- Always provide proper labels
- Use semantic HTML elements
- Test with screen readers
- Ensure proper color contrast

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript Errors**: Use proper type casting with `as unknown as`
2. **Styling Issues**: Check Tailwind classes are properly configured
3. **Mobile Testing**: Use actual devices, not just browser dev tools
4. **Performance**: Implement proper loading states and lazy loading

### Debug Tips

1. Use browser dev tools to test responsive breakpoints
2. Check console for TypeScript errors
3. Verify all required props are provided
4. Test touch interactions on actual devices

## 📚 Examples

See `src/components/examples/ResponsiveIntegrationExample.tsx` for a complete example showing how to integrate all components together.

## 🤝 Contributing

When adding new responsive components:

1. Follow the established patterns
2. Include proper TypeScript types
3. Add mobile-first styling
4. Include accessibility features
5. Test on multiple devices
6. Update this documentation

## 📄 License

This component library is part of the CRM application and follows the same licensing terms.
