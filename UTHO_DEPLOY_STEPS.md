# Utho Deployment Steps - Notification System

## ✅ What's Already Done

The migration file `0003_notification_metadata_pushsubscription.py` already exists in your repo!

## 🚀 Steps to Deploy on Utho VM

### Step 1: Skip Git Pull (Manual Deployment)

**Since git pull asks for credentials, we'll skip it and install directly:**

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate

# Install the two missing packages for notifications
pip install py-vapid==1.9.0 pywebpush==1.14.0

# The migration file already exists in your backend/apps/notifications/migrations/
# Just run the migration
python manage.py migrate notifications

# Restart backend service
sudo systemctl restart crm-backend.service

# Verify
python manage.py showmigrations notifications
```

You should see:
```
notifications
 [X] 0001_initial
 [X] 0002_alter_notification_type
 [X] 0003_notification_metadata_pushsubscription  ← This is the new one!
```

### Step 2: Generate VAPID Keys (First Time Only)

After the migration succeeds, generate keys for Web Push:

```bash
python manage.py generate_vapid_keys
```

Copy the output keys and add them to your `.env` file:

```bash
nano .env
```

Add these lines:
```
VAPID_PUBLIC_KEY=<paste_public_key>
VAPID_PRIVATE_KEY=<paste_private_key>
VAPID_CLAIMS_EMAIL=mailto:admin@jewelrycrm.com
```

Then restart the service:
```bash
sudo systemctl restart crm-backend.service
```

## 📋 Files Changed (Need to be Committed to Git)

If you haven't committed these yet, do it locally:

```bash
cd K:\Master\CRM_FINAL
git add backend/utho-deploy.sh
git add backend/apps/notifications/consumers.py
git add backend/apps/notifications/routing.py
git add backend/apps/notifications/signals.py
git add backend/apps/notifications/push_service.py
git add backend/apps/notifications/management/commands/generate_vapid_keys.py
git add backend/apps/notifications/migrations/0003_notification_metadata_pushsubscription.py
git add backend/apps/notifications/models.py
git add backend/apps/notifications/views.py
git add jewellery-crm/src/services/notificationWebSocket.ts
git add jewellery-crm/src/lib/web-push.ts
git add jewellery-crm/src/lib/register-sw.ts
git add jewellery-crm/public/sw.js
git add jewellery-crm/public/manifest.json
git add jewellery-crm/public/icon-*.png
git add jewellery-crm/public/icon.svg
git add jewellery-crm/src/lib/notification-router.ts
git add jewellery-crm/src/hooks/useNotifications.tsx
git add jewellery-crm/src/components/notifications/NotificationPanel.tsx

git commit -m "Add real-time notification system with WebSocket and Web Push"
git push
```

Then on Utho VM:
```bash
cd /var/www/CRM_FINAL && git pull && cd backend && source venv/bin/activate && pip install -r requirements.txt && python manage.py migrate && sudo systemctl restart crm-backend.service
```

## 🎉 After Deployment

Generate VAPID keys (first time only):
```bash
python manage.py generate_vapid_keys
```

Add to your `.env`:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CLAIMS_EMAIL=mailto:your-email@example.com
```

Restart service:
```bash
sudo systemctl restart crm-backend.service
```

## ✅ Check Status

```bash
sudo systemctl status crm-backend.service
python manage.py showmigrations notifications
```

You're done! 🎉

