# Cursor Rules for Complete Jewellery CRM + E-commerce + Catalog Project

## PROJECT OVERVIEW
You are helping build a comprehensive multi-tenant SaaS platform that combines CRM, E-commerce, and Catalog Management specifically for Indian jewellery businesses. The system must look and feel exactly like HubSpot CRM.

## CORE CONTEXT
- *Target Users*: Indian jewellery store owners and sales teams
- *User Roles*: Platform Admin, Business Admin, Store Manager, Sales Team  
- *Architecture*: Multi-tenant with complete data isolation
- *Design Inspiration*: Exact replica of HubSpot CRM interface
- *Developer Level*: Complete beginner - provide detailed explanations

## TECHNICAL STACK REQUIREMENTS

### Frontend Stack
- *Framework*: Next.js 15 with App Router
- *Language*: TypeScript (with detailed type definitions)
- *Styling*: Tailwind CSS + Shadcn/ui components
- *Forms*: React Hook Form with Zod validation
- *State Management*: Zustand for global state
- *Icons*: Lucide React icons

### Backend Stack
- *API*: Next.js API routes
- *Authentication*: NextAuth.js with role-based access
- *Database*: Prisma ORM with PostgreSQL
- *Multi-tenancy*: Row-level security implementation
- *Payments*: Stripe/Razorpay integration ready

### Design System (HubSpot Clone)
- *Primary Color*: #FF7A59 (HubSpot Orange)
- *Secondary Color*: #0091AE (Deep Navy)
- *Sidebar Color*: #1B2A4E (Dark Navy)
- *Background*: #FFFFFF (Clean White)
- *Typography*: Lexend font family
- *Layout*: 250px fixed sidebar + main content area

## CORE FEATURES TO IMPLEMENT

### 1. CRM System
- Customer profiles with jewellery preferences
- Sales pipeline (Kanban: Lead → Qualified → Proposal → Negotiation → Closed)
- Appointment scheduling system
- Communication timeline
- Lead scoring and tracking

### 2. E-commerce Platform
- Drag-and-drop store builder
- Product catalog with search/filters
- Shopping cart and checkout
- Order management
- Customer accounts
- Payment processing

### 3. Catalog Management
- Master product catalog
- Category/subcategory management
- Product variants (size, metal, stone)
- Inventory tracking across stores
- Bulk product operations
- Performance analytics

### 4. Multi-tenant Features
- Subdomain-based tenant identification
- Complete data isolation
- Role-based permissions
- Tenant-specific branding
- Billing management

### 5. Indian Market Specifics
- Currency formatting (₹)
- GST number validation
- Indian address formats
- Festival tracking (Diwali, Karva Chauth, etc.)
- Traditional jewellery categories
- Regional payment options (UPI, Razorpay)

## DEVELOPMENT RULES

### Code Quality Standards
1. *Always include detailed comments* explaining what each function/component does
2. *Use TypeScript* with proper interfaces and types for everything
3. *Include JSDoc comments* for all functions
4. *Add error handling* and loading states to all components
5. *Implement proper validation* for all forms and inputs
6. *Use consistent naming conventions* (camelCase for variables, PascalCase for components)

### Component Development Rules
1. *Create reusable components* following atomic design principles
2. *Include prop interfaces* with detailed descriptions
3. *Add default props* where appropriate
4. *Implement responsive design* with mobile-first approach
5. *Use Tailwind classes* consistently with design system colors
6. *Include accessibility features* (aria-labels, keyboard navigation)

### Database Rules
1. *Every model must include tenantId* for multi-tenant isolation
2. *Include audit fields* (createdAt, updatedAt, createdBy)
3. *Use proper relationships* with foreign keys and indexes
4. *Implement soft deletes* where appropriate
5. *Add database constraints* for data integrity
6. *Include sample seed data* for testing

### API Development Rules
1. *Implement tenant isolation* in every API route
2. *Add proper authentication* and role-based authorization
3. *Include input validation* using Zod schemas
4. *Implement rate limiting* for security
5. *Add comprehensive error handling* with meaningful messages
6. *Use consistent response formats* for all endpoints

### UI/UX Rules
1. *Follow HubSpot design patterns* exactly
2. *Use consistent spacing* and padding (Tailwind spacing scale)
3. *Implement loading states* for all async operations
4. *Add hover effects* and interactive feedback
5. *Ensure mobile responsiveness* with touch-friendly buttons (min 44px)
6. *Include empty states* with helpful messaging

## SPECIFIC IMPLEMENTATION GUIDELINES

### File Structure

src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components)
│   ├── forms/
│   ├── tables/
│   └── layouts/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   └── validations/
├── types/
└── hooks/


### Component Naming
- *Pages*: PascalCase (CustomerList.tsx)
- *Components*: PascalCase (DataTable.tsx)
- *Hooks*: camelCase with 'use' prefix (useCustomers.ts)
- *Utilities*: camelCase (formatCurrency.ts)
- *Types*: PascalCase with descriptive names (CustomerWithOrders)

