# 🚀 WhatsApp Integration Setup Guide

Complete guide to integrate WAHA (WhatsApp HTTP API) with your Jewelry CRM.

## 📋 Prerequisites

- Docker installed on your system
- Your Jewelry CRM backend running
- A dedicated phone number for WhatsApp Business

## 🔧 Setup Instructions

### Step 1: Start WAHA WhatsApp Service

```bash
# Start WAHA using Docker Compose
docker-compose -f docker-compose.whatsapp.yml up -d

# Or run directly with Docker
docker run -it -p 3001:3000 devlikeapro/waha
```

### Step 2: Access WAHA Dashboard

1. Open your browser and go to: `http://localhost:3001`
2. You'll see the WAHA dashboard with session management

### Step 3: Create WhatsApp Session

1. In WAHA dashboard, create a new session named `jewelry_crm`
2. Scan the QR code with your WhatsApp Business phone
3. Wait for the session to show "WORKING" status

### Step 4: Configure Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Integration (WAHA)
WAHA_BASE_URL=http://localhost:3001
WAHA_SESSION=jewelry_crm
WAHA_API_KEY=your_api_key_here  # Optional for security
SITE_URL=http://localhost:8000  # Your CRM URL
```

### Step 5: Test Integration

1. Go to your CRM: Business Admin → WhatsApp
2. Check connection status
3. Send a test message

## 📱 Available Features

### ✅ What's Implemented:

1. **Single Messages**: Send WhatsApp messages to individual customers
2. **Bulk Campaigns**: Send marketing messages to multiple customers
3. **Message Templates**: Pre-defined templates for jewelry business
4. **Status Monitoring**: Real-time WhatsApp connection status
5. **Management Commands**: Automated notifications via cron jobs

### 📋 Message Templates:

1. **Appointment Reminders**: Automatic reminders for jewelry consultations
2. **Order Ready**: Notifications when custom jewelry is ready
3. **Payment Reminders**: Gentle reminders for pending payments
4. **New Collections**: Marketing messages for new jewelry launches
5. **Follow-ups**: Personalized follow-up messages for prospects

## 🤖 Automated Notifications

### Set up automated WhatsApp notifications:

```bash
# Send appointment reminders (run daily)
python manage.py send_whatsapp_notifications --type appointments

# Send order notifications (run hourly)
python manage.py send_whatsapp_notifications --type orders

# Send follow-up messages (run weekly)
python manage.py send_whatsapp_notifications --type follow_ups

# Send all types
python manage.py send_whatsapp_notifications --type all
```

### Add to Crontab:

```bash
# Edit crontab
crontab -e

# Add these lines:
0 9 * * * cd /path/to/your/crm && python manage.py send_whatsapp_notifications --type appointments
0 */2 * * * cd /path/to/your/crm && python manage.py send_whatsapp_notifications --type orders
0 10 * * 1 cd /path/to/your/crm && python manage.py send_whatsapp_notifications --type follow_ups
```

## 🔗 API Endpoints

Your CRM now has these WhatsApp endpoints:

- `GET /api/integrations/whatsapp/status/` - Get connection status
- `POST /api/integrations/whatsapp/session/start/` - Start session
- `POST /api/integrations/whatsapp/send/` - Send single message
- `POST /api/integrations/whatsapp/bulk/` - Send bulk messages
- `GET /api/integrations/whatsapp/templates/` - Get message templates
- `POST /api/integrations/webhooks/whatsapp/` - Webhook for incoming messages

## 🎯 Business Use Cases

### Customer Communication:
- **Appointment Booking**: "Your jewelry consultation is confirmed for tomorrow 3 PM"
- **Order Updates**: "Your custom wedding ring is ready for pickup!"
- **Payment Reminders**: "Gentle reminder: EMI payment due tomorrow"

### Marketing Campaigns:
- **New Collections**: Send jewelry collection photos with special offers
- **Festival Offers**: Diwali, Valentine's Day jewelry promotions
- **Customer Segmentation**: Different messages for VIP vs regular customers

### Sales Process:
- **Lead Nurturing**: Follow-up with prospects after store visits
- **Upselling**: "Complete your jewelry set with matching earrings"
- **Feedback Collection**: "How do you like your new jewelry?"

## 📊 Usage Examples

### From Python Code:

```python
from apps.integrations.whatsapp_service import WhatsAppService, JewelryWhatsAppTemplates

# Initialize service
whatsapp = WhatsAppService()

# Send appointment reminder
message = JewelryWhatsAppTemplates.appointment_reminder(
    customer_name="Priya Sharma",
    appointment_date="Tomorrow",
    appointment_time="3:00 PM", 
    store_name="Mandeep Jewellers"
)
whatsapp.send_text_message("+919876543210", message)

# Send new collection promotion with image
whatsapp.send_image_message(
    phone="+919876543210",
    image_url="https://yourstore.com/collections/gold-necklaces.jpg",
    caption=JewelryWhatsAppTemplates.new_collection_launch(
        customer_name="Anjali Patel",
        collection_name="Royal Gold Collection",
        discount="25",
        store_name="Mandeep Jewellers"
    )
)
```

### From Frontend:

Navigate to **Business Admin → WhatsApp** to:
- Monitor connection status
- Send individual messages
- Run bulk campaigns
- View message templates

## 🔒 Security Best Practices

1. **API Key**: Set `WAHA_API_KEY` in production
2. **Firewall**: Restrict WAHA port 3000 to localhost only
3. **HTTPS**: Use HTTPS for webhook endpoints in production
4. **Rate Limiting**: Monitor message sending rates
5. **Phone Verification**: Verify customer phone numbers before sending

## 🐛 Troubleshooting

### Common Issues:

1. **QR Code Not Scanning**:
   - Ensure WhatsApp is updated
   - Try refreshing the WAHA dashboard
   - Use WhatsApp Business if possible

2. **Messages Not Sending**:
   - Check WAHA session status
   - Verify phone number format (+country_code)
   - Check WAHA logs: `docker logs jewelry_crm_whatsapp`

3. **Connection Lost**:
   - WhatsApp may disconnect after inactivity
   - Re-scan QR code in WAHA dashboard
   - Restart WAHA container if needed

### Logs and Monitoring:

```bash
# Check WAHA logs
docker logs jewelry_crm_whatsapp

# Check Django logs for WhatsApp integration
tail -f /path/to/django.log | grep WhatsApp

# Monitor session status
curl http://localhost:3000/api/sessions
```

## 🚀 Next Steps

1. **Start WAHA service** using the Docker command
2. **Scan QR code** to connect your WhatsApp
3. **Test sending** a message from the CRM dashboard
4. **Set up automated** notifications with cron jobs
5. **Train your team** on using WhatsApp features

## 📞 Support

For WAHA-specific issues, visit: https://waha.devlike.pro/
For CRM integration support, check your project documentation.

---

🎉 **Congratulations!** Your Jewelry CRM now has powerful WhatsApp integration for better customer communication and marketing! 💎📱
