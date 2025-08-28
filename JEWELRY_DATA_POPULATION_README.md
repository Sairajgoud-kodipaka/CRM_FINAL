# 🎯 Jewelry CRM - Products & Categories Data Population

This document provides comprehensive instructions for populating your jewelry CRM database with realistic products and categories data.

## 📋 Overview

The system includes a Django management command that creates:
- **10 Main Categories**: Rings, Necklaces, Earrings, Bracelets, Pendants, etc.
- **25+ Subcategories**: Detailed breakdowns (Engagement Rings, Diamond Necklaces, etc.)
- **20+ Realistic Products**: Actual jewelry items with proper pricing, descriptions, and specifications
- **Complete Inventory Records**: Stock levels, reorder points, and store-specific inventory

## 🚀 Quick Start

### Option 1: Using the Python Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run the script
python run_jewelry_data.py
```

### Option 2: Using Django Management Command

```bash
# Navigate to backend directory
cd backend

# Run the management command
python manage.py populate_jewelry_data
```

### Option 3: Using Django Management Command with Options

```bash
# Clear existing data and populate fresh
python manage.py populate_jewelry_data --clear-existing

# Specify tenant and store IDs
python manage.py populate_jewelry_data --tenant-id 1 --store-id 1

# Get help
python manage.py populate_jewelry_data --help
```

## 📊 Data Structure

### Main Categories
1. **Rings** - Engagement, Wedding, Fashion rings
2. **Necklaces** - Chains, Pendants, Statement pieces
3. **Earrings** - Studs, Hoops, Drop earrings
4. **Bracelets** - Bangles, Chains, Charm bracelets
5. **Pendants** - Necklace and chain pendants
6. **Anklets** - Delicate ankle jewelry
7. **Nose Pins** - Traditional and modern styles
8. **Mangalsutra** - Traditional married women's jewelry
9. **Toe Rings** - Traditional toe jewelry
10. **Temple Jewellery** - Special occasion traditional jewelry

### Subcategories (Examples)
- **Rings**: Engagement Rings, Wedding Rings, Fashion Rings, Solitaire Rings, Diamond Rings, Gold Rings, Silver Rings, Platinum Rings
- **Necklaces**: Gold Chains, Diamond Necklaces, Pearl Necklaces, Silver Necklaces, Platinum Necklaces, Kundan Necklaces, Polki Necklaces
- **Earrings**: Gold Studs, Diamond Studs, Pearl Earrings, Silver Earrings, Jhumka Earrings, Hoops, Drop Earrings

### Product Examples
- **Engagement Rings**: Solitaire Diamond, Rose Gold Halo, Vintage Emerald Cut
- **Wedding Rings**: Classic Gold Band, Diamond Platinum Band
- **Necklaces**: Diamond Pendant, Pearl Strand, Gold Chain
- **Earrings**: Diamond Studs, Pearl Drops, Traditional Jhumka
- **Bracelets**: Diamond Tennis Bracelet, Gold Bangle Set
- **Pendants**: Om Symbol, Diamond Heart
- **Traditional**: Mangalsutra, Temple Jewellery Set

## 💰 Pricing Structure

The script creates realistic pricing with:
- **Cost Price**: Wholesale/manufacturing cost
- **Selling Price**: Regular retail price
- **Discount Price**: Sale/offer price (when applicable)
- **Profit Margins**: Realistic 30-60% margins

### Price Ranges
- **Basic Items**: ₹8,000 - ₹25,000
- **Mid-Range**: ₹25,000 - ₹50,000
- **Premium**: ₹50,000 - ₹85,000
- **Luxury**: ₹85,000+

## 🏷️ Product Specifications

Each product includes:
- **SKU**: Unique stock keeping unit
- **Material**: 18K Gold, 22K Gold, Platinum, Silver
- **Weight**: In grams
- **Dimensions**: Standard sizing
- **Color**: Gold, White, Rose Gold, etc.
- **Brand**: Luxury Jewels, Elegance Collection, Heritage Jewels
- **Tags**: SEO-friendly keywords
- **Status**: Active, Inactive, Out of Stock
- **Features**: Featured, Bestseller flags

## 📦 Inventory Management

The script creates:
- **Stock Levels**: Realistic quantities (3-25 units)
- **Reorder Points**: Automatic calculation based on stock
- **Store Locations**: Main Display, Storage areas
- **Reserved Quantities**: For pending orders
- **Maximum Stock**: Stock level limits

## 🔧 Prerequisites

Before running the script, ensure you have:

1. **Django Backend Running**: Database migrations applied
2. **Tenant Created**: At least one tenant in the system
3. **Store Created**: At least one store for the tenant
4. **Database Connection**: Proper database configuration

## 🚨 Troubleshooting

### Common Issues

1. **"No tenant found"**
   - Create a tenant first using Django admin or management commands
   - Ensure tenant model is properly migrated

2. **"No store found"**
   - Create a store for your tenant
   - Link store to tenant properly

3. **Import errors**
   - Ensure all required apps are in INSTALLED_APPS
   - Check that models are properly imported

4. **Database errors**
   - Verify database connection
   - Ensure all migrations are applied
   - Check database permissions

### Debug Mode

Run with increased verbosity:
```bash
python manage.py populate_jewelry_data --verbosity 3
```

## 📈 Customization

### Adding More Products

Edit `backend/shared/management/commands/populate_jewelry_data.py`:
1. Add new products to `products_data` list
2. Follow the existing data structure
3. Ensure SKUs are unique
4. Set appropriate categories and pricing

### Adding More Categories

Edit the `create_categories` method:
1. Add main categories to `categories_data`
2. Add subcategories to respective lists
3. Update category descriptions and scope

### Modifying Pricing

Adjust the pricing in `products_data`:
- Update `cost_price`, `selling_price`, `discount_price`
- Maintain realistic profit margins
- Consider market rates for different jewelry types

## 🎨 Frontend Integration

After populating data, the frontend will display:
- **Product Catalog**: All created products with images and details
- **Category Navigation**: Hierarchical category structure
- **Search & Filter**: By category, price, material, etc.
- **Product Details**: Complete specifications and pricing
- **Inventory Status**: Stock availability and locations

## 🔄 Data Refresh

To refresh data:
```bash
# Clear existing and repopulate
python manage.py populate_jewelry_data --clear-existing

# Or manually clear specific models
python manage.py shell
>>> from apps.products.models import Product, Category
>>> Product.objects.all().delete()
>>> Category.objects.all().delete()
```

## 📞 Support

If you encounter issues:
1. Check the Django logs in `backend/logs/`
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Check Django version compatibility

## 🎯 Next Steps

After successful data population:
1. **Verify Data**: Check Django admin for created records
2. **Test Frontend**: Ensure products display correctly
3. **Customize**: Add your own products and categories
4. **Integrate**: Connect with inventory and sales systems

---

**Happy Jewelry CRM Management! 💎✨**
