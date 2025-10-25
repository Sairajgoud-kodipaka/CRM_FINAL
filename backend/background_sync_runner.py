#!/usr/bin/env python3
"""
Background Google Sheets Sync Runner
===================================

This script runs in the background and automatically executes Google Sheets sync
at regular intervals. It's designed to be run as a background service.

Usage:
    python background_sync_runner.py [--interval=30] [--daemon]
"""

import os
import sys
import time
import signal
import logging
import argparse
from datetime import datetime
from threading import Event

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.utils import timezone

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from automated_sheets_sync import AutomatedSyncService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('background_sync.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class BackgroundSyncRunner:
    """Background runner for automated Google Sheets sync"""
    
    def __init__(self, interval_minutes: int = 30):
        self.interval_minutes = interval_minutes
        self.interval_seconds = interval_minutes * 60
        self.running = True
        self.stop_event = Event()
        self.sync_service = AutomatedSyncService(notify_on_error=True)
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
        self.stop_event.set()
    
    def run(self):
        """Main run loop"""
        logger.info(f"Starting background sync runner (interval: {self.interval_minutes} minutes)")
        
        while self.running:
            try:
                # Check if it's business hours (9 AM to 6 PM, Monday to Friday)
                now = timezone.now()
                if self._is_business_hours(now):
                    logger.info("Starting scheduled sync...")
                    
                    # Run the sync
                    success = self.sync_service.run_automated_sync()
                    
                    if success:
                        logger.info("✅ Background sync completed successfully")
                    else:
                        logger.error("❌ Background sync failed")
                else:
                    logger.info("Outside business hours, skipping sync")
                
                # Wait for next interval or stop signal
                logger.info(f"Waiting {self.interval_minutes} minutes until next sync...")
                if self.stop_event.wait(timeout=self.interval_seconds):
                    break
                    
            except Exception as e:
                logger.error(f"Error in background sync runner: {str(e)}")
                # Wait a bit before retrying
                if self.stop_event.wait(timeout=60):
                    break
        
        logger.info("Background sync runner stopped")
    
    def _is_business_hours(self, now) -> bool:
        """Check if current time is within business hours"""
        # Business hours: 9 AM to 6 PM, Monday to Friday
        weekday = now.weekday()  # 0 = Monday, 6 = Sunday
        hour = now.hour
        
        # Monday to Friday (0-4)
        if weekday < 5:
            # 9 AM to 6 PM
            return 9 <= hour < 18
        
        return False
    
    def stop(self):
        """Stop the background runner"""
        self.running = False
        self.stop_event.set()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Background Google Sheets Sync Runner')
    parser.add_argument('--interval', type=int, default=30,
                       help='Sync interval in minutes (default: 30)')
    parser.add_argument('--daemon', action='store_true',
                       help='Run as daemon (background process)')
    
    args = parser.parse_args()
    
    # Validate interval
    if args.interval < 5:
        logger.error("Interval must be at least 5 minutes")
        sys.exit(1)
    
    # Create and run the background runner
    runner = BackgroundSyncRunner(interval_minutes=args.interval)
    
    try:
        if args.daemon:
            # Run as daemon (background process)
            import daemon
            with daemon.DaemonContext():
                runner.run()
        else:
            # Run in foreground
            runner.run()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down...")
        runner.stop()
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()


