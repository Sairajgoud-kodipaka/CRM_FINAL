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
  Settings,
  MessageCircle,
  Zap,
  Copy,
  Eye,
  UserPlus,
  Search,
  X
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface WhatsAppStatus {
  status: string;
  name?: string;
  me?: {
    name: string;
    number: string;
  };
}

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
  template: string;
  category: 'promotional' | 'transactional' | 'informational' | 'greeting' | 'follow_up';
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  customer_type: string;
  status?: string;
}

export default function WhatsAppPage() {
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Customer import state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [modalType, setModalType] = useState<'single' | 'bulk'>('single');
  
  // Single message form
  const [singleMessage, setSingleMessage] = useState({
    phone: '',
    message: ''
  });
  
  // Bulk message form
  const [bulkMessage, setBulkMessage] = useState({
    phones: '',
    message: '',
    template_type: '',
    template_data: {}
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Predefined jewelry business templates
  const jewelryTemplates: MessageTemplate[] = [
    {
      id: 'new_collection',
      name: 'New Collection Launch',
      category: 'promotional',
      description: 'Announce new jewelry collections with special offers',
      fields: ['customer_name', 'collection_name', 'discount', 'store_name'],
      template: `✨ *Exciting News {{customer_name}}!*

We've launched our new *{{collection_name}}* collection! 💎

🎊 *Special Launch Offer:*
🔥 {{discount}}% OFF on all items
⏰ Limited time only!

Visit {{store_name}} to explore our stunning new designs.

Don't miss out on these exclusive pieces! 👑

Visit us today! ✨`
    },
    {
      id: 'appointment_reminder',
      name: 'Appointment Reminder',
      category: 'transactional',
      description: 'Remind customers about their jewelry consultation appointments',
      fields: ['customer_name', 'appointment_date', 'appointment_time', 'store_name'],
      template: `🏅 *{{store_name}}* - Appointment Reminder

Hello {{customer_name}}! 👋

This is a friendly reminder about your jewelry consultation:

📅 *Date:* {{appointment_date}}
🕐 *Time:* {{appointment_time}}
📍 *Location:* {{store_name}}

We're excited to help you find the perfect jewelry! ✨

If you need to reschedule, please let us know.

Thank you! 💎`
    },
    {
      id: 'order_ready',
      name: 'Order Ready for Pickup',
      category: 'transactional',
      description: 'Notify customers when their custom jewelry is ready',
      fields: ['customer_name', 'order_number', 'product_name', 'store_name'],
      template: `🎉 *Great News {{customer_name}}!*

Your custom jewelry is ready for pickup! ✨

📋 *Order #:* {{order_number}}
💎 *Item:* {{product_name}}
📍 *Pickup Location:* {{store_name}}

Please bring a valid ID when collecting your order.

Store Hours: 10 AM - 8 PM
Contact us for any queries.

Thank you for choosing us! 🙏`
    },
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      category: 'transactional',
      description: 'Gentle reminders for pending payments',
      fields: ['customer_name', 'amount', 'due_date', 'order_number'],
      template: `💳 *Payment Reminder*

Hello {{customer_name}},

This is a gentle reminder for your pending payment:

📋 *Order #:* {{order_number}}
💰 *Amount Due:* ₹{{amount}}
📅 *Due Date:* {{due_date}}

You can pay via:
• Cash at store
• Online transfer
• UPI

Contact us for payment assistance.

Thank you! 🙏`
    },
    {
      id: 'follow_up',
      name: 'Customer Follow-up',
      category: 'follow_up',
      description: 'Follow up with customers about their product interests',
      fields: ['customer_name', 'product_interest', 'salesperson_name'],
      template: `Hello {{customer_name}}! 👋

I hope you're doing well. This is {{salesperson_name}} from our jewelry store.

I wanted to follow up on your interest in *{{product_interest}}*.

Do you have any questions about:
• Product specifications 💎
• Pricing and offers 💰
• Customization options ✨
• Visit scheduling 📅

Feel free to reach out anytime!

Best regards,
{{salesperson_name}} 🙏`
    },
    {
      id: 'festival_greetings',
      name: 'Festival Greetings',
      category: 'greeting',
      description: 'Send festival wishes with promotional offers',
      fields: ['customer_name', 'festival_name', 'discount', 'store_name'],
      template: `🎊 *Happy {{festival_name}} {{customer_name}}!*

Wishing you and your family joy, prosperity, and happiness on this auspicious occasion! ✨

🎁 *Festival Special Offer:*
🔥 {{discount}}% OFF on all gold jewelry
💎 Extra 5% off on diamond sets
🎯 Special festive collection now available

Visit {{store_name}} to explore our exclusive festive jewelry collection.

May this festival bring sparkle to your life! 🌟

Warm regards,
{{store_name}} Team 🙏`
    },
    {
      id: 'birthday_wishes',
      name: 'Birthday Wishes',
      category: 'greeting',
      description: 'Birthday greetings with special offers',
      fields: ['customer_name', 'discount', 'store_name'],
      template: `🎂 *Happy Birthday {{customer_name}}!* 🎉

Wishing you a day filled with happiness and a year filled with joy! ✨

🎁 *Special Birthday Treat:*
🔥 {{discount}}% OFF on your birthday month
💎 Complimentary gift wrapping
🎯 Free jewelry cleaning service

Visit {{store_name}} to celebrate your special day with something sparkly!

Have a wonderful birthday! 🌟

With love,
{{store_name}} Team 💖`
    },
    {
      id: 'wedding_collection',
      name: 'Wedding Collection Showcase',
      category: 'promotional',
      description: 'Promote wedding jewelry collections',
      fields: ['customer_name', 'discount', 'store_name'],
      template: `👰 *Wedding Season Special {{customer_name}}!* 💍

Make your special day even more magical with our exquisite bridal collection! ✨

💎 *What We Offer:*
• Traditional bridal sets
• Contemporary designs
• Custom wedding jewelry
• Matching accessories

🎊 *Wedding Season Offer:*
🔥 {{discount}}% OFF on bridal jewelry
💍 Free consultation with our design expert
📸 Complimentary bridal photoshoot jewelry

Visit {{store_name}} to explore our stunning wedding collection.

Create memories that last forever! 💕

{{store_name}} - Where love meets luxury ❤️`
    }
  ];

  useEffect(() => {
    fetchWhatsAppStatus();
    // Use predefined templates instead of fetching from API
    setTemplates(jewelryTemplates);
  }, []);

  const fetchWhatsAppStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWhatsAppStatus();
      setWhatsappStatus(response.data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to WhatsApp service');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiService.getWhatsAppTemplates();
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const startWhatsAppSession = async () => {
    try {
      setLoading(true);
      await apiService.startWhatsAppSession();
      setSuccess('WhatsApp session started! Please scan the QR code in your WAHA dashboard.');
      setTimeout(() => fetchWhatsAppStatus(), 2000);
    } catch (err: any) {
      setError(err.message || 'Error starting WhatsApp session');
    } finally {
      setLoading(false);
    }
  };

  const sendSingleMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleMessage.phone || !singleMessage.message) return;

    try {
      setSendLoading(true);
      await apiService.sendWhatsAppMessage({
        phone: singleMessage.phone,
        message: singleMessage.message,
        type: 'text'
      });
      setSuccess('WhatsApp message sent successfully!');
      setSingleMessage({ phone: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Error sending WhatsApp message');
    } finally {
      setSendLoading(false);
    }
  };

  const sendBulkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.phones || !bulkMessage.message) return;

    try {
      setBulkLoading(true);
      const phoneList = bulkMessage.phones.split('\n').filter(phone => phone.trim());
      
      const response = await apiService.sendBulkWhatsAppMessages({
        recipients: phoneList,
        message: bulkMessage.message,
        template_type: bulkMessage.template_type,
        template_data: bulkMessage.template_data
      });
      
      setSuccess(`Bulk campaign completed! Sent: ${(response.data as any)?.sent_count || 0}, Failed: ${(response.data as any)?.failed_count || 0}`);
      setBulkMessage({ phones: '', message: '', template_type: '', template_data: {} });
    } catch (err: any) {
      setError(err.message || 'Error sending bulk WhatsApp messages');
    } finally {
      setBulkLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WORKING':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'STARTING':
        return <Badge className="bg-yellow-100 text-yellow-800">Starting</Badge>;
      case 'SCAN_QR_CODE':
        return <Badge className="bg-blue-100 text-blue-800">Scan QR Code</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'custom') {
      setSelectedTemplate('custom');
      setBulkMessage(prev => ({
        ...prev,
        message: '',
        template_type: 'custom'
      }));
    } else {
      const template = jewelryTemplates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        setBulkMessage(prev => ({
          ...prev,
          message: template.template,
          template_type: templateId
        }));
      }
    }
  };

  const copyTemplateToSingle = (template: string) => {
    setSingleMessage(prev => ({
      ...prev,
      message: template
    }));
    setSuccess('Template copied to single message!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      promotional: 'bg-blue-100 text-blue-800',
      transactional: 'bg-green-100 text-green-800',
      informational: 'bg-gray-100 text-gray-800',
      greeting: 'bg-purple-100 text-purple-800',
      follow_up: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={colors[category as keyof typeof colors]}>{category.replace('_', ' ')}</Badge>;
  };

  // Customer import functions
  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await apiService.getClients();
      if (response.success) {
        setCustomers(response.data);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (error) {
      setError('Error fetching customers');
      console.error('Error fetching customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const openCustomerModal = (type: 'single' | 'bulk') => {
    setModalType(type);
    setShowCustomerModal(true);
    setSelectedCustomers([]);
    setCustomerSearch('');
    if (customers.length === 0) {
      fetchCustomers();
    }
  };

  const selectCustomer = (customer: Customer) => {
    if (modalType === 'single') {
      // For single message, just set the phone number
      if (customer.phone) {
        setSingleMessage(prev => ({ ...prev, phone: customer.phone! }));
        setShowCustomerModal(false);
        setSuccess(`Phone number imported: ${customer.first_name} ${customer.last_name}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('This customer does not have a phone number');
        setTimeout(() => setError(null), 3000);
      }
    } else {
      // For bulk message, add to selected customers
      if (customer.phone) {
        if (!selectedCustomers.find(c => c.id === customer.id)) {
          setSelectedCustomers(prev => [...prev, customer]);
        }
      } else {
        setError('This customer does not have a phone number');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const removeSelectedCustomer = (customerId: number) => {
    setSelectedCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  const applyBulkCustomers = () => {
    const phoneNumbers = selectedCustomers
      .filter(c => c.phone)
      .map(c => c.phone)
      .join('\n');
    
    setBulkMessage(prev => ({ ...prev, phones: phoneNumbers }));
    setShowCustomerModal(false);
    setSuccess(`Imported ${selectedCustomers.length} phone numbers`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.phone && (
      customer.first_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone.includes(customerSearch)
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">WhatsApp Integration</h1>
          <p className="text-text-secondary mt-1">
            Send WhatsApp messages to customers and manage your WhatsApp business communication
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchWhatsAppStatus} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* WhatsApp Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Connection Status
          </CardTitle>
          <CardDescription>
            Monitor your WhatsApp connection and session status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking WhatsApp status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Connection Status</p>
                  <p className="text-sm text-gray-500">Current WhatsApp session state</p>
                </div>
                {whatsappStatus && getStatusBadge(whatsappStatus.status)}
              </div>
              
              {whatsappStatus?.me && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Connected as: {whatsappStatus.me.name}</p>
                      <p className="text-sm text-green-600">Number: {whatsappStatus.me.number}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {whatsappStatus?.status === 'SCAN_QR_CODE' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Scan QR Code Required</p>
                      <p className="text-sm text-blue-600">
                        Please visit your WAHA dashboard at <code>http://localhost:3001</code> to scan the QR code
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {(!whatsappStatus || whatsappStatus.status === 'NOT_FOUND') && (
                <Button onClick={startWhatsAppSession} disabled={loading}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start WhatsApp Session
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Messaging */}
      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Message</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Single Message
              </CardTitle>
              <CardDescription>
                Send a WhatsApp message to a specific customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendSingleMessage} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+919876543210"
                      value={singleMessage.phone}
                      onChange={(e) => setSingleMessage(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCustomerModal('single')}
                      className="shrink-0"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Include country code (e.g., +91 for India) or import from existing customers
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Hello! This is a message from our jewelry store..."
                    value={singleMessage.message}
                    onChange={(e) => setSingleMessage(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={sendLoading}>
                  {sendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bulk WhatsApp Campaign
              </CardTitle>
              <CardDescription>
                Send WhatsApp messages to multiple customers at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendBulkMessage} className="space-y-4">
                <div>
                  <Label htmlFor="phones">Phone Numbers</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        id="phones"
                        placeholder="+919876543210&#10;+919876543211&#10;+919876543212"
                        value={bulkMessage.phones}
                        onChange={(e) => setBulkMessage(prev => ({ ...prev, phones: e.target.value }))}
                        rows={6}
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomerModal('bulk')}
                        className="shrink-0 h-fit"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Enter one phone number per line with country code or import from existing customers
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="template-select">Message Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template or write custom message" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Message</SelectItem>
                      {jewelryTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && selectedTemplate !== 'custom' && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Required fields:</strong> {jewelryTemplates.find(t => t.id === selectedTemplate)?.fields.join(', ')}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Use {'{'}field_name{'}'} in your message to insert dynamic values
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bulk-message">Message</Label>
                  <Textarea
                    id="bulk-message"
                    placeholder="🎉 Exciting News! New jewelry collection launched with special discounts..."
                    value={bulkMessage.message}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use {'{'}customer_name{'}'}, {'{'}store_name{'}'}, etc. for personalization
                  </p>
                </div>
                
                <Button type="submit" disabled={bulkLoading}>
                  {bulkLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Bulk Messages...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Send Bulk Campaign
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>
            Pre-defined templates for common jewelry business communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jewelryTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  {getCategoryBadge(template.category)}
                </div>
                
                <div className="text-xs text-gray-500">
                  <strong>Variables:</strong> {template.fields.map(field => `{'{'}${field}{'}'}`).join(', ')}
                </div>
                
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="font-medium text-gray-700 mb-2">Template Preview:</div>
                  <div className="whitespace-pre-wrap text-gray-600 text-xs leading-relaxed max-h-32 overflow-y-auto">
                    {template.template}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyTemplateToSingle(template.template)}
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy to Single
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template.id)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Use in Bulk
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Template Usage Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use variables like {'{'}customer_name{'}'} for personalization</li>
              <li>• Templates automatically format for WhatsApp with emojis and spacing</li>
              <li>• Test templates with sample data before sending bulk campaigns</li>
              <li>• Customize templates based on your store's tone and branding</li>
            </ul>
          </div>
        </CardContent>
      </Card>

              {/* Customer Import Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modalType === 'single' ? 'Import Customer Phone Number' : 'Import Customer Phone Numbers'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomerModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {modalType === 'bulk' && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    Selected: {selectedCustomers.length} customers
                  </span>
                  {selectedCustomers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyBulkCustomers}
                    >
                      Apply Selected ({selectedCustomers.length})
                    </Button>
                  )}
                </div>
                {selectedCustomers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCustomers.map(customer => (
                      <Badge key={customer.id} variant="secondary" className="flex items-center gap-1">
                        {customer.first_name} {customer.last_name} - {customer.phone}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeSelectedCustomer(customer.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {customersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading customers...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {customerSearch ? 'No customers found matching your search.' : 'No customers with phone numbers found.'}
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.email} • {customer.phone}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.customer_type} • {customer.status || 'Active'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {customer.phone}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCustomerModal(false)}
              >
                Cancel
              </Button>
              {modalType === 'bulk' && selectedCustomers.length > 0 && (
                <Button onClick={applyBulkCustomers}>
                  Import {selectedCustomers.length} Phone Numbers
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}