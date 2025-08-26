"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, MapPin, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Appointment, apiService } from "@/lib/api-service";

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
}

export function AppointmentDetailModal({ appointment, open, onClose }: AppointmentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [customerName, setCustomerName] = useState<string>('');
  const [assignedUserName, setAssignedUserName] = useState<string>('');
  const [createdUserName, setCreatedUserName] = useState<string>('');
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });
  const [cancelReason, setCancelReason] = useState('');
  const [editData, setEditData] = useState({
    date: '',
    time: '',
    purpose: '',
    notes: '',
    location: '',
    duration: 60,
    client: ''
  });

  // Fetch customer and user names when appointment changes
  useEffect(() => {
    if (appointment) {
      fetchCustomerAndUserNames();
    }
  }, [appointment]);

    const fetchCustomerAndUserNames = async () => {
    if (!appointment) return;

    try {
      // Use embedded names from the appointment data if available
      if (appointment.assigned_to_name) {
        setAssignedUserName(appointment.assigned_to_name);
      } else if (appointment.assigned_to) {
        setAssignedUserName(`User #${appointment.assigned_to}`);
      }

      if (appointment.created_by_name) {
        setCreatedUserName(appointment.created_by_name);
      } else if (appointment.created_by) {
        setCreatedUserName(`User #${appointment.created_by}`);
      }

      // Fetch customer name if not already available
      if (appointment.client_name) {
        setCustomerName(appointment.client_name);
      } else if (appointment.client) {
        try {
          const customerResponse = await apiService.getClient(appointment.client.toString());
          if (customerResponse.success && customerResponse.data) {
            const customer = customerResponse.data;
            setCustomerName(`${customer.first_name} ${customer.last_name}`);
          } else {
            setCustomerName(`Customer #${appointment.client}`);
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
          setCustomerName(`Customer #${appointment.client}`);
        }
      }
    } catch (error) {
      console.error('Error fetching customer/user names:', error);
    }
  };

  if (!appointment) return null;

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
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'no_show':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const response = await apiService.confirmAppointment(appointment.id.toString());
      if (response.success) {
        alert('Appointment confirmed successfully!');
        onClose();
        // Refresh the appointments list
        window.location.reload();
      } else {
        alert('Failed to confirm appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Error confirming appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setShowOutcomeModal(true);
  };

  const handleCompleteSubmit = async () => {
    try {
      setLoading(true);
      const response = await apiService.completeAppointment(appointment.id.toString(), outcomeNotes);
      if (response.success) {
        alert('Appointment marked as completed!');
        setShowOutcomeModal(false);
        onClose();
        window.location.reload();
      } else {
        alert('Failed to complete appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Error completing appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async () => {
    try {
      setLoading(true);
      const response = await apiService.cancelAppointment(appointment.id.toString(), cancelReason);
      if (response.success) {
        alert('Appointment cancelled successfully!');
        setShowCancelModal(false);
        onClose();
        window.location.reload();
      } else {
        alert('Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Error cancelling appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    try {
      setLoading(true);
      const response = await apiService.rescheduleAppointment(
        appointment.id.toString(),
        rescheduleData.newDate,
        rescheduleData.newTime,
        rescheduleData.reason
      );
      if (response.success) {
        alert('Appointment rescheduled successfully!');
        setShowRescheduleModal(false);
        onClose();
        window.location.reload();
      } else {
        alert('Failed to reschedule appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Error rescheduling appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Pre-populate the edit form with current appointment data
    setEditData({
      date: appointment.date,
      time: appointment.time,
      purpose: appointment.purpose || '',
      notes: appointment.notes || '',
      location: appointment.location || '',
      duration: appointment.duration || 60,
      client: appointment.client
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      const response = await apiService.editAppointment(appointment.id.toString(), editData);
      if (response.success) {
        alert('Appointment updated successfully!');
        setShowEditModal(false);
        onClose();
        window.location.reload();
      } else {
        alert('Failed to update appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Error updating appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this appointment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(appointment.status)}
                <Badge variant={getStatusBadgeVariant(appointment.status)} className="capitalize">
                  {appointment.status}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                ID: #{appointment.id}
              </div>
            </div>

            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Appointment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date & Time</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDateTime(appointment.date, appointment.time)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-sm text-gray-900 mt-1">{appointment.duration} minutes</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Purpose</label>
                  <p className="text-sm text-gray-900 mt-1">{appointment.purpose}</p>
                </div>
                {appointment.location && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {appointment.location}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Customer Information */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {customerName || `Customer #${appointment.client}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer ID</label>
                  <p className="text-sm text-gray-900 mt-1">#{appointment.client}</p>
                </div>
              </div>
            </Card>

            {/* Notes and Additional Information */}
            {(appointment.notes || appointment.outcome_notes) && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes & Details
                </h3>
                <div className="space-y-4">
                  {appointment.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Appointment Notes</label>
                      <p className="text-sm text-gray-900 mt-1">{appointment.notes}</p>
                    </div>
                  )}
                  {appointment.outcome_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Outcome Notes</label>
                      <p className="text-sm text-gray-900 mt-1">{appointment.outcome_notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Follow-up Information */}
            {appointment.requires_follow_up && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Follow-up Required
                </h3>
                <div className="space-y-3">
                  {appointment.follow_up_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Follow-up Date</label>
                      <p className="text-sm text-gray-900 mt-1">{appointment.follow_up_date}</p>
                    </div>
                  )}
                  {appointment.follow_up_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Follow-up Notes</label>
                      <p className="text-sm text-gray-900 mt-1">{appointment.follow_up_notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Next Action */}
            {appointment.next_action && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Next Action</h3>
                <p className="text-sm text-gray-900">{appointment.next_action}</p>
              </Card>
            )}

            {/* System Information */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="font-medium text-gray-600">Created</label>
                  <p className="text-gray-900 mt-1">
                    {appointment.created_at ? new Date(appointment.created_at).toLocaleString() : 'N/A'}
                  </p>
                  {createdUserName && (
                    <p className="text-xs text-gray-500 mt-1">by {createdUserName}</p>
                  )}
                </div>
                <div>
                  <label className="font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900 mt-1">
                    {appointment.updated_at ? new Date(appointment.updated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {appointment.assigned_to && (
                  <div>
                    <label className="font-medium text-gray-600">Assigned To</label>
                    <p className="text-gray-900 mt-1">
                      {assignedUserName || `User #${appointment.assigned_to}`}
                    </p>
                  </div>
                )}
                {appointment.reminder_sent && (
                  <div>
                    <label className="font-medium text-gray-600">Reminder Sent</label>
                    <p className="text-gray-900 mt-1">Yes</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {appointment.status === 'scheduled' && (
                <>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? 'Confirming...' : 'Confirm'}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleReschedule}
                    disabled={loading}
                  >
                    Reschedule
                  </Button>
                </>
              )}
              {appointment.status === 'confirmed' && (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleComplete}
                  disabled={loading}
                >
                  Mark Complete
                </Button>
              )}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
                         <div className="flex gap-2">
               <Button 
                 variant="outline"
                 size="sm"
                 onClick={handleEdit}
                 disabled={loading}
               >
                 Edit
               </Button>
               <Button variant="outline" size="sm" onClick={onClose}>
                 Close
               </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Appointment Modal */}
      <Dialog open={showOutcomeModal} onOpenChange={setShowOutcomeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Add outcome notes for this completed appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="outcome-notes">Outcome Notes</Label>
              <Textarea
                id="outcome-notes"
                placeholder="Describe the outcome of this appointment..."
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOutcomeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteSubmit} disabled={loading}>
              {loading ? 'Completing...' : 'Complete Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Appointment Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Set a new date and time for this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-date">New Date</Label>
              <Input
                id="new-date"
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new-time">New Time</Label>
              <Input
                id="new-time"
                type="time"
                value={rescheduleData.newTime}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, newTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reschedule-reason">Reason (Optional)</Label>
              <Textarea
                id="reschedule-reason"
                placeholder="Why is this appointment being rescheduled?"
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRescheduleSubmit} 
              disabled={loading || !rescheduleData.newDate || !rescheduleData.newTime}
            >
              {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* Cancel Appointment Modal */}
       <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Cancel Appointment</DialogTitle>
             <DialogDescription>
               Are you sure you want to cancel this appointment?
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label htmlFor="cancel-reason">Reason (Optional)</Label>
               <Textarea
                 id="cancel-reason"
                 placeholder="Why is this appointment being cancelled?"
                 value={cancelReason}
                 onChange={(e) => setCancelReason(e.target.value)}
                 rows={3}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowCancelModal(false)}>
               Keep Appointment
             </Button>
             <Button variant="destructive" onClick={handleCancelSubmit} disabled={loading}>
               {loading ? 'Cancelling...' : 'Cancel Appointment'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Edit Appointment Modal */}
       <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Edit Appointment</DialogTitle>
             <DialogDescription>
               Update the appointment details
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label htmlFor="edit-date">Date</Label>
               <Input
                 id="edit-date"
                 type="date"
                 value={editData.date}
                 onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
               />
             </div>
             <div>
               <Label htmlFor="edit-time">Time</Label>
               <Input
                 id="edit-time"
                 type="time"
                 value={editData.time}
                 onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
               />
             </div>
             <div>
               <Label htmlFor="edit-purpose">Purpose</Label>
               <Input
                 id="edit-purpose"
                 placeholder="Purpose of the appointment"
                 value={editData.purpose}
                 onChange={(e) => setEditData(prev => ({ ...prev, purpose: e.target.value }))}
               />
             </div>
             <div>
               <Label htmlFor="edit-location">Location (Optional)</Label>
               <Input
                 id="edit-location"
                 placeholder="Location of the appointment"
                 value={editData.location}
                 onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
               />
             </div>
             <div>
               <Label htmlFor="edit-duration">Duration (minutes)</Label>
               <Input
                 id="edit-duration"
                 type="number"
                 min="15"
                 max="480"
                 step="15"
                 value={editData.duration}
                 onChange={(e) => setEditData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
               />
             </div>
             <div>
               <Label htmlFor="edit-notes">Notes (Optional)</Label>
               <Textarea
                 id="edit-notes"
                 placeholder="Additional notes about the appointment"
                 value={editData.notes}
                 onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                 rows={3}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowEditModal(false)}>
               Cancel
             </Button>
             <Button 
               onClick={handleEditSubmit} 
               disabled={loading || !editData.date || !editData.time || !editData.purpose}
             >
               {loading ? 'Updating...' : 'Update Appointment'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 } 