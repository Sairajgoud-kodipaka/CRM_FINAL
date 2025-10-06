# WebRTC Integration Setup Guide

This guide explains how to set up and configure WebRTC calling functionality in the CRM system.

## Overview

The WebRTC integration provides direct browser-to-phone calling capabilities using Exotel's WebRTC SDK. The system includes both real SDK integration and a fallback implementation for development and testing.

## Features

- ✅ Direct browser-to-phone calling
- ✅ Real-time call status updates
- ✅ Mute/unmute functionality
- ✅ Hold/resume functionality
- ✅ Call recording support
- ✅ Fallback implementation for development
- ✅ Comprehensive error handling

## Architecture

### Frontend Components

1. **exotelWebRTC.ts** - Main WebRTC service with SDK integration
2. **realWebRTC.ts** - Alternative WebRTC implementation using REST API
3. **webrtc.ts** - TypeScript type definitions
4. **exotel-webrtc.d.ts** - Exotel SDK type declarations

### Backend Components

1. **webrtc_views.py** - WebRTC API endpoints
2. **call_views.py** - WebRTC configuration endpoint
3. **settings.py** - WebRTC configuration

## Configuration

### 1. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Exotel WebRTC Configuration
EXOTEL_WEBRTC_CLIENT_ID=your_client_id
EXOTEL_WEBRTC_CLIENT_SECRET=your_client_secret
EXOTEL_WEBRTC_CUSTOMER_ID=your_customer_id
EXOTEL_WEBRTC_APP_ID=your_app_id
EXOTEL_WEBRTC_USER_ID=your_user_id
EXOTEL_WEBRTC_SIP_USERNAME=your_sip_username
EXOTEL_WEBRTC_SIP_PASSWORD=your_sip_password
EXOTEL_WEBRTC_ENABLED=true
```

### 2. Backend Settings

The WebRTC configuration is automatically loaded from environment variables in `settings.py`:

```python
EXOTEL_CONFIG = {
    # ... existing config ...
    'webrtc_client_id': config('EXOTEL_WEBRTC_CLIENT_ID', default=''),
    'webrtc_client_secret': config('EXOTEL_WEBRTC_CLIENT_SECRET', default=''),
    'webrtc_customer_id': config('EXOTEL_WEBRTC_CUSTOMER_ID', default=''),
    'webrtc_app_id': config('EXOTEL_WEBRTC_APP_ID', default=''),
    'webrtc_user_id': config('EXOTEL_WEBRTC_USER_ID', default=''),
    'webrtc_sip_username': config('EXOTEL_WEBRTC_SIP_USERNAME', default=''),
    'webrtc_sip_password': config('EXOTEL_WEBRTC_SIP_PASSWORD', default=''),
    'webrtc_enabled': config('EXOTEL_WEBRTC_ENABLED', default=False, cast=bool),
}
```

### 3. Frontend Configuration

The frontend automatically fetches WebRTC configuration from the backend:

```typescript
const response = await telecallingApiService.getWebRTCConfig();
```

## Installation

### 1. Install Exotel WebRTC SDK

```bash
cd jewellery-crm
npm install @exotel-npm-dev/webrtc-core-sdk
```

### 2. Update Package Dependencies

The SDK is already included in `package.json`:

```json
{
  "dependencies": {
    "@exotel-npm-dev/webrtc-core-sdk": "^latest"
  }
}
```

## Usage

### 1. Initialize WebRTC

```typescript
import { exotelWebRTCService } from '@/services/exotelWebRTC';

// Initialize WebRTC
const config = await telecallingApiService.getWebRTCConfig();
const initialized = await exotelWebRTCService.initialize(config.config);

if (initialized) {
  console.log('WebRTC initialized successfully');
}
```

### 2. Make a Call

```typescript
// Make a call
const success = await exotelWebRTCService.makeCall({
  to: '+1234567890',
  from: '+0987654321',
  callType: 'outbound',
  customField: 'lead_id_123'
});

