'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye } from 'lucide-react';
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal';
import { apiService } from '@/lib/api-service';

const stats = [
  { label: 'Total Appointments', value: 6 },
  { label: 'Upcoming', value: 2 },
  { label: 'Completed', value: 3 },
  { label: 'Cancelled', value: 1 },
];

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

export default function TelecallerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAppointments();
      if (response.success && response.data && Array.isArray(response.data)) {
        setAppointments(response.data);
      } else {
        console.warn('Appointments response is not an array:', response.data);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = Array.isArray(appointments) ? appointments.filter(appointment => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = appointment.purpose.toLowerCase().includes(searchLower) ||
                         (appointment.client_name && appointment.client_name.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  const stats = [
    { label: 'Total Appointments', value: Array.isArray(appointments) ? appointments.length : 0 },
    { label: 'Upcoming', value: Array.isArray(appointments) ? appointments.filter(a => a.status === 'confirmed').length : 0 },
    { label: 'Completed', value: Array.isArray(appointments) ? appointments.filter(a => a.status === 'completed').length : 0 },
    { label: 'Cancelled', value: Array.isArray(appointments) ? appointments.filter(a => a.status === 'cancelled').length : 0 },
  ];

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleAppointmentUpdated = () => {
    setIsDetailModalOpen(false);
    setSelectedAppointment(null);
    fetchAppointments(); // Refresh the list
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
      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Appointments</h1>
          <p className="text-text-secondary mt-1">Book appointments for the sales team</p>
        </div>
        <Button className="btn-primary text-sm flex items-center gap-1"><Calendar className="w-4 h-4" /> New Appointment</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-1 p-5">
            <div className="text-xl font-bold text-text-primary">{s.value}</div>
            <div className="text-sm text-text-secondary font-medium">{s.label}</div>
          </Card>
        ))}
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input 
            placeholder="Search by customer or type..." 
            className="w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Date/Time</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Purpose</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">
                      {appointment.client_name || `Customer #${appointment.client}`}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {new Date(appointment.date).toLocaleDateString()}, {appointment.time}
                    </td>
                    <td className="px-4 py-2 text-text-primary">{appointment.purpose}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="capitalize text-xs">{appointment.status}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewAppointment(appointment)}
                        title="View appointment details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}