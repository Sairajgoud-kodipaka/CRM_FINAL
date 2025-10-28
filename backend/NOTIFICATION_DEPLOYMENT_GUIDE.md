# Notification System Deployment Guide

## What This Deployment Script Does

The updated `utho-deploy.sh` script now:

### ✅ Production-Ready Features

1. **Git Integration** 🔄
   - Pulls latest code automatically
   - Handles authentication (stores credentials for future use)
   - Shows commit history
   - Stashes local changes before pulling

2. **Dependency Management** 📦
   - Checks for required packages: `py-vapid`, `pywebpush`, `channels`, `channels-redis`, `redis`
   - Automatically installs missing packages
   - Updates Python virtual environment

3. **Database Migration** 🗄️
   - Runs migrations for notification system
   - Adds `metadata` field to Notification model
   - Creates `PushSubscription` model

4. **Service Management** 🔧
   - Auto-restarts PostgreSQL service
   - Auto-restarts Redis server
   - Auto-restarts CRM backend service
   - Auto-restarts Nginx
   - Shows service status for each

5. **Health Checks** 🏥
   - Tests database connection
   - Tests Redis connection
   - Tests application API endpoint
   - Shows active network ports

6. **Logs** 📋
   - Displays recent logs for each service
   - Shows service status (running/stopped)
   - Provides commands to view live logs

## How to Deploy on Utho VM

### Step 1: SSH into your Utho VM

```bash
ssh root@YOUR_UTHO_IP
cd /var/www/CRM_FINAL/backend
```

### Step 2: Make script executable

```bash
chmod +x utho-deploy.sh
```

### Step 3: Run the deployment script

```bash
sudo ./utho-deploy.sh
```

The script will:
1. ✅ Pull latest code from Git
2. ✅ Install/update Python dependencies
3. ✅ Run database migrations
4. ✅ Restart all services
5. ✅ Show service status & logs
6. ✅ Run health checks

### Step 4: (First time only) Generate VAPID Keys

After deployment, run:

```bash
python manage.py generate_vapid_keys
```

Copy the keys and add them to your `.env` file:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CLAIMS_EMAIL=mailto:your-email@example.com
```

Then restart the backend service:

```bash
sudo systemctl restart crm-backend.service
```

## Checking Service Status

### View all service logs:

```bash
# Backend logs
sudo journalctl -u crm-backend.service -f

# PostgreSQL logs
sudo journalctl -u postgresql -f

# Redis logs
sudo journalctl -u redis-server -f

# Nginx logs
sudo journalctl -u nginx -f
```

### Check service status:

```bash
sudo systemctl status crm-backend.service
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx
```

## Troubleshooting

### Issue: Git asking for username

**Solution:** The script now handles this automatically. It will:
1. Store your credentials
2. Retry the pull
3. If it still fails, it uses existing code and continues

You can also manually configure Git:

```bash
git config --global credential.helper store
git pull
# Enter username and password once
```

### Issue: Services not restarting

Check if services exist:
```bash
sudo systemctl list-unit-files | grep crm-backend
sudo systemctl list-unit-files | grep postgresql
```

If services don't exist, install them first (see original deployment guide).

### Issue: Database migration errors

Check database connection:
```bash
python manage.py check --database default
```

Check migration status:
```bash
python manage.py showmigrations notifications
```

## What Changed?

The `utho-deploy.sh` script was enhanced to include:

1. ✅ **Git pull functionality** - Automatically fetches latest code
2. ✅ **Package dependency checking** - Verifies required packages are installed
3. ✅ **Service auto-restart** - Restarts all related services
4. ✅ **Health checks** - Tests database, Redis, and API
5. ✅ **Service logs** - Shows recent logs for debugging
6. ✅ **Better error handling** - Handles Git auth, missing packages, etc.

## Quick Deploy Commands

### One-line deployment:

```bash
cd /var/www/CRM_FINAL/backend && sudo ./utho-deploy.sh
```

### View logs after deployment:

```bash
sudo journalctl -u crm-backend.service -n 50 --no-pager
```

### Force service restart:

```bash
sudo systemctl restart crm-backend.service
sudo systemctl restart nginx
```

## Notification System Status

Once deployed, the notification system includes:

✅ **Real-time WebSocket notifications** (instant delivery)  
✅ **Web Push notifications** (background, even when app closed)  
✅ **PWA support** (installable app)  
✅ **Deep linking** (clicks redirect to correct pages)  
✅ **Priority-based delivery** (urgent = instant, low = batched)  
✅ **Role-based routing** (managers vs admins)  

Your CRM is now ready with real-time notifications! 🎉

