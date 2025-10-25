# Utho VM Deployment Progress Tracker

## 📋 **Deployment Overview**
- **VM IP:** 150.241.246.110
- **Deployment Type:** Backend-only (Frontend on Vercel)
- **Security Level:** Production-grade with dedicated web user
- **Start Date:** October 25, 2025

---

## ✅ **COMPLETED PHASES**

### **Phase 1: VM Setup & Initial Connection** ✅
**Status:** COMPLETED

#### 1.1 Connect to Utho VM ✅
```bash
ssh root@150.241.246.110
```
**Why:** Establish secure connection to the cloud server

#### 1.2 Update System ✅
```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```
**Why:** 
- `apt update` - Refresh package lists
- `apt upgrade` - Install security updates
- `curl wget git build-essential` - Essential tools for deployment

---

### **Phase 2: Install Core Dependencies** ✅
**Status:** COMPLETED

#### 2.1 Install PostgreSQL ✅
```bash
# Install PostgreSQL 14+
apt install -y postgresql postgresql-contrib libpq-dev

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE jewellery_crm;
CREATE USER crm_user WITH PASSWORD 'SecurePassword123!';
ALTER ROLE crm_user SET client_encoding TO 'utf8';
ALTER ROLE crm_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE crm_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE jewellery_crm TO crm_user;
\q
EOF
```
**Why:**
- `postgresql` - Database server
- `postgresql-contrib` - Additional utilities
- `libpq-dev` - Development headers for Python PostgreSQL
- Database setup with proper encoding and permissions

#### 2.2 Install Redis ✅
```bash
# Install Redis for WebSocket/Channels support
apt install -y redis-server

# Configure Redis for production
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Enable and start Redis
systemctl enable redis-server
systemctl start redis-server

# Test Redis
redis-cli ping  # Should return PONG
```
**Why:**
- `redis-server` - In-memory data store for caching and WebSockets
- `supervised systemd` - Let systemd manage Redis process
- `maxmemory 256mb` - Limit memory usage
- `allkeys-lru` - Evict least recently used keys when memory full

#### 2.3 Install Python 3.11 ✅
```bash
# Add deadsnakes PPA for Python 3.11
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt update

# Install Python 3.11 and pip
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Set Python 3.11 as default
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```
**Why:**
- `deadsnakes PPA` - Provides newer Python versions
- `python3.11` - Required Python version for Django
- `python3.11-venv` - Virtual environment support
- `python3.11-dev` - Development headers for compiling packages

#### 2.4 Install Nginx ✅
```bash
# Install Nginx web server
apt install -y nginx

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx
```
**Why:**
- `nginx` - Reverse proxy and static file server
- Handles HTTP requests and forwards to Django
- Serves static files (CSS, JS, images) efficiently

---

### **Phase 3: Transfer Application Code** ✅
**Status:** COMPLETED

#### 3.1 Transfer from Local Machine ✅
```bash
# Navigate to web directory
cd /var/www

# Clone repository (after fixing incomplete clone)
rm -rf CRM_FINAL
git clone https://github.com/Sairajgoud-kodipaka/CRM_FINAL.git
cd CRM_FINAL
```
**Why:**
- `/var/www` - Standard location for web applications
- `git clone` - Get latest code from repository
- Removed incomplete clone first to ensure clean state

