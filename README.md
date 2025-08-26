# Jewellery CRM

A comprehensive Customer Relationship Management system designed specifically for jewellery businesses. Built with Next.js frontend and Django backend.

## 🚀 Features

- **Multi-role Access**: Platform Admin, Business Admin, Store Manager, Sales Team, Marketing Team, Tele-caller
- **Customer Management**: Complete customer lifecycle management
- **Sales Pipeline**: Track deals and opportunities
- **Product Management**: Inventory and catalog management
- **Analytics Dashboard**: Business insights and reporting
- **Modern UI**: Beautiful, responsive interface

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons
- **Shadcn/ui** - UI components

### Backend
- **Django 4.2** - Python web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database
- **JWT Authentication** - Secure authentication
- **Celery** - Background tasks

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.8+
- PostgreSQL (optional, SQLite for development)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd JulyCrm
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the setup script
python run_setup.py
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd jewellery-crm

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## 👥 Demo Users

The system comes with pre-configured demo users for testing:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `platform_admin` | `admin123` | Platform Admin | Manage entire CRM platform |
| `business_admin` | `business123` | Business Admin | Manage jewellery business |
| `store_manager` | `manager123` | Store Manager | Manage store operations |
| `sales_team` | `sales123` | Sales Team | Handle customers and sales |
| `marketing_team` | `marketing123` | Marketing Team | Manage campaigns |
| `telecaller` | `telecaller123` | Tele-caller | Handle customer calls |

## 🏗️ Project Structure

```
JulyCrm/
├── backend/                 # Django backend
│   ├── apps/               # Django apps
│   ├── core/               # Django settings
│   ├── setup_users.py      # User creation script
│   └── run_setup.py        # Setup script
├── jewellery-crm/          # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── package.json
└── README.md
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Frontend Development

```bash
cd jewellery-crm

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔐 Authentication

The application supports both backend authentication and demo mode:

- **Backend Mode**: Full authentication with Django backend
- **Demo Mode**: Fallback authentication for testing (no backend required)

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📊 API Endpoints

### Authentication
- `POST /api/users/auth/login/` - User login
- `POST /api/users/auth/logout/` - User logout
- `GET /api/users/auth/profile/` - Get user profile
- `POST /api/users/auth/refresh/` - Refresh token

### Customers
- `GET /api/clients/` - List customers
- `POST /api/clients/` - Create customer
- `GET /api/clients/{id}/` - Get customer details
- `PUT /api/clients/{id}/` - Update customer
- `DELETE /api/clients/{id}/` - Delete customer

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product

## 🎨 UI Components

The application uses a custom design system with:

- **Color Scheme**: Professional blue and purple theme
- **Typography**: Clean, readable fonts
- **Icons**: Lucide React icons
- **Components**: Shadcn/ui components
- **Responsive**: Mobile-first design

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- CSRF protection
- Input validation
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Backend Deployment

1. Set up a production server
2. Install Python and PostgreSQL
3. Configure environment variables
4. Run migrations
5. Collect static files
6. Set up Gunicorn and Nginx

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables
4. Set up custom domain (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure the backend server is running
4. Check the API endpoints are accessible

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Email integration
- [ ] SMS notifications
- [ ] Mobile app
- [ ] Multi-tenant support
- [ ] Advanced reporting
- [ ] Integration with payment gateways
- [ ] Inventory management
- [ ] Customer portal

---

**Built with ❤️ for the jewellery industry** 