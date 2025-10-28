import { apiService } from '../lib/api-service';

// Existing telecalling models (CustomerVisit, Assignment, CallLog)
export interface CustomerVisit {
  id: string;
  sales_rep: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  interests: string[];
  visit_timestamp: string;
  notes: string;
  lead_quality: 'hot' | 'warm' | 'cold';
  assigned_to_telecaller: boolean;
  raw_sheets_data?: Record<string, any>; // Raw Google Sheets data
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  telecaller: string;
  customer_visit: string;
  customer_visit_details: CustomerVisit;
  assigned_by: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'follow_up' | 'unreachable';
  priority: 'high' | 'medium' | 'low';
  scheduled_time?: string;
  notes: string;
  outcome: string;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  assignment: string;
  assignment_details: Assignment;
  call_status: 'connected' | 'no_answer' | 'busy' | 'wrong_number' | 'not_interested' | 'call_back';
  call_duration: number;
  feedback: string;
  customer_sentiment: 'positive' | 'neutral' | 'negative';
  revisit_required: boolean;
  revisit_notes: string;
  recording_url?: string;
  disposition_code?: string;
  call_time: string;
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

class TelecallingLegacyApiService {
  // Get assignments for the current telecaller (these are the "leads")
  async getAssignments(): Promise<Assignment[]> {
    try {
      const response = await apiService.get('/telecalling/assignments/');


      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {

        return [];
      }
    } catch (error) {

      throw error;
    }
  }

  // Get customer visits assigned to the current telecaller
  async getCustomerVisits(): Promise<CustomerVisit[]> {
    const response = await apiService.get('/telecalling/customer-visits/');
    return response.data;
  }

  // Get call logs for the current telecaller
  async getCallLogs(): Promise<CallLog[]> {
    try {
      const response = await apiService.get('/telecalling/call-logs/');


      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {

        return [];
      }
    } catch (error) {

      throw error;
    }
  }

  // Get dashboard data
  async getDashboard(): Promise<TelecallerDashboard> {
    const response = await apiService.get('/telecalling/dashboard/me/');
    return response.data;
  }

  // Create a call log
  async createCallLog(data: {
    assignment: string;
    call_status: string;
    call_duration: number;
    feedback: string;
    customer_sentiment: string;
    revisit_required: boolean;
    revisit_notes?: string;
  }): Promise<CallLog> {
    const response = await apiService.post('/telecalling/call-logs/', data);
    return response.data;
  }

  // Update assignment status
  async updateAssignment(assignmentId: string, data: {
    status: string;
    notes?: string;
    outcome?: string;
  }): Promise<Assignment> {
    const response = await apiService.patch(`/telecalling/assignments/${assignmentId}/`, data);
    return response.data;
  }

  // Helper methods for formatting
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'follow_up': 'Follow-up Needed',
      'unreachable': 'Unreachable',
    };
    return statusMap[status] || status;
  }

  formatPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
    };
    return priorityMap[priority] || priority;
  }

  formatCallStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'connected': 'Connected',
      'no_answer': 'No Answer',
      'busy': 'Busy',
      'wrong_number': 'Wrong Number',
      'not_interested': 'Not Interested',
      'call_back': 'Call Back Later',
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

  // Mask phone number
  maskPhone(phone: string): string {
    if (!phone) return '';
    if (phone.length <= 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }

  // Mask email
  maskEmail(email: string): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local;
    return `${maskedLocal}@${domain}`;
  }
}

export const telecallingLegacyApiService = new TelecallingLegacyApiService();
