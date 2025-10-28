import { apiService } from '../lib/api-service';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  masked_phone: string;
  email: string;
  masked_email: string;
  city: string;
  source: 'exhibition' | 'social_media' | 'referral' | 'website' | 'walk_in';
  status: 'new' | 'contacted' | 'qualified' | 'appointment_set' | 'not_interested' | 'converted';
  priority: 'high' | 'medium' | 'low';
  source_system: string;
  source_id: string;
  fetched_at: string;
  raw_data?: Record<string, any>;
  assigned_to?: string;
  assigned_to_details?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  assigned_at?: string;
  last_interaction?: string;
  next_followup?: string;
  call_attempts: number;
  tags: string[];
  segments: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LeadDetail extends Lead {
  // Unmasked PII for detail view
  phone: string;
  email: string;
}

export interface CallRequest {
  id: string;
  lead: string;
  lead_details: Lead;
  telecaller: string;
  telecaller_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  call_type: 'outbound' | 'callback';
  exotel_call_sid?: string;
  exotel_bridge_url?: string;
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no_answer';
  duration: number;
  recording_url?: string;
  disposition_code?: string;
  notes: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  follow_up_required: boolean;
  initiated_at: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRequest {
  id: string;
  lead: string;
  lead_details: Lead;
  telecaller: string;
  telecaller_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  due_at: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  reminder_enabled: boolean;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TelecallerDashboard {
  calls_today: number;
  connected_rate: number;
  appointments_set: number;
  follow_ups_due: number;
  assigned_leads: number;
  overdue_calls: number;
  performance_trend: 'up' | 'down' | 'stable';
}

export interface CallLog {
  id: string;
  lead: string;
  lead_name: string;
  masked_phone: string;
  initiated_at: string;
  duration: number;
  status: string;
  recording_url?: string;
  notes: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  follow_up_required: boolean;
}

export interface CallStats {
  total_calls: number;
  connected_calls: number;
  avg_duration: number;
  conversion_rate: number;
}

export interface PerformanceAnalytics {
  calls_made: number;
  connected_rate: number;
  avg_duration: number;
  appointments_set: number;
  follow_up_completion_rate: number;
  conversion_rate: number;
  daily_breakdown: Array<{
    date: string;
    calls: number;
    connected: number;
  }>;
}

export interface CallInitiationRequest {
  lead_id: string;
  call_type: 'outbound' | 'callback';
}

export interface CallInitiationResponse {
  call_request_id: string;
  status: 'initiated' | 'failed' | 'answered' | 'ringing';
  error_message?: string;
  exotel_bridge_url?: string;
  // Additional fields for existing calls
  error?: string;
  call_id?: string;
  exotel_call_id?: string;
}

export interface FollowUpCreateRequest {
  lead_id: string;
  due_at: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  reminder_enabled: boolean;
}

export interface LeadStatusUpdateRequest {
  status: 'contacted' | 'qualified' | 'not_interested' | 'appointment_set';
  notes?: string;
  next_followup?: string;
}

export interface LeadListResponse {
  results: Lead[];
  count: number;
  next: string | null;
  previous: string | null;
  total_pages?: number;
}

export interface LeadFilters {
  status?: string;
  city?: string;
  source?: string;
  assignedTo?: 'me' | 'all';
  page?: number;
  limit?: number;
}

export interface CallLogFilters {
  disposition?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  duration?: {
    min: number;
  };
}

class TelecallingApiService {
  private baseUrl = '/telecalling';

  // Lead Management
  async getLeads(filters: LeadFilters = {}): Promise<LeadListResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.city) params.append('city', filters.city);
    if (filters.source) params.append('source', filters.source);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiService.get(`${this.baseUrl}/leads/?${params.toString()}`);
    return response.data;
  }

  async getLead(id: string): Promise<LeadDetail> {
    const response = await apiService.get(`${this.baseUrl}/leads/${id}/`);
    return response.data;
  }

  async updateLeadStatus(id: string, data: LeadStatusUpdateRequest): Promise<void> {
    await apiService.post(`${this.baseUrl}/leads/${id}/update_status/`, data);
  }

  async getAssignedLeads(): Promise<Lead[]> {
    const response = await apiService.get(`${this.baseUrl}/leads/assigned_to_me/`);
    return response.data;
  }

  // Dashboard
  async getTelecallerDashboard(): Promise<TelecallerDashboard> {
    const response = await apiService.get(`${this.baseUrl}/dashboard/me/`);
    return response.data;
  }

