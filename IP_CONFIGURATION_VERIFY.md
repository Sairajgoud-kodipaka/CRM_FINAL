# IP Configuration Verification: 150.241.246.110

## ✅ Configuration Status

### 1. Deployment Script (.env template)
**File:** `backend/utho-deploy.sh`
```env
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1,jewel-crm.vercel.app
CORS_ALLOWED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app
CSRF_TRUSTED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app
SITE_URL=http://150.241.246.110
```
**Status:** ✅ Configured

### 2. Nginx Configuration
**File:** `backend/nginx_crm.conf`
```nginx
server_name 150.241.246.110 crm.yourdomain.com;
```
**Status:** ✅ Configured
**Note:** Listening on port 80 (HTTP)

### 3. SystemD Service
**File:** `backend/crm-backend.service`
- Working Directory: `/var/www/CRM_FINAL/backend`
- Bind Address: `127.0.0.1:8000` (internal)
- External access handled by Nginx
**Status:** ✅ Configured

## 🔍 Verification Checklist

### Check #1: Test Backend Health
```bash
# From your server
curl http://localhost:8000/api/health/

# From external
curl http://150.241.246.110/api/health/
```

### Check #2: Verify Nginx is Running
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check #3: Verify Backend Service
```bash
sudo systemctl status crm-backend.service
```

### Check #4: Check Firewall
```bash
# Check if ports are open
sudo ufw status
# Or
sudo iptables -L

# If needed, open port 80
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
```

## 🚀 Deployment Commands

```bash
# 1. Navigate to backend
cd /var/www/CRM_FINAL/backend

# 2. Create/verify .env file
nano .env
# Make sure these are set:
# ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1,jewel-crm.vercel.app
# CORS_ALLOWED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app
# CSRF_TRUSTED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app

# 3. Run deployment
chmod +x utho-deploy.sh
./utho-deploy.sh

# 4. Setup systemd
sudo cp crm-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable crm-backend.service
sudo systemctl start crm-backend.service

# 5. Setup nginx
sudo cp nginx_crm.conf /etc/nginx/sites-available/crm-backend
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 6. Test
curl http://150.241.246.110/api/health/
```

## 🔒 Security Recommendations

### 1. Enable HTTPS (Recommended)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal will be set up automatically
```

### 2. Firewall Configuration
```bash
# Install UFW if not installed
sudo apt-get install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. Update ALLOWED_HOSTS
- Add your domain name when you set it up
- Example: `ALLOWED_HOSTS=150.241.246.110,yourdomain.com,www.yourdomain.com,localhost,127.0.0.1`

## 🌐 Access URLs

- Backend API: `http://150.241.246.110/api/`
- Health Check: `http://150.241.246.110/api/health/`
- Admin Panel: `http://150.241.246.110/admin/`

## 📋 Environment Variables Summary

Essential variables in `.env` file:

```env
# Server Configuration
DEBUG=False
SECRET_KEY=your-secure-secret-key-here
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1,jewel-crm.vercel.app
SITE_URL=http://150.241.246.110

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=jewellery_crm
DB_USER=crm_user
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# CORS & Security
CORS_ALLOWED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app
CSRF_TRUSTED_ORIGINS=http://150.241.246.110,http://localhost:3000,https://jewel-crm.vercel.app

# Paths
STATIC_ROOT=/var/www/CRM_FINAL/backend/staticfiles
MEDIA_ROOT=/var/www/CRM_FINAL/backend/media
```

## ✅ All Systems Ready!

Your IP `150.241.246.110` is properly configured in:
- ✅ Deployment script (.env template)
- ✅ Nginx configuration
- ✅ SystemD service paths
- ✅ CORS and CSRF settings

**Next step:** Run the deployment script!

