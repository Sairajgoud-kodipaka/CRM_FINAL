'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  MessageSquare, 
  Clock, 
  User, 
  ArrowLeft,
  PhoneCall,
  PhoneMissed,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ArrowRightLeft,
  History,
  Plus,
  Minus,
  Hash,
  Star,
  User2
} from 'lucide-react';
import { telecallingApiService, CallLog as ApiCallLog } from '@/services/telecallingApi';
import { apiService } from '@/lib/api-service';
// Exotel WebRTC service removed
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { WebRTCConfig, CallStatus as WebRTCCallStatus } from '@/types/webrtc';

interface LocalCallLog {
  id: string;
  phone: string;
  name: string;
  duration: number;
  status: 'completed' | 'missed' | 'failed' | 'busy';
  timestamp: string;
  notes?: string;
  disposition?: string;
  recording_url?: string;
}

interface TeamMember {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  avatar?: string;
}

interface CallNotes {
  id: string;
  timestamp: string;
  note: string;
  type: 'call' | 'manual' | 'system';
  duration?: number;
  disposition?: string;
}

function CallPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'answered' | 'ended' | 'failed' | 'busy' | 'no-answer'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callVolume, setCallVolume] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [callQuality, setCallQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [realTimeStatus, setRealTimeStatus] = useState<string>('');
  const [callId, setCallId] = useState<string>('');
  const [callLogs, setCallLogs] = useState<LocalCallLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [isDialing, setIsDialing] = useState(false);
  const [dialingNumber, setDialingNumber] = useState('');
  const [dialPadNumber, setDialPadNumber] = useState('');
  const [showDialPadInCenter, setShowDialPadInCenter] = useState(false);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [callQueue, setCallQueue] = useState<any[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showRecordingPlayer, setShowRecordingPlayer] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<string>('');
  const [callNotes, setCallNotes] = useState<CallNotes[]>([]);
  const [newNote, setNewNote] = useState('');
  const [disposition, setDisposition] = useState('neutral');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showExistingCallDialog, setShowExistingCallDialog] = useState(false);
  const [existingCallId, setExistingCallId] = useState<string>('');
  const [webrtcEnabled, setWebrtcEnabled] = useState(false);
  const [webrtcInitialized, setWebrtcInitialized] = useState(false);
  const [webrtcConfig, setWebrtcConfig] = useState<WebRTCConfig | null>(null);
  
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const connectingTimeout = useRef<NodeJS.Timeout | null>(null);
  const dialingInterval = useRef<NodeJS.Timeout | null>(null);
  const statusPollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Get call parameters from URL
  const phoneNumber = searchParams?.get('phone') || '';
  const customerName = searchParams?.get('name') || 'Unknown';
  const leadId = searchParams?.get('leadId') || '';

  // Debug logging for URL parameters
  console.log('🔍 Call page URL parameters:', {
    phoneNumber,
    customerName,
    leadId,
    fullUrl: typeof window !== 'undefined' ? window.location.href : 'SSR'
  });

  useEffect(() => {
    // Initialize WebRTC
    initializeWebRTC();
    
    // Load call logs and team members
    loadCallLogs();
    loadTeamMembers();
    
    // Load lead data and notes if leadId is provided
    if (leadId) {
      loadLeadData();
    }
    
    // If phone number is provided, start the call process
    if (phoneNumber) {
      initiateCall();
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (connectingTimeout.current) {
        clearTimeout(connectingTimeout.current);
      }
      if (dialingInterval.current) {
        clearInterval(dialingInterval.current);
      }
      if (statusPollingInterval.current) {
        clearInterval(statusPollingInterval.current);
      }
      
      // Cleanup call resources
      setCallId('');
    };
  }, [phoneNumber, leadId]);

  // Keyboard input for dial pad
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      
      // Allow digits, *, #, and special keys
      if (/^[0-9*#]$/.test(key)) {
        setDialPadNumber(prev => prev + key);
      } else if (key === 'Backspace') {
        setDialPadNumber(prev => prev.slice(0, -1));
      } else if (key === 'Enter' && dialPadNumber) {
        handleCallNow();
      } else if (key === 'Escape') {
        setDialPadNumber('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dialPadNumber]);

  const initializeWebRTC = async () => {
    try {
      console.log('🚀 Initializing WebRTC...');
      
      // Get WebRTC configuration from backend
      const response = await telecallingApiService.getWebRTCConfig();
      
      if (response.success && response.config) {
        const config: WebRTCConfig = {
          clientId: response.config.clientId,
          clientSecret: response.config.clientSecret,
          customerId: response.config.customerId,
          appId: response.config.appId,
          userId: response.config.userId,
          sipUsername: response.config.sipUsername,
          sipPassword: response.config.sipPassword,
        };
        
        setWebrtcConfig(config);
        
        // Initialize WebRTC SDK
        const initialized = await exotelWebRTCService.initialize(config);
        
        if (initialized) {
          setWebrtcInitialized(true);
          setWebrtcEnabled(true);
          
          // Setup WebRTC status callbacks
          exotelWebRTCService.onStatusChange((status: WebRTCCallStatus) => {
            console.log('📞 WebRTC Status Update:', status);
            
            // Map WebRTC status to our call status
            switch (status.status) {
              case 'connecting':
                setCallStatus('connecting');
                break;
              case 'ringing':
                setCallStatus('ringing');
                break;
              case 'answered':
                setCallStatus('answered');
                setIsCallActive(true);
                startCallTimer();
                break;
              case 'ended':
                setCallStatus('ended');
                setIsCallActive(false);
                stopCallTimer();
                break;
              case 'failed':
                setCallStatus('failed');
                setIsCallActive(false);
                stopCallTimer();
                break;
              case 'busy':
                setCallStatus('busy');
                setIsCallActive(false);
                stopCallTimer();
                break;
              case 'no-answer':
                setCallStatus('no-answer');
                setIsCallActive(false);
                stopCallTimer();
                break;
            }
            
            // Update call duration
            if (status.duration > 0) {
              setCallDuration(status.duration);
            }
          });
          
          console.log('✅ WebRTC initialized successfully');
        } else {
          console.warn('⚠️ WebRTC initialization failed');
          setWebrtcEnabled(false);
        }
      } else {
        console.warn('⚠️ WebRTC not available:', response.error);
        setWebrtcEnabled(false);
      }
    } catch (error) {
      console.error('❌ Error initializing WebRTC:', error);
      setWebrtcEnabled(false);
    }
  };

  const loadCallLogs = async () => {
    try {
      // Load real call logs from API
      const apiCallLogs = await telecallingApiService.getCallLogs();
      
      // Convert API CallLog to LocalCallLog format
      const localCallLogs: LocalCallLog[] = apiCallLogs.map((log: ApiCallLog) => ({
        id: log.id,
        phone: log.masked_phone || 'Unknown',
        name: log.lead_name || 'Unknown',
        timestamp: log.initiated_at || new Date().toISOString(),
        duration: log.duration || 0,
        status: log.status as 'completed' | 'missed' | 'failed' | 'busy',
        disposition: log.sentiment || 'neutral',
        recording_url: log.recording_url
      }));
      
      setCallLogs(localCallLogs);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogs([]);
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Load real team members from API
      const response = await apiService.get<{results: any[]}>('/users/team-members/');
      if (response.data && response.data.results) {
        const members = response.data.results.map((member: any) => ({
          id: member.user.id,
          name: member.user.name,
          phone: member.user.phone || '',
          status: 'available' as 'busy' | 'available' | 'offline'
        }));
        setTeamMembers(members);
      } else {
        console.warn('No team members found');
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
    }
  };

  // Real-time status polling
  const startStatusPolling = (callRequestId: string) => {
    statusPollingInterval.current = setInterval(async () => {
      try {
        const status = await telecallingApiService.getRealTimeCallStatus(callRequestId);
        setRealTimeStatus(status.status);
        
        // Update Exotel call ID if available
        if (status.exotel_call_id) {
          setExotelCallId(status.exotel_call_id);
        }
        
        // Update call status based on Exotel status
        switch (status.status) {
          case 'initiated':
            setCallStatus('connecting');
            break;
          case 'ringing':
            setCallStatus('ringing');
            break;
          case 'answered':
          case 'in-progress':
            if (callStatus !== 'answered') {
              setCallStatus('answered');
              startCallTimer();
            }
            break;
          case 'completed':
            setCallStatus('ended');
            stopCallTimer();
            setIsCallActive(false);
            stopStatusPolling(); // Stop polling when call is completed
            break;
          case 'failed':
            setCallStatus('failed');
            stopCallTimer();
            setIsCallActive(false);
            stopStatusPolling(); // Stop polling when call fails
            break;
          case 'busy':
            setCallStatus('busy');
            stopCallTimer();
            setIsCallActive(false);
            stopStatusPolling(); // Stop polling when line is busy
            break;
          case 'no-answer':
            setCallStatus('no-answer');
            stopCallTimer();
            setIsCallActive(false);
            stopStatusPolling(); // Stop polling when no answer
            break;
        }
        
        // Update call duration from server
        if (status.duration_seconds) {
          setCallDuration(status.duration_seconds);
        }
        
        // Update recording URL if available
        if (status.recording_url && currentCall) {
          setCurrentCall((prev: any) => ({ ...prev, recording_url: status.recording_url }));
        }
        
      } catch (error: any) {
        console.error('Error polling call status:', error);
        
        // If it's a 404 or the call doesn't exist, stop polling
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('Call not found, stopping status polling');
          stopStatusPolling();
          setCallStatus('ended');
          setIsCallActive(false);
        }
        // For other errors, continue polling but log them
      }
    }, 2000); // Poll every 2 seconds
  };

  const stopStatusPolling = () => {
    if (statusPollingInterval.current) {
      clearInterval(statusPollingInterval.current);
      statusPollingInterval.current = null;
    }
  };

  const loadLeadData = async () => {
    if (!leadId) return;
    
    setIsLoadingNotes(true);
    try {
      const data = await telecallingApiService.getLeadNotes(leadId);
      setLeadData(data);
      
      // Convert API data to call notes format
      const notes: CallNotes[] = [];
      
      // Add status history as notes
      if (data.status_history) {
        data.status_history.forEach((history: any) => {
          notes.push({
            id: history.id,
            timestamp: history.created_at,
            note: history.notes || `Status changed to ${history.status}`,
            type: 'system',
            duration: history.call_duration,
            disposition: history.call_outcome
          });
        });
      }
      
      // Add call logs as notes
      if (data.call_logs) {
        data.call_logs.forEach((log: any) => {
          notes.push({
            id: log.id,
            timestamp: log.call_time,
            note: log.feedback || `Call ${log.call_status}`,
            type: 'call',
            duration: log.call_duration,
            disposition: log.customer_sentiment
          });
        });
      }
      
      // Add call requests as notes
      if (data.call_requests) {
        data.call_requests.forEach((request: any) => {
          if (request.notes) {
            notes.push({
              id: request.id,
              timestamp: request.initiated_at,
              note: request.notes,
              type: 'call',
              duration: request.duration,
              disposition: request.sentiment
            });
          }
        });
      }
      
      setCallNotes(notes);
    } catch (error) {
      console.error('Error loading lead data:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const initiateCall = async () => {
    // Validate leadId before making the API call
    if (!leadId || leadId.trim() === '') {
      console.error('❌ Lead ID is missing or empty');
      setCallStatus('ended');
      setIsConnecting(false);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
      console.error('❌ Lead ID is not a valid UUID:', leadId);
      setCallStatus('ended');
      setIsConnecting(false);
      return;
    }

    console.log('📞 Initiating call with lead ID:', leadId);
    
    setIsConnecting(true);
    setCallStatus('connecting');
    
    // Check if WebRTC is available and initialized
    if (webrtcEnabled && webrtcInitialized && phoneNumber) {
      console.log('🚀 Using WebRTC for direct browser-to-phone calling');
      
      try {
        // Use WebRTC for direct calling
        const success = await exotelWebRTCService.makeCall({
          to: phoneNumber,
          from: webrtcConfig?.userId,
          callType: 'outbound',
          customField: leadId
        });
        
        if (success) {
          console.log('✅ WebRTC call initiated successfully');
          setIsCallActive(true);
          addCallNote(`WebRTC call initiated to ${phoneNumber}`, 'system');
        } else {
          console.error('❌ WebRTC call failed');
          setCallStatus('failed');
          setIsConnecting(false);
          addCallNote(`WebRTC call failed to ${phoneNumber}`, 'system');
        }
      } catch (error) {
        console.error('❌ WebRTC call error:', error);
        setCallStatus('failed');
        setIsConnecting(false);
        addCallNote(`WebRTC call error: ${error}`, 'system');
      }
      
      return;
    }
    
    // Fallback to traditional API calling
    console.log('📞 Using traditional API calling (WebRTC not available)');
    
    // Show connecting message for 2 seconds
    connectingTimeout.current = setTimeout(async () => {
      try {
        // Trigger the actual call
        const response = await telecallingApiService.initiateCall(leadId);

        if (response.status === 'initiated') {
          setCurrentCall(response);
          setCallStatus('ringing');
          setIsCallActive(true);
          setExotelCallId(response.call_request_id);
          
          // Start real-time status polling
          startStatusPolling(response.call_request_id);
          
          // Add call note
          addCallNote(`Call initiated to ${phoneNumber}`, 'system');
        } else if (response.error === 'Call already in progress') {
          // Handle existing call - resume it
          console.log('Resuming existing call:', response.call_id);
          setCurrentCall(response);
          setCallStatus(response.status === 'answered' ? 'answered' : 'ringing');
          setIsCallActive(true);
          setExotelCallId(response.exotel_call_id || '');
          
          // Start polling for the existing call
          startStatusPolling(response.call_request_id || '');
          
          addCallNote(`Resumed existing call to ${phoneNumber}`, 'system');
        } else {
          setCallStatus('failed');
          console.error('Call initiation failed:', response);
          addCallNote(`Call failed: ${response.error_message || response.error || 'Unknown error'}`, 'system');
        }
      } catch (error: any) {
        console.error('Error initiating call:', error);
        setCallStatus('failed');
        setIsConnecting(false);
        
        // Handle specific error cases
        if (error.response?.status === 409 && error.response?.data?.error === 'Call already in progress') {
          // Handle 409 Conflict - existing call
          const responseData = error.response.data;
          console.log('Resuming existing call from 409 response:', responseData);
          
          setCurrentCall(responseData);
          setCallStatus(responseData.status === 'answered' ? 'answered' : 'ringing');
          setIsCallActive(true);
          setExotelCallId(responseData.exotel_call_id || '');
          
          // Start polling for the existing call
          startStatusPolling(responseData.call_request_id || '');
          
          addCallNote(`Resumed existing call to ${phoneNumber}`, 'system');
          return; // Successfully resumed existing call
        } else if (error.message?.includes('Call already in progress')) {
          // Fallback for other error formats
          const callIdMatch = error.message.match(/call_id["']?\s*:\s*["']?([^"',\s]+)/);
          if (callIdMatch) {
            const existingCallId = callIdMatch[1];
            console.log('Found existing call:', existingCallId);
            
            // Try to get the existing call status
            try {
              const existingCallStatus = await telecallingApiService.getRealTimeCallStatus(existingCallId);
              setCurrentCall(existingCallStatus);
              setCallStatus(existingCallStatus.status === 'answered' ? 'answered' : 'connecting');
              setIsCallActive(true);
              setExotelCallId(existingCallStatus.exotel_call_id);
              
              // Start polling for the existing call
              startStatusPolling(existingCallId);
              
              addCallNote(`Resumed existing call to ${phoneNumber}`, 'system');
              return; // Successfully resumed existing call
            } catch (statusError) {
              console.error('Error getting existing call status:', statusError);
            }
          }
          
          // Show dialog to handle existing call
          setExistingCallId(existingCallId);
          setShowExistingCallDialog(true);
          addCallNote(`Call already in progress for ${phoneNumber}. Please end the current call first.`, 'system');
        } else {
          addCallNote(`Call failed: ${error.message || 'Unknown error'}`, 'system');
        }
      } finally {
        setIsConnecting(false);
      }
    }, 2000);
  };

  const startInteractiveDialing = async (number: string) => {
    setDialingNumber(number);
    setIsDialing(true);
    setShowDialPadInCenter(true);
    setCallStatus('connecting');
    
    // Simulate interactive dialing with visual feedback
    let currentDigit = 0;
    const digits = number.split('');
    
    dialingInterval.current = setInterval(() => {
      if (currentDigit < digits.length) {
        setDialPadNumber(prev => prev + digits[currentDigit]);
        currentDigit++;
      } else {
        // Dialing complete, start connection
        clearInterval(dialingInterval.current!);
        setTimeout(() => {
          setIsDialing(false);
          setIsConnecting(true);
          initiateCall();
        }, 1000);
      }
    }, 500); // Dial each digit every 500ms
  };

  const handleCallNow = () => {
    if (dialPadNumber) {
      startInteractiveDialing(dialPadNumber);
    }
  };

  const startCallTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const handleEndCall = async () => {
    try {
      // Check if WebRTC call is active
      if (webrtcEnabled && exotelWebRTCService.isCallActive()) {
        console.log('📞 Ending WebRTC call...');
        const success = await exotelWebRTCService.endCall();
        
        if (success) {
          console.log('✅ WebRTC call ended successfully');
          addCallNote(`WebRTC call ended manually. Duration: ${formatDuration(callDuration)}`, 'call');
        } else {
          console.error('❌ Failed to end WebRTC call');
          addCallNote(`Failed to end WebRTC call`, 'system');
        }
      } else if (currentCall) {
        // Use traditional API call ending
        const callRequestId = currentCall.call_request_id || currentCall.id;
        console.log('Ending traditional call with ID:', callRequestId);
        
        await telecallingApiService.endCall(callRequestId);
        
        // Add call note
        if (callDuration > 0) {
          addCallNote(`Call ended manually. Duration: ${formatDuration(callDuration)}`, 'call');
        }
      } else {
        console.warn('No current call to end');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      addCallNote(`Error ending call: ${error}`, 'system');
    } finally {
      setIsCallActive(false);
      setCallStatus('ended');
      stopCallTimer();
      stopStatusPolling();
      
      // Clear current call
      setCurrentCall(null);
      setExotelCallId('');
    }
  };

  const handleMuteToggle = async () => {
    try {
      // Check if WebRTC call is active
      if (webrtcEnabled && exotelWebRTCService.isCallActive()) {
        const newMuteState = await exotelWebRTCService.toggleMute();
        setIsMuted(newMuteState);
        addCallNote(`Call ${newMuteState ? 'muted' : 'unmuted'}`, 'system');
      } else if (currentCall) {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        
        // Call Exotel API to mute/unmute
        await telecallingApiService.muteCall(currentCall.id, newMuteState);
        addCallNote(`Call ${newMuteState ? 'muted' : 'unmuted'}`, 'system');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      // Revert state on error
      setIsMuted(!isMuted);
    }
  };

  const handleHoldToggle = async () => {
    try {
      // Check if WebRTC call is active
      if (webrtcEnabled && exotelWebRTCService.isCallActive()) {
        const newHoldState = await exotelWebRTCService.toggleHold();
        setIsOnHold(newHoldState);
        addCallNote(`Call ${newHoldState ? 'put on hold' : 'resumed from hold'}`, 'system');
      } else if (currentCall) {
        const newHoldState = !isOnHold;
        setIsOnHold(newHoldState);
        
        // Call Exotel API to hold/resume
        await telecallingApiService.holdCall(currentCall.id, newHoldState);
        addCallNote(`Call ${newHoldState ? 'put on hold' : 'resumed from hold'}`, 'system');
      }
    } catch (error) {
      console.error('Error toggling hold:', error);
      // Revert state on error
      setIsOnHold(!isOnHold);
    }
  };

  const handleVolumeChange = (volume: number) => {
    setCallVolume(volume);
    // In a real implementation, this would control the call volume
  };

  const handleSpeakerToggle = () => {
    setIsSpeakerOn(!isSpeakerOn);
    addCallNote(`Speaker ${!isSpeakerOn ? 'enabled' : 'disabled'}`, 'system');
  };

  const handleStartRecording = async () => {
    try {
      if (currentCall) {
        await telecallingApiService.startRecording(currentCall.id);
        setIsRecording(true);
        setRecordingDuration(0);
        addCallNote('Recording started', 'system');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (currentCall) {
        await telecallingApiService.stopRecording(currentCall.id);
        setIsRecording(false);
        addCallNote('Recording stopped', 'system');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handlePlayRecording = (recordingUrl: string) => {
    setCurrentRecording(recordingUrl);
    setShowRecordingPlayer(true);
  };

  const handleTransfer = async () => {
    if (!selectedTeamMember) return;
    
    try {
      const member = teamMembers.find(m => m.id === selectedTeamMember);
      if (currentCall && member) {
        // Mock transfer - replace with actual API call
        addCallNote(`Call transferred to ${member.name}`, 'system');
        setShowTransferDialog(false);
      }
    } catch (error) {
      console.error('Error transferring call:', error);
    }
  };

  const addCallNote = (note: string, type: 'call' | 'manual' | 'system' = 'manual') => {
    const newNote: CallNotes = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      note,
      type,
      duration: type === 'call' ? callDuration : undefined,
      disposition: type === 'call' ? disposition : undefined
    };
    setCallNotes(prev => [newNote, ...prev]);
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || !leadId) return;
    
    try {
      // Add note via API
      await telecallingApiService.addLeadNote({
        lead_id: leadId,
        note: newNote.trim(),
        status: disposition,
        disposition: disposition,
        follow_up_required: followUpRequired
      });
      
      // Add to local notes
      addCallNote(newNote.trim(), 'manual');
      setNewNote('');
      
      // Reload lead data to get updated notes
      await loadLeadData();
      
    } catch (error) {
      console.error('Error saving note:', error);
      // Still add to local notes as fallback
      addCallNote(newNote.trim(), 'manual');
      setNewNote('');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'missed': return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'busy': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Phone className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Telecaller Interface</h1>
              <p className="text-sm text-gray-600">Call Management System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Call History & Dial Pad */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* Call History */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Call History
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {callLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium text-sm">{log.name}</span>
                      </div>
                      <Badge className={getStatusColor(log.status)} variant="outline">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{log.phone}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatTime(log.timestamp)}</span>
                      {log.duration > 0 && (
                        <span>{formatDuration(log.duration)}</span>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dial Pad - Hide when shown in center */}
            {isCallActive && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Dial Pad</h3>
                <div className="text-center mb-4">
                  <div className="text-2xl font-mono font-bold text-gray-900 mb-2">
                    {dialPadNumber || 'Enter number'}
                  </div>
                  <p className="text-xs text-gray-500">*with mouse and keyboard input*</p>
                </div>

                {/* Dial Pad Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      size="lg"
                      onClick={() => setDialPadNumber(prev => prev + digit)}
                      className="w-16 h-16 text-xl font-bold hover:bg-blue-50"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>

                {/* Dial Pad Actions */}
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialPadNumber(prev => prev.slice(0, -1))}
                    className="flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialPadNumber('')}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleCallNow}
                    disabled={!dialPadNumber || isDialing || isConnecting}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="w-3 h-3" />
                    {isDialing ? 'Dialing...' : 'Call'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Call Controls */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Show Dial Pad in Center when no call is active */}
            {!isCallActive && callStatus === 'idle' && (
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Call</h2>
                  <p className="text-gray-600">Enter a number below to start dialing</p>
                </div>
                
                {/* Center Dial Pad */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-lg mx-auto shadow-lg">
                  <div className="text-center mb-8">
                    <div className="text-4xl font-mono font-bold text-gray-900 mb-3 tracking-wider">
                      {dialPadNumber || 'Enter number'}
                    </div>
                    <p className="text-sm text-gray-500">Click or use keyboard to dial</p>
                  </div>

                  {/* Dial Pad Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        size="lg"
                        onClick={() => setDialPadNumber(prev => prev + digit)}
                        className="w-20 h-20 text-2xl font-bold hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>

                  {/* Dial Pad Actions */}
                  <div className="flex justify-center gap-4 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialPadNumber(prev => prev.slice(0, -1))}
                      className="flex items-center gap-2 px-4 py-2"
                    >
                      <Minus className="w-4 h-4" />
                      Backspace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialPadNumber('')}
                      className="px-4 py-2"
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleCallNow}
                    disabled={!dialPadNumber || isDialing}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Phone className="w-6 h-6 mr-3" />
                    {isDialing ? 'Dialing...' : 'Call Now'}
                  </Button>
                </div>
              </div>
            )}

            {/* Show Dialing Animation */}
            {isDialing && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                    {dialPadNumber}
                  </div>
                  <p className="text-lg text-gray-600">Dialing...</p>
                </div>
                <div className="flex justify-center gap-2 mb-4">
                  {dialPadNumber.split('').map((digit, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-600"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <div className="animate-pulse text-sm text-gray-500">
                  Connecting to {dialingNumber}...
                </div>
              </div>
            )}

            {/* User/Lead Identifier - Show when call is active */}
            {isCallActive && (
              <div className="text-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  {/* Call status indicator ring */}
                  <div className={`absolute inset-0 w-24 h-24 rounded-full mx-auto ${
                    callStatus === 'ringing' ? 'animate-ping bg-yellow-400 opacity-75' :
                    callStatus === 'answered' ? 'animate-pulse bg-green-400 opacity-50' :
                    'hidden'
                  }`}></div>
                </div>
                <div className="text-xl font-bold text-gray-900 mb-2">{customerName}</div>
                <div className="text-lg text-gray-600 font-mono">{phoneNumber}</div>
                {leadId && (
                  <div className="text-xs text-gray-500 mt-1">Lead ID: {leadId.slice(0, 8)}...</div>
                )}
              </div>
            )}

            {/* Call Duration Timer */}
            {isCallActive && (callStatus === 'answered' || callStatus === 'connecting' || callStatus === 'ringing') && (
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg border border-gray-200">
                  <div className="text-5xl font-mono font-bold text-gray-900 mb-3 tracking-wider">
                    {formatDuration(callDuration)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Call Duration</p>
                  
                  {/* Real-time Status */}
                  {realTimeStatus && (
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border">
                        <div className={`w-2 h-2 rounded-full ${
                          realTimeStatus === 'in-progress' ? 'bg-green-500 animate-pulse' :
                          realTimeStatus === 'completed' ? 'bg-blue-500' :
                          realTimeStatus === 'failed' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <span className="text-xs text-gray-600 font-medium capitalize">
                          {realTimeStatus.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Call Quality Indicator */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Quality:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`w-1.5 h-4 rounded-sm ${
                            (callQuality === 'excellent' && bar <= 4) ||
                            (callQuality === 'good' && bar <= 3) ||
                            (callQuality === 'fair' && bar <= 2) ||
                            (callQuality === 'poor' && bar <= 1)
                              ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-medium capitalize">{callQuality}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {isConnecting && (
              <div className="text-center py-8">
                <Skeleton className="w-8 h-8 mx-auto mb-4 rounded-full" />
                <p className="text-lg font-medium text-gray-700">
                  Connecting your call to {phoneNumber}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please wait while we establish the connection...
                </p>
              </div>
            )}

            {/* Call Status Indicators */}
            {isCallActive && (
              <div className="text-center mb-6">
                {/* WebRTC Status Indicator */}
                {webrtcEnabled && (
                  <div className="mb-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      WebRTC Direct Calling
                    </Badge>
                  </div>
                )}
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  callStatus === 'connecting' ? 'bg-blue-100 text-blue-800' :
                  callStatus === 'ringing' ? 'bg-yellow-100 text-yellow-800' :
                  callStatus === 'answered' ? 'bg-green-100 text-green-800' :
                  callStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  callStatus === 'busy' ? 'bg-orange-100 text-orange-800' :
                  callStatus === 'no-answer' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    callStatus === 'connecting' ? 'bg-blue-500 animate-pulse' :
                    callStatus === 'ringing' ? 'bg-yellow-500 animate-pulse' :
                    callStatus === 'answered' ? 'bg-green-500' :
                    callStatus === 'failed' ? 'bg-red-500' :
                    callStatus === 'busy' ? 'bg-orange-500' :
                    callStatus === 'no-answer' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}></div>
                  {callStatus === 'connecting' && 'Connecting...'}
                  {callStatus === 'ringing' && 'Ringing...'}
                  {callStatus === 'answered' && 'Call Connected'}
                  {callStatus === 'failed' && 'Call Failed'}
                  {callStatus === 'busy' && 'Line Busy'}
                  {callStatus === 'no-answer' && 'No Answer'}
                  {callStatus === 'ended' && 'Call Ended'}
                </div>
                
                {/* Prominent End Call Button */}
                {isCallActive && (callStatus === 'answered' || callStatus === 'connecting' || callStatus === 'ringing') && (
                  <div className="mt-6">
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEndCall}
                      className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <PhoneOff className="w-5 h-5" />
                      End Call
                    </Button>
                  </div>
                )}
                
                {/* Exotel Call ID */}
                {exotelCallId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Call ID: {exotelCallId}
                  </p>
                )}
              </div>
            )}

            {/* Recording Indicator */}
            {isCallActive && callStatus === 'answered' && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200 shadow-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording Active</span>
                </div>
              </div>
            )}

            {/* Enhanced Call Control Buttons */}
            {isCallActive && (callStatus === 'answered' || callStatus === 'connecting' || callStatus === 'ringing') && (
              <div className="space-y-6">
                {/* Primary Call Controls */}
                <div className="flex justify-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="lg"
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={handleMuteToggle}
                      className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </Button>
                    <span className="text-xs font-medium text-gray-600">Mute</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="lg"
                      variant={isOnHold ? "secondary" : "outline"}
                      onClick={handleHoldToggle}
                      className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isOnHold ? <Play className="w-7 h-7" /> : <Pause className="w-7 h-7" />}
                    </Button>
                    <span className="text-xs font-medium text-gray-600">Hold</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleSpeakerToggle}
                      className={`w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
                        isSpeakerOn ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      {isSpeakerOn ? <Volume2 className="w-7 h-7 text-blue-600" /> : <VolumeX className="w-7 h-7" />}
                    </Button>
                    <span className="text-xs font-medium text-gray-600">Speaker</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-red-500 hover:bg-red-600"
                    >
                      <PhoneOff className="w-7 h-7" />
                    </Button>
                    <span className="text-xs font-medium text-gray-600">End Call</span>
                  </div>
                </div>

                {/* Secondary Call Controls */}
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTransferDialog(true)}
                      className="px-4 py-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Transfer
                    </Button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCallHistory(true)}
                      className="px-4 py-2 bg-green-50 border-green-200 hover:bg-green-100"
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`px-4 py-2 ${
                        isRecording 
                          ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <div className="w-4 h-4 mr-2 bg-red-500 rounded-full animate-pulse" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 mr-2 bg-gray-400 rounded-full" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-center gap-4">
                  <VolumeX className="w-4 h-4 text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={callVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 w-8">{callVolume}%</span>
                </div>
              </div>
            )}

            {/* Call Disposition */}
            {isCallActive && callStatus === 'answered' && (
              <div className="mt-8 flex items-center gap-4 justify-center">
                <Select value={disposition} onValueChange={setDisposition}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="callback">Callback Required</SelectItem>
                  </SelectContent>
                </Select>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Follow-up required</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Notes */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              
              {/* Lead Details */}
              <div className="space-y-2 mb-6">
                <div className="text-sm">
                  <span className="font-medium">Lead Name:</span> {customerName}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lead ID:</span> {leadId || 'N/A'}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lead Status:</span> 
                  <Badge variant="outline" className="ml-2">Current</Badge>
                </div>
              </div>

              {/* Add Note */}
              <div className="space-y-3 mb-6">
                <Textarea
                  placeholder="Add new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Select value={disposition} onValueChange={setDisposition}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Disposition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="callback">Callback Required</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                      className="rounded"
                    />
                    Follow-up
                  </label>
                </div>
                <Button 
                  onClick={handleSaveNote} 
                  className="w-full"
                  disabled={!newNote.trim() || !leadId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </div>
            </div>

            {/* Notes History */}
            <div>
              <h4 className="font-medium mb-3">Notes History at Every Lead Status</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingNotes ? (
                  <div className="text-center py-8 text-gray-500">
                    <Skeleton className="w-6 h-6 mx-auto mb-2 rounded-full" />
                    <p>Loading notes...</p>
                  </div>
                ) : callNotes.length > 0 ? (
                  callNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {note.type === 'call' && <Phone className="w-4 h-4 text-blue-500" />}
                          {note.type === 'manual' && <FileText className="w-4 h-4 text-green-500" />}
                          {note.type === 'system' && <Clock className="w-4 h-4 text-purple-500" />}
                          <span className="text-xs text-gray-500">
                            {formatTime(note.timestamp)}
                          </span>
                        </div>
                        {note.duration && (
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(note.duration)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                      {note.disposition && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs mt-2 ${
                            note.disposition === 'positive' ? 'text-green-600 border-green-300' :
                            note.disposition === 'negative' ? 'text-red-600 border-red-300' :
                            'text-gray-600 border-gray-300'
                          }`}
                        >
                          {note.disposition}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                    <p className="text-xs">Start adding notes during your call</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Team Member</label>
              <p className="text-xs text-gray-500 mb-3">
                List all available team members so that we can add them if required (this is for faster adding of respective manager or sales - like a call forwarding or conference)
              </p>
              <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getMemberStatusColor(member.status)}`} />
                        <span>{member.name}</span>
                        <span className="text-xs text-gray-500">({member.status})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleTransfer} disabled={!selectedTeamMember}>
                Transfer Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call History Modal */}
      <Dialog open={showCallHistory} onOpenChange={setShowCallHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call History & Recordings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {callLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <h4 className="font-medium">{log.name}</h4>
                      <p className="text-sm text-gray-600">{log.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(log.status)} variant="outline">
                      {log.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(log.timestamp)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {log.duration > 0 && (
                      <span className="text-sm text-gray-600">
                        Duration: {formatDuration(log.duration)}
                      </span>
                    )}
                    {log.disposition && (
                      <Badge variant="outline" className="text-xs">
                        {log.disposition}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {log.notes && (
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        Notes
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePlayRecording(log.recording_url || '')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
                
                {log.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    {log.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recording Player Modal */}
      <Dialog open={showRecordingPlayer} onOpenChange={setShowRecordingPlayer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Playing call recording...</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Play className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Pause className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Minus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '30%'}}></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>0:45</span>
                <span>2:30</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRecordingPlayer(false)}>
                Close
              </Button>
              <Button>
                <Minus className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Call Dialog */}
      <Dialog open={showExistingCallDialog} onOpenChange={setShowExistingCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Already in Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                There's already an active call for this lead.
              </p>
              <p className="text-xs text-gray-500">
                Call ID: {existingCallId}
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowExistingCallDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  try {
                    await telecallingApiService.endExistingCall(existingCallId);
                    setShowExistingCallDialog(false);
                    addCallNote(`Ended existing call ${existingCallId}`, 'system');
                    // Retry the call
                    setTimeout(() => {
                      initiateCall();
                    }, 1000);
                  } catch (error) {
                    console.error('Error ending existing call:', error);
                    addCallNote(`Failed to end existing call: ${error}`, 'system');
                  }
                }}
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End & Retry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallPageContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';

