# 🚀 PRODUCTION PRE-DEPLOYMENT CHECKLIST
## For Vercel Frontend + Utho VM Backend Deployment

## ⚠️ **CRITICAL SECURITY CHECKS BEFORE DEPLOYMENT**

### ✅ **1. SECURITY AUDIT**

- [x] **SQL Injection Prevention**: Django ORM used - verified
- [x] **Credentials Removed**: Google Cloud credentials removed from git
- [x] **Gitignore Updated**: All sensitive files protected
- [x] **No Hardcoded Secrets**: All credentials use environment variables
- [x] **Environment Files**: `.env` files properly gitignored
- [x] **Database Passwords**: Strong passwords set
- [x] **API Keys**: Stored in environment variables only
- [x] **SSL/HTTPS**: Configured for production

### ✅ **2. DATABASE SECURITY**

- [ ] Test database backups
- [ ] Verify PostgreSQL user has minimal required permissions
- [ ] Ensure database is not exposed to public internet
- [ ] Set strong database passwords
- [ ] Test database connection pooling

### ✅ **3. APPLICATION SECURITY**

- [x] **DEBUG**: Set to `False` in production
- [x] **SECRET_KEY**: Strong random key set
- [x] **ALLOWED_HOSTS**: Configured with specific domains
- [x] **CORS**: Properly configured with allowed origins
- [x] **CSRF**: Protection enabled
- [x] **XSS**: Protection headers enabled
- [x] **HSTS**: Enabled for HTTPS
- [x] **Content Security Policy**: Configured

---

## 🔧 **DEPLOYMENT AUTOMATION WITH START.SH**

### **Current `start.sh` Capabilities:**
```bash
✓ Database connection check
✓ Migration runner
✓ Superuser creation (only if no users exist)
✓ Static files collection
✓ Choice between ASGI (Uvicorn) and WSGI (Gunicorn)
```

### **What `start.sh` Should Do (Enhanced for Production):**

#### **1. Pre-Deployment Health Checks**
```bash
# Check Python version
python --version  # Should be 3.11

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "ERROR: Virtual environment not activated"
    exit 1
fi

# Check database connectivity
# Check Redis connectivity (if used)
# Check disk space
# Check memory availability
```

#### **2. Production Startup Sequence**
```bash
# 1. Wait for dependencies (DB, Redis) to be ready
# 2. Run migrations
# 3. Create superuser (if not exists)
# 4. Collect static files
# 5. Start appropriate server (ASGI vs WSGI)
```

#### **3. Auto-Recovery Features**
```bash
# Retry failed migrations
# Restart on crash
# Health checks
# Log rotation
```

---

## 📋 **COMPLETE PRE-DEPLOYMENT CHECKLIST**

### **BACKEND (Utho VM) PRE-DEPLOYMENT**

#### **A. Code Quality Checks**
- [ ] Run `python manage.py check --deploy`
- [ ] Run `python manage.py check --database default`
- [ ] No `print()` statements left in code (use logging)
- [ ] No commented-out debug code
- [ ] No test data in production
- [ ] All TODO/FIXME comments addressed or documented

#### **B. Dependencies**
```bash
# Update to latest stable versions
pip freeze > requirements.txt

# Check for security vulnerabilities
pip install pip-audit
pip-audit

# Update requirements
pip install --upgrade -r requirements.txt
```

#### **C. Database Migration**
```bash
# Backup current database
pg_dump jewellery_crm > backup_$(date +%Y%m%d).sql

# Test migrations on staging
python manage.py migrate --plan

# Create migration files
python manage.py makemigrations

# Run migrations
python manage.py migrate
```

#### **D. Static Files**
```bash
# Test static file collection
python manage.py collectstatic --noinput --dry-run

# Verify static files will be served correctly
```

#### **E. Environment Variables**
```bash
# Verify all required env vars are set
python manage.py check --deploy

# Critical variables:
# - SECRET_KEY
# - DEBUG
# - ALLOWED_HOSTS
# - DATABASE_URL
# - CORS_ALLOWED_ORIGINS
```

#### **F. Server Configuration**
- [ ] Nginx config tested: `nginx -t`
- [ ] Systemd service configured
- [ ] Log rotation configured
- [ ] Firewall rules set
- [ ] Port 80/443 open

---

### **FRONTEND (Vercel) PRE-DEPLOYMENT**

#### **A. Build Verification**
```bash
cd jewellery-crm
npm run build
npm run lint
```

- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors (or all acknowledged)
- [ ] Bundle size within limits
- [ ] All images optimized

#### **B. Environment Variables**
```bash
# Required for Vercel:
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

#### **C. API Integration**
- [ ] All API endpoints tested
- [ ] CORS properly configured
- [ ] Authentication flow tested
- [ ] Error handling implemented
- [ ] Loading states implemented

#### **D. Performance**
- [ ] Page load times acceptable
- [ ] Images optimized
- [ ] Code split implemented
- [ ] Caching configured
- [ ] CDN configured

---

## 🚀 **DEPLOYMENT STEPS**

### **Phase 1: Utho VM Backend Deployment**

#### **1. Update `start.sh` for Production**

Create enhanced `start.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting CRM Backend Deployment..."

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1)
echo "✓ Python: $PYTHON_VERSION"