  // Call Management
  async initiateCall(leadId: string, callType: 'outbound' | 'callback' = 'outbound'): Promise<CallInitiationResponse> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/initiate/`, {
      lead_id: leadId,
      call_type: callType
    });
    return response.data;
  }

  // Test Exotel configuration
  async testExotelConfig(): Promise<ApiResponse<any>> {
    return this.request(`${this.baseUrl}/call-requests/test_exotel_config/`, {
      method: 'POST'
    });
  }

  // Get WebRTC configuration
  async getWebRTCConfig(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/webrtc_config/`);
    return response.data;
  }

  // WebRTC API methods
  async initiateWebRTCCall(data: {
    to: string;
    from?: string;
    customField?: string;
    webrtcEnabled?: boolean;
  }): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/webrtc/initiate/`, data);
    return response.data;
  }

  async getWebRTCCallStatus(callSid: string): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/webrtc/call-status/${callSid}/`);
    return response.data;
  }

  async endWebRTCCall(callSid: string): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/webrtc/end-call/${callSid}/`);
    return response.data;
  }

  async muteWebRTCCall(callSid: string, muted: boolean): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/webrtc/mute-call/${callSid}/`, { muted });
    return response.data;
  }

  async holdWebRTCCall(callSid: string, onHold: boolean): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/webrtc/hold-call/${callSid}/`, { onHold });
    return response.data;
  }

  // Get real-time call status with comprehensive information
  async getRealTimeCallStatus(callRequestId: string): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/${callRequestId}/real_time_status/`);
    return response.data;
  }

  // Get basic call status
  async getCallStatus(callRequestId: string): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/${callRequestId}/status/`);
    return response.data;
  }

  // End an existing call
  async endExistingCall(callRequestId: string): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/${callRequestId}/end/`);
    return response.data;
  }

  // End current call
  async endCall(callRequestId: string): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/${callRequestId}/end/`);
    return response.data;
  }

  async muteCall(callId: string, muted: boolean): Promise<void> {
    await apiService.post(`${this.baseUrl}/call-requests/${callId}/mute/`, { on: muted });
  }

  async holdCall(callId: string, onHold: boolean): Promise<void> {
    await apiService.post(`${this.baseUrl}/call-requests/${callId}/hold/`, { on: onHold });
  }

  async startRecording(callId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/call-requests/${callId}/start_recording/`);
  }

  async stopRecording(callId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/call-requests/${callId}/stop_recording/`);
  }

  async transferCall(callId: string, targetNumber: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/call-requests/${callId}/transfer/`, {
      target_number: targetNumber
    });
  }

  async conferenceCall(callId: string, participants: string[]): Promise<void> {
    await apiService.post(`${this.baseUrl}/call-requests/${callId}/conference/`, {
      participants
    });
  }

  async getCallRecordings(callId: string): Promise<any[]> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/${callId}/recordings/`);
    return response.data;
  }

  async downloadRecording(recordingId: string): Promise<Blob> {
    const response = await apiService.get(`${this.baseUrl}/recordings/${recordingId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getCallLogs(filters: CallLogFilters = {}): Promise<CallLog[]> {
    const params = new URLSearchParams();

    if (filters.disposition) params.append('disposition', filters.disposition);
    if (filters.dateRange?.from) params.append('date_from', filters.dateRange.from);
    if (filters.dateRange?.to) params.append('date_to', filters.dateRange.to);
    if (filters.duration?.min) params.append('duration_min', filters.duration.min.toString());

    const response = await apiService.get(`${this.baseUrl}/call-requests/logs/?${params.toString()}`);
    return response.data;
  }

  async getCallStats(): Promise<CallStats> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/stats/`);
    return response.data;
  }

  // Follow-up Management
  async createFollowUp(data: FollowUpCreateRequest): Promise<FollowUpRequest> {
    const response = await apiService.post(`${this.baseUrl}/followup-requests/create_followup/`, data);
    return response.data;
  }

  async getFollowUpsDueToday(): Promise<FollowUpRequest[]> {
    const response = await apiService.get(`${this.baseUrl}/followup-requests/due_today/`);
    return response.data;
  }

  // Performance Analytics
  async getPerformanceAnalytics(telecallerId: string = 'me', range: number = 7): Promise<PerformanceAnalytics> {
    const params = new URLSearchParams();
    params.append('telecaller_id', telecallerId);
    params.append('range', range.toString());

    const response = await apiService.get(`${this.baseUrl}/performance/?${params.toString()}`);
    return response.data;
  }

  // Google Sheets API Status
  async getGoogleSheetsStatus(): Promise<{
    connection_status: boolean;
    last_sync?: string;
    total_leads?: number;
    assigned_leads?: number;
    automation_status?: {
      sync_task_active: boolean;
      last_sync?: string;
      success_rate: number;
    };
    recent_activity?: Array<{
      type: string;
      status: string;
      timestamp: string;
      message: string;
      details?: string;
    }>;
  }> {
    const response = await apiService.get(`${this.baseUrl}/google-sheets/status/`);
    return response.data;
  }

  async testGoogleSheetsConnection(): Promise<{
    connection_status: boolean;
    message: string;
    timestamp: string;
    sample_data?: any[];
  }> {
    const response = await apiService.post(`${this.baseUrl}/google-sheets/test-connection/`);
    return response.data;
  }

  async triggerManualSync(): Promise<{
    sync_status: boolean;
    message: string;
    timestamp: string;
  }> {
    const response = await apiService.post(`${this.baseUrl}/google-sheets/manual-sync/`);
    return response.data;
  }

  // Utility functions
  maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4) + '****';
  }

  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatCallStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'initiated': 'Initiated',
      'ringing': 'Ringing',
      'answered': 'Answered',
      'completed': 'Completed',
      'failed': 'Failed',
      'busy': 'Busy',
      'no_answer': 'No Answer',
    };
    return statusMap[status] || status;
  }

  formatSentiment(sentiment: string): string {
    const sentimentMap: Record<string, string> = {
      'positive': 'Positive',
      'neutral': 'Neutral',
      'negative': 'Negative',
    };
    return sentimentMap[sentiment] || sentiment;
  }

  formatPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
    };
    return priorityMap[priority] || priority;
  }

  formatSource(source: string): string {
    const sourceMap: Record<string, string> = {
      'exhibition': 'Exhibition',
      'social_media': 'Social Media',
      'referral': 'Referral',
      'website': 'Website',
      'walk_in': 'Walk In',
    };
    return sourceMap[source] || source;
  }

  // Advanced Features
  async sendSMS(leadId: string, message: string, template?: string): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/send_sms/`, {
      lead_id: leadId,
      message: message,
      template: template
    });
    return response.data;
  }

  async sendVoiceMessage(leadId: string, message: string, template?: string, voiceType: string = 'female'): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/send_voice_message/`, {
      lead_id: leadId,
      message: message,
      template: template,
      voice_type: voiceType
    });
    return response.data;
  }

  async routeCall(leadId: string, routingStrategy: string = 'skill_based'): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/route_call/`, {
      lead_id: leadId,
      routing_strategy: routingStrategy
    });
    return response.data;
  }

  async triggerAutomation(leadId: string, workflowType: string): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/trigger_automation/`, {
      lead_id: leadId,
      workflow_type: workflowType
    });
    return response.data;
  }

  async getRoutingAnalytics(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/routing_analytics/`);
    return response.data;
  }

  // Lead Notes and Status Management
  async getLeadNotes(leadId: string): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/call-requests/get_lead_notes/?lead_id=${leadId}`);
    return response.data;
  }

  async addLeadNote(data: {
    lead_id: string;
    note: string;
    status?: string;
    disposition?: string;
    follow_up_required?: boolean;
  }): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/add_lead_note/`, data);
    return response.data;
  }

  async updateLeadStatus(data: {
    lead_id: string;
    status: string;
    note?: string;
    disposition?: string;
  }): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/call-requests/update_lead_status/`, data);
    return response.data;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-green-100 text-green-800',
      'appointment_set': 'bg-purple-100 text-purple-800',
      'not_interested': 'bg-red-100 text-red-800',
      'converted': 'bg-emerald-100 text-emerald-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  }

  getSentimentColor(sentiment: string): string {
    const colorMap: Record<string, string> = {
      'positive': 'bg-green-100 text-green-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'negative': 'bg-red-100 text-red-800',
    };
    return colorMap[sentiment] || 'bg-gray-100 text-gray-800';
  }

  // Lead Transfer Methods
  async getSalesPersons(): Promise<SalesPerson[]> {
    const response = await apiService.get(`${this.baseUrl}/sales-persons/`);
    return response.data;
  }

  async transferLead(data: LeadTransferRequest): Promise<{ message: string; transfer_id: string }> {
    const response = await apiService.post(`${this.baseUrl}/lead-transfers/transfer_lead/`, data);
    return response.data;
  }

  async getLeadTransfers(): Promise<LeadTransfer[]> {
    const response = await apiService.get(`${this.baseUrl}/lead-transfers/`);
    return response.data;
  }

  async acceptTransfer(transferId: string): Promise<{ message: string }> {
    const response = await apiService.post(`${this.baseUrl}/lead-transfers/${transferId}/accept_transfer/`);
    return response.data;
  }

  async rejectTransfer(transferId: string): Promise<{ message: string }> {
    const response = await apiService.post(`${this.baseUrl}/lead-transfers/${transferId}/reject_transfer/`);
    return response.data;
  }
}

export interface SalesPerson {
  id: number;
  name: string;
  email: string;
  username: string;
}

export interface LeadTransfer {
  id: string;
  lead: string;
  lead_details: Lead;
  from_user: string;
  from_user_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  to_user: string;
  to_user_details: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  transfer_reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface LeadTransferRequest {
  lead_id: string;
  to_user_id: number;
  transfer_reason?: string;
}

export const telecallingApiService = new TelecallingApiService();
