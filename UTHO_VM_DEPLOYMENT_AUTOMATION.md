# 🚀 Utho VM Deployment Automation Guide

## Overview

This guide automates the Utho VM backend deployment using enhanced `start.sh` script while following the manual deployment process documented in `UTHO_VM_BACKEND_DEPLOYMENT.md`.

## 🎯 What's Different from Render?

### ✅ **Utho VM Deployment:**
- Uses **systemd** for process management
- Uses **Nginx** as reverse proxy
- Runs **local PostgreSQL and Redis**
- No Docker required
- **Manual deployment process** (NOT auto-deploy like Render)

### ❌ **NOT Like Render:**
- NO auto-deploy from Git push
- NO build scripts that run on every deploy
- NO Render-specific environment variables
- NO cloud database (uses local PostgreSQL)

---

## 🔧 Enhanced `start.sh` Features

The updated `start.sh` now:

### 1. **Pre-Deployment Checks**
- ✅ Verifies Python version (3.11)
- ✅ Checks for `.env` file existence
- ✅ Database connection retry (30 attempts, 2s intervals)
- ✅ Creates necessary directories

### 2. **Deployment Steps**
- ✅ Runs database migrations
- ✅ Creates superuser (only if no users exist)
- ✅ Collects static files
- ✅ Starts Uvicorn server on port 8000

### 3. **Utho VM Specifics**
- ✅ Uses `python3` explicitly
- ✅ Defaults to port 8000 (not $PORT variable)
- ✅ Uses ASGI (Uvicorn) for WebSocket support
- ✅ Runs 2 workers
- ✅ Better logging with emojis for clarity

---

## 📋 Deployment Process (Following Manual Guide)

### **Phase 1-3: VM Setup (Already Done)** ✅

You've already completed:
- ✅ VM connection and system updates
- ✅ Core dependencies (PostgreSQL, Redis, Python 3.11, Nginx)
- ✅ Code transfer and permissions

### **Phase 4: Backend Setup (Continue Manual Process)**

#### 4.1 Navigate to Backend Directory
```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
```

#### 4.2 Update `start.sh` with Enhanced Version
The enhanced `start.sh` is now updated. No action needed.

#### 4.3 Make `start.sh` Executable
```bash
chmod +x start.sh
```

#### 4.4 Test the Enhanced `start.sh`
```bash
# This will run the entire deployment sequence
./start.sh
```

The script will automatically:
1. Check Python version
2. Verify `.env` file exists
3. Wait for database connection (with retries)
4. Run migrations
5. Create superuser (if needed)
6. Collect static files
7. Start Uvicorn server

---

## 🔄 **Automated Deployment Flow**

### **Manual Process (What You Do):**
```bash
# 1. SSH into Utho VM
ssh root@150.241.246.110

# 2. Navigate to project
cd /var/www/CRM_FINAL
git pull origin main

# 3. Navigate to backend
cd backend
source venv/bin/activate

# 4. Update dependencies (if needed)
pip install -r requirements.txt

# 5. Run the enhanced start.sh
./start.sh
```

### **What `start.sh` Does Automatically:**
```
🚀 Starting Jewellery CRM Backend on Utho VM...
✓ Python Version: Python 3.11.14
✓ Environment file found
⏳ Checking database connection...
✓ Database connection successful!
📊 Running database migrations...
👤 Checking if any users exist...
✅ Found X existing users - preserving all data
📦 Collecting static files...
✓ Created necessary directories
🎯 Starting application server...
🚀 Starting Uvicorn (ASGI) server on port 8000...
```

---

## 🏗️ **Systemd Service Integration**

### **Current systemd Service (From UTHO_VM_BACKEND_DEPLOYMENT.md):**

```bash
[Service]
ExecStart=/var/www/CRM_FINAL/backend/venv/bin/uvicorn core.asgi:application \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --proxy-headers
```

### **Option 1: Use Enhanced `start.sh` (Recommended)**

Update systemd service to use `start.sh`:

```bash
sudo nano /etc/systemd/system/crm-backend.service
```

Change `ExecStart` to:
```ini
ExecStart=/var/www/CRM_FINAL/backend/start.sh
WorkingDirectory=/var/www/CRM_FINAL/backend
```

### **Option 2: Keep Direct Uvicorn Start**

Keep the current systemd configuration if you prefer direct Uvicorn execution.

---

## 🔄 **Deployment Workflow**

### **Initial Deployment (First Time):**
```bash
# 1. Follow UTHO_VM_BACKEND_DEPLOYMENT.md Phases 1-3
# 2. For Phase 4, use enhanced start.sh
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
./start.sh  # This will do everything automatically
```