if (success) {
  console.log('Call initiated successfully');
}
```

### 3. Handle Call Events

```typescript
// Listen for call status changes
exotelWebRTCService.onStatusChange((status) => {
  console.log('Call status:', status.status);
  console.log('Duration:', status.duration);
  
  switch (status.status) {
    case 'answered':
      console.log('Call answered');
      break;
    case 'ended':
      console.log('Call ended');
      break;
    case 'failed':
      console.log('Call failed:', status.error);
      break;
  }
});
```

### 4. Call Controls

```typescript
// Mute/unmute call
const isMuted = await exotelWebRTCService.toggleMute();

// Hold/resume call
const isOnHold = await exotelWebRTCService.toggleHold();

// End call
const ended = await exotelWebRTCService.endCall();

// Check call status
const isActive = exotelWebRTCService.isCallActive();
const duration = exotelWebRTCService.getCallDuration();
```

## API Endpoints

### WebRTC Endpoints

- `POST /api/telecalling/webrtc/initiate/` - Initiate WebRTC call
- `GET /api/telecalling/webrtc/call-status/{call_sid}/` - Get call status
- `POST /api/telecalling/webrtc/end-call/{call_sid}/` - End call
- `POST /api/telecalling/webrtc/mute-call/{call_sid}/` - Mute/unmute call
- `POST /api/telecalling/webrtc/hold-call/{call_sid}/` - Hold/resume call

### Configuration Endpoint

- `GET /api/telecalling/call-requests/webrtc_config/` - Get WebRTC configuration

## Fallback Implementation

If the Exotel WebRTC SDK is not available or fails to load, the system automatically falls back to a custom implementation that:

- Simulates call progression with realistic timing
- Provides microphone access for audio testing
- Maintains the same API interface
- Logs all operations for debugging

## Browser Requirements

### Supported Browsers

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### Required Permissions

- Microphone access
- HTTPS connection (required for WebRTC)

### Browser Console Logs

The WebRTC service provides comprehensive logging:

```
🚀 Initializing Exotel WebRTC SDK...
✅ Exotel WebRTC SDK loaded successfully
📞 Making WebRTC call to: +1234567890
📞 Call initiated
📞 Call ringing
📞 Call answered
✅ Call ended successfully
```

## Troubleshooting

### Common Issues

1. **SDK Not Loading**
   - Check if `@exotel-npm-dev/webrtc-core-sdk` is installed
   - Verify network connectivity
   - Check browser console for import errors

2. **Microphone Permission Denied**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Test microphone access in browser settings

3. **Configuration Errors**
   - Verify all environment variables are set
   - Check backend logs for configuration issues
   - Ensure Exotel credentials are valid

4. **Call Failures**
   - Check Exotel account status
   - Verify phone number format
   - Review Exotel API logs

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('webrtc-debug', 'true');
```

### Testing

1. **Development Testing**
   - Use fallback implementation
   - Test with mock phone numbers
   - Verify UI interactions

2. **Production Testing**
   - Test with real phone numbers
   - Verify audio quality
   - Test call controls

## Security Considerations

- WebRTC credentials are stored securely in environment variables
- All API calls use HTTPS
- Microphone access is requested only when needed
- Call data is encrypted in transit

## Performance Optimization

- WebRTC SDK is loaded dynamically
- Audio streams are optimized for quality
- Call timers are efficiently managed
- Resources are properly cleaned up

## Support

For issues related to:

- **Exotel SDK**: Contact Exotel support
- **WebRTC Implementation**: Check this guide and code comments
- **Configuration**: Verify environment variables and settings
- **Browser Compatibility**: Test in supported browsers

## Changelog

### v1.0.0
- Initial WebRTC integration
- Exotel SDK support
- Fallback implementation
- Comprehensive API endpoints
- Full call control functionality

