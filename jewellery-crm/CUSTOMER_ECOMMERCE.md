# Customer E-Commerce Website

This document describes the customer-facing e-commerce website that has been created for the Jewellery CRM system.

## Overview

The customer e-commerce website is a multi-tenant platform that allows customers to browse and purchase jewellery products. It's designed with a CaratLane-inspired theme and provides a complete shopping experience.

## Features

### 🏪 Multi-Tenant Architecture
- Each tenant has their own store URL: `/store/[tenant]`
- Products and categories are filtered by tenant
- Separate analytics and order management per tenant

### 🛍️ Shopping Experience
- **Product Browsing**: Browse products by category, search, and filters
- **Product Details**: Detailed product pages with images, specifications, and reviews
- **Shopping Cart**: Add/remove items, quantity management
- **Checkout Process**: Multi-step checkout with shipping and payment
- **Order Confirmation**: Order tracking and confirmation

### 🎨 Design Features
- **CaratLane-inspired Design**: Modern, elegant jewellery store design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Gold Theme**: Premium gold color scheme throughout
- **Smooth Animations**: Hover effects and transitions
- **Trust Badges**: Security, shipping, and return policies

### 💳 Payment & Shipping
- **Multiple Payment Methods**: Credit/Debit cards, UPI, Net Banking
- **Free Shipping**: On orders above ₹999
- **Secure Checkout**: SSL encryption and secure payment processing
- **Order Tracking**: Real-time order status updates

## File Structure

```
src/app/store/[tenant]/
├── page.tsx                    # Main store page
├── product/[id]/page.tsx       # Product detail page
├── cart/page.tsx              # Shopping cart
└── checkout/page.tsx          # Checkout process

src/components/customer/
├── CustomerLayout.tsx          # Main layout wrapper
├── CustomerHeader.tsx          # Header with navigation
├── CustomerFooter.tsx          # Footer with links
├── HeroSection.tsx            # Hero banner
├── CategoryGrid.tsx           # Category display
├── ProductGrid.tsx            # Product grid
└── FeaturedProducts.tsx       # Featured products carousel
```

## Key Components

### CustomerLayout
- Provides the main layout structure
- Includes announcement bar and WhatsApp floating button
- Handles responsive design

### CustomerHeader
- Navigation menu with categories
- Search functionality
- Shopping cart icon with item count
- Mobile-responsive menu

### ProductGrid
- Displays products in an attractive grid
- Product cards with images, prices, and actions
- Wishlist and add to cart functionality
- Discount badges and stock status

### Checkout Process
1. **Shipping Information**: Collect customer details
2. **Payment Method**: Choose payment option
3. **Order Confirmation**: Process payment and confirm order

## API Integration

The customer website integrates with the existing Django backend through the `ApiService`:

```typescript
// Load products
const productsResponse = await apiService.getProducts();

// Load categories
const categoriesResponse = await apiService.getProductCategories();

// Get product details
const productResponse = await apiService.getProduct(productId);
```

## Multi-Tenant Features

### Tenant Isolation
- Each tenant's products are isolated
- Categories are filtered by tenant
- Analytics are separated by tenant
- Orders are tracked per tenant

### Store URLs
- Format: `/store/[tenant]`
- Example: `/store/jewellery-store-1`
- Default: `/store/default`

## Styling

### Color Scheme
- **Primary Gold**: `#FFD700` (gold)
- **Background**: White and light grays
- **Text**: Dark grays for readability
- **Accents**: Gold highlights and buttons

### Typography
- **Font**: Lexend (clean, modern)
- **Headings**: Bold, large sizes
- **Body**: Readable, medium weight

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Collapsible navigation menu
- Touch-friendly buttons
- Optimized product grid
- Mobile-first checkout

## Future Enhancements

### Planned Features
- **User Accounts**: Customer registration and login
- **Order History**: View past orders
- **Wishlist**: Save favorite products
- **Reviews**: Product reviews and ratings
- **Size Guide**: Ring size and jewellery sizing
- **Live Chat**: Customer support integration
- **Gift Cards**: Gift card functionality
- **Loyalty Program**: Points and rewards

### Technical Improvements
- **State Management**: Redux or Zustand for cart
- **Payment Gateway**: Integration with Razorpay/Stripe
- **Inventory Sync**: Real-time stock updates
- **Analytics**: Customer behavior tracking
- **SEO**: Meta tags and structured data
- **Performance**: Image optimization and caching

## Getting Started

1. **Access the Store**: Navigate to `/store/default`
2. **Browse Products**: Use categories and search
3. **Add to Cart**: Click "Add to Cart" on products
4. **Checkout**: Complete shipping and payment
5. **Order Confirmation**: Receive order confirmation

## Business Admin Integration

The customer website is connected to the business admin system:

- **Products**: Created in business admin appear on customer site
- **Categories**: Managed in business admin
- **Orders**: Customer orders appear in business admin
- **Analytics**: Sales data flows to business admin dashboard

This creates a complete e-commerce ecosystem where business owners can manage their store and customers can shop seamlessly. 