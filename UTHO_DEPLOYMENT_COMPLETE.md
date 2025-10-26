# Utho Cloud VM Deployment - Complete Guide

## 📋 Summary of Changes

### ✅ Fixed Issues

1. **Updated requirements.txt**
   - Changed from `psycopg2` to `psycopg2-binary` for easier deployment
   - No compilation needed, no libpq-dev required

2. **Created Missing Files**
   - ✅ `backend/crm-backend.service` - Systemd service file
   - ✅ `backend/nginx_crm.conf` - Nginx configuration
   
3. **Fixed Deployment Script**
   - Added PostgreSQL and Redis checks
   - Fixed paths (changed from `/var/www` to `/home/ubuntu`)
   - Improved error messages
   - Added comprehensive deployment instructions

4. **Updated Dockerfile**
   - Removed unnecessary `build-essential` and `libpq-dev` 
   - Works with `psycopg2-binary`

5. **Fixed Configuration Paths**
   - Updated all references to use `/home/ubuntu/CRM_FINAL` instead of `/var/www/CRM_FINAL`
   - Updated systemd service user to `ubuntu`
   - Updated nginx paths

---

## 🚀 Quick Deployment (Already Set Up Server)

### For Already Configured Server

If you already have the code cloned on your server:

```bash
# Switch to crm-web user
su - crm-web

# Navigate to backend directory
cd ~/backend

# Check if .env exists
ls -la | grep .env

# If no .env file exists, create it
nano .env

# Update with your values:
# DEBUG=False
# SECRET_KEY=your-actual-secret-key
# ALLOWED_HOSTS=YOUR_SERVER_IP
# DB credentials

# Run deployment script
chmod +x utho-deploy.sh
./utho-deploy.sh
```

---

## 🚀 Full Deployment Instructions (New Setup)

### Prerequisites
- Utho Cloud VM (Ubuntu 22.04 recommended)
- Python 3.11 installed
- Root/sudo access
- `crm-web` user created (for running the application)
- `root` user (for system administration)

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Python 3.11 and pip
sudo apt-get install python3.11 python3.11-venv python3.11-dev -y

# Install required system packages
sudo apt-get install postgresql postgresql-contrib postgresql-client -y
sudo apt-get install redis-server nginx -y
sudo apt-get install git curl -y

# Create crm-web user if it doesn't exist
sudo useradd -m -s /bin/bash crm-web
sudo mkdir -p /home/crm-web
sudo chown -R crm-web:crm-web /home/crm-web
```

### Step 2: Clone and Setup Project

```bash
# Switch to crm-web user (if not already)
su - crm-web

# Navigate to home directory
cd ~

# Clone repository (or upload files)
# If cloning as root, move to crm-web:
# mv /root/CRM_FINAL ~/CRM_FINAL

cd backend

# Run deployment script
chmod +x utho-deploy.sh
./utho-deploy.sh
```

### Step 3: Configure Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, create user and database
CREATE USER crm_user WITH PASSWORD 'SecurePassword123!';
CREATE DATABASE jewellery_crm OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE jewellery_crm TO crm_user;
\q
```

### Step 4: Configure Environment Variables

```bash
# Switch to crm-web user if not already
su - crm-web
cd ~/CRM_FINAL/backend

# Edit .env file
nano .env
```

Update these values:
```env
DEBUG=False
SECRET_KEY=your-actual-secret-key-here
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1  # Replace with your server IP
DB_ENGINE=django.db.backends.postgresql
DB_NAME=jewellery_crm
DB_USER=crm_user
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432
```

### Step 5: Setup Systemd Service

```bash
# Copy service file
sudo cp crm-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable crm-backend.service

# Start service
sudo systemctl start crm-backend.service

# Check status
sudo systemctl status crm-backend.service
```

### Step 6: Configure Nginx

```bash
# Copy nginx config
sudo cp nginx_crm.conf /etc/nginx/sites-available/crm-backend

# Create symlink
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

# Remove default nginx config (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 7: Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/api/health/

# Check via public IP
curl http://YOUR_SERVER_IP/api/health/

# Check backend logs
sudo journalctl -u crm-backend.service -f

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📁 File Structure (YOUR ACTUAL SETUP)

```
/home/crm-web/
├── backend/                       # Backend directory ✅
│   ├── manage.py
│   ├── requirements.txt
│   ├── utho-deploy.sh
│   ├── crm-backend.service
│   ├── nginx_crm.conf
│   ├── Dockerfile
│   ├── start.sh
│   ├── venv/
│   ├── logs/
│   ├── media/
│   ├── staticfiles/
│   └── .env (needs to be created)
├── jewellery-crm/                  # Frontend directory
├── crmsales-475507-247bd72ab136.json
├── Initialized
├── staticfiles
├── ssl
└── ... (other project files)
```

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check service status
sudo systemctl status crm-backend.service

# Check logs
sudo journalctl -u crm-backend.service -n 50

# Check if database is accessible
psql -U crm_user -d jewellery_crm -h localhost

# Test database connection from Python
cd /home/crm-web/backend
source venv/bin/activate
python manage.py dbshell
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
curl http://localhost:8000/api/health/

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify nginx config
sudo nginx -t

# Check if gunicorn is listening
sudo netstat -tulpn | grep 8000
```

### Static files not loading

```bash
# Run collectstatic
cd /home/crm-web/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Check permissions
sudo chown -R crm-web:crm-web /home/crm-web/backend/staticfiles
sudo chmod -R 755 /home/crm-web/backend/staticfiles
```

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Test connection
psql -U crm_user -d jewellery_crm -h localhost

# Reset database (if needed)
cd /home/crm-web/backend
source venv/bin/activate
python manage.py flush --noinput
python manage.py migrate
```

---

## 🔒 Security Checklist

- [ ] Changed default `SECRET_KEY` in `.env`
- [ ] Changed default database password
- [ ] Updated `ALLOWED_HOSTS` with actual server IP
- [ ] SSL certificate configured (via Let's Encrypt or Utho)
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key authentication enabled
- [ ] Database backups configured
- [ ] Regular security updates enabled

### Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is automatic
```

---

## 📊 Service Management

### Start/Stop/Restart Backend

```bash
# Start
sudo systemctl start crm-backend.service

# Stop
sudo systemctl stop crm-backend.service

# Restart
sudo systemctl restart crm-backend.service

# Status
sudo systemctl status crm-backend.service

# Enable auto-start on boot
sudo systemctl enable crm-backend.service

# Disable auto-start
sudo systemctl disable crm-backend.service
```

### Viewing Logs

```bash
# Real-time logs
sudo journalctl -u crm-backend.service -f

# Last 100 lines
sudo journalctl -u crm-backend.service -n 100

# Logs since today
sudo journalctl -u crm-backend.service --since today

# Application logs
tail -f /home/crm-web/backend/logs/error.log
```

---

## 🎯 Next Steps

1. **Configure Domain**: Update DNS records to point to your Utho VM IP
2. **SSL Certificate**: Set up HTTPS with Let's Encrypt
3. **Monitoring**: Set up monitoring (Uptime Robot, etc.)
4. **Backups**: Configure automated database backups
5. **Performance**: Tune gunicorn workers based on server resources

---

## 📞 Support

For issues or questions:
- Check logs: `sudo journalctl -u crm-backend.service -f`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Test API directly: `curl http://localhost:8000/api/health/`

---

**Deployment Status**: ✅ Complete and Ready for Production

**Last Updated**: 2025-01-XX

