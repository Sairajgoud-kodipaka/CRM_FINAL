// Exotel WebRTC Service for direct browser-to-phone calling
import { WebRTCConfig, CallOptions, CallStatus } from '@/types/webrtc';
import { pureWebRTCService } from './pureWebRTC';

// Real Exotel WebRTC SDK implementation
let ExotelWebRTC: any = null;
let isSDKAvailable = false;

// Load WebRTC implementation (currently using pure implementation)
const loadSDK = async () => {
  if (ExotelWebRTC) return ExotelWebRTC;
  
  try {
    // For now, use pure WebRTC implementation to avoid build issues
    console.log('🔄 Using Pure WebRTC implementation (SDK temporarily disabled)');
    ExotelWebRTC = pureWebRTCService;
    isSDKAvailable = false;
    return ExotelWebRTC;
    
    // TODO: Re-enable Exotel SDK when build issues are resolved
    /*
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('⚠️ WebRTC SDK requires browser environment, using pure WebRTC fallback');
      ExotelWebRTC = pureWebRTCService;
      isSDKAvailable = false;
      return ExotelWebRTC;
    }

    // Try to import the actual Exotel WebRTC SDK
    const { ExotelWebRTC: SDK } = await import('@exotel-npm-dev/webrtc-core-sdk');
    ExotelWebRTC = SDK;
    isSDKAvailable = true;
    console.log('✅ Exotel WebRTC SDK loaded successfully');
    return ExotelWebRTC;
    */
  } catch (error) {
    console.warn('⚠️ WebRTC SDK not available, using pure WebRTC fallback:', error);
    isSDKAvailable = false;
    // Fallback to pure WebRTC implementation
    ExotelWebRTC = pureWebRTCService;
    return ExotelWebRTC;
  }
};

// Custom WebRTC implementation as fallback
class CustomWebRTC {
  private config: WebRTCConfig | null = null;
  private currentCall: any = null;
  private callStatusCallbacks: ((status: CallStatus) => void)[] = [];
  private isInitialized = false;
  private localStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private callStartTime: number = 0;
  private durationInterval: NodeJS.Timeout | null = null;

  constructor(options: WebRTCConfig) {
    this.config = options;
    console.log('Using Custom WebRTC implementation');
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Custom WebRTC...');
      
      // Request microphone permission and get local stream
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        console.warn('⚠️ Microphone permission denied');
        return false;
      }
      
      this.isInitialized = true;
      console.log('✅ Custom WebRTC initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Custom WebRTC:', error);
      return false;
    }
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false
      });
      
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  }

  async makeCall(options: CallOptions): Promise<any> {
    try {
      console.log('📞 Making Custom WebRTC call to:', options.to);
      
      // Create call object
      this.currentCall = {
        id: `call-${Date.now()}`,
        to: options.to,
        from: options.from || this.config?.userId,
        status: 'initiated',
        startTime: Date.now()
      };

      this.callStartTime = Date.now();
      this.notifyStatusChange({ status: 'connecting', duration: 0, callId: this.currentCall.id });

      // Simulate call progression with realistic timing
      setTimeout(() => {
        this.notifyStatusChange({ status: 'ringing', duration: 0, callId: this.currentCall.id });
      }, 1000);

      // Simulate call answered after 3-5 seconds
      setTimeout(() => {
        this.notifyStatusChange({ status: 'answered', duration: 0, callId: this.currentCall.id });
        this.startCallTimer();
      }, 3000 + Math.random() * 2000);

      return this.currentCall;
    } catch (error) {
      console.error('❌ Failed to make call:', error);
      this.notifyStatusChange({ status: 'failed', duration: 0, error: error.message });
      return null;
    }
  }

  private startCallTimer(): void {
    this.durationInterval = setInterval(() => {
      if (this.currentCall && this.currentCall.status === 'answered') {
        const duration = this.getCallDuration();
        this.notifyStatusChange({ 
          status: 'answered', 
          duration, 
          callId: this.currentCall.id 
        });
      }
    }, 1000);
  }

  private stopCallTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  async endCall(): Promise<boolean> {
    try {
      if (this.currentCall) {
        console.log('📞 Ending Custom WebRTC call...');
        const duration = this.getCallDuration();
        
        this.stopCallTimer();
        this.notifyStatusChange({ 
          status: 'ended', 
          duration, 
          callId: this.currentCall.id 
        });
        
        this.cleanup();
        console.log('✅ Call ended successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to end call:', error);
      return false;
    }
  }

  async toggleMute(): Promise<boolean> {
    try {
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          console.log('🔇 Mute toggled:', !audioTrack.enabled);
          return !audioTrack.enabled;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error toggling mute:', error);
      return false;
    }
  }

  async toggleHold(): Promise<boolean> {
    // Hold functionality would pause the audio stream
    console.log('⏸️ Hold toggle (not implemented yet)');
    return false;
  }

  isCallActive(): boolean {
    return this.currentCall !== null && this.currentCall.status === 'answered';
  }

  isCallMuted(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack ? !audioTrack.enabled : false;
    }
    return false;
  }

  isCallOnHold(): boolean {
    return false; // Not implemented yet
  }

  getCallDuration(): number {
    if (this.callStartTime > 0) {
      return Math.floor((Date.now() - this.callStartTime) / 1000);
    }
    return 0;
  }

  getCurrentCallInfo(): any {
    return this.currentCall ? {
      id: this.currentCall.id,
      to: this.currentCall.to,
      from: this.currentCall.from,
      duration: this.getCallDuration(),
      status: this.currentCall.status,
      isMuted: this.isCallMuted(),
      isOnHold: this.isCallOnHold(),
    } : null;
  }

  onStatusChange(callback: (status: CallStatus) => void): void {
    this.callStatusCallbacks.push(callback);
  }

  offStatusChange(callback: (status: CallStatus) => void): void {
    const index = this.callStatusCallbacks.indexOf(callback);
    if (index > -1) {
      this.callStatusCallbacks.splice(index, 1);
    }
  }

  private notifyStatusChange(status: CallStatus): void {
    this.callStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  private cleanup(): void {
    this.stopCallTimer();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.currentCall = null;
    this.callStartTime = 0;
  }

  destroy(): void {
    this.cleanup();
    this.callStatusCallbacks = [];
    this.isInitialized = false;
    console.log('🧹 Custom WebRTC destroyed');
  }
}

