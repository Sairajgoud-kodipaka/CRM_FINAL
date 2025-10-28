// Simplified Call Status Component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface CallStatusProps {
  callStatus: 'idle' | 'connecting' | 'ringing' | 'answered' | 'ended' | 'failed' | 'busy' | 'no-answer';
  callDuration: number;
  isMuted: boolean;
  isOnHold: boolean;
  isSpeakerOn: boolean;
  onMute: () => void;
  onHold: () => void;
  onSpeaker: () => void;
  onEndCall: () => void;
  onAnswer?: () => void;
  error?: string;
}

export function CallStatus({
  callStatus,
  callDuration,
  isMuted,
  isOnHold,
  isSpeakerOn,
  onMute,
  onHold,
  onSpeaker,
  onEndCall,
  onAnswer,
  error
}: CallStatusProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'answered': return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'no-answer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'ringing': return 'Ringing...';
      case 'answered': return 'Call Connected';
      case 'failed': return 'Call Failed';
      case 'busy': return 'Line Busy';
      case 'no-answer': return 'No Answer';
      case 'ended': return 'Call Ended';
      default: return 'Ready to Call';
    }
  };

  const isCallActive = ['ringing', 'answered', 'connecting'].includes(callStatus);

  return (
    <div className="space-y-6">
      {/* Main Call Status Card */}
      <Card className="p-6 text-center">
        <div className="space-y-4">
          {/* Call Duration */}
          <div className="text-4xl font-mono font-bold text-gray-900">
            {formatDuration(callDuration)}
          </div>

          {/* Status Badge */}
          <Badge
            className={`px-4 py-2 text-sm font-medium border ${getStatusColor(callStatus)} ${
              callStatus === 'ringing' ? 'animate-pulse' : ''
            }`}
          >
            {getStatusText(callStatus)}
          </Badge>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* Call Controls */}
      {isCallActive && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 text-center">Call Controls</h3>

            {/* Primary Controls */}
            <div className="flex justify-center space-x-4">
              {/* Mute Button */}
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={onMute}
                className="w-16 h-16 rounded-full"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              {/* Hold Button */}
              <Button
                variant={isOnHold ? "destructive" : "outline"}
                size="lg"
                onClick={onHold}
                className="w-16 h-16 rounded-full"
              >
                {isOnHold ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </Button>

              {/* Speaker Button */}
              <Button
                variant={isSpeakerOn ? "default" : "outline"}
                size="lg"
                onClick={onSpeaker}
                className="w-16 h-16 rounded-full"
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>

            {/* End Call Button */}
            <div className="flex justify-center">
              <Button
                variant="destructive"
                size="lg"
                onClick={onEndCall}
                className="w-20 h-20 rounded-full text-white bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Answer Button for Incoming Calls */}
      {callStatus === 'ringing' && onAnswer && (
        <div className="flex justify-center space-x-4">
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="w-16 h-16 rounded-full"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onAnswer}
            className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}

