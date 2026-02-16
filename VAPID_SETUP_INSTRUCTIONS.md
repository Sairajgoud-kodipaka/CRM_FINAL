# VAPID Keys Setup Instructions

## Step 1: Generate VAPID Keys

Run this command in your backend directory:

```bash
cd backend
python generate_vapid_keys.py
```

You will get output like this:
```
VAPID_PRIVATE_KEY=abc123xyz456...
VAPID_PUBLIC_KEY=def789uvw012...
VAPID_CLAIMS_EMAIL=mailto:admin@yourdomain.com
```

**Important:** Paste the **entire** line for `VAPID_PUBLIC_KEY` into your `.env` (it is long, ~120+ characters). If only part is pasted, push will fail with "key conversion failed" or "truncated". Use `python manage.py generate_vapid_keys` to get single-line keys.

## Step 2: Provide the Keys

Copy the three values and send them to me:
1. **VAPID_PRIVATE_KEY** - The private key
2. **VAPID_PUBLIC_KEY** - The public key  
3. **VAPID_CLAIMS_EMAIL** - Replace `yourdomain.com` with your actual domain (e.g., `mailto:admin@jewellerycrm.com`)

## Step 3: I Will Configure

Once you provide the keys, I will:
- ✅ Add them to Django settings
- ✅ Configure environment variables
- ✅ Update Docker configuration (if needed)
- ✅ Test the integration
- ✅ Ensure everything works

## Important Notes

- 🔒 **Keep the private key SECRET** - Never share it publicly
- ✅ The public key is safe to expose
- ✅ Use your real domain email for VAPID_CLAIMS_EMAIL
- ✅ These keys are unique to your application

## Alternative: Manual Setup

If you prefer to set them up manually:

1. **Add to Django settings** (`backend/core/settings.py`):
   ```python
   # VAPID Keys for Web Push Notifications
   VAPID_PRIVATE_KEY = config('VAPID_PRIVATE_KEY', default='')
   VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
   VAPID_CLAIMS_EMAIL = config('VAPID_CLAIMS_EMAIL', default='mailto:admin@yourdomain.com')
   ```

2. **Add to environment variables** (`.env` file or Docker):
   ```env
   VAPID_PRIVATE_KEY=your-private-key-here
   VAPID_PUBLIC_KEY=your-public-key-here
   VAPID_CLAIMS_EMAIL=mailto:admin@yourdomain.com
   ```

But I recommend just providing the keys to me and I'll handle the configuration! 😊