class ExotelWebRTCService {
  private webrtc: any = null;
  private isInitialized = false;
  private currentCall: any = null;
  private callStatusCallbacks: ((status: CallStatus) => void)[] = [];
  private config: WebRTCConfig | null = null;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Initialize WebRTC service
   */
  async initialize(config: WebRTCConfig): Promise<boolean> {
    try {
      console.log('🚀 Initializing WebRTC service...');
      
      this.config = config;
      
      // Use pure WebRTC implementation for now
      await pureWebRTCService.initialize(config);
      this.webrtc = pureWebRTCService;
      
      this.isInitialized = true;
      console.log('✅ WebRTC service initialized successfully (using pure implementation)');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC service:', error);
      return false;
    }
  }

  /**
   * Setup event listeners for call events
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Listen for microphone permission changes
      navigator.mediaDevices?.addEventListener('devicechange', () => {
        console.log('🎤 Media devices changed');
      });
    }
  }

  /**
   * Request microphone permissions
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Make a call using WebRTC
   */
  async makeCall(options: CallOptions): Promise<boolean> {
    if (!this.isInitialized || !this.webrtc) {
      console.error('❌ WebRTC SDK not initialized');
      this.notifyStatusChange({ status: 'failed', duration: 0, error: 'SDK not initialized' });
      return false;
    }

    try {
      console.log('📞 Making WebRTC call to:', options.to);
      
      // Update status to connecting
      this.notifyStatusChange({ status: 'connecting', duration: 0 });

      // Make the call
      this.currentCall = await this.webrtc.makeCall({
        to: options.to,
        from: options.from || this.config?.userId,
        callType: options.callType || 'outbound',
        customField: options.customField,
      });

      // Setup call event listeners if using real SDK
      if (isSDKAvailable && this.currentCall) {
        this.setupCallEventListeners(this.currentCall);
      }

      console.log('✅ Call initiated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to make call:', error);
      this.notifyStatusChange({ status: 'failed', duration: 0, error: error.message });
      return false;
    }
  }

  /**
   * Setup event listeners for a specific call
   */
  private setupCallEventListeners(call: any): void {
    if (!call) return;

    // Only setup event listeners if using real SDK
    if (!isSDKAvailable) {
      console.log('📞 Using fallback WebRTC - event listeners handled internally');
      return;
    }

    // Call initiated
    call.on('initiated', () => {
      console.log('📞 Call initiated');
      this.notifyStatusChange({ status: 'connecting', duration: 0, callId: call.id });
    });

    // Call ringing
    call.on('ringing', () => {
      console.log('📞 Call ringing');
      this.notifyStatusChange({ status: 'ringing', duration: 0, callId: call.id });
    });

    // Call answered
    call.on('answered', () => {
      console.log('📞 Call answered');
      this.notifyStatusChange({ status: 'answered', duration: 0, callId: call.id });
      this.startCallTimer();
    });

    // Call ended
    call.on('ended', () => {
      console.log('📞 Call ended');
      this.stopCallTimer();
      this.notifyStatusChange({ status: 'ended', duration: this.getCallDuration(), callId: call.id });
      this.currentCall = null;
    });

    // Call failed
    call.on('failed', (error: any) => {
      console.log('📞 Call failed:', error);
      this.stopCallTimer();
      this.notifyStatusChange({ status: 'failed', duration: this.getCallDuration(), error: error.message });
      this.currentCall = null;
    });

    // Call busy
    call.on('busy', () => {
      console.log('📞 Call busy');
      this.stopCallTimer();
      this.notifyStatusChange({ status: 'busy', duration: this.getCallDuration(), callId: call.id });
      this.currentCall = null;
    });

    // No answer
    call.on('no-answer', () => {
      console.log('📞 No answer');
      this.stopCallTimer();
      this.notifyStatusChange({ status: 'no-answer', duration: this.getCallDuration(), callId: call.id });
      this.currentCall = null;
    });
  }

