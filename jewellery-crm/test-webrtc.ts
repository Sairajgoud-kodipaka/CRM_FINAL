// WebRTC Integration Test Script
// This script tests the WebRTC functionality without requiring a full server setup

import { exotelWebRTCService } from './src/services/exotelWebRTC';
import { WebRTCConfig } from './src/types/webrtc';

// Test configuration
const testConfig: WebRTCConfig = {
  clientId: 'test_client_id',
  clientSecret: 'test_client_secret',
  customerId: 'test_customer_id',
  appId: 'test_app_id',
  userId: 'test_user_id',
  sipUsername: 'test_sip_user',
  sipPassword: 'test_sip_pass'
};

async function testWebRTCIntegration() {
  console.log('🧪 Starting WebRTC Integration Test...\n');

  try {
    // Test 1: Initialize WebRTC
    console.log('1️⃣ Testing WebRTC Initialization...');
    const initialized = await exotelWebRTCService.initialize(testConfig);
    
    if (initialized) {
      console.log('✅ WebRTC initialized successfully');
    } else {
      console.log('❌ WebRTC initialization failed');
      return;
    }

    // Test 2: Setup status change listener
    console.log('\n2️⃣ Testing Status Change Listener...');
    exotelWebRTCService.onStatusChange((status) => {
      console.log(`📞 Status Update: ${status.status} (Duration: ${status.duration}s)`);
    });
    console.log('✅ Status change listener registered');

    // Test 3: Test call initiation (simulated)
    console.log('\n3️⃣ Testing Call Initiation...');
    const callSuccess = await exotelWebRTCService.makeCall({
      to: '+1234567890',
      from: '+0987654321',
      callType: 'outbound',
      customField: 'test_lead_123'
    });

    if (callSuccess) {
      console.log('✅ Call initiated successfully');
    } else {
      console.log('❌ Call initiation failed');
    }

    // Test 4: Test call controls
    console.log('\n4️⃣ Testing Call Controls...');
    
    // Wait a bit for call to be "answered"
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isActive = exotelWebRTCService.isCallActive();
    console.log(`📞 Call Active: ${isActive}`);

    if (isActive) {
      // Test mute
      const muteResult = await exotelWebRTCService.toggleMute();
      console.log(`🔇 Mute Toggle: ${muteResult}`);

      // Test hold
      const holdResult = await exotelWebRTCService.toggleHold();
      console.log(`⏸️ Hold Toggle: ${holdResult}`);

      // Test duration
      const duration = exotelWebRTCService.getCallDuration();
      console.log(`⏱️ Call Duration: ${duration}s`);
    }

    // Test 5: Test call ending
    console.log('\n5️⃣ Testing Call Ending...');
    const endResult = await exotelWebRTCService.endCall();
    
    if (endResult) {
      console.log('✅ Call ended successfully');
    } else {
      console.log('❌ Call ending failed');
    }

    // Test 6: Test cleanup
    console.log('\n6️⃣ Testing Cleanup...');
    exotelWebRTCService.cleanup();
    console.log('✅ WebRTC service cleaned up');

    console.log('\n🎉 WebRTC Integration Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testWebRTCIntegration();
} else {
  // Node.js environment
  console.log('⚠️ This test requires a browser environment with WebRTC support');
  console.log('Run this test in the browser console or in a test environment');
}

export { testWebRTCIntegration };

