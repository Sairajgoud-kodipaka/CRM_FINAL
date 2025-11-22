"use client";
import { formatCustomerName, cleanCustomerNameFromText } from '@/utils/name-utils';
import React, { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { Calendar, Clock, User, MapPin, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Appointment, apiService } from "@/lib/api-service";

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  openInEditMode?: boolean; // New prop to open directly in edit mode
}

export function AppointmentDetailModal({ appointment, open, onClose, openInEditMode = false }: AppointmentDetailModalProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [loading, setLoading] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(openInEditMode);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
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

  // Open edit modal if openInEditMode is true (but don't show view modal)
  useEffect(() => {
    if (open && openInEditMode && appointment) {
      // Pre-populate edit form immediately
      setEditData({
        date: appointment.date,
        time: appointment.time,
        purpose: appointment.purpose || '',
        notes: appointment.notes || '',
        location: appointment.location || '',
        duration: appointment.duration || 60,
        client: appointment.client.toString()
      });
      // Open edit modal directly, view modal will be hidden
      setShowEditModal(true);
    } else if (open && !openInEditMode) {
      // If opening in view mode, make sure edit modal is closed
      setShowEditModal(false);
    }
  }, [open, openInEditMode, appointment]);

  // Reset edit modal state when modal closes
  useEffect(() => {
    if (!open) {
      setShowEditModal(false);
    }
  }, [open]);

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

      // Set customer name from appointment data if available
      if (appointment.client_name) {
        setCustomerName(appointment.client_name);
      }
      
      // Use client_phone from appointment data if available (comes from backend serializer)
      if (appointment.client_phone) {
        setCustomerPhone(appointment.client_phone || 'Not provided');
      }
      
      // Fallback: Fetch customer data only if name or phone is missing
      if ((!appointment.client_name || !appointment.client_phone) && appointment.client) {
        try {
          const customerResponse = await apiService.getClient(appointment.client.toString());
          if (customerResponse.success && customerResponse.data) {
            const customer = customerResponse.data;
            if (!appointment.client_name) {
              setCustomerName(`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer');
            }
            if (!appointment.client_phone) {
              setCustomerPhone(customer.phone || 'Not provided');
            }
          } else {
            if (!appointment.client_name) {
              setCustomerName(`Customer #${appointment.client}`);
            }
            if (!appointment.client_phone) {
              setCustomerPhone('Not provided');
            }
          }
        } catch (error) {
          if (!appointment.client_name) {
            setCustomerName(`Customer #${appointment.client}`);
          }
          if (!appointment.client_phone) {
            setCustomerPhone('Not provided');
          }
        }
      }
    } catch (error) {

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
      client: appointment.client.toString()
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      const response = await apiService.editAppointment(appointment.id.toString(), {
        ...editData,
        client: parseInt(editData.client) || appointment.client
      });
      if (response.success) {
        alert('Appointment updated successfully!');
        setShowEditModal(false);
        onClose();
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert('Failed to update appointment. Please try again.');
      }
    } catch (error) {

      alert('Error updating appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    return (
    <>
      {/* View Modal - only show if not opening in edit mode */}
      <ResponsiveDialog
        open={open && !openInEditMode && !showEditModal}
        onOpenChange={onClose}
        title="Appointment Details"
        description="View detailed information about this appointment"
        size={isMobile ? "full" : isTablet ? "lg" : "xl"}
        showCloseButton={true}
        actions={
          <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            {appointment?.status === 'scheduled' && (
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
                  onClick={() => setShowRescheduleModal(true)}
                  disabled={loading}
                >
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            )}
            {appointment?.status === 'confirmed' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowOutcomeModal(true)}
                  disabled={loading}
                >
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRescheduleModal(true)}
                  disabled={loading}
                >
                  Reschedule
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
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
              <div>
                <label className="text-sm font-medium text-gray-600">Purpose</label>
                <p className="text-sm text-gray-900 mt-1">{appointment.purpose}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Location</label>
                <p className="text-sm text-gray-900 mt-1">{appointment.location || 'Not specified'}</p>
              </div>
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
                <label className="text-sm font-medium text-gray-600">Customer Name</label>
                <p className="text-sm text-gray-900 mt-1">{customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-sm text-gray-900 mt-1">{customerPhone}</p>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {appointment.notes && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h3>
              <p className="text-sm text-gray-900">{appointment.notes}</p>
            </Card>
          )}
        </div>
      </ResponsiveDialog>

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
       <Dialog open={showEditModal} onOpenChange={(isOpen) => {
         setShowEditModal(isOpen);
         if (!isOpen) {
           // When edit modal closes, also close the parent modal
           onClose();
         }
       }}>
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
