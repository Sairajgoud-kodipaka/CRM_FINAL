'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { telecallingApiService } from '@/services/telecallingApi';

interface CallLog {
  id: string;
  phone: string;
  name: string;
  duration: number;
  status: 'completed' | 'missed' | 'failed' | 'busy';
  timestamp: string;
  notes?: string;
  disposition?: string;
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

export default function CallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'answered' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callNotes, setCallNotes] = useState<CallNotes[]>([]);
  const [newNote, setNewNote] = useState('');
  const [disposition, setDisposition] = useState('neutral');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [dialPadNumber, setDialPadNumber] = useState('');
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [isDialing, setIsDialing] = useState(false);
  const [dialingNumber, setDialingNumber] = useState('');
  const [showDialPadInCenter, setShowDialPadInCenter] = useState(false);
  
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const connectingTimeout = useRef<NodeJS.Timeout | null>(null);
  const dialingInterval = useRef<NodeJS.Timeout | null>(null);

  // Get call parameters from URL
  const phoneNumber = searchParams?.get('phone') || '';
  const customerName = searchParams?.get('name') || 'Unknown';
  const leadId = searchParams?.get('leadId') || '';

  useEffect(() => {
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

  const loadCallLogs = async () => {
    try {
      // Mock call logs - replace with actual API call
      const mockLogs: CallLog[] = [
        {
          id: '1',
          phone: '+919876543210',
          name: 'Rajesh Kumar',
          duration: 180,
          status: 'completed',
          timestamp: '2025-01-06T10:30:00Z',
          notes: 'Interested in gold necklace',
          disposition: 'positive'
        },
        {
          id: '2',
          phone: '+919876543211',
          name: 'Priya Sharma',
          duration: 0,
          status: 'missed',
          timestamp: '2025-01-06T09:15:00Z',
          disposition: 'neutral'
        },
        {
          id: '3',
          phone: '+919876543212',
          name: 'Amit Singh',
          duration: 240,
          status: 'completed',
          timestamp: '2025-01-06T08:45:00Z',
          notes: 'Wants to visit store',
          disposition: 'positive'
        },
        {
          id: '4',
          phone: '+919876543213',
          name: 'Sneha Patel',
          duration: 120,
          status: 'completed',
          timestamp: '2025-01-06T07:20:00Z',
          notes: 'Looking for diamond rings',
          disposition: 'positive'
        },
        {
          id: '5',
          phone: '+919876543214',
          name: 'Vikram Singh',
          duration: 0,
          status: 'busy',
          timestamp: '2025-01-06T06:45:00Z',
          disposition: 'neutral'
        }
      ];
      setCallLogs(mockLogs);
    } catch (error) {
      console.error('Error loading call logs:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Mock team members - replace with actual API call
      const mockMembers: TeamMember[] = [
        {
          id: '1',
          name: 'Rajesh Kumar',
          phone: '+919876543210',
          status: 'available'
        },
        {
          id: '2',
          name: 'Priya Sharma',
          phone: '+919876543211',
          status: 'busy'
        },
        {
          id: '3',
          name: 'Amit Singh',
          phone: '+919876543212',
          status: 'available'
        },
        {
          id: '4',
          name: 'Sneha Patel',
          phone: '+919876543213',
          status: 'available'
        },
        {
          id: '5',
          name: 'Vikram Singh',
          phone: '+919876543214',
          status: 'offline'
        }
      ];
      setTeamMembers(mockMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
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
    setIsConnecting(true);
    setCallStatus('connecting');
    
    // Show connecting message for 2 seconds
    connectingTimeout.current = setTimeout(async () => {
      try {
        // Trigger the actual call
        const response = await telecallingApiService.initiateCall(leadId);

        if (response.status === 'initiated') {
          setCurrentCall(response);
          setCallStatus('ringing');
          setIsCallActive(true);
          
          // Simulate call being answered after 3 seconds
          setTimeout(() => {
            setCallStatus('answered');
            startCallTimer();
          }, 3000);
        } else {
          setCallStatus('ended');
          console.error('Call initiation failed:', response);
        }
      } catch (error) {
        setCallStatus('ended');
        console.error('Error initiating call:', error);
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
      if (currentCall) {
        await telecallingApiService.endCall(currentCall.id);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      setIsCallActive(false);
      setCallStatus('ended');
      stopCallTimer();
      
      // Add call note
      if (callDuration > 0) {
        addCallNote(`Call ended. Duration: ${formatDuration(callDuration)}`, 'call');
      }
    }
  };

  const handleMuteToggle = async () => {
    try {
      if (currentCall) {
        // Mock mute toggle - replace with actual API call
        setIsMuted(!isMuted);
        addCallNote(`Call ${!isMuted ? 'muted' : 'unmuted'}`, 'system');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleHoldToggle = async () => {
    try {
      if (currentCall) {
        // Mock hold toggle - replace with actual API call
        setIsOnHold(!isOnHold);
        addCallNote(`Call ${!isOnHold ? 'put on hold' : 'resumed from hold'}`, 'system');
      }
    } catch (error) {
      console.error('Error toggling hold:', error);
    }
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
                <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                      {dialPadNumber || 'Enter number'}
                    </div>
                    <p className="text-xs text-gray-500">*with mouse and keyboard input*</p>
                  </div>

                  {/* Dial Pad Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        size="lg"
                        onClick={() => setDialPadNumber(prev => prev + digit)}
                        className="w-20 h-20 text-2xl font-bold hover:bg-blue-50"
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>

                  {/* Dial Pad Actions */}
                  <div className="flex justify-center gap-3 mb-4">
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
                  </div>
                  
                  <Button
                    onClick={handleCallNow}
                    disabled={!dialPadNumber || isDialing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                  >
                    <Phone className="w-5 h-5 mr-2" />
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
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-2">{customerName}</div>
                <div className="text-sm text-gray-600">Ph: {phoneNumber}</div>
              </div>
            )}

            {/* Call Duration Timer */}
            {isCallActive && callStatus === 'answered' && (
              <div className="text-center mb-8">
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
                    {formatDuration(callDuration)}
                  </div>
                  <p className="text-sm text-gray-600">Call Duration Timer</p>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {isConnecting && (
              <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700">
                  Connecting your call to {phoneNumber}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please wait while we establish the connection...
                </p>
              </div>
            )}

            {/* Call Control Buttons */}
            {isCallActive && callStatus === 'answered' && (
              <div className="flex justify-center gap-6">
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "outline"}
                  onClick={handleMuteToggle}
                  className="w-20 h-20 rounded-full text-sm"
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  <span className="mt-1">Mute</span>
                </Button>
                
                <Button
                  size="lg"
                  variant={isOnHold ? "secondary" : "outline"}
                  onClick={handleHoldToggle}
                  className="w-20 h-20 rounded-full text-sm"
                >
                  {isOnHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  <span className="mt-1">Hold</span>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowTransferDialog(true)}
                  className="w-20 h-20 rounded-full text-sm bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <ArrowRightLeft className="w-6 h-6" />
                  <span className="mt-1">Transfer</span>
                </Button>
                
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="w-20 h-20 rounded-full text-sm"
                >
                  <PhoneOff className="w-6 h-6" />
                  <span className="mt-1">End</span>
                </Button>
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
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
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
    </div>
  );
}