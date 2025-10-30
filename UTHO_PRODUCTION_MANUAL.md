## Utho Production Manual (SDLC Stage: Production)

This document captures our live Utho VM production setup, what is currently running, and the exact procedures/commands used to deploy, operate, and troubleshoot the Jewellery CRM backend in production.

---

### 1) What is live today (Production state)
- Backend: Django running via Gunicorn, managed by systemd
  - Service: `/etc/systemd/system/crm-backend.service`
  - App root: `/var/www/CRM_FINAL/backend`
  - Virtualenv: `/var/www/CRM_FINAL/backend/venv`
  - WSGI: `core.wsgi:application`
- Web server: Nginx reverse proxy
  - Files: `/etc/nginx/nginx.conf`, `/etc/nginx/sites-enabled/crm-backend`, `/etc/nginx/sites-enabled/api-sslip.io.conf`
  - HTTPS:
    - `api.150.241.246.110.sslip.io` → Let’s Encrypt certificate (Certbot managed)
    - `150.241.246.110` → self-signed certificate (as configured in `crm-backend`)
- Database: PostgreSQL on localhost (DB name `jewellery_crm`, user `crm_user`)
- Cache/Channels broker: Redis on localhost (`127.0.0.1:6379`)
- Static: served by Nginx from `/var/www/CRM_FINAL/backend/staticfiles/` (collected)
- Media: served by Nginx from `/var/www/CRM_FINAL/backend/media/`
- Environment file: `/var/www/CRM_FINAL/backend/.env` (loaded by `decouple` in `core/settings.py`)
- WebSockets routing: configured via `core/asgi.py` and Nginx `/ws/` location
  - Note: Current systemd starts Gunicorn with WSGI. For full Channels/WebSockets production, consider ASGI server (uvicorn/daphne). Current Nginx is prepared for `/ws/`.

---

### 2) Key configuration snapshots (for reference)
- Django settings: `backend/core/settings.py`
  - `DEBUG=False`, `ALLOWED_HOSTS` includes `api.150.241.246.110.sslip.io`, `150.241.246.110`, `localhost`, `127.0.0.1`, `jewel-crm.vercel.app`
  - PostgreSQL (local), Redis (local), Whitenoise in production
  - Channels configured with Redis
- Systemd (Gunicorn): `/etc/systemd/system/crm-backend.service`
  - Binds to `127.0.0.1:8000`, 3 workers, preload, logs to `/var/www/CRM_FINAL/backend/logs/`
- Nginx sites:
  - `api-sslip.io.conf`: HTTPS vhost for `api.150.241.246.110.sslip.io` with Certbot
  - `crm-backend`: HTTPS vhost for `150.241.246.110` (self-signed), HTTP → HTTPS redirect, static/media locations, `/ws/` upgrade rules
- .env highlights (`/var/www/CRM_FINAL/backend/.env`):
  - DB creds, `ALLOWED_HOSTS`, CORS/CSRF origins, `PORT=8000`, Redis host/port, VAPID keys (for web push), `DJANGO_SETTINGS_MODULE=core.settings`

---

### 3) One-time initial setup (fresh server)
```bash
# Update and install base packages
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev \
  postgresql postgresql-contrib postgresql-client redis-server \
  nginx git curl

# Create project directories (if not already present)
sudo mkdir -p /var/www/CRM_FINAL/backend
sudo mkdir -p /var/www/CRM_FINAL/backend/logs
sudo mkdir -p /var/www/CRM_FINAL/backend/media
sudo mkdir -p /var/www/CRM_FINAL/backend/staticfiles

# Create and activate virtualenv
cd /var/www/CRM_FINAL/backend
python3.11 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install --upgrade pip wheel
pip install -r requirements.txt

# Create PostgreSQL DB and user (adjust password securely)
sudo -u postgres psql <<'SQL'
CREATE USER crm_user WITH PASSWORD 'SecurePassword123!';
CREATE DATABASE jewellery_crm OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE jewellery_crm TO crm_user;
\q
SQL

# Create .env
nano /var/www/CRM_FINAL/backend/.env
# Populate with production values (see section 2)

# Django migrations & collectstatic
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

---

### 4) Systemd service (Gunicorn)
File already installed at `/etc/systemd/system/crm-backend.service`. To (re)load and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable crm-backend.service
sudo systemctl start crm-backend.service
sudo systemctl status crm-backend.service
```

Manage thereafter:
```bash
sudo systemctl restart crm-backend.service
sudo journalctl -u crm-backend.service -f
```

---

### 5) Nginx reverse proxy
Active configs:
- `/etc/nginx/nginx.conf`
- `/etc/nginx/sites-enabled/crm-backend` (HTTPS for `150.241.246.110` + static/media + /ws)
- `/etc/nginx/sites-enabled/api-sslip.io.conf` (HTTPS for `api.150.241.246.110.sslip.io`, Certbot)

Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

