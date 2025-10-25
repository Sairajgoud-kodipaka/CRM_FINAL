# Utho Cloud VM Backend-Only Deployment Plan
# Frontend will be deployed separately on Vercel

## Overview

Deploy the Django backend, PostgreSQL database, and Redis on Utho Cloud VM (150.241.246.110) while keeping the Next.js frontend on Vercel. This hybrid approach provides better performance and cost optimization.

## Phase 1: VM Setup & Initial Connection

### 1.1 Connect to Utho VM

```bash
# From your local machine (Windows PowerShell or WSL)
ssh root@150.241.246.110
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

## Phase 2: Install Core Dependencies

### 2.1 Install PostgreSQL

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

### 2.2 Install Redis

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

### 2.3 Install Python 3.11

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

### 2.4 Install Nginx

```bash
# Install Nginx web server
apt install -y nginx

# Enable and start Nginx
systemctl enable nginx
systemctl start nginx
```

## Phase 3: Transfer Application Code

### 3.1 Transfer from Local Machine

```bash
# Option A: Using Git (Recommended)
# On VM:
cd /var/www
git clone https://github.com/yourusername/CRM_FINAL.git
cd CRM_FINAL

# Option B: Using SCP from local machine
# From Windows (PowerShell):
scp -r K:\Master\CRM_FINAL root@150.241.246.110:/var/www/
           

# Option C: Using rsync (if available)
rsync -avz -e ssh K:\Master\CRM_FINAL/ root@150.241.246.110:/var/www/CRM_FINAL/
```

### 3.2 Set Proper Permissions

```bash
cd /var/www/CRM_FINAL
chown -R root:root .
chmod -R 755 .
```

## Phase 4: Backend Setup (Django)

### 4.1 Create Python Virtual Environment

```bash
cd /var/www/CRM_FINAL/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### 4.2 Install Python Dependencies

```bash
# Install from requirements.txt
pip install -r requirements.txt

# Install additional production dependencies
pip install gunicorn uvicorn[standard]
```

### 4.3 Create Production Environment File

```bash
# Create .env file for Utho VM deployment
cat > /var/www/CRM_FINAL/backend/.env << 'EOF'
# Django Settings
DEBUG=False
SECRET_KEY=f3Csh9SZNGRp84-xLGvEEYPhWqTt2_q6-5lXuXjiR5Y
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

# Google Sheets Configuration (Simplified - Uses JSON file only)
# The application now uses the mangatrai-6bc45a711bae.json file directly
# No need for environment variable credentials - cleaner and more secure

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

### 4.4 Setup Google Sheets Credentials

```bash
# Create Google Cloud service account JSON file
# IMPORTANT: Replace with your actual service account credentials
# This file should be created manually with your Google Cloud service account JSON
cat > /var/www/CRM_FINAL/backend/mangatrai-6bc45a711bae.json << 'EOF'
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "crm-625@crmsales-475507.iam.gserviceaccount.com",
  "client_id": "112954059357864433278",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/crm-625%40crmsales-475507.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
EOF

# Set secure permissions
chmod 600 /var/www/CRM_FINAL/backend/mangatrai-6bc45a711bae.json
```

### 4.5 Run Database Migrations

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser --username admin --email admin@jewelrycrm.com

# Collect static files
python manage.py collectstatic --noinput

# Create required directories
mkdir -p /var/www/CRM_FINAL/backend/logs
mkdir -p /var/www/CRM_FINAL/backend/media
chmod -R 755 /var/www/CRM_FINAL/backend/staticfiles
chmod -R 755 /var/www/CRM_FINAL/backend/media
```

### 4.6 Test Backend Server

```bash
# Quick test with development server
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+C to stop after confirming it works
```

## Phase 5: Systemd Service Configuration

### 5.1 Create Backend Systemd Service

