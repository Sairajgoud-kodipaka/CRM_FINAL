#!/usr/bin/env bash
# Run appointment reminder notifications (1 hour before).
# Used on Utho production from cron or systemd.
# Usage: run from backend dir, or set BACKEND_DIR.

set -e
BACKEND_DIR="${BACKEND_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$BACKEND_DIR"
if [[ -d "venv" ]]; then
  exec ./venv/bin/python manage.py send_appointment_reminders "$@"
fi
exec python manage.py send_appointment_reminders "$@"
