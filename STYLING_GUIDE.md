# Complete Styling Guide - HubSpot-Inspired Jewellery CRM

## Overview
This document defines the complete design system for our jewellery CRM platform, inspired by HubSpot's clean and professional interface. Every component and page should follow these guidelines to ensure consistency and professional appearance.

## Color Palette

### Primary Colors
```css
/* HubSpot-Inspired Color Scheme */
--primary-orange: #FF7A59;      /* HubSpot Orange - Primary CTA buttons */
--primary-navy: #0091AE;        /* Deep Navy - Secondary elements */
--sidebar-navy: #1B2A4E;        /* Dark Navy - Sidebar background */
--accent-orange: #FFB84D;       /* Light Orange - Accent elements */
```

### Neutral Colors
```css
--background-white: #FFFFFF;    /* Main background */
--card-white: #FFFFFF;          /* Card backgrounds */
--border-light: #E6EAED;        /* Light borders and dividers */
--text-primary: #33475B;        /* Primary text color */
--text-secondary: #5E6C84;      /* Secondary text color */
--text-muted: #8B9BAB;          /* Muted text for metadata */
```

### Status Colors
```css
--success-green: #00BDA5;       /* Success states */
--warning-yellow: #F5A623;      /* Warning states */
--error-red: #E74C3C;           /* Error states */
--info-blue: #4A90E2;           /* Info states */
```

### Tailwind CSS Custom Colors
Add to `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF4F1',
          100: '#FFE8E1',
          500: '#FF7A59',
          600: '#E85A3A',
          700: '#C14A2F',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          500: '#0091AE',
          700: '#1B2A4E',
          900: '#0F1419',
        },
        sidebar: '#1B2A4E',
        accent: '#FFB84D',
      }
    }
  }
}
```

## Typography

### Font Family
**Primary Font**: Lexend (Google Fonts)
**Fallback**: 'Avenir Next', system-ui, sans-serif

### Font Weights and Usage
```css
/* Font Weight Scale */
--font-light: 300;     /* Rarely used */
--font-regular: 400;   /* Body text, descriptions */
--font-medium: 500;    /* UI elements, labels */
--font-semibold: 600;  /* Headings, emphasis */
--font-bold: 700;      /* Major headings only */
```

### Typography Scale
```css
/* Heading Styles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* Page titles */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* Section headers */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* Card titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }    /* Sub-headers */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }   /* Large body text */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* Regular body text */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }   /* Small text, captions */
.text-xs { font-size: 0.75rem; line-height: 1rem; }       /* Meta text, timestamps */
```

### Usage Examples
```html
<!-- Page Title -->
<h1 class="text-4xl font-semibold text-text-primary">Customers</h1>

<!-- Section Header -->
<h2 class="text-2xl font-medium text-text-primary">Customer Details</h2>

<!-- Card Title -->
<h3 class="text-xl font-medium text-text-primary">Recent Activity</h3>

<!-- Body Text -->
<p class="text-base text-text-secondary">Customer contact information and preferences.</p>

<!-- Meta Text -->
<span class="text-sm text-text-muted">Last updated 2 hours ago</span>
```

## Layout Structure

### Main Layout Grid
```css
/* Desktop Layout (1024px+) */
.main-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas: 
    "sidebar header"
    "sidebar main";
  min-height: 100vh;
}

/* Tablet Layout (768px - 1023px) */
@media (max-width: 1023px) {
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "header"
      "main";
  }
}
```

### Sidebar Specifications
```css
.sidebar {
  width: 250px;
  background: var(--sidebar-navy);
  color: white;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 50;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  padding: 1rem 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.sidebar-nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-nav-item.active {
  background: var(--primary-orange);
  color: white;
}
```

### Main Content Area
```css
.main-content {
  margin-left: 250px; /* Desktop */
  padding: 2rem;
  background: #F8F9FA;
  min-height: 100vh;
}

@media (max-width: 1023px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
}
```

## Component Specifications

### Cards
```css
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-light);
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  background: #F8F9FA;
  border-top: 1px solid var(--border-light);
}
```

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-orange);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-orange-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 122, 89, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: var(--primary-orange);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid var(--primary-orange);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--primary-orange);
  color: white;
}

