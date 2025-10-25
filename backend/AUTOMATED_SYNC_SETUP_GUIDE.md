"""
Automated Google Sheets Sync Setup Guide
========================================

This guide explains how to set up fully automated Google Sheets synchronization
that runs without manual intervention.

## What's Been Created

1. **Unified Google Sheets Sync Script** (`unified_google_sheets_sync.py`)
   - Read-only Google Sheets integration
   - Balanced lead assignment
   - Comprehensive logging
   - No manual intervention required

2. **Automated Sync Scheduler** (`automated_sync_scheduler.py`)
   - Django management command for automation
   - Integrates with existing automation system
   - Tracks execution history and statistics

3. **Background Sync Runner** (`background_sync_runner.py`)
   - Runs continuously in background
   - Business hours scheduling (9 AM - 6 PM, Mon-Fri)
   - Automatic retry logic
   - Email notifications on failure

4. **Startup Scripts**
   - `start_automated_sync.bat` (Windows)
   - `start_automated_sync.sh` (Linux/Unix)

## Setup Instructions

### Option 1: Using Django Management Commands (Recommended)

1. **Initial Setup:**
   ```bash
   python manage.py automated_sync_scheduler --setup
   ```

2. **Run Manual Sync (for testing):**
   ```bash
   python manage.py automated_sync_scheduler --run
   ```

3. **Check Status:**
   ```bash
   python manage.py automated_sync_scheduler --status
   ```

4. **Enable/Disable:**
   ```bash
   python manage.py automated_sync_scheduler --enable
   python manage.py automated_sync_scheduler --disable
   ```

### Option 2: Background Service (For Production)

**Windows:**
1. Double-click `start_automated_sync.bat`
2. Or run: `python background_sync_runner.py --interval=30`

**Linux/Unix:**
1. Make executable: `chmod +x start_automated_sync.sh`
2. Run: `./start_automated_sync.sh`
3. Or run: `python3 background_sync_runner.py --interval=30`

### Option 3: System Service (Advanced)

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: "Daily" at 9:00 AM
4. Set action: Start program
5. Program: `python.exe`
6. Arguments: `background_sync_runner.py --interval=30`
7. Start in: `C:\path\to\your\backend\directory`

**Linux (systemd service):**
1. Create service file: `/etc/systemd/system/google-sheets-sync.service`
2. Add configuration:
   ```ini
   [Unit]
   Description=Google Sheets Sync Service
   After=network.target

   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/your/backend
   ExecStart=/usr/bin/python3 background_sync_runner.py --interval=30
   Restart=always
   RestartSec=60

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start:
   ```bash
   sudo systemctl enable google-sheets-sync
   sudo systemctl start google-sheets-sync
   ```

## Configuration

### Environment Variables
- `GOOGLE_SHEETS_CREDENTIALS_JSON`: Service account credentials
- `GOOGLE_SHEETS_ID`: Spreadsheet ID
- `SYNC_ERROR_EMAILS`: Email addresses for error notifications

### Schedule Settings
- **Default**: Every 30 minutes
- **Business Hours**: 9 AM - 6 PM, Monday to Friday
- **Retry Logic**: 3 attempts with 5-minute delays
- **Error Notifications**: Email alerts on failure

## Monitoring

### Check Sync Status
```bash
python manage.py automated_sync_scheduler --status
```

### View Logs
- **Application Logs**: `google_sheets_sync.log`
- **Background Runner Logs**: `background_sync.log`
- **Automated Sync Logs**: `automated_sync_YYYYMMDD.log`

### API Endpoints
- `GET /api/telecalling/google-sheets/status/` - Overall status
- `GET /api/telecalling/google-sheets/sync-status/` - Detailed sync statistics

## Troubleshooting

### Common Issues

1. **"No tenant found"**
   - Solution: Create a tenant first using Django admin

2. **"Google Sheets credentials not found"**
   - Solution: Set `GOOGLE_SHEETS_CREDENTIALS_JSON` environment variable
   - Or place credentials file in the correct location

3. **"No active telecallers found"**
   - Solution: Create telecaller users with role 'tele_calling'

4. **Sync not running automatically**
   - Check if automation is enabled: `python manage.py automated_sync_scheduler --status`
   - Check background runner logs
   - Verify business hours (9 AM - 6 PM, Mon-Fri)

### Manual Override

If you need to run sync manually:
```bash
# Test connection only
python manage.py unified_sheets_sync --test-connection

# Dry run (no data changes)
python manage.py unified_sheets_sync --dry-run

# Full sync
python manage.py unified_sheets_sync
```

## Benefits of This Setup

✅ **Fully Automated**: No manual intervention required
✅ **Optimized**: Runs only during business hours
✅ **Reliable**: Built-in retry logic and error handling
✅ **Monitored**: Comprehensive logging and status tracking
✅ **Scalable**: Handles large volumes of leads efficiently
✅ **Safe**: Read-only Google Sheets access
✅ **Balanced**: Fair lead distribution among telecallers

## Next Steps

1. **Test the setup** with a dry run
2. **Monitor the logs** for the first few days
3. **Adjust the schedule** if needed (change interval in scripts)
4. **Set up email notifications** for error alerts
5. **Configure backup** for the automation system

The system is now fully automated and will sync Google Sheets data every 30 minutes during business hours without any manual intervention!


