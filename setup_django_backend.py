#!/usr/bin/env python3
"""
Simple Django Backend Setup for Existing Next.js Jewellery CRM
This script installs Django and creates the backend structure
"""

import os
import subprocess
import sys
import shutil

def run_command(command, description, cwd=None):
    """Run a shell command with error handling"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, cwd=cwd)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def install_django():
    """Install Django and required packages"""
    
    # Install Django and required packages
    packages = [
        "Django==5.0",
        "djangorestframework==3.14.0",
        "django-cors-headers==4.3.1",
        "django-filter==23.5",
        "psycopg2-binary==2.9.7",
        "prisma==0.12.0",
        "djangorestframework-simplejwt==5.3.0",
        "python-decouple==3.8",
        "Pillow==10.0.1",
    ]
    
    for package in packages:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            return False
    
    return True

def create_backend_structure():
    """Create the backend directory structure"""
    
    # Navigate to jewellery-crm directory
    if not os.path.exists("jewellery-crm"):
        print("❌ jewellery-crm directory not found")
        return False
    
    os.chdir("jewellery-crm")
    
    # Create backend directory
    if not os.path.exists("backend"):
        os.makedirs("backend")
    
    # Create Django project
    if not run_command("django-admin startproject django_backend backend", "Creating Django project"):
        return False
    
    # Create Django apps
    apps = [
        "tenants",      # Multi-tenancy
        "customers",    # Customer management
        "sales",        # Sales pipeline
        "appointments", # Appointment system
        "products",     # Product catalog
        "ecommerce",    # Online store
        "analytics",    # Dashboard & reports
        "auth_custom",  # Custom authentication
    ]
    
    for app in apps:
        if not run_command(f"python backend/manage.py startapp {app}", f"Creating {app} app"):
            return False
    
    return True

def create_prisma_schema():
    """Create Prisma schema for Django backend"""
    
    # Create Prisma directory
    os.makedirs("backend/prisma", exist_ok=True)
    
    # Create .env file for Prisma
    env_content = '''# Database URL for Prisma
DATABASE_URL="postgresql://postgres:password@localhost:5432/jewellery_crm"

# Django settings
DJANGO_SECRET_KEY=your-django-secret-key-here
DEBUG=True
'''
    
    with open("backend/.env", "w") as f:
        f.write(env_content)
    
    # Create Prisma schema
    schema_content = '''// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-py"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Multi-tenant setup
model Tenant {
  id          String   @id @default(cuid())
  name        String
  subdomain   String   @unique
  schemaName  String   @unique @map("schema_name")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Tenant-specific data
  users       User[]
  stores      Store[]
  customers   Customer[]
  products    Product[]
  orders      Order[]
  appointments Appointment[]
  
  @@map("tenants")
}

// User management with roles
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  firstName   String   @map("first_name")
  lastName    String   @map("last_name")
  phone       String?
  password    String
  role        UserRole
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Multi-tenant relationship
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // User relationships
  storeId     String?  @map("store_id")
  store       Store?   @relation(fields: [storeId], references: [id])
  
  // User activities
  customers   Customer[]
  appointments Appointment[]
  orders      Order[]
  
  @@map("users")
}

enum UserRole {
  PLATFORM_ADMIN
  BUSINESS_ADMIN
  STORE_MANAGER
  SALES_TEAM
}

// Store management
model Store {
  id          String   @id @default(cuid())
  name        String
  address     String
  phone       String
  email       String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Multi-tenant relationship
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Store relationships
  users        User[]
  customers   Customer[]
  products    Product[]
  orders      Order[]
  
  @@map("stores")
}

// Customer management with jewellery-specific fields
model Customer {
  id          String   @id @default(cuid())
  firstName   String   @map("first_name")
  lastName    String   @map("last_name")
  email       String?
  phone       String
  address     String?
  city        String?
  state       String?
  pincode     String?
  
  // Jewellery preferences
  preferredMetal    MetalType?    @map("preferred_metal")
  stylePreference   StyleType?    @map("style_preference")
  occasion         OccasionType?
  budgetRange      BudgetRange?   @map("budget_range")
  
  // Business info
  gstNumber        String?        @map("gst_number")
  businessName     String?        @map("business_name")
  
  // Customer status
  isActive         Boolean        @default(true) @map("is_active")
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  
  // Multi-tenant relationship
  tenantId         String         @map("tenant_id")
  tenant           Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Store relationship
  storeId          String?        @map("store_id")
  store            Store?         @relation(fields: [storeId], references: [id])
  
  // Sales relationship
  assignedToId     String?        @map("assigned_to_id")
  assignedTo       User?          @relation(fields: [assignedToId], references: [id])
  
  // Customer relationships
  appointments     Appointment[]
  orders          Order[]
  leads           Lead[]
  
  @@map("customers")
}

enum MetalType {
  GOLD
  SILVER
  PLATINUM
  DIAMOND
  PEARL
  GEMSTONE
}

enum StyleType {
  TRADITIONAL
  MODERN
  FUSION
  CONTEMPORARY
  VINTAGE
}

enum OccasionType {
  WEDDING
  ANNIVERSARY
  FESTIVAL
  BIRTHDAY
  GIFT
  PERSONAL
}

enum BudgetRange {
  UNDER_10K
  TEN_TO_25K
  TWENTYFIVE_TO_50K
  FIFTY_TO_1L
  ONE_TO_2L
  ABOVE_2L
}

// Sales pipeline
model Lead {
  id          String   @id @default(cuid())
  title       String
  description String?
  amount      Decimal?
  
  // Lead status
  status      LeadStatus
  priority    Priority
  source      LeadSource
  
  // Lead details
  expectedCloseDate DateTime? @map("expected_close_date")
  notes       String?
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relationships
  customerId  String   @map("customer_id")
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  assignedToId String? @map("assigned_to_id")
  assignedTo   User?   @relation(fields: [assignedToId], references: [id])
  
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@map("leads")
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL
  NEGOTIATION
  CLOSED_WON
  CLOSED_LOST
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum LeadSource {
  WEBSITE
  REFERRAL
  SOCIAL_MEDIA
  WALK_IN
  PHONE
  WHATSAPP
  OTHER
}

// Appointment system
model Appointment {
  id          String   @id @default(cuid())
  title       String
  description String?
  
  // Appointment details
  startTime   DateTime @map("start_time")
  endTime     DateTime @map("end_time")
  type        AppointmentType
  status      AppointmentStatus
  
  // Location
  location    String?
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relationships
  customerId  String   @map("customer_id")
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  assignedToId String? @map("assigned_to_id")
  assignedTo   User?   @relation(fields: [assignedToId], references: [id])
  
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@map("appointments")
}

enum AppointmentType {
  CONSULTATION
  FITTING
  DELIVERY
  FOLLOW_UP
  OTHER
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

// Product catalog
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  sku         String   @unique
  
  // Product details
  category    String
  subcategory String?
  metalType   MetalType? @map("metal_type")
  weight      Decimal?
  purity      String?  // 14k, 18k, 22k, etc.
  
  // Pricing
  costPrice   Decimal  @map("cost_price")
  sellingPrice Decimal @map("selling_price")
  
  // Inventory
  stockQuantity Int    @default(0) @map("stock_quantity")
  minStockLevel Int    @default(0) @map("min_stock_level")
  
  // Product status
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relationships
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  storeId     String?  @map("store_id")
  store       Store?   @relation(fields: [storeId], references: [id])
  
  // Product relationships
  orderItems  OrderItem[]
  
  @@map("products")
}

// Order management
model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique @map("order_number")
  
  // Order details
  orderDate   DateTime @default(now()) @map("order_date")
  deliveryDate DateTime? @map("delivery_date")
  
  // Pricing
  subtotal    Decimal
  tax         Decimal
  discount    Decimal @default(0)
  total       Decimal
  
  // Order status
  status      OrderStatus
  paymentStatus PaymentStatus @map("payment_status")
  
  // Customer info
  customerName String @map("customer_name")
  customerPhone String @map("customer_phone")
  customerEmail String? @map("customer_email")
  deliveryAddress String? @map("delivery_address")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relationships
  customerId  String?  @map("customer_id")
  customer    Customer? @relation(fields: [customerId], references: [id])
  
  assignedToId String? @map("assigned_to_id")
  assignedTo   User?   @relation(fields: [assignedToId], references: [id])
  
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  storeId     String?  @map("store_id")
  store       Store?   @relation(fields: [storeId], references: [id])
  
  // Order relationships
  items       OrderItem[]
  
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  quantity    Int
  unitPrice   Decimal  @map("unit_price")
  totalPrice  Decimal  @map("total_price")
  
  // Relationships
  orderId     String   @map("order_id")
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId   String   @map("product_id")
  product     Product  @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  READY_FOR_DELIVERY
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
  REFUNDED
}
'''
    
    with open("backend/prisma/schema.prisma", "w") as f:
        f.write(schema_content)
    
    print("✅ Prisma schema created successfully")
    return True

def create_django_settings():
    """Create Django settings with API configuration"""
    
    settings_content = '''"""