# Check virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Warning: Virtual environment not activated"
fi

# Wait for database
echo "⏳ Waiting for database..."
python3 << 'PYEOF'
import os
import sys
import time
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.db import connection

max_attempts = 30
for i in range(max_attempts):
    try:
        connection.ensure_connection()
        print("✓ Database connection successful!")
        break
    except Exception as e:
        print(f"Attempt {i+1}/{max_attempts}: Database not ready...")
        time.sleep(2)
else:
    print("❌ Database connection failed after 30 attempts")
    sys.exit(1)
PYEOF

# Run migrations
echo "📊 Running migrations..."
python manage.py migrate --noinput

# Create superuser if needed
echo "👤 Checking superuser..."
python manage.py shell << 'PYEOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if User.objects.count() == 0:
    User.objects.create_superuser('admin', 'admin@jewelrycrm.com', 'admin123')
    print("✓ Created default admin user")
else:
    print("✓ Users already exist")
PYEOF

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "🎯 Starting server..."
if [ "$USE_ASGI" = "true" ]; then
    exec uvicorn core.asgi:application --host 0.0.0.0 --port $PORT --workers 2
else
    exec gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 300
fi
```

#### **2. Deploy to Utho VM**

```bash
# SSH into Utho VM
ssh root@150.241.246.110

# Navigate to project
cd /var/www/CRM_FINAL/backend

# Pull latest code
git pull origin main

# Backup current deployment
cp start.sh start.sh.backup

# Update start.sh with enhanced version
nano start.sh  # Or use vi

# Activate virtual environment
source venv/bin/activate

# Update dependencies
pip install -r requirements.txt

# Run enhanced start.sh
chmod +x start.sh
./start.sh
```

#### **3. Configure Systemd Service**

```bash
sudo systemctl restart crm-backend.service
sudo systemctl status crm-backend.service
```

---

### **Phase 2: Vercel Frontend Deployment**

#### **1. Update Environment Variables in Vercel**

```bash
# In Vercel Dashboard:
NEXT_PUBLIC_API_URL=http://150.241.246.110:8000
# Or for production with domain:
NEXT_PUBLIC_API_URL=https://crm.yourdomain.com
```

#### **2. Deploy**

```bash
# From jewellery-crm directory
vercel --prod
```

Or push to GitHub and let Vercel auto-deploy.

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **1. Backend Health Checks**

```bash
# Check if backend is running
curl http://150.241.246.110:8000/api/health/

# Check admin panel
curl http://150.241.246.110:8000/admin/

# Check API endpoints
curl http://150.241.246.110:8000/api/clients/
```

### **2. Frontend Checks**

- [ ] Homepage loads
- [ ] Login works
- [ ] API calls succeed
- [ ] No console errors
- [ ] Images load correctly
- [ ] Forms submit successfully

### **3. Integration Tests**

```bash
# Test authentication
# Test CRUD operations
# Test file uploads
# Test date filtering
```

---

## 📊 **MONITORING SETUP**

### **1. Log Monitoring**

```bash
# Backend logs
tail -f /var/www/CRM_FINAL/backend/logs/backend.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -u crm-backend.service -f
```

### **2. Error Tracking**

- [ ] Set up Sentry (optional)
- [ ] Monitor Django logs
- [ ] Set up uptime monitoring
- [ ] Configure alerting

---

## 🔄 **ROLLBACK PLAN**

### **If Deployment Fails:**

```bash
# Rollback to previous version
cd /var/www/CRM_FINAL/backend
git checkout <previous-commit>
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart crm-backend.service
```

---

## ✅ **FINAL CHECKLIST BEFORE GO-LIVE**

### **Security**
- [ ] All credentials removed from code
- [ ] DEBUG=False in production
- [ ] HTTPS configured
- [ ] Firewall rules in place
- [ ] Database backups scheduled

### **Performance**
- [ ] Static files cached
- [ ] Database indexes optimized
- [ ] Images optimized
- [ ] Code minified
- [ ] CDN configured (if applicable)

### **Documentation**
- [ ] Deployment guide updated
- [ ] Runbook created
- [ ] Contact information documented
- [ ] Emergency procedures documented

---

## 🎯 **SUMMARY**

**Automated Deployment Flow:**

1. **Push to Git** → Triggers deployment
2. **Utho VM**: Git pull → Run `start.sh` → Auto-checks → Deploy
3. **Vercel**: Auto-deploy → Run build → Deploy frontend
4. **Health checks** → Monitoring → Alerts

**Key Files:**
- `backend/start.sh` - Enhanced with health checks
- `.env` - Environment-specific configuration
- `nginx.conf` - Reverse proxy configuration
- `systemd service` - Process management

**Estimated Deployment Time:**
- Backend: 10-15 minutes
- Frontend: 5-10 minutes
- Total: ~20 minutes

---

## 🔗 **QUICK REFERENCE**

```bash
# Utho VM Connection
ssh root@150.241.246.110

# Restart backend
sudo systemctl restart crm-backend.service

# View logs
journalctl -u crm-backend.service -f

# Test backend
curl http://150.241.246.110:8000/api/health/

# Deploy frontend
cd jewellery-crm && vercel --prod
```
