# 🚀 Quick Start Deployment Guide

## Your Current Setup

```
Working Directory: /var/www/CRM_FINAL
User: crm-web
Structure:
├── backend/
├── jewellery-crm/
└── other files
```

## Step-by-Step Deployment

### 1. Navigate to Backend Directory

```bash
cd /var/www/CRM_FINAL/backend
```

### 2. Check .env File

```bash
# Check if .env exists
ls -la | grep .env

# If it doesn't exist, the deployment script will create it
```

### 3. Run Deployment Script

```bash
# Make script executable
chmod +x utho-deploy.sh

# Run deployment script
./utho-deploy.sh
```

### 4. Edit .env File (Important!)

```bash
# After running the script, edit .env
nano .env
```

Update these critical values:
```env
DEBUG=False
SECRET_KEY=CHANGE-THIS-TO-A-SECURE-RANDOM-KEY
ALLOWED_HOSTS=150.241.246.110,localhost,127.0.0.1
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### 5. Setup Database (if not done)

As root user:
```bash
sudo -u postgres psql

# In PostgreSQL:
CREATE USER crm_user WITH PASSWORD 'your_password';
CREATE DATABASE jewellery_crm OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE jewellery_crm TO crm_user;
\q
```

### 6. Install Systemd Service

```bash
# Copy service file
sudo cp /var/www/CRM_FINAL/backend/crm-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable crm-backend.service

# Start service
sudo systemctl start crm-backend.service

# Check status
sudo systemctl status crm-backend.service
```

### 7. Setup Nginx

```bash
# Copy nginx config
sudo cp /var/www/CRM_FINAL/backend/nginx_crm.conf /etc/nginx/sites-available/crm-backend

# Create symlink
sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 8. Test Deployment

```bash
# Test backend health
curl http://localhost:8000/api/health/

# Test via public IP (replace with your IP)
curl http://150.241.246.110/api/health/
```

## Quick Commands

### Start/Stop/Status

```bash
# Start service
sudo systemctl start crm-backend.service

# Stop service
sudo systemctl stop crm-backend.service

# Restart service
sudo systemctl restart crm-backend.service

# Check status
sudo systemctl status crm-backend.service
```

### View Logs

```bash
# System logs
sudo journalctl -u crm-backend.service -f

# Application logs
tail -f /var/www/CRM_FINAL/backend/logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Common Tasks

```bash
# Collect static files
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u crm-backend.service -n 50

# Check database connection
psql -U crm_user -d jewellery_crm -h localhost

# Check permissions
ls -la /var/www/CRM_FINAL/backend/
sudo chown -R crm-web:crm-web /var/www/CRM_FINAL/
```

### Static files not loading

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo chmod -R 755 /var/www/CRM_FINAL/backend/staticfiles
```

### Database errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database
sudo -u postgres psql -l

# Test connection
psql -U crm_user -d jewellery_crm -h localhost
```

## File Structure

```
/var/www/CRM_FINAL/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── utho-deploy.sh
│   ├── crm-backend.service
│   ├── nginx_crm.conf
│   ├── .env
│   ├── venv/
│   ├── logs/
│   ├── media/
│   └── staticfiles/
└── jewellery-crm/
```

## Security Checklist

- [ ] Changed SECRET_KEY in .env
- [ ] Changed database password
- [ ] Updated ALLOWED_HOSTS
- [ ] Firewall configured
- [ ] SSL certificate (if using HTTPS)
- [ ] Backups configured

## Next Steps

1. Test API endpoints
2. Configure domain name
3. Setup SSL certificate
4. Configure backups
5. Setup monitoring

