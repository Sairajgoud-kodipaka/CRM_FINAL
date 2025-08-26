# CRM- Multi-Store Jewelry CRM System

A comprehensive Customer Relationship Management system designed specifically for jewelry businesses with multiple store locations. Built with Django (Backend) and Next.js (Frontend).

## 🚀 Quick Setup

### Prerequisites
- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### One-Click Setup

#### For Linux/Mac Users:
```bash
chmod +x setup.sh
./setup.sh
```

#### For Windows Users:
```cmd
setup.bat
```

## 📋 Manual Setup (if automated setup fails)

### Backend Setup (Django)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - **Linux/Mac:** `source venv/bin/activate`
   - **Windows:** `venv\Scripts\activate.bat`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env file with your database settings
   ```

6. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

### Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
   ```bash
   cd jewellery-crm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

## 🏃‍♂️ Running the Application

### Option 1: Use the generated scripts
- **Backend only:** `./run_backend.sh` (Linux/Mac) or `run_backend.bat` (Windows)
- **Frontend only:** `./run_frontend.sh` (Linux/Mac) or `run_frontend.bat` (Windows)
- **Both:** `./run_both.sh` (Linux/Mac) or `run_both.bat` (Windows)

### Option 2: Manual commands

#### Start Backend:
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate.bat  # Windows
python manage.py runserver 8000
```

#### Start Frontend:
```bash
cd jewellery-crm
npm run dev
```

## 🌐 Access URLs

- **Frontend Application:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Django Admin:** http://localhost:8000/admin

## 🔑 Default Credentials

- **Username:** admin
- **Password:** admin123

## 📁 Project Structure

```
JulyCrm/
├── backend/                 # Django Backend
│   ├── apps/               # Django Apps
│   │   ├── products/       # Product Management
│   │   ├── clients/        # Customer Management
│   │   ├── sales/          # Sales & Orders
│   │   ├── stores/         # Store Management
│   │   └── users/          # User Management
│   ├── core/               # Django Settings
│   └── manage.py
├── jewellery-crm/          # Next.js Frontend
│   ├── src/
│   │   ├── app/           # Pages & Routes
│   │   ├── components/    # React Components
│   │   └── lib/           # Utilities & API
│   └── package.json
├── setup.sh               # Linux/Mac Setup Script
├── setup.bat              # Windows Setup Script
└── README_SETUP.md        # This file
```

## 🎯 Key Features

### Multi-Store Management
- **Store-specific product catalogs**
- **Global catalogue aggregation**
- **Inter-store stock transfers**
- **Scoped visibility based on user roles**

### Product Management
- **Product creation and editing**
- **Category management**
- **Inventory tracking**
- **Stock transfer system**

### User Roles & Permissions
- **Business Admin:** Full access to all stores
- **Store Manager:** Access to assigned store
- **In-house Sales:** Limited to store-specific data
- **Telecaller:** Customer interaction tools

### Stock Transfer System
- **Request transfers between stores**
- **Approval workflow**
- **Transfer tracking**
- **Global catalogue access**

## 🔧 Configuration

### Backend Environment (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   - Backend: Change port in `run_backend.sh` or use `python manage.py runserver 8001`
   - Frontend: Change port in `package.json` or use `npm run dev -- -p 3001`

2. **Database connection issues:**
   - Check your `.env` file configuration
   - Ensure database is running
   - Run `python manage.py migrate` again

3. **Node modules issues:**
   ```bash
   cd jewellery-crm
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Python virtual environment issues:**
   ```bash
   cd backend
   rm -rf venv
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate.bat on Windows
   pip install -r requirements.txt
   ```

### Getting Help

1. **Check the logs** in the terminal where you're running the servers
2. **Verify all prerequisites** are installed correctly
3. **Ensure all environment variables** are set properly
4. **Check file permissions** (especially on Linux/Mac)

## 📚 Additional Resources

- **Django Documentation:** https://docs.djangoproject.com/
- **Next.js Documentation:** https://nextjs.org/docs
- **React Documentation:** https://react.dev/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🎉**

For support, please check the troubleshooting section or create an issue in the repository. 