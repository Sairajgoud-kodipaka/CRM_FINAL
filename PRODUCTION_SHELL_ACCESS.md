# 🔧 Production Server Shell Access Guide

## 🚨 **Issue: Python Shell Not Working**

When you run `python manage.py shell`, you get an error because the system Python is being used instead of the virtual environment.

## ✅ **Solution: Use Virtual Environment Python**

### **Correct Command:**

```bash
# Navigate to backend directory
cd /var/www/CRM_FINAL/backend

# Activate virtual environment OR use full path
source venv/bin/activate

# Now Django shell will work
python manage.py shell
```

### **Alternative (Direct Path):**

```bash
# Use the full path to venv Python
/var/www/CRM_FINAL/backend/venv/bin/python manage.py shell
```

### **Quick Commands:**

```bash
# Django shell
cd /var/www/CRM_FINAL/backend && source venv/bin/activate && python manage.py shell

# Run migrations
cd /var/www/CRM_FINAL/backend && source venv/bin/activate && python manage.py migrate

# Check Django status
cd /var/www/CRM_FINAL/backend && source venv/bin/activate && python manage.py check

# Create superuser
cd /var/www/CRM_FINAL/backend && source venv/bin/activate && python manage.py createsuperuser
```

---

## 📋 **Understanding Your Logs**

### **1. Normal Application Activity** ✅
```
📅 Date Filter Applied to Client:
   Field: created_at
   Range: 2025-10-31 to 2025-11-29
   Before: 4 records
   After: 1 records
```
**Status**: ✅ Working correctly - date filtering is functioning properly.

### **2. Security Scanner Attempts** ⚠️ (Harmless)
```
WARNING Not Found: /vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php
WARNING Not Found: /phpunit/phpunit/Util/PHP/eval-stdin.php
```
**Status**: ⚠️ These are automated bot/scanner attacks trying to find vulnerabilities. Your application is correctly:
- Returning 404 (Not Found) responses
- Not exposing any vulnerable endpoints
- Logging these attempts (which is good for security monitoring)

**Action**: No action needed - this is normal internet traffic. Your application is secure.

---

## 🔒 **Security Best Practices**

### **1. Rate Limiting** (Optional)
Consider adding rate limiting to reduce noise from scanners:
- Use Django middleware like `django-ratelimit`
- Configure Nginx rate limiting
- Use fail2ban for repeated attack patterns

### **2. Log Monitoring**
Monitor these logs for:
- Unusual patterns (many requests from same IP)
- Successful exploit attempts (should be 0)
- High traffic from unknown sources

### **3. Firewall Rules**
Consider blocking known malicious IPs:
```bash
# Check current firewall rules
sudo ufw status

# Block specific IP (if needed)
sudo ufw deny from <malicious-ip>
```

---

## 🛠️ **Common Django Commands in Production**

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate

# Check system status
python manage.py check --deploy

# View all users
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.all()

# Check database connection
python manage.py dbshell

# View migrations status
python manage.py showmigrations

# Run specific migration
python manage.py migrate app_name migration_name

# Collect static files
python manage.py collectstatic --noinput
```

---

## 📊 **Monitoring Your Application**

### **View Recent Logs:**
```bash
# Last 50 lines
sudo journalctl -u crm-backend.service -n 50

# Follow logs in real-time
sudo journalctl -u crm-backend.service -f

# Last hour
sudo journalctl -u crm-backend.service --since "1 hour ago"

# Today's logs
sudo journalctl -u crm-backend.service --since today
```

### **Check Service Status:**
```bash
# Service status
sudo systemctl status crm-backend.service

# Restart service
sudo systemctl restart crm-backend.service

# View error logs
sudo journalctl -u crm-backend.service -p err
```

---

## ✅ **Summary**

1. ✅ **Date filtering is working** - Your application is functioning correctly
2. ✅ **Security is working** - Scanner attempts are being blocked (404 responses)
3. ✅ **Use venv Python** - Always activate virtual environment before running Django commands
4. ⚠️ **Scanner traffic is normal** - No action needed unless you see actual security breaches

**Your application is secure and working correctly!** 🎉

