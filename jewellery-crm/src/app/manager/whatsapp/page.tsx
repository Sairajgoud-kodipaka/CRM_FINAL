'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  PlayCircle,
  MessageCircle,
  Zap,
  Copy,
  Eye,
  Phone,
  Building2
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

export default function ManagerWhatsAppPage() {
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [singleMessage, setSingleMessage] = useState({
    phone: '',
    message: '',
    recipient_type: 'customer'
  });

  useEffect(() => {
    fetchWhatsAppStatus();
  }, []);

  const fetchWhatsAppStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWhatsAppStatus();
      if (response.success) {
        setWhatsappStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      setError('Failed to fetch WhatsApp status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Connecting</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const startWhatsAppSession = async () => {
    try {
      setLoading(true);
      const response = await apiService.startWhatsAppSession();
      if (response.success) {
        await fetchWhatsAppStatus();
        setSuccess('WhatsApp session started successfully');
      } else {
        setError(response.message || 'Failed to start WhatsApp session');
      }
    } catch (error) {
      console.error('Error starting WhatsApp session:', error);
      setError('Failed to start WhatsApp session');
    } finally {
      setLoading(false);
    }
  };

  const sendSingleMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleMessage.phone || !singleMessage.message) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSendLoading(true);
      const response = await apiService.sendWhatsAppMessage({
        phone: singleMessage.phone,
        message: singleMessage.message,
        type: 'text'
      });
      
      if (response.success) {
        setSuccess('Message sent successfully');
        setSingleMessage({ phone: '', message: '', recipient_type: 'customer' });
      } else {
        setError(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Manager</h1>
          <p className="text-muted-foreground">
            Send WhatsApp messages to customers and team members
          </p>
        </div>
        <Button onClick={startWhatsAppSession} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
          Start Session
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {whatsappStatus ? (
            <div className="flex items-center gap-4">
              {getStatusBadge(whatsappStatus.status || 'disconnected')}
              <div className="text-sm text-muted-foreground">
                {whatsappStatus.status === 'connected' ? 'Ready to send messages' : 'Start session to begin'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading status...</div>
          )}
        </CardContent>
      </Card>

      {/* Single Message Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Message</CardTitle>
          <CardDescription>
            Send a WhatsApp message to customers or team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendSingleMessage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_type">Recipient Type</Label>
                <Select
                  value={singleMessage.recipient_type}
                  onValueChange={(value: 'customer' | 'team') => 
                    setSingleMessage(prev => ({ ...prev, recipient_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="team">Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={singleMessage.phone}
                  onChange={(e) => setSingleMessage(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={singleMessage.message}
                onChange={(e) => setSingleMessage(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={sendLoading}>
              {sendLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
