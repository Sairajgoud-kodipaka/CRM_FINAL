// TypeScript interfaces for Exotel WebRTC
export interface WebRTCConfig {
  clientId: string;
  clientSecret: string;
  customerId: string;
  appId: string;
  userId: string;
  sipUsername: string;
  sipPassword: string;
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

