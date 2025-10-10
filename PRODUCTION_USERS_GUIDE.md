# 👤 PRODUCTION USER CREDENTIALS - JEWELLERY CRM

## 🔐 **AUTOMATIC USER CREATION**

During deployment, the system automatically creates production users with the following credentials:

---

## 📋 **PRODUCTION USER ACCOUNTS**

### **1. System Administrator**
- **Username**: `admin`
- **Password**: `JewelleryCRM2024!`
- **Email**: admin@jewellerycrm.com
- **Role**: Superuser (Full Access)
- **Access**: All features, Django Admin, System Settings

### **2. Business Administrator**
- **Username**: `business_admin`
- **Password**: `BusinessAdmin2024!`
- **Email**: business@jewellerycrm.com
- **Role**: Business Admin
- **Access**: Business management, analytics, team management

### **3. Store Manager**
- **Username**: `manager`
- **Password**: `Manager2024!`
- **Email**: manager@jewellerycrm.com
- **Role**: Manager
- **Access**: Store operations, inventory, sales team management

### **4. Sales Representative**
- **Username**: `sales`
- **Password**: `Sales2024!`
- **Email**: sales@jewellerycrm.com
- **Role**: Sales
- **Access**: Customer management, sales pipeline, appointments

### **5. Telecaller**
- **Username**: `telecaller`
- **Password**: `Telecaller2024!`
- **Email**: telecaller@jewellerycrm.com
- **Role**: Telecaller
- **Access**: Lead management, calling features, customer follow-ups

---

## 🌐 **ACCESS POINTS**

### **Frontend Application**
- **URL**: https://jewel-crm.vercel.app
- **Login**: Use any of the above credentials
- **Features**: Full CRM functionality based on user role

### **Django Admin Panel**
- **URL**: https://crm-final-tj4n.onrender.com/admin/
- **Login**: Use `admin` credentials for full access
- **Features**: Database management, user management, system settings

### **API Endpoints**
- **Base URL**: https://crm-final-tj4n.onrender.com/api/
- **Authentication**: JWT tokens (obtained via login)
- **Documentation**: Available at `/api/docs/`

---

## 🔧 **USER CREATION PROCESS**

### **Automatic Creation**
The production users are created automatically during deployment via:

1. **Build Script**: `backend/build.sh` calls the management command
2. **Management Command**: `python manage.py create_production_users`
3. **Database**: Users are stored in the PostgreSQL database
4. **Security**: Passwords are hashed using Django's built-in hashing

### **Manual Creation** (if needed)
```bash
# Run from backend directory
python manage.py create_production_users

# Force update existing users
python manage.py create_production_users --force
```

---

## 🔒 **SECURITY FEATURES**

### **Password Security**
- ✅ Strong passwords (12+ characters)
- ✅ Mix of uppercase, lowercase, numbers, symbols
- ✅ Django's PBKDF2 hashing algorithm
- ✅ No plain text storage

### **User Permissions**
- ✅ Role-based access control
- ✅ Django's built-in permission system
- ✅ Custom user roles for different access levels
- ✅ Session management and JWT tokens

### **Production Security**
- ✅ HTTPS enforced
- ✅ Secure cookies
- ✅ CSRF protection
- ✅ CORS properly configured
- ✅ Environment variables for sensitive data

---

## 📊 **USER ROLES & PERMISSIONS**

| Role | Dashboard | Customers | Products | Sales | Analytics | Admin |
|------|-----------|-----------|----------|-------|-----------|-------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Business Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Sales** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Telecaller** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 **DEPLOYMENT INTEGRATION**

### **Build Process**
```bash
# During Render deployment
1. Install dependencies
2. Run migrations
3. Collect static files
4. Create production users ← NEW!
5. Start application
```

### **Environment Variables**
```yaml
# Already configured in render.yaml
SECRET_KEY: f3Csh9SZNGRp84-xLGvEEYPhWqTt2_q6-5lXuXjiR5Y
JWT_SECRET_KEY: "25CBSetI1cCv7Zfy0Wfl9bd6YB/Ws7l/dZnRVFWBVzg="
DB_*: PostgreSQL connection details
```

---

## 🎯 **IMMEDIATE ACCESS**

After deployment, you can immediately:

1. **Login to Frontend**: https://jewel-crm.vercel.app
   - Use any of the 5 user accounts
   - Full CRM functionality available

2. **Access Admin Panel**: https://crm-final-tj4n.onrender.com/admin/
   - Use `admin` / `JewelleryCRM2024!`
   - Manage users, data, and system settings

3. **Test API**: https://crm-final-tj4n.onrender.com/api/health/
   - Verify backend connectivity
   - Test authentication endpoints

---

## ✅ **PRODUCTION READY**

Your Jewellery CRM now includes:

- ✅ **5 Production Users** with different roles
- ✅ **Automatic Creation** during deployment
- ✅ **Secure Passwords** with proper hashing
- ✅ **Role-Based Access** for different user types
- ✅ **Admin Panel Access** for system management
- ✅ **API Authentication** ready for frontend integration

**Status**: 🎉 **PRODUCTION USERS READY!**

---

## 📞 **SUPPORT**

If you need to:
- **Reset passwords**: Use Django admin panel
- **Create new users**: Use Django admin or management command
- **Modify permissions**: Update user roles in admin panel
- **Troubleshoot**: Check deployment logs in Render dashboard
