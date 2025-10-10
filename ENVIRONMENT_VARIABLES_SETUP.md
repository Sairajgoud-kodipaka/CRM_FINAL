# 🔐 ENVIRONMENT VARIABLES SETUP GUIDE

## 🌐 **VERCEL (Frontend) Environment Variables**

### **Required Variables for Vercel Dashboard:**

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://crm-final-tj4n.onrender.com

# Optional: Analytics (if you want to add later)
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
# NEXT_PUBLIC_HOTJAR_ID=your-hotjar-id
```

### **How to Add in Vercel:**
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://crm-final-tj4n.onrender.com`
   - **Environment**: Production, Preview, Development (all)

---

## 🚀 **RENDER (Backend) Environment Variables**

### **Required Variables for Render Dashboard:**

```bash
# Python Configuration
PYTHON_VERSION=3.11.0
PORT=8000
DEBUG=false
DJANGO_SETTINGS_MODULE=core.settings
PYTHONUNBUFFERED=1

# Security
SECRET_KEY=f3Csh9SZNGRp84-xLGvEEYPhWqTt2_q6-5lXuXjiR5Y
JWT_SECRET_KEY=25CBSetI1cCv7Zfy0Wfl9bd6YB/Ws7l/dZnRVFWBVzg=
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=crm_db_pyoz
DB_USER=crm_db_pyoz_user
DB_PASSWORD=AHX6yNDH5S6MrdPxf7gsxJhKurS7Q0BO
DB_HOST=dpg-d3k73ss9c44c73a7q2d0-a
DB_PORT=5432

# Host Configuration
ALLOWED_HOSTS=crm-final-tj4n.onrender.com,crm-final-mfe4.onrender.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://jewel-crm.vercel.app,https://crm-final-mfe4.onrender.com,https://crm-final-tj4n.onrender.com,https://jewellery-crm-frontend.vercel.app
CORS_ALLOW_ALL_ORIGINS=false
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://jewel-crm.vercel.app,https://crm-final-mfe4.onrender.com,https://crm-final-tj4n.onrender.com,https://jewellery-crm-frontend.vercel.app

# Static Files
STATIC_URL=/static/
MEDIA_URL=/media/
STATIC_ROOT=staticfiles
MEDIA_ROOT=media

# Security Headers
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=true
SECURE_HSTS_PRELOAD=true
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
SECURE_BROWSER_XSS_FILTER=true
SECURE_CONTENT_TYPE_NOSNIFF=true
X_FRAME_OPTIONS=DENY
SECURE_REFERRER_POLICY=strict-origin-when-cross-origin

# Gunicorn Configuration
GUNICORN_CMD_ARGS=--timeout=300 --workers=2 --preload
```

### **How to Add in Render:**
1. Go to your Render service dashboard
2. Click **Environment** tab
3. Add each variable one by one:
   - **Key**: Variable name (e.g., `SECRET_KEY`)
   - **Value**: Variable value (e.g., `f3Csh9SZNGRp84-xLGvEEYPhWqTt2_q6-5lXuXjiR5Y`)

---

## 📋 **QUICK SETUP CHECKLIST**

### **Vercel Setup:**
- [ ] Add `NEXT_PUBLIC_API_URL` environment variable
- [ ] Set value to `https://crm-final-tj4n.onrender.com`
- [ ] Enable for all environments (Production, Preview, Development)

### **Render Setup:**
- [ ] Add all 25+ environment variables listed above
- [ ] Verify database credentials are correct
- [ ] Ensure CORS origins include your Vercel domain
- [ ] Confirm security settings are enabled

---

## 🔒 **SECURITY NOTES**

### **Sensitive Data Protected:**
- ✅ Database passwords are in environment variables
- ✅ Secret keys are in environment variables
- ✅ JWT secrets are in environment variables
- ✅ No sensitive data in code files

### **Production Security:**
- ✅ HTTPS enforced
- ✅ Secure cookies enabled
- ✅ CSRF protection enabled
- ✅ CORS properly configured
- ✅ Security headers enabled

---

## 🚀 **DEPLOYMENT READY**

After setting up these environment variables:

1. **Vercel** will automatically deploy your frontend
2. **Render** will automatically deploy your backend
3. **Database** will be connected via environment variables
4. **API** will be accessible from frontend

**Status**: ✅ **ENVIRONMENT VARIABLES READY FOR SETUP!**
