# Phone Number Feature Deployment Guide - Utho VM

## 🚀 Quick Deployment Steps

### Step 1: SSH into your Utho VM
```bash
ssh root@YOUR_UTHO_IP
cd /var/www/CRM_FINAL/backend
```

### Step 2: Fix Git Ownership (if needed)
If you get "dubious ownership" error, run:
```bash
git config --global --add safe.directory /root/CRM_FINAL
# OR if using /var/www/CRM_FINAL:
git config --global --add safe.directory /var/www/CRM_FINAL
```

### Step 3: Pull Latest Code
```bash
cd /root/CRM_FINAL  # or /var/www/CRM_FINAL

# If you get "divergent branches" error, reset to match remote:
git fetch origin
git reset --hard origin/main

# OR if you want to merge instead:
git pull origin main --no-rebase
```

### Step 4: Run Deployment Script
```bash
cd /root/CRM_FINAL/backend  # or /var/www/CRM_FINAL/backend

# Make script executable (if not already)
chmod +x utho-deploy.sh

# Run the script
sudo bash utho-deploy.sh
# OR if executable:
sudo ./utho-deploy.sh
```

The deployment script will automatically:
- ✅ Install `phonenumbers==8.13.27` package (new dependency)
- ✅ Run database migrations (updates phone field max_length: 15 → 20)
- ✅ Restart backend service
- ✅ Run health checks

## 📋 What Gets Updated

### Backend Changes:
1. **New Package**: `phonenumbers==8.13.27` (already in requirements.txt)
2. **Database Migrations**: 
   - `users.phone`: max_length 15 → 20
   - `tenants.phone`: max_length 15 → 20
   - `support.callback_phone`: max_length 15 → 20
3. **Validators**: International phone number validation
4. **Serializers**: Updated to use international validators

### Frontend Changes:
- All phone input fields now support international numbers
- Country code selector with flags
- Paste support for formatted numbers
- 20 character limit
- India-specific: +91 + exactly 10 digits

## 🔍 Manual Verification Steps

### 1. Check Package Installation
```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
pip show phonenumbers
```
Should show: `Version: 8.13.27`

### 2. Check Migrations
```bash
python manage.py showmigrations users tenants support
```
Should show migrations applied for phone field updates.

### 3. Test Backend API
```bash
curl http://localhost:8000/api/health/
```
Should return: `{"status": "healthy", "service": "jewellery-crm-backend"}`

### 4. Check Service Status
```bash
sudo systemctl status crm-backend.service
```
Should show: `active (running)`

## 🐛 Troubleshooting

### If migrations fail:
```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

### If phonenumbers package not found:
```bash
source venv/bin/activate
pip install phonenumbers==8.13.27
```

### If backend service won't start:
```bash
# Check logs
sudo journalctl -u crm-backend.service -n 50

# Restart service
sudo systemctl restart crm-backend.service
```

## ✅ Post-Deployment Checklist

- [ ] Backend service is running
- [ ] Health check endpoint responds
- [ ] Database migrations completed
- [ ] `phonenumbers` package installed
- [ ] Test adding customer with Indian number (+91)
- [ ] Test adding customer with US number (+1)
- [ ] Test pasting formatted phone numbers
- [ ] Verify phone number validation works

## 📝 Quick Commands Reference

```bash
# View backend logs
sudo journalctl -u crm-backend.service -f

# Restart backend
sudo systemctl restart crm-backend.service

# Check service status
sudo systemctl status crm-backend.service

# Test API
curl http://localhost:8000/api/health/

# Run migrations manually
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py migrate
```

## 🎯 Expected Results

After deployment:
- ✅ All phone number fields support international numbers
- ✅ Country code selector with flags appears
- ✅ Users can add US, UK, and other country phone numbers
- ✅ Indian numbers still work: +91 + 10 digits
- ✅ Paste functionality works for formatted numbers
- ✅ 20 character limit enforced