#### 3.2 Set Proper Permissions ✅
```bash
# Create dedicated web user for security
useradd -r -s /bin/false -d /var/www/CRM_FINAL -c "CRM Web User" crm-web

# Verify user was created
id crm-web
# Output: uid=998(crm-web) gid=998(crm-web) groups=998(crm-web)

# Set ownership to secure user
chown -R crm-web:crm-web .

# Set secure permissions
chmod -R 755 .

# Extra security for sensitive files (will be created later)
# chmod 600 backend/.env  # Only owner can read environment file
# chmod 700 backend/logs  # Only owner can access logs
```
**Why:**
- `useradd -r -s /bin/false` - Create system user with no shell access (security)
- `chown -R crm-web:crm-web` - Make crm-web owner of all files
- `chmod -R 755` - Secure permissions (owner: rwx, group/others: rx)
- **Security Benefits:**
  - Limited privileges (can't access system files)
  - No shell access (can't execute system commands)
  - Isolated process (web app runs in its own space)

---

## 🔧 **ISSUES RESOLVED**

### **Issue 1: PostgreSQL Service Status** ✅
**Problem:** `systemctl status postgresql` showed `active (exited)`
**Solution:** This is normal for PostgreSQL 14 - actual process runs under `postgresql@14-main.service`
**Verification:** `pg_lsclusters` showed `online` status

### **Issue 2: Permission Denied Errors** ✅
**Problem:** `could not change directory to "/root": Permission denied`
**Solution:** Run database commands from `/tmp` directory instead of `/root`
**Why:** PostgreSQL user can't access `/root` directory (security feature)

### **Issue 3: Hostname Resolution Warnings** ✅
**Problem:** `sudo: unable to resolve host cloudserver-rK5s3YDO.mhc`
**Solution:** Added hostname to `/etc/hosts`
```bash
echo "127.0.0.1 cloudserver-rK5s3YDO.mhc cloudserver-rK5s3YDO" >> /etc/hosts
```
**Why:** System needs to resolve its own hostname for proper operation

### **Issue 4: Incomplete Git Clone** ✅
**Problem:** SSH connection broke during git clone, leaving only `.git` directory
**Solution:** Removed incomplete directory and re-cloned
```bash
rm -rf CRM_FINAL
git clone https://github.com/Sairajgoud-kodipaka/CRM_FINAL.git
```

### **Issue 5: Google Sheets Credentials Error** ✅
**Problem:** `ERROR Google Sheets credentials not found in environment variable or file: /var/www/CRM_FINAL/crmsales-475507-247bd72ab136.json`
**Solution:** 
1. Created JSON credentials file directly on server
2. Updated code to prioritize JSON file in deployment directory
3. Created fallback file for Django compatibility
```bash
# Create JSON file
cat > /var/www/CRM_FINAL/backend/mangatrai-6bc45a711bae.json << 'EOF'
{...credentials...}
EOF

# Create fallback file
cp /var/www/CRM_FINAL/backend/mangatrai-6bc45a711bae.json /var/www/CRM_FINAL/crmsales-475507-247bd72ab136.json
```

### **Issue 6: SECRET_KEY Security Warning** ✅
**Problem:** `Your SECRET_KEY has less than 50 characters, less than 5 unique characters`
**Solution:** Generated secure 50+ character SECRET_KEY using Django's built-in generator
```bash
python -c "from django.core.management.utils import get_random_secret_key; print('SECRET_KEY=' + get_random_secret_key())"
# Output: SECRET_KEY=yksfx7-0asnh_nkyxqk2innomq(p3dkm7)mp5ks907f=if(5+)
```

### **Issue 7: File Ownership Security** ✅
**Problem:** Some files still owned by root user (security risk)
**Solution:** Changed all file ownership to dedicated `crm-web` user
```bash
chown crm-web:crm-web /var/www/CRM_FINAL/backend/.env
chown crm-web:crm-web /var/www/CRM_FINAL/backend/mangatrai-6bc45a711bae.json
# SQLite database removed - using PostgreSQL only
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/logs
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/media
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/staticfiles
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/venv
```

### **Issue 8: .env File Corruption** ✅
**Problem:** `.env` file creation got corrupted using `cat` command
**Solution:** Used `nano` editor for reliable file creation
```bash
nano /var/www/CRM_FINAL/backend/.env
# Copy-paste content and save with Ctrl+X, Y, Enter
```

---

## 📊 **SYSTEM STATUS CHECK**

### **All Services Running:** ✅
```bash
# PostgreSQL
pg_lsclusters
# Output: 14 main 5432 online postgres

# Redis
systemctl status redis-server
# Output: Active: active (running)

# Nginx
systemctl status nginx
# Output: Active: active (running)

# Python
python3 --version
# Output: Python 3.11.14
```

### **Database Setup:** ✅
```bash
# Database exists
sudo -u postgres psql -c "\l" | grep jewellery_crm
# Output: jewellery_crm | postgres | UTF8 | en_US.UTF-8

# User exists
sudo -u postgres psql -c "\du" | grep crm_user
# Output: crm_user | | {}
```

### **File Ownership:** ✅
```bash
# All files owned by crm-web user
ls -la
# Shows: drwxr-xr-x crm-web crm-web (for all directories)
```

---

## 🚀 **NEXT PHASES**

### **Phase 4: Backend Setup (Django)** ✅
**Status:** COMPLETED

#### 4.1 Create Python Virtual Environment ✅
```bash
cd /var/www/CRM_FINAL/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```
**Status:** COMPLETED
**Why:** Isolated Python environment for Django application

#### 4.2 Install Python Dependencies ✅
```bash
pip install -r requirements.txt
pip install gunicorn uvicorn[standard]
```
**Status:** COMPLETED
**Why:** Install Django and production server dependencies

#### 4.3 Create Production Environment File ✅
**Status:** COMPLETED

**Commands Used:**
```bash
# Generate secure SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print('SECRET_KEY=' + get_random_secret_key())"
# Output: SECRET_KEY=yksfx7-0asnh_nkyxqk2innomq(p3dkm7)mp5ks907f=if(5+)

# Create .env file using nano (more reliable than cat)
nano /var/www/CRM_FINAL/backend/.env
```

**Final .env Configuration:**
```bash
# Django Settings
DEBUG=False
SECRET_KEY=yksfx7-0asnh_nkyxqk2innomq(p3dkm7)mp5ks907f=if(5+)
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1,jewel-crm.vercel.app,jewellery-crm-frontend.vercel.app

# Database Configuration (Local PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=jewellery_crm
DB_USER=crm_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration (Local Redis)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CORS Settings (Updated for Vercel frontend + Utho VM backend)
CORS_ALLOWED_ORIGINS=https://jewel-crm.vercel.app,https://jewellery-crm-frontend.vercel.app,http://150.241.246.110,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
CORS_ALLOW_ALL_ORIGINS=False
CSRF_TRUSTED_ORIGINS=https://jewel-crm.vercel.app,https://jewellery-crm-frontend.vercel.app,http://150.241.246.110,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# Security Settings (Updated for production)
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_HSTS_SECONDS=31536000
SECURE_REFERRER_POLICY=strict-origin-when-cross-origin
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=True
X_FRAME_OPTIONS=DENY

# Static/Media Files
STATIC_URL=/static/
STATIC_ROOT=/var/www/CRM_FINAL/backend/staticfiles
MEDIA_URL=/media/
MEDIA_ROOT=/var/www/CRM_FINAL/backend/media

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
JWT_SECRET_KEY=25CBSetI1cCv7Zfy0Wfl9bd6YB/Ws7l/dZnRVFWBVzg=

# Server Configuration
PORT=8000
PYTHONUNBUFFERED=1
PYTHON_VERSION=3.11.0
DJANGO_SETTINGS_MODULE=core.settings

# Gunicorn Configuration
GUNICORN_CMD_ARGS="--timeout=300 --workers=2 --preload"
```

**Security Setup:**
```bash
chmod 600 /var/www/CRM_FINAL/backend/.env
```

**Why:** Production environment variables with secure SECRET_KEY (50+ characters)

#### 4.4 Google Sheets Credentials Setup ✅
**Status:** COMPLETED

**Commands Used:**
```bash
# Create JSON credentials file directly on server
# NOTE: Replace with your actual service account credentials
cat > /var/www/CRM_FINAL/backend/mangatrai-service-account.json << 'EOF'
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
EOF

# Set secure permissions
chmod 600 /var/www/CRM_FINAL/backend/mangatrai-service-account.json

# Create fallback file for Django compatibility
```

**Code Updates Made:**
- Updated `backend/telecalling/google_sheets_service.py` to prioritize JSON file in deployment directory
- Updated `backend/unified_google_sheets_sync.py` with same priority logic
- Removed Google credentials from `.env` file (saves space, more secure)

**Why:** JSON file approach is more secure and doesn't have environment variable size limits

#### 4.5 Django Deployment Check ✅
**Status:** COMPLETED

**Commands Used:**
```bash
# Test Django configuration
python manage.py check --deploy
```

**Results:**
- ✅ **Google Sheets credentials found** - No more credential errors
- ✅ **SECRET_KEY secure** - No more security warnings about weak key
- ⚠️ **SSL redirect warning** - Expected for HTTP deployment
- ⚠️ **URL namespace warning** - Minor issue, doesn't affect functionality

**Why:** Verify all Django settings are production-ready

#### 4.6 File Ownership & Security Setup ✅
**Status:** COMPLETED

**Commands Used:**
```bash
# Fix remaining root-owned files
chown crm-web:crm-web /var/www/CRM_FINAL/backend/.env
chown crm-web:crm-web /var/www/CRM_FINAL/backend/mangatrai-6bc45a711bae.json
# SQLite database removed - using PostgreSQL only
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/logs
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/media
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/staticfiles
chown -R crm-web:crm-web /var/www/CRM_FINAL/backend/venv

# Verify all files owned by crm-web
ls -la /var/www/CRM_FINAL/backend/
```

**Security Benefits:**
- ✅ **No root ownership** - All files owned by dedicated `crm-web` user
- ✅ **Proper permissions** - 600 for sensitive files, 755 for directories
- ✅ **Principle of least privilege** - Web app can't access system files

**Why:** Production-grade security with dedicated web user

#### 4.7 Run Database Migrations
```bash
python manage.py migrate
python manage.py createsuperuser --username admin --email admin@jewelrycrm.com
python manage.py collectstatic --noinput
mkdir -p /var/www/CRM_FINAL/backend/logs
mkdir -p /var/www/CRM_FINAL/backend/media
chmod -R 755 /var/www/CRM_FINAL/backend/staticfiles
chmod -R 755 /var/www/CRM_FINAL/backend/media
```

#### 4.5 Test Backend Server
```bash
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+C to stop after confirming it works
```

---

### **Phase 5: Systemd Service Configuration** ⏳
**Status:** READY TO START

#### 5.1 Create Backend Systemd Service
```bash
cat > /etc/systemd/system/crm-backend.service << 'EOF'
[Unit]
Description=Jewellery CRM Backend (Django ASGI with Uvicorn)
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=notify
User=crm-web
Group=crm-web
WorkingDirectory=/var/www/CRM_FINAL/backend
Environment="PATH=/var/www/CRM_FINAL/backend/venv/bin"
EnvironmentFile=/var/www/CRM_FINAL/backend/.env
ExecStart=/var/www/CRM_FINAL/backend/venv/bin/uvicorn core.asgi:application \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --proxy-headers \
    --log-level warning
Restart=always
RestartSec=10
StandardOutput=append:/var/www/CRM_FINAL/backend/logs/backend.log
StandardError=append:/var/www/CRM_FINAL/backend/logs/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd, enable and start backend
systemctl daemon-reload
systemctl enable crm-backend.service
systemctl start crm-backend.service
systemctl status crm-backend.service
```

---

### **Phase 6: Nginx Configuration** ⏳
**Status:** PENDING

#### 6.1 Create Nginx Configuration
```bash
cat > /etc/nginx/sites-available/crm-backend << 'EOF'
# Upstream for Django Backend
upstream django_backend {
    server 127.0.0.1:8000;
}

# Main Server Block
server {
    listen 80;
    server_name 150.241.246.110;
    
    client_max_body_size 100M;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Access-Control-Allow-Origin "https://jewel-crm.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-CSRFToken" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Handle preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://jewel-crm.vercel.app";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-CSRFToken";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
        
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Backend API endpoints
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Django Admin
    location /admin/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket connections for telecalling
    location /ws/ {
        proxy_pass http://django_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Django Static Files
    location /static/ {
        alias /var/www/CRM_FINAL/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Django Media Files
    location /media/ {
        alias /var/www/CRM_FINAL/backend/media/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

### **Phase 7: Firewall & Security** ⏳
**Status:** PENDING

#### 7.1 Configure UFW Firewall
```bash
# Install UFW if not present
apt install -y ufw

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT - do this first!)
ufw allow 22/tcp
ufw allow OpenSSH

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (for future SSL setup)
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status verbose
```

#### 7.2 Secure PostgreSQL
```bash
# Edit PostgreSQL config to only listen on localhost
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
systemctl restart postgresql
```

#### 7.3 Secure Redis
```bash
# Bind Redis to localhost only
sed -i 's/bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf

# Restart Redis
systemctl restart redis-server
```

---

## 🎯 **DEPLOYMENT GOALS**

### **Security Objectives:** ✅
- ✅ Dedicated web user (`crm-web`) instead of root
- ✅ Proper file permissions (755)
- ✅ Isolated processes
- ✅ Limited privileges

### **Performance Objectives:** ⏳
- ⏳ Nginx reverse proxy for static files
- ⏳ Redis caching
- ⏳ Multiple Django workers
- ⏳ Optimized database connections

### **Reliability Objectives:** ⏳
- ⏳ Systemd service management
- ⏳ Automatic restarts on failure
- ⏳ Log rotation
- ⏳ Health monitoring

---

## 📝 **NOTES**

### **Key Decisions Made:**
1. **Security-First Approach:** Created dedicated `crm-web` user instead of using root
2. **Hybrid Deployment:** Backend on Utho VM, Frontend on Vercel
3. **Production-Grade Setup:** Proper permissions, systemd services, Nginx reverse proxy
4. **Local Services:** PostgreSQL and Redis running locally on VM

### **Lessons Learned:**
1. **SSH Stability:** Git clone can be interrupted by connection issues
2. **Permission Management:** Different users have different access rights
3. **Service Dependencies:** PostgreSQL 14 uses different service management
4. **Hostname Resolution:** System needs proper hostname configuration

---

## 🔄 **UPDATE LOG**

- **2025-10-25 09:15:** Completed Phase 4 - Django Backend Setup with secure configuration
- **2025-10-25 09:10:** Fixed Google Sheets credentials and SECRET_KEY security issues
- **2025-10-25 09:05:** Resolved file ownership security issues (all files now owned by crm-web)
- **2025-10-25 08:58:** Fixed .env file corruption using nano editor
- **2025-10-25 08:50:** Generated secure SECRET_KEY (50+ characters)
- **2025-10-25 08:45:** Created Google Sheets JSON credentials file
- **2025-10-25 08:40:** Updated Google Sheets service code for JSON file priority
- **2025-10-25 08:35:** Created production .env file with all necessary settings
- **2025-10-25 08:30:** Installed Python dependencies and created virtual environment
- **2025-10-25 05:06:** Completed Phase 3 - Code transfer and secure permissions
- **2025-10-25 04:42:** Completed Phase 2 - All core dependencies installed
- **2025-10-25 04:03:** Completed Phase 1 - VM setup and system updates
- **2025-10-25 03:43:** Started deployment process

---

**Next Action:** Begin Phase 5 - Systemd Service Configuration


# Static/Media Files

STATIC_URL=/static/

STATIC_ROOT=/var/www/CRM_FINAL/backend/staticfiles

MEDIA_URL=/media/

MEDIA_ROOT=/var/www/CRM_FINAL/backend/media



# JWT Settings

JWT_ACCESS_TOKEN_LIFETIME=60

JWT_REFRESH_TOKEN_LIFETIME=1440

JWT_SECRET_KEY=25CBSetI1cCv7Zfy0Wfl9bd6YB/Ws7l/dZnRVFWBVzg=



# Google Sheets Configuration

GOOGLE_CREDENTIALS='[Your Google Credentials JSON]'



# Server Configuration

PORT=8000

PYTHONUNBUFFERED=1

PYTHON_VERSION=3.11.0

DJANGO_SETTINGS_MODULE=core.settings



# Gunicorn Configuration

GUNICORN_CMD_ARGS="--timeout=300 --workers=2 --preload"

EOF



chmod 600 /var/www/CRM_FINAL/backend/.env

```



#### 4.4 Run Database Migrations

```bash

python manage.py migrate

python manage.py createsuperuser --username admin --email admin@jewelrycrm.com

python manage.py collectstatic --noinput

mkdir -p /var/www/CRM_FINAL/backend/logs

mkdir -p /var/www/CRM_FINAL/backend/media

chmod -R 755 /var/www/CRM_FINAL/backend/staticfiles

chmod -R 755 /var/www/CRM_FINAL/backend/media

```



#### 4.5 Test Backend Server

```bash

python manage.py runserver 0.0.0.0:8000

# Press Ctrl+C to stop after confirming it works

```



---



### **Phase 5: Systemd Service Configuration** ⏳

**Status:** PENDING



#### 5.1 Create Backend Systemd Service

```bash

cat > /etc/systemd/system/crm-backend.service << 'EOF'

[Unit]

Description=Jewellery CRM Backend (Django ASGI with Uvicorn)

After=network.target postgresql.service redis-server.service

Requires=postgresql.service redis-server.service



[Service]

Type=notify

User=crm-web

Group=crm-web

WorkingDirectory=/var/www/CRM_FINAL/backend

Environment="PATH=/var/www/CRM_FINAL/backend/venv/bin"

EnvironmentFile=/var/www/CRM_FINAL/backend/.env

ExecStart=/var/www/CRM_FINAL/backend/venv/bin/uvicorn core.asgi:application \

    --host 0.0.0.0 \

    --port 8000 \

    --workers 2 \

    --proxy-headers \

    --log-level warning

Restart=always

RestartSec=10

StandardOutput=append:/var/www/CRM_FINAL/backend/logs/backend.log

StandardError=append:/var/www/CRM_FINAL/backend/logs/backend-error.log



[Install]

WantedBy=multi-user.target

EOF



# Reload systemd, enable and start backend

systemctl daemon-reload

systemctl enable crm-backend.service

systemctl start crm-backend.service

systemctl status crm-backend.service

```



---



### **Phase 6: Nginx Configuration** ⏳

**Status:** PENDING



#### 6.1 Create Nginx Configuration

```bash

cat > /etc/nginx/sites-available/crm-backend << 'EOF'

# Upstream for Django Backend

upstream django_backend {

    server 127.0.0.1:8000;

}



# Main Server Block

server {

    listen 80;

    server_name 150.241.246.110;

    

    client_max_body_size 100M;

    

    # Security Headers

    add_header X-Frame-Options "DENY" always;

    add_header X-Content-Type-Options "nosniff" always;

    add_header X-XSS-Protection "1; mode=block" always;

    add_header Access-Control-Allow-Origin "https://jewel-crm.vercel.app" always;

    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;

    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-CSRFToken" always;

    add_header Access-Control-Allow-Credentials "true" always;

    

    # Handle preflight requests

    location / {

        if ($request_method = 'OPTIONS') {

            add_header Access-Control-Allow-Origin "https://jewel-crm.vercel.app";

            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";

            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-CSRFToken";

            add_header Access-Control-Allow-Credentials "true";

            add_header Access-Control-Max-Age 1728000;

            add_header Content-Type "text/plain; charset=utf-8";

            add_header Content-Length 0;

            return 204;

        }

        

        proxy_pass http://django_backend;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_redirect off;

    }

    

    # Backend API endpoints

    location /api/ {

        proxy_pass http://django_backend;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_redirect off;

    }

    

    # Django Admin

    location /admin/ {

        proxy_pass http://django_backend;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

    }

    

    # WebSocket connections for telecalling

    location /ws/ {

        proxy_pass http://django_backend;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400;

    }

    

    # Django Static Files

    location /static/ {

        alias /var/www/CRM_FINAL/backend/staticfiles/;

        expires 30d;

        add_header Cache-Control "public, immutable";

    }

    

    # Django Media Files

    location /media/ {

        alias /var/www/CRM_FINAL/backend/media/;

        expires 30d;

        add_header Cache-Control "public";

    }

}

EOF



# Enable the site

ln -sf /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

rm -f /etc/nginx/sites-enabled/default



# Test Nginx configuration

nginx -t



# Reload Nginx

systemctl reload nginx

```



---



### **Phase 7: Firewall & Security** ⏳

**Status:** PENDING



#### 7.1 Configure UFW Firewall

```bash

# Install UFW if not present

apt install -y ufw



# Set default policies

ufw default deny incoming

ufw default allow outgoing



# Allow SSH (IMPORTANT - do this first!)

ufw allow 22/tcp

ufw allow OpenSSH



# Allow HTTP

ufw allow 80/tcp



# Allow HTTPS (for future SSL setup)

ufw allow 443/tcp



# Enable firewall

ufw --force enable



# Check status

ufw status verbose

```



#### 7.2 Secure PostgreSQL

```bash

# Edit PostgreSQL config to only listen on localhost

sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf



# Restart PostgreSQL

systemctl restart postgresql

```



#### 7.3 Secure Redis

```bash

# Bind Redis to localhost only

sed -i 's/bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf



# Restart Redis

systemctl restart redis-server

```



---



## 🎯 **DEPLOYMENT GOALS**



### **Security Objectives:** ✅

- ✅ Dedicated web user (`crm-web`) instead of root

- ✅ Proper file permissions (755)

- ✅ Isolated processes

- ✅ Limited privileges



### **Performance Objectives:** ⏳

- ⏳ Nginx reverse proxy for static files

- ⏳ Redis caching

- ⏳ Multiple Django workers

- ⏳ Optimized database connections



### **Reliability Objectives:** ⏳

- ⏳ Systemd service management

- ⏳ Automatic restarts on failure

- ⏳ Log rotation

- ⏳ Health monitoring



---



## 📝 **NOTES**



### **Key Decisions Made:**

1. **Security-First Approach:** Created dedicated `crm-web` user instead of using root

2. **Hybrid Deployment:** Backend on Utho VM, Frontend on Vercel

3. **Production-Grade Setup:** Proper permissions, systemd services, Nginx reverse proxy

4. **Local Services:** PostgreSQL and Redis running locally on VM



### **Lessons Learned:**

1. **SSH Stability:** Git clone can be interrupted by connection issues

2. **Permission Management:** Different users have different access rights

3. **Service Dependencies:** PostgreSQL 14 uses different service management

4. **Hostname Resolution:** System needs proper hostname configuration



---



## 🔄 **UPDATE LOG**



- **2025-10-25 05:06:** Completed Phase 3 - Code transfer and secure permissions

- **2025-10-25 04:42:** Completed Phase 2 - All core dependencies installed

- **2025-10-25 04:03:** Completed Phase 1 - VM setup and system updates

- **2025-10-25 03:43:** Started deployment process



---



**Next Action:** Begin Phase 4 - Django Backend Setup

