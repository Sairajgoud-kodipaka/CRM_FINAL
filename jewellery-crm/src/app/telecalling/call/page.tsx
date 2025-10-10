'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users, 
  MessageSquare, 
  Clock, 
  User, 
  ArrowLeft,
  PhoneCall,
  PhoneMissed,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  Settings,
  ArrowRightLeft,
  UserPlus,
  History,
  Plus,
  Minus,
  Hash,
  Star
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

function CallPageContent() {
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
  const [showCallLogs, setShowCallLogs] = useState(false);
  const [dialPadNumber, setDialPadNumber] = useState('');
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const connectingTimeout = useRef<NodeJS.Timeout | null>(null);

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
    };
  }, [phoneNumber, leadId]);

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
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold text-gray-900">Call Center</h1>
              <p className="text-sm text-gray-600">Manage calls and customer interactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCallLogs(true)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Call Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Call Panel */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Call Status Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{customerName}</h2>
                    <p className="text-gray-600">{phoneNumber}</p>
                  </div>
                  <div className="ml-auto">
                    {isConnecting && (
                      <Badge variant="secondary" className="animate-pulse">
                        Connecting...
                      </Badge>
                    )}
                    {callStatus === 'ringing' && (
                      <Badge variant="secondary" className="animate-pulse">
                        Ringing
                      </Badge>
                    )}
                    {callStatus === 'answered' && (
                      <Badge variant="default" className="bg-green-500">
                        Connected
                      </Badge>
                    )}
                    {callStatus === 'ended' && (
                      <Badge variant="destructive">
                        Call Ended
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Connection Message */}
                {isConnecting && (
                  <div className="text-center py-8">
                    <div className="opacity-50 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">
                      Connecting your call to {phoneNumber}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please wait while we establish the connection...
                    </p>
                  </div>
                )}

                {/* Call Controls */}
                {isCallActive && callStatus === 'answered' && (
                  <div className="space-y-6">
                    {/* Call Duration */}
                    <div className="text-center">
                      <div className="text-3xl font-mono font-bold text-gray-900">
                        {formatDuration(callDuration)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Call Duration</p>
                    </div>

                    {/* Call Control Buttons */}
                    <div className="flex justify-center gap-4">
                      <Button
                        size="lg"
                        variant={isMuted ? "destructive" : "outline"}
                        onClick={handleMuteToggle}
                        className="w-16 h-16 rounded-full"
                      >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant={isOnHold ? "secondary" : "outline"}
                        onClick={handleHoldToggle}
                        className="w-16 h-16 rounded-full"
                      >
                        {isOnHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className="w-16 h-16 rounded-full"
                      >
                        {isSpeakerOn ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setShowTransferDialog(true)}
                        className="w-16 h-16 rounded-full"
                      >
                        <ArrowRightLeft className="w-6 h-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleEndCall}
                        className="w-16 h-16 rounded-full"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* Call Disposition */}
                    <div className="flex items-center gap-4 justify-center">
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
                  </div>
                )}

                {/* Dial Pad */}
                {!isCallActive && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-4">Dial Pad</h3>
                      <div className="text-2xl font-mono font-bold text-gray-900 mb-4">
                        {dialPadNumber || 'Enter number'}
                      </div>
                    </div>

                    {/* Dial Pad Grid */}
                    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                        <Button
                          key={digit}
                          variant="outline"
                          size="lg"
                          onClick={() => setDialPadNumber(prev => prev + digit)}
                          className="w-16 h-16 text-xl font-bold"
                        >
                          {digit}
                        </Button>
                      ))}
                    </div>

                    {/* Dial Pad Actions */}
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setDialPadNumber(prev => prev.slice(0, -1))}
                        className="flex items-center gap-2"
                      >
                        <Minus className="w-4 h-4" />
                        Backspace
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDialPadNumber('')}
                        className="flex items-center gap-2"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={() => {
                          if (dialPadNumber) {
                            router.push(`/telecalling/call?phone=${dialPadNumber}&name=Unknown`);
                          }
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notes Panel */}
        <div className="w-96 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Call Notes & History</h3>
              
              {/* Add Note */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add call notes..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
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
                  Add Note
                </Button>
              </div>
            </div>

            {/* Notes History */}
            <div>
              <h4 className="font-medium mb-3">Conversation History</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingNotes ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="opacity-50 w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Loading notes...</p>
                  </div>
                ) : callNotes.length > 0 ? (
                  callNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {note.type === 'call' && <Phone className="w-4 h-4 text-blue-500" />}
                          {note.type === 'manual' && <FileText className="w-4 h-4 text-green-500" />}
                          {note.type === 'system' && <Settings className="w-4 h-4 text-purple-500" />}
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

      {/* Call Logs Dialog */}
      <Dialog open={showCallLogs} onOpenChange={setShowCallLogs}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Call Logs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {callLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <h4 className="font-medium">{log.name}</h4>
                        <p className="text-sm text-gray-600">{log.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(log.timestamp)}
                      </p>
                      {log.duration > 0 && (
                        <p className="text-xs text-gray-500">
                          {formatDuration(log.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                  {log.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{log.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
