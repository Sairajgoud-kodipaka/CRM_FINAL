'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { telecallingApiService, Lead, SalesPerson, LeadTransferRequest } from '@/services/telecallingApi';

interface TransferToSalesModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess: () => void;
}

export function TransferToSalesModal({
  lead,
  isOpen,
  onClose,
  onTransferSuccess
}: TransferToSalesModalProps) {
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  const [transferReason, setTransferReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [salesPersonsLoading, setSalesPersonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSalesPersons();
    }
  }, [isOpen]);

  const fetchSalesPersons = async () => {
    try {
      setSalesPersonsLoading(true);
      setError(null);
      const salesList = await telecallingApiService.getSalesPersons();
      setSalesPersons(salesList);
    } catch (err) {

      setError('Failed to load sales persons. Please try again.');
    } finally {
      setSalesPersonsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!lead || !selectedSalesPerson) {
      setError('Please select a sales person to transfer the lead to.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const transferData: LeadTransferRequest = {
        lead_id: lead.id,
        to_user_id: parseInt(selectedSalesPerson),
        transfer_reason: transferReason.trim() || undefined
      };

      const result = await telecallingApiService.transferLead(transferData);

      setSuccess(true);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onTransferSuccess();
        onClose();
        resetForm();
      }, 2000);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to transfer lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSalesPerson('');
    setTransferReason('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Transfer Lead to Sales
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Lead Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {lead.name}</p>
              <p><span className="font-medium">Phone:</span> {lead.phone}</p>
              <p><span className="font-medium">Source:</span> {lead.source}</p>
              <p><span className="font-medium">Status:</span> {lead.status}</p>
            </div>
          </div>

          {/* Sales Person Selection */}
          <div className="space-y-2">
            <Label htmlFor="sales-person">Select Sales Person</Label>
            {salesPersonsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Skeleton className="w-4 h-4 mr-2 rounded" />
                <span className="text-sm text-gray-600">Loading sales persons...</span>
              </div>
            ) : (
              <Select value={selectedSalesPerson} onValueChange={setSelectedSalesPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sales person" />
                </SelectTrigger>
                <SelectContent>
                  {salesPersons.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{person.name}</div>
                          <div className="text-xs text-gray-500">{person.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Transfer Reason */}
          <div className="space-y-2">
            <Label htmlFor="transfer-reason">Transfer Reason (Optional)</Label>
            <Textarea
              id="transfer-reason"
              placeholder="Why are you transferring this lead to sales? (e.g., Lead is interested, ready to purchase, etc.)"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                Lead transferred successfully! The sales person will be notified.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={loading || !selectedSalesPerson || salesPersonsLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Skeleton className="w-4 h-4 mr-2 rounded" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Transfer Lead
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
