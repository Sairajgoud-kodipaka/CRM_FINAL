'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Eye, Search, Plus, Clock, CheckCircle, XCircle, AlertTriangle, CalendarDays, RefreshCw, Users } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal';
import { useToast } from '@/hooks/use-toast';

// Local interface to match backend serializer
interface Appointment {
  id: number;
  client: number;
  client_name?: string;
  tenant: number;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
  status: string;
  reminder_sent: boolean;
  reminder_date?: string;
  requires_follow_up: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  duration: number;
  location?: string;
  outcome_notes?: string;
  next_action?: string;
  created_by?: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface AppointmentStats {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  overdueAppointments: number;
}

export default function ManagerAppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    overdueAppointments: 0,
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  
  // Add Appointment Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    client: '',
    date: '',
    time: '',
    purpose: '',
    notes: '',
    duration: '60',
    location: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchAppointments();
    fetchCustomers();
    // Set up daily notification check
    const checkTodayAppointments = () => {
      checkTodayAppointmentsNotification();
    };
    
    // Check immediately
    checkTodayAppointments();
    
    // Check every hour
    const interval = setInterval(checkTodayAppointments, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter appointments based on search term, status, and date
    let filtered = appointments || [];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.toString().includes(searchTerm) ||
        appointment.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }
    
    // Filter by date - show today + future + incomplete past
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const appointmentDateTime = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      
      // Always show today and future appointments
      if (appointmentDateTime >= today) {
        return true;
      }
      
      // Show past appointments only if they're incomplete and user wants to see overdue
      if (showOverdue && appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        return true;
      }
      
