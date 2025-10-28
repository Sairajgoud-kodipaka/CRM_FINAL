# Notification System Setup Guide

## Quick Setup Script

### For Linux/Mac:
```bash
cd backend
chmod +x setup_notifications.sh
./setup_notifications.sh
```

### For Windows:
```cmd
cd backend
setup_notifications.bat
```

## Manual Setup (If script doesn't work)

### Step 1: Install Python packages
```bash
pip install py-vapid==1.9.0 pywebpush==1.14.0
```

### Step 2: Run migrations
```bash
cd backend
python manage.py makemigrations notifications
python manage.py migrate
```

### Step 3: Generate VAPID keys
```bash
python manage.py generate_vapid_keys
```

You'll see output like:
```
VAPID Keys Generated!
Add these to your .env file:

VAPID_PUBLIC_KEY=BNrGK...xxx
VAPID_PRIVATE_KEY=8xzKL...xxx
VAPID_CLAIMS_EMAIL=mailto:your-email@example.com
```

### Step 4: Update .env file

Add these to your `backend/.env` file:

```env
VAPID_PUBLIC_KEY=<paste_the_public_key_here>
VAPID_PRIVATE_KEY=<paste_the_private_key_here>
VAPID_CLAIMS_EMAIL=mailto:your-email@example.com
```

**Important:** Replace `<paste_the_public_key_here>` and `<paste_the_private_key_here>` with the actual keys generated, and replace `your-email@example.com` with your actual email.

### Step 5: Restart your Django server

After updating the .env file, restart your Django server:
```bash
# If using gunicorn
python manage.py runserver

# Or with your usual command
```

## What This Does

1. **Database Migrations**: Adds the `metadata` field to Notification model and creates PushSubscription model
2. **VAPID Keys**: Generates cryptographic keys for secure Web Push notifications (free, no OneSignal needed)
3. **Environment Variables**: Stores keys securely for backend use

## Verification

After setup, check:
- ✅ Database has new notifications fields
- ✅ .env file has VAPID keys added
- ✅ Django server starts without errors
- ✅ No import errors in Django shell when importing notification models

## Troubleshooting

### "Command not found: python"
Try:
```bash
python3 manage.py makemigrations notifications
python3 manage.py migrate
python3 manage.py generate_vapid_keys
```

### "ModuleNotFoundError: No module named 'py_vapid'"
Install the package:
```bash
pip install py-vapid==1.9.0 pywebpush==1.14.0
```

### "No migrations to create"
This is normal if notifications app already has migrations. Just run:
```bash
python manage.py migrate
```

## Next Steps After Setup

1. **Frontend**: Add WebSocket URL to `.env.local`:
   ```env
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

2. **Test**: Start your app and verify notifications work in real-time

3. **Deploy**: When deploying, add the VAPID keys to your production environment variables

---

**Need help?** Check the main implementation files:
- `backend/apps/notifications/consumers.py` - WebSocket consumer
- `backend/apps/notifications/signals.py` - Real-time broadcasting
- `backend/apps/notifications/models.py` - Database models
- `jewellery-crm/src/services/notificationWebSocket.ts` - Frontend WebSocket client

