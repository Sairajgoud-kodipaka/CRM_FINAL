Create a complete multi-tenant SaaS CRM system specifically designed for Indian jewellery businesses that looks and feels exactly like HubSpot CRM. I am a complete beginner to coding, so please provide detailed explanations and step-by-step instructions for everything.

## PROJECT REQUIREMENTS:

### DESIGN INSPIRATION:
*Primary Inspiration: HubSpot CRM Interface*
- Replicate HubSpot's clean, professional design language
- Use HubSpot's layout patterns and navigation structure
- Implement HubSpot's color scheme and typography
- Follow HubSpot's information architecture
- Maintain HubSpot's user experience patterns

*Visual References to Replicate:*
- HubSpot's dashboard layout with metric cards
- Contact list view with filtering sidebar
- Deal pipeline kanban board
- Contact profile layout with timeline
- Navigation sidebar structure
- Form styling and input patterns
- Button styles and states
- Modal and dialog patterns

### BUSINESS CONTEXT:
- Target: Indian jewellery store owners and their sales teams
- Users: Platform Admin, Business Admin, Store Managers, Sales Team
- Key features: Customer management, appointment booking, sales pipeline, WhatsApp integration
- Multi-tenant: Each jewellery business gets isolated data

### TECHNICAL SPECIFICATIONS:

*Frontend Stack:*
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/ui components
- React Hook Form for forms
- Zustand for state management

*Backend Stack:*
- Next.js API routes
- NextAuth.js for authentication
- Prisma ORM with PostgreSQL
- Row-level security for multi-tenancy

*Database Schema:*
- Tenants (jewellery businesses)
- Users (with roles: platform_admin, business_admin, store_manager, sales_team)
- Stores (physical locations)
- Customers (with jewellery-specific fields)
- Products (jewellery items with variants)
- Categories and subcategories
- Product images and media
- Inventory tracking
- Orders and order items
- Shopping carts
- Wishlists
- Product reviews
- Shipping addresses
- Payment transactions
- Appointments
- Sales/Orders (offline and online)
- WhatsApp messages log
- Email campaigns
- Lead capture forms
- Website pages and content

*UI Requirements:*
- Mobile-first responsive design
- Indian jewellery business theme (gold, purple, elegant)
- Role-based navigation and access
- Modern SaaS dashboard layout
- Touch-friendly for mobile sales teams

### DETAILED FEATURE REQUIREMENTS:

#### 1. AUTHENTICATION & MULTI-TENANCY:
- Subdomain-based tenant identification (tenant.mycrm.com)
- Role-based access control
- Tenant isolation at database level
- User registration with email verification
- Password reset functionality

#### 2. USER ROLES & PERMISSIONS:

*Platform Admin:*
- Manage all tenants
- Create new business accounts
- View system-wide analytics
- Billing management

*Business Admin:*
- Manage their business settings
- Create stores and assign managers
- View business-wide analytics
- Manage team members
- WhatsApp integration settings
- E-commerce store builder and management
- Global catalog management
- Online order processing
- Website content management
- SEO and marketing tools
- Payment gateway configuration
- Shipping and delivery settings

*Store Manager:*
- Manage their store's customers
- Assign leads to sales team
- View store analytics
- Schedule appointments
- Monitor sales team performance
- Manage store-specific inventory
- Process online orders for their store
- Update product availability
- Handle store-specific promotions
- Manage local delivery options

*Sales Team:*
- Add/edit customers
- Book appointments
- Track sales pipeline
- Send WhatsApp messages
- View personal performance
- Access product catalog for recommendations
- Create quotes and proposals
- Process orders (online and offline)
- Track customer preferences and wishlists
- Share product links via WhatsApp

#### 3. CUSTOMER MANAGEMENT:
- Customer profile with photo
- Contact information (phone, email, address)
- Jewellery preferences:
  - Preferred metal (Gold, Silver, Platinum)
  - Style preference (Traditional, Modern, Fusion)
  - Occasion (Wedding, Anniversary, Festival)
  - Budget range
- Purchase history
- Communication log
- Tags and segmentation
- Customer journey timeline

#### 4. SALES PIPELINE:
- Lead capture and qualification
- Kanban-style pipeline (Lead → Qualified → Proposal → Negotiation → Closed)
- Lead scoring based on budget, urgency, preferences
- Follow-up reminders
- Conversion tracking
- Sales forecasting

#### 5. APPOINTMENT SYSTEM:
- Calendar view for appointments
- Book appointments with customers
- Appointment types (Consultation, Delivery, Fitting)
- Reminder notifications
- Reschedule/cancel functionality
- Staff availability management

