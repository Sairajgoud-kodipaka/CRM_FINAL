# Utho Cloud VM Production Deployment Plan

## Overview

Deploy the full-stack Jewellery CRM application (Django backend + Next.js frontend) on a single Utho Cloud VM with self-managed PostgreSQL and Redis, using Nginx as reverse proxy and systemd for process management.

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

### 2.4 Install Node.js 20 (for Next.js)

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version
```

### 2.5 Install Nginx

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
# Create .env file
cat > /var/www/CRM_FINAL/backend/.env << 'EOF'
# Django Settings
DEBUG=False
SECRET_KEY=jewelry-crm-2024-production-secure-key-8f7e6d5c4b3a2918-7f6e5d4c3b2a1909
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=jewellery_crm
DB_USER=crm_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CORS Settings
CORS_ALLOWED_ORIGINS=http://150.241.246.110,http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://150.241.246.110,http://localhost:3000

# Static/Media Files
STATIC_URL=/static/
STATIC_ROOT=/var/www/CRM_FINAL/backend/staticfiles
MEDIA_URL=/media/
MEDIA_ROOT=/var/www/CRM_FINAL/backend/media

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Google Sheets (if needed)
GOOGLE_SHEETS_ENABLED=False
GOOGLE_SHEETS_ID=

# Exotel Configuration (if needed)
EXOTEL_ACCOUNT_SID=
EXOTEL_API_KEY=
EXOTEL_API_TOKEN=
EOF

chmod 600 /var/www/CRM_FINAL/backend/.env
```

### 4.4 Run Database Migrations

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

### 4.5 Test Backend Server

```bash
# Quick test with development server
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+C to stop after confirming it works
```

## Phase 5: Frontend Setup (Next.js)

### 5.1 Install Frontend Dependencies

```bash
cd /var/www/CRM_FINAL/jewellery-crm

# Install dependencies
npm install --production=false

# Install PM2 for Next.js process management
npm install -g pm2
```

### 5.2 Configure Frontend Environment

```bash
# Create .env.local for production
cat > /var/www/CRM_FINAL/jewellery-crm/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://150.241.246.110:8000
NODE_ENV=production
EOF
```

### 5.3 Build Frontend

```bash
cd /var/www/CRM_FINAL/jewellery-crm

# Build Next.js application
npm run build

# Test the build
npm start  # Press Ctrl+C to stop after confirming
```

## Phase 6: Systemd Service Configuration

### 6.1 Create Backend Systemd Service

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

### 6.2 Create Frontend Systemd Service

```bash
cat > /etc/systemd/system/crm-frontend.service << 'EOF'
[Unit]
Description=Jewellery CRM Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/CRM_FINAL/jewellery-crm
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:/var/www/CRM_FINAL/jewellery-crm/logs/frontend.log
StandardError=append:/var/www/CRM_FINAL/jewellery-crm/logs/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Create logs directory
mkdir -p /var/www/CRM_FINAL/jewellery-crm/logs

# Reload systemd, enable and start frontend
systemctl daemon-reload
systemctl enable crm-frontend.service
systemctl start crm-frontend.service
systemctl status crm-frontend.service
```

## Phase 7: Nginx Configuration

### 7.1 Create Nginx Configuration

```bash
cat > /etc/nginx/sites-available/crm-app << 'EOF'
# Upstream for Django Backend
upstream django_backend {
    server 127.0.0.1:8000;
}

# Upstream for Next.js Frontend
upstream nextjs_frontend {
    server 127.0.0.1:3000;
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
    
    # Next.js Frontend (default)
    location / {
        proxy_pass http://nextjs_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Next.js static files
    location /_next/static/ {
        proxy_pass http://nextjs_frontend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/crm-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

## Phase 8: Firewall & Security

### 8.1 Configure UFW Firewall

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

### 8.2 Secure PostgreSQL

```bash
# Edit PostgreSQL config to only listen on localhost
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
systemctl restart postgresql
```

### 8.3 Secure Redis

```bash
# Bind Redis to localhost only
sed -i 's/bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf

# Restart Redis
systemctl restart redis-server
```

## Phase 9: Testing & Verification

### 9.1 Test Backend

```bash
# Check backend service
systemctl status crm-backend.service

# Test API endpoint
curl http://localhost:8000/api/health/
curl http://150.241.246.110/api/health/

# Check backend logs
tail -f /var/www/CRM_FINAL/backend/logs/backend.log
```

### 9.2 Test Frontend

```bash
# Check frontend service
systemctl status crm-frontend.service

# Test frontend
curl http://localhost:3000
curl http://150.241.246.110/

# Check frontend logs
tail -f /var/www/CRM_FINAL/jewellery-crm/logs/frontend.log
```

### 9.3 Test Database Connection

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py dbshell
# Type \q to exit
```

### 9.4 Test Redis

```bash
redis-cli ping  # Should return PONG
redis-cli info | grep connected_clients
```

## Phase 10: Monitoring & Maintenance

### 10.1 Set Up Log Rotation

```bash
cat > /etc/logrotate.d/crm-app << 'EOF'
/var/www/CRM_FINAL/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 root root
}

/var/www/CRM_FINAL/jewellery-crm/logs/*.log {
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
systemctl status crm-backend.service crm-frontend.service nginx postgresql redis-server

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

# Restart frontend
systemctl restart crm-frontend.service

# Restart Nginx
systemctl restart nginx

# View backend logs
journalctl -u crm-backend.service -f

# View frontend logs
journalctl -u crm-frontend.service -f

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

# Update frontend
cd ../jewellery-crm
npm install
npm run build
systemctl restart crm-frontend.service

# Verify services are running
systemctl status crm-backend.service crm-frontend.service
```

## Phase 11: Optional Enhancements

### 11.1 Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (requires domain name)
# certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal: certbot renew --dry-run
```

### 11.2 Set Up Automated Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-crm.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/crm"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
sudo -u postgres pg_dump jewellery_crm | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/CRM_FINAL/backend/media

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-crm.sh

# Schedule daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-crm.sh >> /var/log/crm-backup.log 2>&1") | crontab -
```

### 11.3 Install Monitoring Tools

```bash
# Install basic monitoring tools
apt install -y htop iotop nethogs glances

# Use glances for comprehensive monitoring
# glances
```

## Access URLs

After deployment, access your application at:

- **Frontend**: http://150.241.246.110/
- **Backend API**: http://150.241.246.110/api/
- **Admin Panel**: http://150.241.246.110/admin/
- **Health Check**: http://150.241.246.110/api/health/

## Security Recommendations

1. **Change default passwords** immediately after first login
2. **Set up SSH key authentication** and disable password login
3. **Configure SSL/TLS** as soon as possible (even with self-signed cert initially)
4. **Regular updates**: `apt update && apt upgrade` weekly
5. **Monitor logs** regularly for suspicious activity
6. **Set up fail2ban** to prevent brute force attacks
7. **Consider VPC** if Utho offers it for network isolation
8. **Backup regularly** - database and media files

## Troubleshooting

### Service won't start

```bash
journalctl -u crm-backend.service -n 50
journalctl -u crm-frontend.service -n 50
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
netstat -tuln | grep :3000
# Kill process if needed: kill -9 <PID>
```

---

**Deployment Status**: Ready to execute step-by-step

**Estimated Time**: 2-3 hours for complete setup

**VM IP**: 150.241.246.110