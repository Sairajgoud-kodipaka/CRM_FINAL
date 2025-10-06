// TypeScript declarations for Exotel WebRTC SDK
declare module '@exotel-npm-dev/webrtc-core-sdk' {
  export interface ExotelWebRTCOptions {
    clientId: string;
    clientSecret: string;
    customerId: string;
    appId: string;
    userId: string;
    sipUsername: string;
    sipPassword: string;
    environment?: 'production' | 'sandbox';
  }

  export interface CallOptions {
    to: string;
    from?: string;
    callType?: 'outbound' | 'inbound';
    customField?: string;
  }

  export interface CallStatus {
    status: 'idle' | 'connecting' | 'ringing' | 'answered' | 'ended' | 'failed' | 'busy' | 'no-answer';
    duration: number;
    callId?: string;
    error?: string;
  }

  export class ExotelWebRTC {
    constructor(options: ExotelWebRTCOptions);
    
    initialize(): Promise<boolean>;
    destroy(): void;
    
    makeCall(options: CallOptions): Promise<any>;
    
    onStatusChange(callback: (status: CallStatus) => void): void;
    offStatusChange(callback: (status: CallStatus) => void): void;
    
    isCallActive(): boolean;
    isCallMuted(): boolean;
    isCallOnHold(): boolean;
    getCallDuration(): number;
    getCurrentCallInfo(): any;
    
    endCall(): Promise<boolean>;
    toggleMute(): Promise<boolean>;
    toggleHold(): Promise<boolean>;
  }

  export default ExotelWebRTC;
}

// Declare audio file modules
declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