Django settings for django_backend project.
"""

import os
from pathlib import Path
from prisma import Prisma

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'tenants',
    'customers',
    'sales',
    'appointments',
    'products',
    'ecommerce',
    'analytics',
    'auth_custom',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'django_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_backend.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'jewellery_crm'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# CORS settings for Next.js frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

CORS_ALLOW_CREDENTIALS = True

# Prisma client
prisma = Prisma()

# Custom user model
AUTH_USER_MODEL = 'auth_custom.User'

# Login/Logout URLs
LOGIN_URL = '/auth/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/auth/login/'

# Email settings (for development)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Multi-tenancy settings
TENANT_MODEL = 'tenants.Tenant'

# API Versioning
API_VERSION = 'v1'
'''
    
    with open("backend/django_backend/settings.py", "w") as f:
        f.write(settings_content)
    
    print("✅ Django settings created successfully")
    return True

def create_api_urls():
    """Create API URL configuration"""
    
    urls_content = '''"""
URL configuration for django_backend project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('tenants.urls')),
    path('api/v1/', include('customers.urls')),
    path('api/v1/', include('sales.urls')),
    path('api/v1/', include('appointments.urls')),
    path('api/v1/', include('products.urls')),
    path('api/v1/', include('ecommerce.urls')),
    path('api/v1/', include('analytics.urls')),
    path('api/v1/', include('auth_custom.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
'''
    
    with open("backend/django_backend/urls.py", "w") as f:
        f.write(urls_content)
    
    print("✅ API URLs created successfully")
    return True

def create_requirements():
    """Create requirements.txt file for Django backend"""
    
    requirements_content = '''# Django
Django==5.0
djangorestframework==3.14.0
django-cors-headers==4.3.1
django-filter==23.5

# Database
psycopg2-binary==2.9.7
prisma==0.12.0

# Authentication
djangorestframework-simplejwt==5.3.0

# Utilities
python-decouple==3.8
Pillow==10.0.1

# Development
django-debug-toolbar==4.2.0
'''
    
    with open("backend/requirements.txt", "w") as f:
        f.write(requirements_content)
    
    print("✅ Requirements.txt created successfully")
    return True

def create_nextjs_integration():
    """Create Next.js integration files"""
    
    # Create API service for Next.js
    api_service_content = '''// Next.js API service for Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout/', {
      method: 'POST',
    });
  }

  // Customer methods
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers/?${queryString}`);
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}/`);
  }

  async createCustomer(data) {
    return this.request('/customers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id, data) {
    return this.request(`/customers/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}/`, {
      method: 'DELETE',
    });
  }

  // Sales pipeline methods
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/sales/leads/?${queryString}`);
  }

  async createLead(data) {
    return this.request('/sales/leads/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Appointments methods
  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/appointments/?${queryString}`);
  }

  async createAppointment(data) {
    return this.request('/appointments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Products methods
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products/?${queryString}`);
  }

  async createProduct(data) {
    return this.request('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Analytics methods
  async getDashboardMetrics() {
    return this.request('/analytics/dashboard/');
  }

  async getSalesMetrics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/sales/?${queryString}`);
  }
}