/* Tertiary Button */
.btn-tertiary {
  background: transparent;
  color: var(--primary-orange);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-tertiary:hover {
  background: rgba(255, 122, 89, 0.1);
}
```

### Form Elements
```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-orange);
  box-shadow: 0 0 0 3px rgba(255, 122, 89, 0.1);
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-error {
  color: var(--error-red);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
```

### Tables
```css
.data-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table thead {
  background: #F8F9FA;
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
}

.data-table tbody tr:hover {
  background: #F8F9FA;
}
```

### Navigation Breadcrumbs
```css
.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: var(--text-muted);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: var(--text-muted);
}
```

## Page-Specific Layouts

### Dashboard Layout
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--primary-orange);
}

.metric-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

### Customer List Layout
```css
.customer-list-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  height: calc(100vh - 200px);
}

.filter-sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.customer-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
```

### Sales Pipeline (Kanban) Layout
```css
.pipeline-container {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  min-height: calc(100vh - 200px);
}

.pipeline-column {
  min-width: 300px;
  background: #F8F9FA;
  border-radius: 8px;
  padding: 1rem;
}

.pipeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-light);
}

.deal-card {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: all 0.2s ease;
}

.deal-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
```

## Responsive Design Breakpoints

### Mobile First Approach
```css
/* Mobile (320px - 767px) */
.mobile-only { display: block; }
.tablet-up { display: none; }
.desktop-up { display: none; }

/* Tablet (768px - 1023px) */
@media (min-width: 768px) {
  .mobile-only { display: none; }
  .tablet-up { display: block; }
  .desktop-up { display: none; }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .mobile-only { display: none; }
  .tablet-up { display: block; }
  .desktop-up { display: block; }
}
```

### Mobile Navigation
```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-around;
  padding: 1rem 0;
  z-index: 100;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.75rem;
  min-width: 44px;
  min-height: 44px;
}

.mobile-nav-item.active {
  color: var(--primary-orange);
}
```

## Animation and Interactions

### Loading States
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--primary-orange);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Hover Effects
```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}
```

### Page Transitions
```css
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-exit {
  opacity: 1;
  transform: translateY(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
```

## Component Usage Guidelines

### Do's ✅
- Always use the defined color palette
- Maintain consistent spacing (multiples of 4px)
- Use Lexend font family throughout
- Include hover states for interactive elements
- Implement loading states for async operations
- Follow mobile-first responsive design
- Use semantic HTML elements
- Include accessibility attributes (aria-labels, roles)

### Don'ts ❌
- Don't use custom colors outside the palette
- Don't mix different border-radius values
- Don't use inline styles (use Tailwind classes)
- Don't ignore mobile responsiveness
- Don't forget loading and error states
- Don't use non-standard font weights
- Don't create components without proper TypeScript types

## Indian Market Customizations

### Currency Display
```css
.currency-inr::before {
  content: "₹";
  margin-right: 0.25rem;
}

.currency-large {
  font-weight: 600;
  color: var(--text-primary);
}

.currency-positive {
  color: var(--success-green);
}

.currency-negative {
  color: var(--error-red);
}
```

### Festival Themes
```css
.festival-diwali {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #8B4513;
}

.festival-karva-chauth {
  background: linear-gradient(135deg, #FF69B4, #DC143C);
  color: white;
}

.festival-navratri {
  background: linear-gradient(135deg, #FF6347, #FFD700);
  color: #8B0000;
}
```

## Implementation Priority

### Phase 1: Core Components
1. Color system setup in Tailwind config
2. Typography classes and font import
3. Basic layout structure (sidebar, header, main)
4. Card and button components
5. Form elements styling

### Phase 2: Complex Components
1. Data tables with sorting and filtering
2. Navigation with role-based visibility
3. Dashboard metric cards
4. Loading and error states
5. Modal and drawer components

### Phase 3: Page-Specific Layouts
1. Dashboard grid layout
2. Customer list with sidebar filters
3. Sales pipeline kanban board
4. Product catalog grid
5. Mobile navigation

### Phase 4: Polish and Optimization
1. Animation and transitions
2. Responsive design testing
3. Accessibility improvements
4. Performance optimizations
5. Indian market customizations

This styling guide ensures consistency across the entire application while maintaining the professional HubSpot-inspired appearance that users expect from a modern CRM system.