```bash
cat > /etc/systemd/system/crm-backend.service << 'EOF'
[Unit]
Description=Jewellery CRM Backend (Django ASGI with Uvicorn)
After=network.target postgresql.service redis-server.service
Requires=postgresql.service redis-server.service

[Service]
Type=notify
User=root
Group=root
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

## Phase 6: Nginx Configuration

### 6.1 Create Nginx Configuration

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

## Phase 7: Firewall & Security

### 7.1 Configure UFW Firewall

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

### 7.2 Secure PostgreSQL

```bash
# Edit PostgreSQL config to only listen on localhost
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
systemctl restart postgresql
```

### 7.3 Secure Redis

```bash
# Bind Redis to localhost only
sed -i 's/bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf

# Restart Redis
systemctl restart redis-server
```

## Phase 8: Testing & Verification

### 8.1 Test Backend

```bash
# Check backend service
systemctl status crm-backend.service

# Test API endpoint
curl http://localhost:8000/api/health/
curl http://150.241.246.110/api/health/

# Check backend logs
tail -f /var/www/CRM_FINAL/backend/logs/backend.log
```

### 8.2 Test Database Connection

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py dbshell
# Type \q to exit
```

### 8.3 Test Redis

```bash
redis-cli ping  # Should return PONG
redis-cli info | grep connected_clients
```

## Phase 9: Frontend Configuration for Vercel

### 9.1 Update Frontend Environment Variables

In your Vercel deployment, update the environment variables:

```bash
# Frontend .env.local for Vercel
NEXT_PUBLIC_API_URL=http://150.241.246.110:8000
NODE_ENV=production
```

### 9.2 Update Frontend API Configuration

Make sure your frontend is configured to use the Utho VM backend:

```javascript
// In your frontend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://150.241.246.110:8000';
```

## Phase 10: Monitoring & Maintenance

### 10.1 Set Up Log Rotation

```bash
cat > /etc/logrotate.d/crm-backend << 'EOF'
/var/www/CRM_FINAL/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 root root
}
EOF
```

### 10.2 Monitor Services

```bash
# Check all CRM services
systemctl status crm-backend.service nginx postgresql redis-server

# Monitor system resources
htop
# Install if not present: apt install htop

# Check disk usage
df -h

# Check memory usage
free -h
```

### 10.3 Common Management Commands

```bash
# Restart backend
systemctl restart crm-backend.service

# Restart Nginx
systemctl restart nginx

# View backend logs
journalctl -u crm-backend.service -f

# View Nginx access logs
tail -f /var/log/nginx/access.log

# View Nginx error logs
tail -f /var/log/nginx/error.log
```

### 10.4 Update Application

```bash
# Navigate to application directory
cd /var/www/CRM_FINAL

# Pull latest code (if using Git)
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart crm-backend.service

# Verify services are running
systemctl status crm-backend.service
```

## Access URLs

After deployment, access your application at:

- **Backend API**: http://150.241.246.110/api/
- **Admin Panel**: http://150.241.246.110/admin/
- **Health Check**: http://150.241.246.110/api/health/
- **Frontend**: https://jewel-crm.vercel.app (deployed separately on Vercel)

## Security Recommendations

1. **Change default passwords** immediately after first login
2. **Set up SSH key authentication** and disable password login
3. **Configure SSL/TLS** as soon as possible (even with self-signed cert initially)
4. **Regular updates**: `apt update && apt upgrade` weekly
5. **Monitor logs** regularly for suspicious activity
6. **Set up fail2ban** to prevent brute force attacks
7. **Backup regularly** - database and media files

## Troubleshooting

### Service won't start

```bash
journalctl -u crm-backend.service -n 50
```

### Database connection issues

```bash
sudo -u postgres psql
\l  # List databases
\du # List users
```

### Nginx issues

```bash
nginx -t  # Test configuration
tail -f /var/log/nginx/error.log
```

### Port already in use

```bash
netstat -tuln | grep :8000
# Kill process if needed: kill -9 <PID>
```

---

**Deployment Status**: Ready to execute step-by-step

**Estimated Time**: 1-2 hours for backend-only setup

**VM IP**: 150.241.246.110

**Frontend**: Deploy separately on Vercel with API URL pointing to Utho VM
