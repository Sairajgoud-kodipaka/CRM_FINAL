// Real WebRTC Service using Exotel REST API + WebRTC Bridge
import { WebRTCConfig, CallOptions, CallStatus } from '@/types/webrtc';

interface ExotelCallResponse {
  CallSid: string;
  Status: string;
  BridgeUrl?: string;
  RecordingUrl?: string;
  Duration?: number;
}

interface WebRTCBridge {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
}

class RealWebRTCService {
  private config: WebRTCConfig | null = null;
  private currentCall: any = null;
  private callStatusCallbacks: ((status: CallStatus) => void)[] = [];
  private isInitialized = false;
  private bridge: WebRTCBridge = {
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isConnected: false
  };
  private callStartTime: number = 0;
  private durationInterval: NodeJS.Timeout | null = null;

  constructor(options: WebRTCConfig) {
    this.config = options;
    console.log('🚀 Initializing Real WebRTC Service');
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Real WebRTC...');
      
      // Request microphone permission and get local stream
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        console.warn('⚠️ Microphone permission denied');
        return false;
      }
      
      this.isInitialized = true;
      console.log('✅ Real WebRTC initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Real WebRTC:', error);
      return false;
    }
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      this.bridge.localStream = await navigator.mediaDevices.getUserMedia({
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
    if (!this.isInitialized || !this.bridge.localStream) {
      console.error('❌ WebRTC not initialized or no microphone access');
      this.notifyStatusChange({ status: 'failed', duration: 0, error: 'WebRTC not initialized' });
      return null;
    }

    try {
      console.log('📞 Making real WebRTC call to:', options.to);
      
      // Step 1: Initiate call via Exotel REST API
      const exotelResponse = await this.initiateExotelCall(options);
      
      if (!exotelResponse.success) {
        console.error('❌ Exotel call initiation failed:', exotelResponse.error);
        this.notifyStatusChange({ status: 'failed', duration: 0, error: exotelResponse.error });
        return null;
      }

      // Step 2: Create call object
      this.currentCall = {
        id: exotelResponse.callSid,
        to: options.to,
        from: options.from || this.config?.userId,
        status: 'initiated',
        exotelCallId: exotelResponse.callSid,
        bridgeUrl: exotelResponse.bridgeUrl,
        startTime: Date.now()
      };

      this.callStartTime = Date.now();
      this.notifyStatusChange({ status: 'connecting', duration: 0, callId: this.currentCall.id });

      // Step 3: Setup WebRTC bridge if available
      if (exotelResponse.bridgeUrl) {
        await this.setupWebRTCBridge(exotelResponse.bridgeUrl);
      }

      // Step 4: Start monitoring call status
      this.startCallMonitoring();

      return this.currentCall;
    } catch (error) {
      console.error('❌ Failed to make call:', error);
      this.notifyStatusChange({ status: 'failed', duration: 0, error: error.message });
      return null;
    }
  }

  private async initiateExotelCall(options: CallOptions): Promise<{success: boolean, callSid?: string, bridgeUrl?: string, error?: string}> {
    try {
      console.log('📞 Initiating Exotel call...');
      
      // Use Exotel REST API to initiate call
      const response = await fetch('/api/telecalling/webrtc/initiate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          from: options.from || this.config?.userId,
          customField: options.customField,
          webrtcEnabled: true
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Exotel call initiated:', data.callSid);
        return {
          success: true,
          callSid: data.callSid,
          bridgeUrl: data.bridgeUrl
        };
      } else {
        console.error('❌ Exotel call failed:', data.error);
        return {
          success: false,
          error: data.error || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('❌ Exotel API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async setupWebRTCBridge(bridgeUrl: string): Promise<void> {
    try {
      console.log('🌉 Setting up WebRTC bridge...');
      
      // Create RTCPeerConnection for WebRTC bridge
      this.bridge.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream to peer connection
      if (this.bridge.localStream) {
        this.bridge.localStream.getTracks().forEach(track => {
          this.bridge.peerConnection!.addTrack(track, this.bridge.localStream!);
        });
      }

      // Handle remote stream
      this.bridge.peerConnection.ontrack = (event) => {
        console.log('📞 Remote audio stream received');
        this.bridge.remoteStream = event.streams[0];
        this.bridge.isConnected = true;
        
        // Play remote audio
        const audio = new Audio();
        audio.srcObject = this.bridge.remoteStream;
        audio.play().catch(console.error);
      };

      // Handle connection state changes
      this.bridge.peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', this.bridge.peerConnection?.connectionState);
        
        if (this.bridge.peerConnection?.connectionState === 'connected') {
          this.notifyStatusChange({ status: 'answered', duration: 0, callId: this.currentCall.id });
          this.startCallTimer();
        } else if (this.bridge.peerConnection?.connectionState === 'disconnected') {
          this.notifyStatusChange({ status: 'ended', duration: this.getCallDuration(), callId: this.currentCall.id });
        }
      };

      // Connect to Exotel bridge
      await this.connectToBridge(bridgeUrl);
      
    } catch (error) {
      console.error('❌ Failed to setup WebRTC bridge:', error);
    }
  }

  private async connectToBridge(bridgeUrl: string): Promise<void> {
    try {
      console.log('🌉 Connecting to Exotel bridge...');
      
      // Create offer
      const offer = await this.bridge.peerConnection!.createOffer();
      await this.bridge.peerConnection!.setLocalDescription(offer);

      // Send offer to Exotel bridge
      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'offer',
          sdp: offer.sdp
        })
      });

      if (response.ok) {
        const answer = await response.json();
        
        // Set remote description
        await this.bridge.peerConnection!.setRemoteDescription({
          type: 'answer',
          sdp: answer.sdp
        });
        
        console.log('✅ Connected to Exotel bridge');
      }
    } catch (error) {
      console.error('❌ Failed to connect to bridge:', error);
    }
  }

  private startCallMonitoring(): void {
    // Monitor call status via Exotel API
    const monitoringInterval = setInterval(async () => {
      if (!this.currentCall) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        const status = await this.getCallStatus(this.currentCall.exotelCallId);
        
        switch (status.status) {
          case 'ringing':
            this.notifyStatusChange({ status: 'ringing', duration: 0, callId: this.currentCall.id });
            break;
          case 'answered':
            if (this.currentCall.status !== 'answered') {
              this.notifyStatusChange({ status: 'answered', duration: 0, callId: this.currentCall.id });
              this.startCallTimer();
            }
            break;
          case 'completed':
            this.notifyStatusChange({ status: 'ended', duration: this.getCallDuration(), callId: this.currentCall.id });
            clearInterval(monitoringInterval);
            break;
          case 'failed':
            this.notifyStatusChange({ status: 'failed', duration: this.getCallDuration(), callId: this.currentCall.id });
            clearInterval(monitoringInterval);
            break;
          case 'busy':
            this.notifyStatusChange({ status: 'busy', duration: 0, callId: this.currentCall.id });
            clearInterval(monitoringInterval);
            break;
          case 'no-answer':
            this.notifyStatusChange({ status: 'no-answer', duration: 0, callId: this.currentCall.id });
            clearInterval(monitoringInterval);
            break;
        }
      } catch (error) {
        console.error('❌ Error monitoring call:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  private async getCallStatus(callSid: string): Promise<{status: string, duration?: number}> {
    try {
      const response = await fetch(`/api/telecalling/webrtc/call-status/${callSid}/`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error getting call status:', error);
      return { status: 'unknown' };
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
        console.log('📞 Ending real WebRTC call...');
        
        // End call via Exotel API
        await this.endExotelCall(this.currentCall.exotelCallId);
        
        const duration = this.getCallDuration();
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

  private async endExotelCall(callSid: string): Promise<void> {
    try {
      await fetch(`/api/telecalling/webrtc/end-call/${callSid}/`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('❌ Error ending Exotel call:', error);
    }
  }

  async toggleMute(): Promise<boolean> {
    try {
      if (this.bridge.localStream) {
        const audioTrack = this.bridge.localStream.getAudioTracks()[0];
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
    return this.currentCall !== null && this.bridge.isConnected;
  }

  isCallMuted(): boolean {
    if (this.bridge.localStream) {
      const audioTrack = this.bridge.localStream.getAudioTracks()[0];
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
      isConnected: this.bridge.isConnected
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
    
    if (this.bridge.peerConnection) {
      this.bridge.peerConnection.close();
      this.bridge.peerConnection = null;
    }
    
    if (this.bridge.localStream) {
      this.bridge.localStream.getTracks().forEach(track => track.stop());
      this.bridge.localStream = null;
    }
    
    this.bridge.remoteStream = null;
    this.bridge.isConnected = false;
    this.currentCall = null;
    this.callStartTime = 0;
  }

  destroy(): void {
    this.cleanup();
    this.callStatusCallbacks = [];
    this.isInitialized = false;
    console.log('🧹 Real WebRTC service destroyed');
  }
}

// Export singleton instance
export const realWebRTCService = new RealWebRTCService({
  clientId: '',
  clientSecret: '',
  customerId: '',
  appId: '',
  userId: '',
  sipUsername: '',
  sipPassword: ''
});