### **Future Updates (Subsequent Deployments):**
```bash
# 1. SSH and pull latest code
ssh root@150.241.246.110
cd /var/www/CRM_FINAL
git pull origin main

# 2. Restart service (uses start.sh if configured)
sudo systemctl restart crm-backend.service

# OR run start.sh manually
cd backend
source venv/bin/activate
./start.sh
```

---

## ✅ **Benefits of Enhanced `start.sh`**

### **Before (Basic):**
- Simple database check
- Basic error handling
- Manual port management

### **After (Enhanced):**
- ✅ **Robust database connection** (30 retry attempts)
- ✅ **Better error messages** (emojis and clear feedback)
- ✅ **Pre-flight checks** (Python version, .env file)
- ✅ **Automatic directory creation**
- ✅ **Better logging** (clear progress indicators)
- ✅ **Utho VM optimized** (python3, port 8000, Uvicorn)

---

## 🧪 **Testing the Enhanced start.sh**

### **Test Database Connection Retry:**
```bash
# Temporarily stop PostgreSQL
sudo systemctl stop postgresql

# Run start.sh - it will retry 30 times
./start.sh
# You should see: "Attempt 1/30: Waiting for database..."

# Start PostgreSQL
sudo systemctl start postgresql
# start.sh should now connect successfully
```

### **Test Superuser Creation:**
```bash
# Delete all users (CAUTION!)
python3 manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.all().delete()

# Run start.sh - it should create admin user
./start.sh
# You should see: "✅ Created initial admin user: admin/admin123"
```

---

## 📊 **Comparison: Manual vs Automated**

| Step | Manual Process | Automated (start.sh) |
|------|---------------|---------------------|
| Check DB | Manual testing | ✅ Auto-retry 30 times |
| Migrations | `python manage.py migrate` | ✅ Auto-runs |
| Superuser | Manual creation | ✅ Auto-creates if needed |
| Static files | `collectstatic` | ✅ Auto-runs |
| Server start | Manual uvicorn | ✅ Auto-starts |
| Error handling | Manual debugging | ✅ Clear error messages |

---

## 🚨 **Important Notes**

1. **Manual Deployment**: Unlike Render, this is NOT automatic. You must SSH and run commands manually.

2. **Git Pull**: Always pull latest code before running `start.sh`:
   ```bash
   git pull origin main
   ```

3. **Virtual Environment**: Always activate venv before running `start.sh`:
   ```bash
   source venv/bin/activate
   ```

4. **Systemd Service**: Configure systemd service to use `start.sh` for automatic restarts.

5. **Logs**: Check logs if something fails:
   ```bash
   journalctl -u crm-backend.service -f
   ```

---

## 🎯 **Next Steps for Your Deployment**

Based on your progress in `DEPLOYMENT_PROGRESS_TRACKER.md`:

### **You've Completed:**
- ✅ Phase 1-3: VM setup, dependencies, code transfer
- ✅ Phase 4.1-4.7: Backend setup

### **Next Steps (Phase 5):**
1. Test the enhanced `start.sh`:
   ```bash
   cd /var/www/CRM_FINAL/backend
   source venv/bin/activate
   ./start.sh
   ```

2. Configure systemd service to use `start.sh`:
   ```bash
   sudo nano /etc/systemd/system/crm-backend.service
   # Update ExecStart to use ./start.sh
   ```

3. Continue with Phases 5-7 from `UTHO_VM_BACKEND_DEPLOYMENT.md`

---

## 🔗 **Quick Reference**

```bash
# Connect to Utho VM
ssh root@150.241.246.110

# Navigate and activate
cd /var/www/CRM_FINAL/backend
source venv/bin/activate

# Run automated deployment
./start.sh

# Restart systemd service
sudo systemctl restart crm-backend.service

# View logs
journalctl -u crm-backend.service -f

# Test health
curl http://localhost:8000/api/health/
```

---

## 🎉 **Summary**

**Enhanced `start.sh` Features:**
- ✅ Better error handling
- ✅ Retry logic for database connection
- ✅ Clear progress indicators
- ✅ Utho VM optimized
- ✅ No Render-specific logic

**Deployment Process:**
- ✅ Follows `UTHO_VM_BACKEND_DEPLOYMENT.md`
- ✅ Manual deployment (SSH-based)
- ✅ Uses enhanced `start.sh` for automation
- ✅ Integrated with systemd for process management

**Result:**
- ✅ Faster deployments
- ✅ Better reliability
- ✅ Clear feedback
- ✅ Easier troubleshooting
