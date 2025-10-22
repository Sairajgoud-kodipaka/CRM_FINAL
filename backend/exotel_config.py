# Exotel Configuration
# Add these settings to your Django settings.py

EXOTEL_CONFIG = {
    'account_sid': 'your_exotel_account_sid',
    'api_key': 'your_exotel_api_key',
    'api_token': 'your_exotel_api_token',
    'agent_number': 'your_agent_phone_number',  # Telecaller's phone number
    'caller_id': 'your_caller_id',  # Display number for outbound calls
    'webhook_url': 'https://yourdomain.com/api/telecalling/webhook/exotel/',
    'webhook_secret': 'your_webhook_secret',
    'record_calls': True,  # Enable call recording
}

# Example configuration for development
# EXOTEL_CONFIG = {
#     'account_sid': 'exotel_account_123',
#     'api_key': 'exotel_api_key_456',
#     'api_token': 'exotel_token_789',
#     'agent_number': '+919876543210',
#     'caller_id': '+919876543210',
#     'webhook_url': 'http://localhost:8000/api/telecalling/webhook/exotel/',
#     'webhook_secret': 'your_webhook_secret_key',
#     'record_calls': True,
# }