export const apiService = new ApiService();
'''
    
    with open("src/lib/api-service.ts", "w") as f:
        f.write(api_service_content)
    
    # Create environment variables
    env_content = '''# Django Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Database (shared between Django and Next.js)
DATABASE_URL="postgresql://postgres:password@localhost:5432/jewellery_crm"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Django
DJANGO_SECRET_KEY=your-django-secret-key
'''
    
    with open(".env.local", "w") as f:
        f.write(env_content)
    
    print("✅ Next.js integration files created successfully")
    return True

def update_package_json():
    """Update package.json with Django scripts"""
    
    # Read existing package.json
    with open("package.json", "r") as f:
        package_data = f.read()
    
    # Add Django scripts
    package_data = package_data.replace(
        '"scripts": {',
        '''"scripts": {
    "dev:backend": "cd backend && python manage.py runserver 8000",
    "dev:frontend": "next dev --turbopack",
    "dev": "concurrently \\"npm run dev:backend\\" \\"npm run dev:frontend\\"",
    "build:backend": "cd backend && python manage.py collectstatic --noinput",
    "migrate": "cd backend && python manage.py migrate",
    "makemigrations": "cd backend && python manage.py makemigrations",
    "createsuperuser": "cd backend && python manage.py createsuperuser",
    "shell": "cd backend && python manage.py shell",
    "test:backend": "cd backend && python manage.py test",
    "prisma:generate": "cd backend && prisma generate",
    "prisma:migrate": "cd backend && prisma migrate dev",
    "prisma:studio": "cd backend && prisma studio",'''
    )
    
    # Add development dependencies
    package_data = package_data.replace(
        '"devDependencies": {',
        '''"devDependencies": {
    "concurrently": "^8.2.2",'''
    )
    
    with open("package.json", "w") as f:
        f.write(package_data)
    
    print("✅ Package.json updated with Django scripts")
    return True

def main():
    """Main setup function"""
    
    print("🚀 Setting up Django Backend for Existing Next.js Jewellery CRM")
    print("=" * 70)
    
    # Step 1: Install Django and dependencies
    if not install_django():
        print("❌ Failed to install Django")
        return
    
    # Step 2: Create backend structure
    if not create_backend_structure():
        print("❌ Failed to create backend structure")
        return
    
    # Step 3: Create Prisma schema
    if not create_prisma_schema():
        print("❌ Failed to create Prisma schema")
        return
    
    # Step 4: Create Django settings
    if not create_django_settings():
        print("❌ Failed to create Django settings")
        return
    
    # Step 5: Create API URLs
    if not create_api_urls():
        print("❌ Failed to create API URLs")
        return
    
    # Step 6: Create requirements
    if not create_requirements():
        print("❌ Failed to create requirements")
        return
    
    # Step 7: Create Next.js integration
    if not create_nextjs_integration():
        print("❌ Failed to create Next.js integration")
        return
    
    # Step 8: Update package.json
    if not update_package_json():
        print("❌ Failed to update package.json")
        return
    
    print("\n🎉 Django Backend Setup Completed Successfully!")
    print("\n📁 Project Structure:")
    print("jewellery-crm/")
    print("├── src/                    # Next.js frontend")
    print("│   ├── app/")
    print("│   ├── components/")
    print("│   └── lib/api-service.ts  # API integration")
    print("├── backend/                 # Django backend")
    print("│   ├── django_backend/")
    print("│   ├── tenants/")
    print("│   ├── customers/")
    print("│   ├── sales/")
    print("│   ├── appointments/")
    print("│   ├── products/")
    print("│   ├── ecommerce/")
    print("│   ├── analytics/")
    print("│   ├── auth_custom/")
    print("│   ├── prisma/")
    print("│   └── requirements.txt")
    print("├── package.json            # Updated with Django scripts")
    print("└── .env.local              # Environment variables")
    
    print("\n🚀 Next Steps:")
    print("1. Set up your database and update .env.local")
    print("2. Run Prisma migrations: npm run prisma:migrate")
    print("3. Run Django migrations: npm run migrate")
    print("4. Create superuser: npm run createsuperuser")
    print("5. Start both servers: npm run dev")
    print("6. Access Next.js frontend: http://localhost:3000")
    print("7. Access Django admin: http://localhost:8000/admin")
    print("8. Access Django API: http://localhost:8000/api/v1/")

if __name__ == "__main__":
    main() 
 
 