# How to Discard Local Changes on Utho VM

## Quick Fix: Reset to Match GitHub

Run these commands on your Utho VM:

```bash
cd /var/www/CRM_FINAL

# First, see what local changes exist
git status

# Discard all local changes and reset to match GitHub
git reset --hard origin/main

# Pull latest code from GitHub
git pull

# If git asks for username, use your GitHub username
# Password: use a GitHub Personal Access Token (not your password!)
```

## After Resetting

Continue with deployment:

```bash
cd backend
source venv/bin/activate

# Install notification packages
pip install py-vapid==1.9.0 pywebpush==1.14.0

# Create and run migrations
python manage.py makemigrations notifications
python manage.py migrate

# Restart service
sudo systemctl restart crm-backend.service

# Verify
python manage.py showmigrations notifications
```

You should see all 3 migrations including `0003_notification_metadata_pushsubscription`

## Commands Summary

```bash
cd /var/www/CRM_FINAL
git reset --hard origin/main
git pull
cd backend
source venv/bin/activate
pip install py-vapid==1.9.0 pywebpush==1.14.0
python manage.py makemigrations notifications
python manage.py migrate
sudo systemctl restart crm-backend.service
```

That's it! 🎉