  /**
   * End the current call
   */
  async endCall(): Promise<boolean> {
    if (!this.currentCall) {
      console.warn('⚠️ No active call to end');
      return false;
    }

    try {
      console.log('📞 Ending call...');
      
      if (isSDKAvailable && this.currentCall.hangup) {
        // Use real SDK method
        await this.currentCall.hangup();
      } else {
        // Use fallback method
        await this.webrtc.endCall();
      }
      
      console.log('✅ Call ended successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to end call:', error);
      return false;
    }
  }

  /**
   * Mute/unmute the call
   */
  async toggleMute(): Promise<boolean> {
    if (!this.currentCall) {
      console.warn('⚠️ No active call to mute');
      return false;
    }

    try {
      if (isSDKAvailable && this.currentCall.mute) {
        // Use real SDK method
        const isMuted = this.currentCall.isMuted();
        await this.currentCall.mute(!isMuted);
        console.log(`🔇 Call ${isMuted ? 'unmuted' : 'muted'}`);
        return !isMuted;
      } else {
        // Use fallback method
        return await this.webrtc.toggleMute();
      }
    } catch (error) {
      console.error('❌ Failed to toggle mute:', error);
      return false;
    }
  }

  /**
   * Hold/unhold the call
   */
  async toggleHold(): Promise<boolean> {
    if (!this.currentCall) {
      console.warn('⚠️ No active call to hold');
      return false;
    }

    try {
      if (isSDKAvailable && this.currentCall.hold) {
        // Use real SDK method
        const isOnHold = this.currentCall.isOnHold();
        await this.currentCall.hold(!isOnHold);
        console.log(`⏸️ Call ${isOnHold ? 'unheld' : 'held'}`);
        return !isOnHold;
      } else {
        // Use fallback method
        return await this.webrtc.toggleHold();
      }
    } catch (error) {
      console.error('❌ Failed to toggle hold:', error);
      return false;
    }
  }

  /**
   * Get call duration
   */
  getCallDuration(): number {
    if (!this.currentCall) return 0;
    
    if (isSDKAvailable && this.currentCall.getDuration) {
      return this.currentCall.getDuration() || 0;
    } else {
      return this.webrtc.getCallDuration();
    }
  }

  /**
   * Check if call is active
   */
  isCallActive(): boolean {
    if (!this.currentCall) return false;
    
    if (isSDKAvailable && this.currentCall.isActive) {
      return this.currentCall.isActive();
    } else {
      return this.webrtc.isCallActive();
    }
  }

  /**
   * Check if call is muted
   */
  isCallMuted(): boolean {
    if (!this.currentCall) return false;
    
    if (isSDKAvailable && this.currentCall.isMuted) {
      return this.currentCall.isMuted();
    } else {
      return this.webrtc.isCallMuted();
    }
  }

  /**
   * Check if call is on hold
   */
  isCallOnHold(): boolean {
    if (!this.currentCall) return false;
    
    if (isSDKAvailable && this.currentCall.isOnHold) {
      return this.currentCall.isOnHold();
    } else {
      return this.webrtc.isCallOnHold();
    }
  }

  /**
   * Add status change callback
   */
  onStatusChange(callback: (status: CallStatus) => void): void {
    this.callStatusCallbacks.push(callback);
  }

  /**
   * Remove status change callback
   */
  offStatusChange(callback: (status: CallStatus) => void): void {
    const index = this.callStatusCallbacks.indexOf(callback);
    if (index > -1) {
      this.callStatusCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify all status change callbacks
   */
  private notifyStatusChange(status: CallStatus): void {
    this.callStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Start call timer
   */
  private startCallTimer(): void {
    // Timer is handled by the SDK internally
    console.log('⏱️ Call timer started');
  }

  /**
   * Stop call timer
   */
  private stopCallTimer(): void {
    console.log('⏱️ Call timer stopped');
  }

  /**
   * Get current call info
   */
  getCurrentCallInfo(): any {
    if (!this.currentCall) return null;
    
    if (isSDKAvailable) {
      return {
        id: this.currentCall.id,
        to: this.currentCall.to,
        from: this.currentCall.from,
        duration: this.getCallDuration(),
        status: this.currentCall.status,
        isMuted: this.isCallMuted(),
        isOnHold: this.isCallOnHold(),
      };
    } else {
      return this.webrtc.getCurrentCallInfo();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.currentCall) {
      if (isSDKAvailable && this.currentCall.hangup) {
        this.currentCall.hangup();
      }
      this.currentCall = null;
    }
    
    if (this.webrtc) {
      this.webrtc.destroy();
      this.webrtc = null;
    }
    
    this.isInitialized = false;
    this.callStatusCallbacks = [];
    console.log('🧹 WebRTC service cleaned up');
  }
}

// Export singleton instance
export const exotelWebRTCService = new ExotelWebRTCService();
