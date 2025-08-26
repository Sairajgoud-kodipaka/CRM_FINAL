'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Phone, 
  User, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  X,
  MoreVertical,
  PhoneCall,
  Video,
  Image,
  Paperclip
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  is_bot_response?: boolean;
  media_url?: string;
}

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  status: 'online' | 'offline' | 'typing';
  last_seen?: string;
  avatar?: string;
}

interface Conversation {
  id: string;
  contact: Contact;
  status: 'active' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_agent?: string;
  tags: string[];
  unread_count: number;
  last_message: Message;
}

interface RealTimeChatProps {
  conversationId?: string;
  onClose?: () => void;
}

export function RealTimeChat({ conversationId, onClose }: RealTimeChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading conversations
    setTimeout(() => {
      const mockConversations: Conversation[] = [
        {
          id: '1',
          contact: {
            id: '1',
            name: 'Rahul Sharma',
            phone_number: '+91 98765 43210',
            status: 'online',
            last_seen: '2 minutes ago'
          },
          status: 'active',
          priority: 'high',
          assigned_agent: 'Amit Kumar',
          tags: ['vip', 'urgent'],
          unread_count: 3,
          last_message: {
            id: '1',
            content: 'I need urgent help with my order',
            direction: 'inbound',
            type: 'text',
            timestamp: '2 minutes ago',
            status: 'delivered'
          }
        },
        {
          id: '2',
          contact: {
            id: '2',
            name: 'Priya Patel',
            phone_number: '+91 98765 43211',
            status: 'typing',
            last_seen: '5 minutes ago'
          },
          status: 'active',
          priority: 'medium',
          assigned_agent: 'Neha Singh',
          tags: ['customer', 'support'],
          unread_count: 0,
          last_message: {
            id: '2',
            content: 'Thank you for your help!',
            direction: 'outbound',
            type: 'text',
            timestamp: '5 minutes ago',
            status: 'read'
          }
        }
      ];

      setConversations(mockConversations);
      setLoading(false);
    }, 1000);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ws = new WebSocket('ws://localhost:8000/ws/whatsapp/');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      setWsConnection(ws);
      
      return () => {
        ws.close();
      };
    }
  }, []);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        handleNewMessage(data.message);
        break;
      case 'message_status_update':
        handleMessageStatusUpdate(data.message_id, data.status);
        break;
      case 'contact_typing':
        handleContactTyping(data.contact_id, data.is_typing);
        break;
      case 'conversation_update':
        handleConversationUpdate(data.conversation);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    scrollToBottom();
    
    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation?.id 
        ? { ...conv, last_message: message, unread_count: conv.unread_count + 1 }
        : conv
    ));
  };

  const handleMessageStatusUpdate = (messageId: string, status: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: status as any } : msg
    ));
  };

  const handleContactTyping = (contactId: string, isTyping: boolean) => {
    setConversations(prev => prev.map(conv => 
      conv.contact.id === contactId 
        ? { ...conv, contact: { ...conv.contact, status: isTyping ? 'typing' : 'online' } }
        : conv
    ));
  };

  const handleConversationUpdate = (conversation: Conversation) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id ? conversation : conv
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `temp_${Date.now()}`,
      content: newMessage,
      direction: 'outbound',
      type: 'text',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    scrollToBottom();

    try {
      // Send message via API
      const response = await fetch('/api/whatsapp/messages/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: message.content,
          type: message.type
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update message with server response
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, id: result.message_id, status: 'sent' } : msg
        ));
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'failed' } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Load messages for this conversation
    loadMessages(conversation.id);
    
    // Mark as read
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
    ));
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}/messages/`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'typing': return 'bg-blue-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Conversations</h3>
          <p className="text-sm text-gray-500">{conversations.length} active</p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.contact.avatar} />
                      <AvatarFallback>
                        {conversation.contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.contact.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.contact.name}
                      </h4>
                      {conversation.unread_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.last_message.content}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                        {conversation.priority}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {conversation.last_message.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConversation.contact.avatar} />
                    <AvatarFallback>
                      {selectedConversation.contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium">{selectedConversation.contact.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedConversation.contact.status)}`} />
                      <span className="text-sm text-gray-500">
                        {selectedConversation.contact.status === 'typing' ? 'typing...' : selectedConversation.contact.last_seen}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Conversation Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                      <DropdownMenuItem>Escalate</DropdownMenuItem>
                      <DropdownMenuItem>Transfer</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Close Conversation</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.direction === 'outbound'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.direction === 'outbound' && (
                          <div className="flex items-center space-x-1">
                            {message.status === 'pending' && <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                            {message.status === 'sent' && <CheckCircle className="w-3 h-3" />}
                            {message.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                            {message.status === 'read' && <CheckCircle className="w-3 h-3 text-blue-400" />}
                            {message.status === 'failed' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


