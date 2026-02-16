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

## ⏰ Appointment reminder cron (production)

Appointment reminders (“1 hour before”) run automatically via a **systemd timer** (recommended) or **cron**.

### Option A: Systemd timer (implemented in deploy script)

**No manual setup needed.** When you run `sudo bash utho-deploy.sh`, the script automatically installs and enables the timer (Step 9b). Every deploy keeps it running.

- Runs every **15 minutes** (first run 2 minutes after boot).
- Logs: `sudo journalctl -u crm-appointment-reminders.service -f`
- Status: `sudo systemctl list-timers crm-appointment-reminders.timer`

**Manual one-time setup** (only if you are not using the deploy script):

```bash
# From project root (e.g. /var/www/CRM_FINAL)
sudo cp backend/deploy/utho/crm-appointment-reminders.service /etc/systemd/system/
sudo cp backend/deploy/utho/crm-appointment-reminders.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable crm-appointment-reminders.timer --now
```

### Option B: Cron

```bash
sudo cp backend/deploy/utho/cron.d/crm-appointment-reminders /etc/cron.d/
sudo chmod 644 /etc/cron.d/crm-appointment-reminders
```

- Log file: `/var/log/crm-reminders.log` (create with `sudo touch /var/log/crm-reminders.log` if needed).

### Manual test

```bash
cd /var/www/CRM_FINAL/backend
./venv/bin/python manage.py send_appointment_reminders
```

### Why this does not spam users

- The **timer** runs every 15 minutes (it only *checks*).
- The **command** only sends a reminder for appointments that are **~1 hour away** (default window: 50–70 minutes from now) and have **not** had a reminder yet (`reminder_sent=False`).
- After sending, it sets `reminder_sent=True` on that appointment, so the next run skips it.
- **Result:** each appointment generates **at most one** reminder to the assignee/creator.

### Example scenario

| Time (today) | Timer runs? | Appointment: Priya at **10:00 AM** |
|--------------|-------------|-------------------------------------|
| 8:00         | Yes         | 10:00 is 2 hours away → not in 50–70 min window → **no notification** |
| 8:15         | Yes         | Still outside window → **no notification** |
| 8:50         | Yes         | 10:00 is 70 min away → in window, `reminder_sent=False` → **one notification**: “Reminder: Priya in 1 hour”. Then `reminder_sent=True`. |
| 9:05         | Yes         | 10:00 is 55 min away but `reminder_sent=True` → **no new notification** |
| 9:20, 9:35…  | Yes         | Same appointment skipped every time → **no spam** |

So the user gets **one** reminder per appointment, about 1 hour before.

---

## 📝 Quick Commands Reference

```bash
# View backend logs
sudo journalctl -u crm-backend.service -f

# Restart backend
sudo systemctl restart crm-backend.service

# Restart ALL services (one command)
sudo systemctl restart crm-backend.service nginx.service postgresql.service redis.service 2>/dev/null; echo "✅ All services restarted"

# Check service status
sudo systemctl status crm-backend.service

# Check all services status
sudo systemctl status crm-backend.service nginx.service postgresql.service redis.service

# Appointment reminder timer (if enabled)
sudo systemctl status crm-appointment-reminders.timer
sudo journalctl -u crm-appointment-reminders.service -n 20

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

