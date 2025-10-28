#!/bin/bash
# Live Log Viewer for Jewellery CRM Services
# Usage: ./show-live-logs.sh

echo "🔍 Choose which logs to view:"
echo ""
echo "  1) All service logs (combined view)"
echo "  2) Backend (Django) logs only"
echo "  3) PostgreSQL logs only"
echo "  4) Redis logs only"
echo "  5) Nginx access logs"
echo "  6) Nginx error logs"
echo "  7) System logs (all systemd)"
echo "  8) Search logs by keyword"
echo ""
read -p "Enter your choice (1-8): " choice

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

case $choice in
    1)
        echo ""
        echo "📊 Showing ALL service logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        trap 'kill $(jobs -p) 2>/dev/null; exit' INT
        sudo journalctl -u crm-backend.service -f --no-pager | sed "s/^/${BLUE}[BACKEND]${NC} /" &
        sudo journalctl -u postgresql -f --no-pager 2>/dev/null | sed "s/^/${GREEN}[POSTGRES]${NC} /" &
        sudo journalctl -u redis-server -f --no-pager 2>/dev/null | sed "s/^/${YELLOW}[REDIS]${NC} /" &
        sudo tail -f /var/log/nginx/access.log 2>/dev/null | sed "s/^/${CYAN}[NGINX]${NC} /" &
        wait
        ;;
    2)
        echo ""
        echo "📊 Showing BACKEND logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        sudo journalctl -u crm-backend.service -f --no-pager
        ;;
    3)
        echo ""
        echo "📊 Showing POSTGRESQL logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        sudo journalctl -u postgresql -f --no-pager
        ;;
    4)
        echo ""
        echo "📊 Showing REDIS logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        sudo journalctl -u redis-server -f --no-pager
        ;;
    5)
        echo ""
        echo "📊 Showing NGINX ACCESS logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        sudo tail -f /var/log/nginx/access.log
        ;;
    6)
        echo ""
        echo "📊 Showing NGINX ERROR logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        sudo tail -f /var/log/nginx/error.log
        ;;
    7)
        echo ""
        echo "📊 Showing ALL SYSTEM logs (Press Ctrl+C to exit)..."
        echo "=========================================="
        sudo journalctl -f --no-pager
        ;;
    8)
        read -p "Enter keyword to search: " keyword
        echo ""
        echo "🔍 Searching logs for: $keyword"
        echo "=========================================="
        sudo journalctl -f --no-pager | grep -i "$keyword" --color=always
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