### 6) TLS/SSL
- Let’s Encrypt (Certbot) is configured for `api.150.241.246.110.sslip.io`:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
# Example issuance (already done for sslip.io host):
# sudo certbot --nginx -d api.150.241.246.110.sslip.io
sudo systemctl reload nginx
sudo certbot renew --dry-run
```
- Self-signed cert is configured for direct IP `150.241.246.110` in `crm-backend` vhost.
- Recommended: use a real domain with Let’s Encrypt for primary access.

---

### 7) Routine deployment/update procedure
```bash
# 1) SSH to server
ssh root@150.241.246.110

# 2) Go to backend and activate venv
cd /var/www/CRM_FINAL/backend
source venv/bin/activate

# 3) Update code (if git is configured) or sync via your CI/CD
# If git pull is not used (auth issues), sync files via your preferred method.
# Example with git (if set up):
# git pull

# 4) Install/upgrade dependencies
pip install -r requirements.txt

# 5) Run migrations and collectstatic
python manage.py migrate
python manage.py collectstatic --noinput

# 6) Restart backend service
sudo systemctl restart crm-backend.service

# 7) Verify
sudo systemctl status crm-backend.service
curl -k https://150.241.246.110/health/
curl -k https://api.150.241.246.110.sslip.io/health/
```

If using notifications (Web Push) for the first time:
```bash
python manage.py generate_vapid_keys
# Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CLAIMS_EMAIL to .env
sudo systemctl restart crm-backend.service
```

---

### 8) Operations commands (quick reference)
- Backend service:
```bash
sudo systemctl start crm-backend.service
sudo systemctl stop crm-backend.service
sudo systemctl restart crm-backend.service
sudo systemctl status crm-backend.service
sudo journalctl -u crm-backend.service -n 100
sudo journalctl -u crm-backend.service -f
```

- Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

- Database:
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
psql -U crm_user -d jewellery_crm -h localhost
```

- Redis:
```bash
sudo systemctl status redis-server
ss -tulpen | awk 'NR==1 || /:(6379)\b/'
```

---

### 9) Verification & health
```bash
# Health endpoint (Nginx level)
curl -k https://150.241.246.110/health/
curl -k https://api.150.241.246.110.sslip.io/health/

# App sanity checks
curl -s http://127.0.0.1:8000/ | head -n 5
```

---

### 10) Troubleshooting
- Backend running but 502 at Nginx:
```bash
curl http://127.0.0.1:8000/health/
sudo systemctl status crm-backend.service
sudo journalctl -u crm-backend.service -n 100
sudo tail -f /var/log/nginx/error.log
```

- Static files not served:
```bash
python manage.py collectstatic --noinput
sudo nginx -t && sudo systemctl reload nginx
```

- Database connection issues:
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
psql -U crm_user -d jewellery_crm -h localhost
```

- Redis/Channels issues:
```bash
sudo systemctl status redis-server
ss -tulpen | awk 'NR==1 || /:(6379)\b/'
```

- WebSockets not connecting:
  - Nginx `/ws/` is configured to upgrade. The application is currently served via Gunicorn (WSGI). For production-grade WebSockets (Channels), run an ASGI server (e.g., `uvicorn` or `daphne`) and update systemd `ExecStart` accordingly.

---

### 11) Security checklist (production)
- Rotate and store secrets securely (`SECRET_KEY`, DB password, VAPID keys)
- Restrict `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` to exact domains
- Keep system packages updated (`unattended-upgrades` recommended)
- Ensure firewall open only for 80/443 (public), 22 (SSH), others local
- Enable automatic Certbot renewals and monitor
- Backups for PostgreSQL

---

### 12) Notes and current warnings
- Log excerpt shows:
  - `ERROR Google Sheets credentials not found ... /var/www/CRM_FINAL/crmsales-475507-247bd72ab136.json`
  - If Google Sheets sync is required, place the JSON at the expected path or set env var to its contents/path.
- Rootless service user is recommended for least privilege. Current unit runs as `root`; consider switching to a dedicated user and adjusting file permissions.

---

### 13) Appendix: file paths
- Project root: `/var/www/CRM_FINAL`
- Backend root: `/var/www/CRM_FINAL/backend`
- venv: `/var/www/CRM_FINAL/backend/venv`
- Logs: `/var/www/CRM_FINAL/backend/logs`
- Static: `/var/www/CRM_FINAL/backend/staticfiles`
- Media: `/var/www/CRM_FINAL/backend/media`
- systemd unit: `/etc/systemd/system/crm-backend.service`
- Nginx: `/etc/nginx/nginx.conf`, `/etc/nginx/sites-enabled/`
- Env: `/var/www/CRM_FINAL/backend/.env`