### Database Naming
- *Tables*: snake_case (customer_orders)
- *Columns*: snake_case (created_at, tenant_id)
- *Relations*: descriptive names (customer.orders)
- *Indexes*: descriptive (idx_customers_tenant_id)

## BEGINNER-FRIENDLY REQUIREMENTS

### Code Explanation Standards
1. *Add inline comments* explaining complex logic
2. *Include function descriptions* with examples
3. *Explain TypeScript types* and why they're used
4. *Document component props* with usage examples
5. *Add README sections* for each major feature

### Setup Instructions
1. *Provide step-by-step setup* for all dependencies
2. *Include environment variable* examples
3. *Add database migration* instructions
4. *Document deployment* process
5. *Include troubleshooting* guides

### Learning Resources
1. *Explain React concepts* when introducing new patterns
2. *Document Tailwind utilities* being used
3. *Explain database relationships* and why they exist
4. *Include links* to relevant documentation
5. *Add code examples* for common tasks

## SAMPLE DATA REQUIREMENTS

### Tenant Sample Data
- *3 jewellery businesses*: "Royal Jewellers", "Modern Gems", "Bridal Collection"
- *Different business types*: Traditional, Contemporary, Wedding specialist
- *Realistic Indian business data*: Mumbai, Delhi, Bangalore locations

### Customer Sample Data
- *50+ customers per tenant* with Indian names
- *Variety of profiles*: VIP customers, regular customers, new leads
- *Purchase history*: Range from ₹5,000 to ₹5,00,000
- *Jewellery preferences*: Traditional, Modern, Fusion styles
- *Occasions*: Wedding, Anniversary, Festival, Personal

### Product Sample Data
- *100+ products per category*: Rings, Necklaces, Earrings, Bracelets
- *Product variants*: Different sizes, metals (Gold/Silver/Platinum), stones
- *Realistic pricing*: Market-appropriate Indian jewellery prices
- *Detailed specifications*: Purity, weight, craftsmanship details

## TESTING REQUIREMENTS

### Functionality Testing
1. *Multi-tenant isolation*: Verify no data leakage between tenants
2. *Role-based access*: Test all user roles have appropriate permissions
3. *CRUD operations*: Test all create, read, update, delete functions
4. *Form validation*: Test all input validation and error states
5. *Mobile responsiveness*: Test on various screen sizes

### Performance Testing
1. *Page load times*: Target under 3 seconds
2. *Database queries*: Optimize with proper indexes
3. *Image loading*: Implement lazy loading for product images
4. *API response times*: Target under 500ms for most operations

## ERROR HANDLING STANDARDS

### Frontend Error Handling
1. *Try-catch blocks* for all async operations
2. *User-friendly error messages* instead of technical errors
3. *Loading states* during data fetching
4. *Fallback UI* for component errors
5. *Toast notifications* for user feedback

### Backend Error Handling
1. *Proper HTTP status codes* for all responses
2. *Detailed error logging* for debugging
3. *Input validation* with clear error messages
4. *Rate limiting* with appropriate responses
5. *Database error handling* with fallbacks

## SECURITY REQUIREMENTS

### Authentication & Authorization
1. *Secure password hashing* using bcrypt
2. *JWT token management* with proper expiration
3. *Role-based route protection* on all pages
4. *API route authentication* for all endpoints
5. *Session management* with NextAuth.js

### Data Protection
1. *Input sanitization* to prevent XSS
2. *SQL injection prevention* using Prisma
3. *CSRF protection* on forms
4. *Rate limiting* on API routes
5. *Tenant data isolation* at database level

## DEPLOYMENT PREPARATION

### Environment Configuration
1. *Separate environments*: Development, staging, production
2. *Environment variables*: Secure storage of secrets
3. *Database migrations*: Automated deployment process
4. *Static asset optimization*: Image compression and CDN
5. *Performance monitoring*: Error tracking and analytics

### Production Readiness
1. *Error boundaries* for React components
2. *Database connection pooling* for scalability
3. *Caching strategies* for frequently accessed data
4. *SEO optimization* for public-facing pages
5. *Backup strategies* for data protection

## COMMUNICATION STYLE

When generating code or providing explanations:
1. *Be conversational and encouraging* - remember this is for a beginner
2. *Explain the "why"* behind technical decisions
3. *Provide context* for complex concepts
4. *Offer alternatives* when multiple approaches exist
5. *Include next steps* and suggestions for improvement

## SUCCESS CRITERIA

The project is successful when:
1. *Complete CRM functionality* matching HubSpot's interface
2. *Full e-commerce platform* with shopping cart and checkout
3. *Comprehensive catalog management* with inventory tracking
4. *Perfect multi-tenant isolation* with no data leakage
5. *Mobile-responsive design* working smoothly on all devices
6. *Production deployment* accessible via public URL
7. *Complete documentation* for future maintenance

Remember: Every response should be helpful, educational, and move the project forward while maintaining high code quality and beginner-friendly explanations.