      return false;
    });
    
    // Sort appointments: today first, then by date
    filtered.sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      const aIsToday = aDate.toDateString() === today.toDateString();
      const bIsToday = bDate.toDateString() === today.toDateString();
      
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      
      return aDate.getTime() - bDate.getTime();
    });
    
    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, showOverdue]);

  useEffect(() => {
    // Calculate stats from appointments
    const appointmentsArray = appointments || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const totalAppointments = appointmentsArray.length;
    const todayAppointments = appointmentsArray.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate.toDateString() === today.toDateString();
    }).length;
    
    const upcomingAppointments = appointmentsArray.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate >= today && (a.status === 'scheduled' || a.status === 'confirmed');
    }).length;
    
    const completedAppointments = appointmentsArray.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointmentsArray.filter(a => a.status === 'cancelled').length;
    
    const overdueAppointments = appointmentsArray.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate < today && a.status !== 'completed' && a.status !== 'cancelled';
    }).length;

    setStats({
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      overdueAppointments,
    });
  }, [appointments]);

  const checkTodayAppointmentsNotification = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    
    const todayAppointments = appointments.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate.toDateString() === today.toDateString() && 
             a.status === 'scheduled' || a.status === 'confirmed';
    });
    
    if (todayAppointments.length > 0) {
      // Check if any appointment is within the next hour
      const upcomingAppointments = todayAppointments.filter(a => {
        const [hours, minutes] = a.time.split(':');
        const appointmentHour = parseInt(hours);
        const appointmentMinute = parseInt(minutes);
        const appointmentTime = appointmentHour * 60 + appointmentMinute;
        const currentTime = currentHour * 60 + now.getMinutes();
        
        // Show notification if appointment is within the next hour
        return (appointmentTime - currentTime) <= 60 && (appointmentTime - currentTime) > 0;
      });
      
      if (upcomingAppointments.length > 0) {
        upcomingAppointments.forEach(appointment => {
          const [hours, minutes] = appointment.time.split(':');
          const appointmentTime = `${hours}:${minutes}`;
          
          toast({
            title: "🔔 Upcoming Appointment",
            description: `${appointment.client_name || 'Customer'} has an appointment at ${appointmentTime}`,
            variant: "default",
          });
        });
      }
      
      // Show summary notification for today's appointments
      if (currentHour === 9) { // Show at 9 AM
        toast({
          title: "📅 Today's Appointments",
          description: `You have ${todayAppointments.length} appointment(s) scheduled for today`,
          variant: "default",
        });
      }
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      console.log('=== FETCHING APPOINTMENTS ===');
      const response = await apiService.getAppointments();
      console.log('Appointments API response:', response);
      console.log('Response success:', response.success);
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', response.data);
      
      // Ensure we have an array of appointments
      const appointmentsData = Array.isArray(response.data) ? response.data : [];
      console.log('Processed appointments data:', appointmentsData);
      console.log('Appointments count:', appointmentsData.length);
      
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiService.getClients();
      if (response.success && response.data) {
        const customersData = Array.isArray(response.data) ? response.data : [];
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const time = timeString ? timeString : '00:00';
    const [hours, minutes] = time.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));
    
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'rescheduled':
        return 'outline';
      case 'no_show':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'confirmed':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const isAppointmentOverdue = (appointment: Appointment) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDate = new Date(appointment.date);
    const appointmentDateTime = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    return appointmentDateTime < today && appointment.status !== 'completed' && appointment.status !== 'cancelled';
  };

  const isAppointmentToday = (appointment: Appointment) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDate = new Date(appointment.date);
    const appointmentDateTime = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    return appointmentDateTime.toDateString() === today.toDateString();
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleRescheduleAppointment = async (appointment: Appointment) => {
    // TODO: Implement reschedule functionality
    console.log('Reschedule appointment:', appointment);
    toast({
      title: "Reschedule Appointment",
      description: "Reschedule functionality will be implemented soon",
      variant: "default",
    });
  };

  const handleCreateAppointment = () => {
    // Reset form and open modal
    setAppointmentForm({
      client: '',
      date: '',
      time: '',
      purpose: '',
      notes: '',
      duration: '60',
      location: '',
      status: 'scheduled'
    });
    setIsAddModalOpen(true);
  };

  const handleAppointmentFormChange = (field: string, value: string) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitAppointment = async () => {
    // Validate form
    if (!appointmentForm.client || !appointmentForm.date || !appointmentForm.time || !appointmentForm.purpose) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Customer, Date, Time, Purpose)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const appointmentData = {
        client: parseInt(appointmentForm.client),
        date: appointmentForm.date,
        time: appointmentForm.time,
        purpose: appointmentForm.purpose,
        notes: appointmentForm.notes || '',
        duration: parseInt(appointmentForm.duration),
        location: appointmentForm.location || '',
        status: appointmentForm.status
      };

      console.log('Creating appointment with data:', appointmentData);
      
      const response = await apiService.createAppointment(appointmentData);
      
      if (response.success) {
        toast({
          title: "Success!",
          description: "Appointment created successfully",
          variant: "default",
        });
        
        // Close modal and refresh appointments
        setIsAddModalOpen(false);
        fetchAppointments();
        
        // Reset form
        setAppointmentForm({
          client: '',
          date: '',
          time: '',
          purpose: '',
          notes: '',
          duration: '60',
          location: '',
          status: 'scheduled'
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create appointment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Appointments</h1>
          <p className="text-text-secondary mt-1">Manage and track all appointments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAppointments}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button className="btn-primary text-sm flex items-center gap-1" onClick={handleCreateAppointment}>
            <Plus className="w-4 h-4" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.todayAppointments}</div>
          <div className="text-sm text-text-secondary font-medium">Today's Appointments</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.upcomingAppointments}</div>
          <div className="text-sm text-text-secondary font-medium">Upcoming</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.completedAppointments}</div>
          <div className="text-sm text-text-secondary font-medium">Completed</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.overdueAppointments}</div>
          <div className="text-sm text-text-secondary font-medium">Overdue</div>
          </Card>
      </div>

      {/* Overdue Appointments Toggle */}
      {stats.overdueAppointments > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                You have {stats.overdueAppointments} incomplete appointment(s) from previous days
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverdue(!showOverdue)}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {showOverdue ? 'Hide Overdue' : 'Show Overdue'}
            </Button>
          </div>
        </Card>
      )}

      {/* Appointments Table */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search by customer or type..." 
              className="pl-10 w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Date/Time</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Purpose</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Duration</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const isOverdue = isAppointmentOverdue(appointment);
                  const isToday = isAppointmentToday(appointment);
                  
                  return (
                    <tr 
                      key={appointment.id} 
                      className={`border-t border-border hover:bg-gray-50 ${
                        isToday ? 'bg-blue-50' : ''
                      } ${
                        isOverdue ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          {appointment.client_name || `Customer #${appointment.client}`}
                          {isToday && (
                            <Badge variant="default" className="bg-blue-600 text-white text-xs">
                              <CalendarDays className="w-3 h-3 mr-1" />
                              Today
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {formatDateTime(appointment.date, appointment.time)}
                  </td>
                      <td className="px-4 py-3 text-text-primary">
                        <div className="max-w-xs truncate" title={appointment.purpose}>
                          {appointment.purpose}
                        </div>
                    </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(appointment.status)}
                          <Badge variant={getStatusBadgeVariant(appointment.status)} className="capitalize text-xs">
                            {appointment.status}
                          </Badge>
                        </div>
                    </td>
                      <td className="px-4 py-3 text-text-primary">
                        {appointment.duration} min
                    </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleViewAppointment(appointment)}
                        title="View appointment details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                          {isOverdue && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              onClick={() => handleRescheduleAppointment(appointment)}
                              title="Reschedule overdue appointment"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    {appointments.length === 0 ? 'No appointments found' : 'No appointments match your search criteria'}
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredAppointments.length > 0 && (
          <div className="text-sm text-text-secondary text-center py-2">
            Showing {filteredAppointments.length} of {appointments.length} appointments
            {!showOverdue && stats.overdueAppointments > 0 && (
              <span className="ml-2 text-orange-600">
                • {stats.overdueAppointments} overdue appointment(s) hidden
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Add Appointment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment with a customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <Select value={appointmentForm.client} onValueChange={(value) => handleAppointmentFormChange('client', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {customer.first_name} {customer.last_name} - {customer.phone}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <Input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time *</label>
                <Input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
                />
              </div>
            </div>

            {/* Purpose and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Purpose *</label>
                <Select value={appointmentForm.purpose} onValueChange={(value) => handleAppointmentFormChange('purpose', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Product Demo">Product Demo</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Select value={appointmentForm.duration} onValueChange={(value) => handleAppointmentFormChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  placeholder="e.g., Store, Office, Customer's place"
                  value={appointmentForm.location}
                  onChange={(e) => handleAppointmentFormChange('location', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={appointmentForm.status} onValueChange={(value) => handleAppointmentFormChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Textarea
                placeholder="Additional notes about the appointment..."
                value={appointmentForm.notes}
                onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAppointment} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
}