#### 6. DASHBOARD & ANALYTICS:
- Revenue metrics (daily, monthly, yearly)
- Customer acquisition metrics
- Sales team performance
- Popular product categories
- Customer segmentation insights
- Appointment analytics

#### 8. E-COMMERCE STORE MANAGEMENT:
- Online store builder with drag-and-drop interface
- Product catalog synchronization with inventory
- Order management and fulfillment
- Customer accounts and wishlists
- Shopping cart and checkout flow
- Payment gateway integration (Razorpay, Stripe)
- Shipping and delivery tracking
- Product reviews and ratings
- SEO optimization tools
- Social media integration
- Discount codes and promotions
- Abandoned cart recovery

#### 9. GLOBAL CATALOG MANAGEMENT:
- Master product catalog for all stores
- Product categories and subcategories (Rings, Necklaces, Earrings, Bracelets, etc.)
- Product variants (size, metal type, stone type)
- Bulk product upload via CSV/Excel
- Image gallery with multiple product photos
- 360° product view support
- Product specifications:
  - Metal purity (14k, 18k, 22k gold)
  - Stone details (diamond clarity, carat weight)
  - Dimensions and weight
  - Craftsmanship details
- Inventory management across multiple stores
- Price management with markup rules
- Product availability by store location
- Stock alerts and reorder points
- Product performance analytics
- Seasonal collection management

#### 10. ONLINE LEAD CAPTURE:
- Landing page builder for campaigns
- Contact forms and lead magnets
- Live chat widget integration
- Social media lead capture
- WhatsApp Business catalog integration
- Email capture popups
- Quote request forms
- Virtual appointment booking
- Product inquiry forms
- Newsletter subscription management

### UI/UX SPECIFIC REQUIREMENTS:

#### COLOR SCHEME (HUBSPOT-INSPIRED):
- Primary: HubSpot Orange (#FF7A59)
- Secondary: Deep Navy (#0091AE) 
- Accent: Light Orange (#FFB84D)
- Background: Clean White (#FFFFFF)
- Sidebar: Dark Navy (#1B2A4E)
- Cards: White (#FFFFFF) with subtle shadows
- Borders: Light Grey (#E6EAED)
- Text Primary: Dark Grey (#33475B)
- Text Secondary: Medium Grey (#5E6C84)

#### TYPOGRAPHY (HUBSPOT STYLE):
- Font Family: 'Lexend', 'Avenir Next', system-ui, sans-serif
- Headings: Lexend Medium/Semibold
- Body: Lexend Regular
- UI Elements: Lexend Medium
- Clean, modern, highly readable

#### MOBILE OPTIMIZATION:
- Touch-friendly buttons (minimum 44px)
- Swipe gestures for navigation
- Optimized forms for mobile input
- Fast loading on slower networks
- Offline-first customer data access

#### HUBSPOT-STYLE UI COMPONENTS:

*Layout Structure:*
- Dark navy left sidebar (200px fixed width)
- White main content area
- Top navigation bar with search and user menu
- Breadcrumb navigation
- Clean white cards with subtle shadows

*Sidebar Navigation:*
- Dark navy background (#1B2A4E)
- White/light grey icons and text
- Collapsible sections
- Active state with orange accent
- Role-based menu items
- Company logo at top

*Dashboard Cards:*
- White background with subtle box-shadow
- Rounded corners (8px border-radius)
- Orange accent borders on key metrics
- Clean typography hierarchy
- Consistent padding and spacing

*Tables & Lists:*
- Clean data tables with alternating row colors
- Sortable columns with clear indicators
- Inline actions (edit, delete, view)
- Bulk action checkboxes
- Advanced filtering panels
- Search with autocomplete

*Forms:*
- Clean, spacious form layouts
- Consistent input styling
- Orange primary buttons
- Clear validation states
- Multi-step form wizards for complex processes

*Buttons:*
- Primary: Orange (#FF7A59) with white text
- Secondary: White with orange border
- Tertiary: Ghost buttons with orange text
- Consistent padding and border-radius

*Navigation Patterns:*
- Breadcrumb trails
- Tabbed interfaces for detailed views
- Modal dialogs for quick actions
- Slide-out panels for additional details

*Data Visualization:*
- Clean charts using Chart.js or Recharts
- Orange and navy color scheme
- Minimal grid lines
- Clear legends and labels
- Interactive tooltips

*Mobile Interface:*
- Collapsible sidebar becomes bottom navigation
- Card-based layout for mobile
- Touch-friendly buttons and inputs
- Swipe gestures for actions

#### SPECIFIC HUBSPOT-STYLE PAGES:

*Dashboard Page:*
- Grid layout with metric cards
- Revenue charts and graphs
- Recent activity feed
- Quick action buttons
- Team performance widgets

*Contact/Customer List:*
- Full-width data table
- Left sidebar for filtering
- Top search bar with advanced filters
- Bulk actions toolbar
- Import/export options

*Customer Profile:*
- Left column: customer photo and basic info
- Center: timeline of interactions
- Right column: deal/opportunity sidebar
- Tabbed sections for different data types

*Sales Pipeline:*
- Kanban-style deal board
- Drag-and-drop functionality
- Deal cards with key information
- Stage conversion metrics
- Filters and search above board

### SAMPLE DATA REQUIREMENTS:
Create realistic sample data including:
- 3 sample tenants (different jewellery businesses)
- 50+ customers with Indian names and addresses
- Variety of purchase amounts (₹5,000 to ₹5,00,000)
- Different customer types and preferences
- Appointment history
- Sales pipeline data
- Product catalog with Indian jewellery items

### INDIAN MARKET SPECIFIC FEATURES:
- Indian currency formatting (₹)
- Indian phone number format validation
- Indian address format
- Festival and occasion tracking (Diwali, Karva Chauth, etc.)
- Regional language support preparation
- GST number fields for business customers
- Traditional jewellery categories

### SECURITY REQUIREMENTS:
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting on APIs
- Secure session management
- Data encryption for sensitive fields

### PERFORMANCE REQUIREMENTS:
- Page load time < 3 seconds
- Database queries optimized
- Image optimization for product photos
- Lazy loading for large lists
- Caching strategy for frequently accessed data

## IMPLEMENTATION INSTRUCTIONS:

### STEP 1: Project Setup
1. Create Next.js project with TypeScript
2. Set up Tailwind CSS and Shadcn/ui
3. Configure Prisma with PostgreSQL
4. Set up NextAuth.js
5. Create basic folder structure

### STEP 2: Database Design
1. Create Prisma schema with all required models
2. Implement row-level security for multi-tenancy
3. Set up database migrations
4. Seed with sample data

### STEP 3: Authentication System
1. Implement NextAuth.js with credentials provider
2. Add role-based access control
3. Create login/signup pages
4. Implement tenant identification

### STEP 4: Core UI Components
1. Create layout components
2. Build navigation with role-based menus
3. Create dashboard components
4. Build customer management interfaces

### STEP 5: API Routes
1. Authentication APIs
2. Customer CRUD operations
3. Appointment management
4. Sales pipeline APIs
5. Analytics endpoints

### STEP 6: Business Logic
1. Multi-tenant data filtering
2. Role-based permissions
3. Customer journey tracking
4. Sales pipeline logic

### STEP 7: Polish & Testing
1. Mobile responsiveness testing
2. Performance optimization
3. Error handling
4. Data validation

## BEGINNER-FRIENDLY REQUIREMENTS:

Since I'm new to coding:

1. *Provide detailed comments* in all code explaining what each part does
2. *Include step-by-step setup instructions* for each tool and dependency
3. *Explain technical concepts* in simple terms when introduced
4. *Provide debugging guidance* for common issues
5. *Include testing instructions* to verify everything works
6. *Create a README file* with setup and usage instructions
7. *Organize code clearly* with logical file structure
8. *Use TypeScript* with clear type definitions for learning

## DELIVERABLES:

1. Complete working Next.js application
2. Database schema and migrations
3. Sample data for demonstration
4. Component library documentation
5. API documentation
6. Deployment instructions
7. User guide for different roles
8. Developer setup guide

## EXAMPLE PAGES TO CREATE:

1. Landing/Login page
2. Business Admin dashboard
3. Customer list page
4. Customer profile page
5. Add/edit customer page
6. Appointments calendar
7. Sales pipeline kanban
8. Analytics dashboard
9. *E-commerce store builder*
10. *Product catalog management*
11. *Online store front-end*
12. *Order management dashboard*
13. *Inventory tracking page*
14. *Website content editor*
15. Settings page
16. Mobile sales app interface

## TESTING SCENARIOS:

1. Multi-tenant data isolation
2. Role-based access control
3. Customer CRUD operations
4. Mobile responsiveness
5. Performance with sample data
6. Form validations
7. Error handling

Please build this system with production-ready code quality but explain everything clearly for a beginner to understand and maintain.