# 🚀 Cursor AI/Code Assistant Prompt: CRM Responsiveness Refactor

You are an expert React + TypeScript + Tailwind CSS developer specializing in responsive enterprise web applications. You have extensive experience with CRM systems and mobile-first design principles.

## CONTEXT & OBJECTIVE

I have a CRM application built with:
- **Frontend:** Next.js 15.5.2 + React 19.1.0 + TypeScript
- **Styling:** Tailwind CSS + Custom CSS
- **UI Components:** Radix UI + Custom Components
- **State Management:** Zustand + React Query
- **Icons:** Lucide React

**CRITICAL PROBLEM:** The CRM is completely unusable on mobile devices (≤768px) and poorly optimized for tablets (768px-1024px). Tables, forms, dashboards, and navigation are broken on smaller screens.

**OBJECTIVE:** Refactor the frontend to be fully responsive and usable across all devices using adaptive components (NOT separate mobile/tablet folders).

## SPECIFIC REQUIREMENTS

### 1. RESPONSIVE TABLE SYSTEM
Create a `ResponsiveTable` component that:
- Mobile (≤768px): Shows data as vertical cards (`MobileCardView`)
- Tablet (768px-1024px): Uses optimized table layout (`TabletTableView`)
- Desktop (≥1024px): Full table with all columns (`DesktopTableView`)
- Replace ALL existing table implementations
- NO horizontal scrolling on mobile

### 2. ADAPTIVE FORM LAYOUTS
Create a `ResponsiveFormLayout` component that:
- Mobile: Single-column layout, progressive disclosure for complex forms
- Tablet: Single or two-column based on content
- Desktop: Multi-column layouts
- Touch targets ≥44px, proper spacing ≥8px
- Native input types (tel, email, date) for mobile

### 3. MOBILE-OPTIMIZED NAVIGATION
Create `EnhancedMobileNav` that includes:
- Bottom navigation with 4-5 primary actions
- Search functionality
- Quick add button
- Role-based navigation items
- Maintain feature parity with desktop nav

### 4. RESPONSIVE DASHBOARDS
Create `MobileDashboard` component with:
- Essential KPIs visible by default
- Accordion/collapsible sections for detailed metrics
- Progressive disclosure pattern
- Touch-friendly interactions

### 5. MOBILE DIALOGS/MODALS
Update dialog components for:
- Full-screen on mobile
- Proper sizing on tablet/desktop
- Touch-optimized interactions

## TECHNICAL SPECIFICATIONS

### Breakpoints (Use Consistently)
```tsx
const breakpoints = {
  sm: '640px',
  md: '768px',  // Mobile/Tablet boundary
  lg: '1024px', // Tablet/Desktop boundary
  xl: '1280px'
};
```

### Device Detection Hook
```tsx
const useMediaQuery = (query: string) => {
  // Implementation for responsive logic
};
```

### Component Structure Pattern
```tsx
// Example: ResponsiveTable
const ResponsiveTable = ({ data, columns, actions }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  
  if (isMobile) return <MobileCardView {...props} />;
  if (isTablet) return <TabletTableView {...props} />;
  return <DesktopTableView {...props} />;
};
```

## DELIVERABLES REQUESTED

### Phase 1: Core Components
1. **ResponsiveTable.tsx** - Complete implementation with MobileCardView, TabletTableView, DesktopTableView
2. **ResponsiveFormLayout.tsx** - Adaptive form layouts
3. **EnhancedMobileNav.tsx** - Mobile-optimized navigation
4. **MobileDashboard.tsx** - Mobile dashboard component
5. **ResponsiveDialog.tsx** - Mobile-optimized dialogs

### Phase 2: Integration Examples
1. Refactor `CustomerList` page to use ResponsiveTable
2. Update `AddCustomerModal` to use ResponsiveFormLayout
3. Integrate MobileDashboard into BusinessAdminDashboard
4. Update AppLayout to use EnhancedMobileNav

### Phase 3: Utility Components
1. **ResponsiveGrid.tsx** - Adaptive grid system
2. **ResponsiveCard.tsx** - Device-aware card component
3. **TouchOptimizedButton.tsx** - Mobile-friendly buttons
4. **ProgressiveDisclosure.tsx** - For complex forms/content

## CODING STANDARDS

- **TypeScript:** Strongly typed, proper interfaces
- **Tailwind:** Mobile-first approach, consistent breakpoints
- **Performance:** Lazy loading for heavy components on mobile
- **Accessibility:** WCAG 2.1 AA compliance, proper ARIA labels
- **Testing:** Include prop types and usage examples
- **Documentation:** JSDoc comments for all components

## FILE ORGANIZATION

```
/components
  /ui
    ResponsiveTable.tsx
    ResponsiveFormLayout.tsx
    ResponsiveGrid.tsx
    ResponsiveCard.tsx
    ResponsiveDialog.tsx
  /navigation
    EnhancedMobileNav.tsx
  /dashboard
    MobileDashboard.tsx
```

## DO NOT CREATE

- Separate `/mobile`, `/tablet`, or `/desktop` folders
- Device-specific duplicate pages
- Horizontal scrolling solutions for tables
- Feature-incomplete mobile versions

## MOBILE UX PATTERNS TO IMPLEMENT

Based on HubSpot, Salesforce, and Zoho CRM mobile apps:
- Card-based data display
- Bottom navigation
- Progressive disclosure
- Pull-to-refresh (optional)
- Swipe gestures (optional)
- Touch-optimized interactions

## PRIORITY ORDER

1. **CRITICAL:** Fix tables (ResponsiveTable + MobileCardView)
2. **HIGH:** Fix forms (ResponsiveFormLayout)
3. **HIGH:** Fix navigation (EnhancedMobileNav)
4. **MEDIUM:** Fix dashboards (MobileDashboard)
5. **LOW:** Advanced interactions and optimizations

## EXAMPLE OUTPUT REQUEST

Start with the ResponsiveTable component and show:
1. Complete TypeScript implementation
2. Usage example with sample data
3. Integration instructions
4. Performance considerations

Generate production-ready code that I can immediately copy-paste into my CRM project. Include proper error handling, loading states, and edge cases.

Focus on creating a maintainable, scalable responsive system that follows React best practices and provides excellent UX across all devices.