# Fix Git Authentication on Utho VM

## Current Issue: Divergent Branches

You have local changes on the server that conflict with the remote. Here's how to fix:

### Solution 1: Merge (Recommended)

```bash
cd /var/www/CRM_FINAL

# Configure git to merge on pull
git config pull.rebase false

# Pull the changes
git pull

# If there are merge conflicts, resolve them or:
git reset --hard origin/main  # This will discard local changes!
```

### Solution 2: Force Update to Remote (Quickest)

If you don't need the local server changes:

```bash
cd /var/www/CRM_FINAL
git fetch origin
git reset --hard origin/main
```

This will make your server exactly match the GitHub repo.

### Solution 3: Rebase (Keep Local Changes)

If you have important local changes on the server:

```bash
cd /var/www/CRM_FINAL
git config pull.rebase true
git pull --rebase
```

If that doesn't work, then run:

```bash
# Configure git to use the public repo without authentication
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git config --global credential.helper ""
export GIT_TERMINAL_PROMPT=0
git pull
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub details.

## What's Happening

The git pull is asking for credentials because:
1. Your repo might be private (requires auth)
2. Credentials were cached before but expired
3. Git is trying to authenticate even for public repos

## Solution Options

### Option 1: Skip Git Pull (What You're Doing Now)
You're already installing the packages manually - this works! Just continue with:
```bash
pip install py-vapid==1.9.0 pywebpush==1.14.0
python manage.py migrate notifications
```

### Option 2: Fix Git Authentication
If you want to use git pull in future deployments, fix the auth issue above.

### Option 3: Use SSH Instead of HTTPS
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

Then setup SSH keys on the server.

## Current Status

You have:
- ✅ Packages installed (py-vapid, pywebpush)
- ❌ Migration file missing on server

The migration file `0003_notification_metadata_pushsubscription.py` needs to be on the server!

## Manual Workaround: Create Migration on Server

Since you can't git pull, create the migration file directly on the server:

```bash
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py makemigrations notifications
python manage.py migrate notifications
```

This will create the migration for you!

