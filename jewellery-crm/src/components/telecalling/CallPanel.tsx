'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Pause, Play, Clock, User, MapPin, Calendar, MessageSquare, Volume1, Route, Zap, Send, Settings, Bot, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { telecallingApiService } from '@/services/telecallingApi';
import { Lead, CallRequest } from '@/services/telecallingApi';
import { useCallWebSocket, callPollingService } from '@/services/callWebSocket';

interface CallPanelProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onCallEnded: (callLog: CallRequest) => void;
}

type CallStatus = 'idle' | 'initiating' | 'ringing' | 'connected' | 'ended' | 'failed';
type CallControlState = {
  muted: boolean;
  speakerOn: boolean;
  onHold: boolean;
};

export function CallPanel({ lead, isOpen, onClose, onCallEnded }: CallPanelProps) {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callControls, setCallControls] = useState<CallControlState>({
    muted: false,
    speakerOn: false,
    onHold: false,
  });
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Advanced Features State
  const [smsMessage, setSmsMessage] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('');
  const [routingStrategy, setRoutingStrategy] = useState('skill_based');
  const [automationWorkflow, setAutomationWorkflow] = useState('');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [smsTemplates, setSmsTemplates] = useState([
    'post_call_positive',
    'post_call_neutral',
    'post_call_negative',
    'appointment_reminder',
    'follow_up_1_day',
    'special_offer'
  ]);
  const [voiceTemplates, setVoiceTemplates] = useState([
    'appointment_reminder',
    'follow_up_positive',
    'follow_up_neutral',
    'special_offer',
    'birthday_wish',
    'customer_survey'
  ]);
  const [automationWorkflows, setAutomationWorkflows] = useState([
    'welcome_call',
    'follow_up_survey',
    'promotional_call',
    'appointment_reminder',
    're_engagement'
  ]);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callStatus === 'connected' && !durationIntervalRef.current) {
      startDurationTimer();
    } else if (callStatus !== 'connected' && durationIntervalRef.current) {
      stopDurationTimer();
    }

    return () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    };
  }, [callStatus]);

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initiate call - redirect to dedicated call page
  const initiateCall = async () => {
    // Redirect to dedicated call page - use telecaller route if in telecaller context
    const isTelecallerContext = window.location.pathname.startsWith('/telecaller');
    const callRoute = isTelecallerContext ? '/telecaller/call' : '/telecalling/call';
    window.location.href = `${callRoute}?phone=${lead.phone}&name=${lead.name}&leadId=${lead.id}`;
  };

  // End call
  const endCall = async () => {
    try {
      if (callRequest) {
        await telecallingApiService.endCall(callRequest.id);
      }
      setCallStatus('ended');
      stopDurationTimer();

      // Save call log
      if (callRequest) {
        const callLog = {
          ...callRequest,
          status: 'completed' as const,
          duration: callDuration,
          notes,
          sentiment: disposition as 'positive' | 'neutral' | 'negative',
          follow_up_required: followUpRequired,
        };
        onCallEnded(callLog);
      }
    } catch (err) {

      setError('Failed to end call');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setCallControls(prev => ({ ...prev, muted: !prev.muted }));
    // Note: This is UI-only for PSTN calls. For IP SDK, would call API
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setCallControls(prev => ({ ...prev, speakerOn: !prev.speakerOn }));
    // Note: This is UI-only for PSTN calls. For IP SDK, would call API
  };

  // Toggle hold
  const toggleHold = () => {
    setCallControls(prev => ({ ...prev, onHold: !prev.onHold }));
    // Note: This is UI-only for PSTN calls. For IP SDK, would call API
  };

  // NEW ADVANCED FEATURES

  // Send SMS
  const sendSMS = async (template?: string) => {
    try {
      setIsLoading(true);
      const message = template ? smsMessage : smsMessage;

      const response = await fetch('/api/telecalling/call-requests/send_sms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          message: message,
          template: template
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSmsMessage('');
        // Show success notification

      } else {
        setError(result.error || 'Failed to send SMS');
      }
    } catch (err) {

      setError('Failed to send SMS');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Voice Message
  const sendVoiceMessage = async (template?: string) => {
    try {
      setIsLoading(true);
      const message = template ? voiceMessage : voiceMessage;

      const response = await fetch('/api/telecalling/call-requests/send_voice_message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          message: message,
          template: template,
          voice_type: 'female'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVoiceMessage('');

      } else {
        setError(result.error || 'Failed to send voice message');
      }
    } catch (err) {

      setError('Failed to send voice message');
    } finally {
      setIsLoading(false);
    }
  };

  // Route Call with Advanced Strategy
  const routeCall = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/telecalling/call-requests/route_call/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          routing_strategy: routingStrategy
        }),
      });

      const result = await response.json();

      if (result.success) {

        // Optionally initiate the routed call
        await initiateCall();
      } else {
        setError(result.error || 'Failed to route call');
      }
    } catch (err) {

      setError('Failed to route call');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Automation Workflow
  const triggerAutomation = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/telecalling/call-requests/trigger_automation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          workflow_type: automationWorkflow
        }),
      });

      const result = await response.json();

      if (result.success) {

      } else {
        setError(result.error || 'Failed to trigger automation');
      }
    } catch (err) {

      setError('Failed to trigger automation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{lead.name}</h2>
              <p className="text-sm text-gray-500">{lead.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <Button
              variant="outline"
            size="sm"
              onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Advanced
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
          </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Tabs defaultValue="call" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="call">Call</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>

            {/* Call Tab */}
            <TabsContent value="call" className="space-y-6">
        {/* Call Status */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        callStatus === 'connected' ? 'bg-green-500' :
                        callStatus === 'ringing' ? 'bg-yellow-500' :
                        callStatus === 'failed' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="font-medium capitalize">{callStatus}</span>
                    </div>
            {callStatus === 'connected' && (
                      <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="w-4 h-4" />
                        {formatDuration(callDuration)}
            </div>
          )}
        </div>

        {/* Call Controls */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {callStatus === 'idle' ? (
            <Button
              onClick={initiateCall}
              disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        {isLoading ? 'Initiating...' : 'Start Call'}
                      </Button>
                    ) : (
                      <>
              <Button
                          variant={callControls.muted ? 'destructive' : 'outline'}
                onClick={toggleMute}
                          size="lg"
                          className="rounded-full"
              >
                {callControls.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                          variant={callControls.speakerOn ? 'default' : 'outline'}
                onClick={toggleSpeaker}
                          size="lg"
                          className="rounded-full"
              >
                {callControls.speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>

              <Button
                          variant={callControls.onHold ? 'destructive' : 'outline'}
                onClick={toggleHold}
                          size="lg"
                          className="rounded-full"
              >
                {callControls.onHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>

              <Button
                variant="destructive"
                onClick={endCall}
                          size="lg"
                          className="rounded-full"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
                      </>
          )}
        </div>

                  {/* Call Notes */}
            <div className="space-y-4">
                <Textarea
                      placeholder="Add call notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px]"
                    />

                    <div className="flex items-center gap-4">
                      <Select value={disposition} onValueChange={(value: any) => setDisposition(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>

                      <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                        />
                        <label htmlFor="followUp" className="text-sm">Follow-up required</label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SMS Tab */}
            <TabsContent value="sms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send SMS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Type your SMS message..."
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Or use template</label>
                    <Select onValueChange={(template) => sendSMS(template)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SMS template" />
                      </SelectTrigger>
                      <SelectContent>
                        {smsTemplates.map(template => (
                          <SelectItem key={template} value={template}>
                            {template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
              </div>

                  <Button
                    onClick={() => sendSMS()}
                    disabled={!smsMessage || isLoading}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume1 className="w-5 h-5" />
                    Send Voice Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Voice Message</label>
                    <Textarea
                      placeholder="Type your voice message..."
                      value={voiceMessage}
                      onChange={(e) => setVoiceMessage(e.target.value)}
                      className="min-h-[100px]"
                  />
                </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Or use template</label>
                    <Select onValueChange={(template) => sendVoiceMessage(template)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice template" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceTemplates.map(template => (
                          <SelectItem key={template} value={template}>
                            {template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
            </div>

                  <Button
                    onClick={() => sendVoiceMessage()}
                    disabled={!voiceMessage || isLoading}
                    className="w-full"
                  >
                    <Volume1 className="w-4 h-4 mr-2" />
                    Send Voice Message
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Call Routing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Route className="w-5 h-5" />
                      Advanced Routing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Routing Strategy</label>
                      <Select value={routingStrategy} onValueChange={setRoutingStrategy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skill_based">Skill Based</SelectItem>
                          <SelectItem value="workload_based">Workload Based</SelectItem>
                          <SelectItem value="performance_based">Performance Based</SelectItem>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="priority_based">Priority Based</SelectItem>
                          <SelectItem value="geographic">Geographic</SelectItem>
                        </SelectContent>
                      </Select>
          </div>

                    <Button
                      onClick={routeCall}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Route Call
                    </Button>
                  </CardContent>
                </Card>

                {/* Automation Workflows */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Automation Workflows
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Workflow Type</label>
                      <Select value={automationWorkflow} onValueChange={setAutomationWorkflow}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select workflow" />
                        </SelectTrigger>
                        <SelectContent>
                          {automationWorkflows.map(workflow => (
                            <SelectItem key={workflow} value={workflow}>
                              {workflow.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
          </div>

              <Button
                      onClick={triggerAutomation}
                      disabled={!automationWorkflow || isLoading}
                      className="w-full"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Trigger Workflow
              </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
