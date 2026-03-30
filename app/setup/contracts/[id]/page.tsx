'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText, Download, Eye } from "lucide-react";
import Link from "next/link";

interface Contract {
  id: string;
  offer_letter_id: string;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  reporting_station: string | null;
  grade_level: string | null;
  contract_type: string | null;
  expected_start_date: string;
  contract_duration: string | null;
  acceptance_deadline: string | null;
  salary_notes: string | null;
  custom_clauses: string | null;
  status: string;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  token_expires_at: string | null;
  created_at: string;
}

interface ContractDetails {
  contract_id: string;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  swift_code: string | null;
  iban: string | null;
  visa_status: string | null;
  visa_notes: string | null;
  needs_assistance: boolean;
  ifaq_status: string | null;
  ssafe_status: string | null;
}

interface BsafeUpload {
  id: string;
  contract_id: string;
  file_name: string;
  file_size: number;
  file_url: string | null;
  uploaded_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-purple-100 text-purple-800",
  viewed: "bg-cyan-100 text-cyan-800",
  signed: "bg-blue-100 text-blue-800",
  details_pending: "bg-amber-100 text-amber-800",
  bsafe_pending: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [contract, setContract] = useState<Contract | null>(null);
  const [details, setDetails] = useState<ContractDetails | null>(null);
  const [bsafeUpload, setBsafeUpload] = useState<BsafeUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [bsafeApproving, setBsafeApproving] = useState(false);
  const [bsafeReason, setBsafeReason] = useState('');
  const [bsafeNotes, setBsafeNotes] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const contractId = params.id as string;

        // Fetch contract
        const { data: contractData, error: contractError } = await supabase
          .from('employment_contracts')
          .select('*')
          .eq('id', contractId)
          .single();

        if (contractError || !contractData) {
          console.error('[v0] Contract not found:', contractError);
          router.push('/setup/contracts');
          return;
        }

        setContract(contractData);

        // Fetch contract details
        const { data: detailsData } = await supabase
          .from('employment_contracts')
          .select('account_holder_name, bank_name, account_number, swift_code, iban, visa_status, visa_notes, needs_assistance, ifaq_status, ssafe_status')
          .eq('id', contractId)
          .single();

        if (detailsData) {
          setDetails(detailsData as any);
        }

        // Fetch BSAFE upload if exists
        const { data: bsafeData } = await supabase
          .from('bsafe_uploads')
          .select('*')
          .eq('contract_id', contractId)
          .single();

        if (bsafeData) {
          setBsafeUpload(bsafeData);
        }
      } catch (error) {
        console.error('[v0] Error fetching contract:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  const handleBsafeApproval = async (approved: boolean) => {
    if (!approved && !bsafeReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setBsafeApproving(true);
      const contractId = params.id as string;

      const response = await fetch(`/api/contracts/${contractId}/bsafe-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          reason: bsafeReason,
          adminNotes: bsafeNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to update BSAFE status'}`);
        return;
      }

      alert(`BSAFE certification ${approved ? 'approved' : 'rejected'} successfully. Email notification sent to applicant.`);
      setBsafeReason('');
      setBsafeNotes('');

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('[v0] Error updating BSAFE status:', error);
      alert('Failed to update BSAFE status');
    } finally {
      setBsafeApproving(false);
    }
  };

  const handleContractStatusUpdate = async (status: string) => {
    try {
      setStatusUpdating(true);

      const response = await fetch(`/api/contracts/${contract!.id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          message: statusMessage || `Contract status has been updated to ${status}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to update status'}`);
        return;
      }

      alert('Contract status updated and email notification sent to applicant.');
      setNewStatus('');
      setStatusMessage('');

      // Update local state
      setContract((prev) => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('[v0] Error updating contract status:', error);
      alert('Failed to update contract status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4">
        <Link href="/setup/contracts">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Contract not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/setup/contracts">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{contract.applicant_name}</h1>
            <p className="text-muted-foreground">{contract.job_title}</p>
          </div>
        </div>
        <Badge className={statusColors[contract.status] || "bg-gray-100"}>
          {contract.status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{contract.applicant_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Job Title</p>
              <p className="font-medium">{contract.job_title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reporting Station</p>
              <p className="font-medium">{contract.reporting_station || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade Level</p>
              <p className="font-medium">{contract.grade_level || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contract Type</p>
              <p className="font-medium capitalize">{contract.contract_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Start Date</p>
              <p className="font-medium">
                {new Date(contract.expected_start_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      {details && (details.bank_name || details.account_holder_name) && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Holder Name</p>
                <p className="font-medium">{details.account_holder_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bank Name</p>
                <p className="font-medium">{details.bank_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{details.account_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SWIFT Code</p>
                <p className="font-medium">{details.swift_code || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">IBAN</p>
                <p className="font-medium">{details.iban || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visa Status */}
      {details && details.visa_status && (
        <Card>
          <CardHeader>
            <CardTitle>Visa Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Visa Status</p>
                <p className="font-medium capitalize">{details.visa_status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Assistance</p>
                <p className="font-medium">{details.needs_assistance ? 'Yes' : 'No'}</p>
              </div>
              {details.visa_notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{details.visa_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Status */}
      {details && (details.ifaq_status || details.ssafe_status) && (
        <Card>
          <CardHeader>
            <CardTitle>Security Confirmations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">IFAQ Status</p>
                <p className="font-medium capitalize">{details.ifaq_status || 'Not submitted'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SSAFE Status</p>
                <p className="font-medium capitalize">{details.ssafe_status || 'Not submitted'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BSAFE Upload */}
      {bsafeUpload && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>BSAFE Certification</CardTitle>
              <Badge className={
                bsafeUpload.file_url?.includes('approved') 
                  ? 'bg-green-100 text-green-800'
                  : bsafeUpload.file_url?.includes('rejected')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }>
                {bsafeUpload.file_url?.includes('approved') ? 'Approved' : bsafeUpload.file_url?.includes('rejected') ? 'Rejected' : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">File Name</p>
                <p className="font-medium">{bsafeUpload.file_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File Size</p>
                <p className="font-medium">{(bsafeUpload.file_size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uploaded At</p>
              <p className="font-medium">
                {new Date(bsafeUpload.uploaded_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Admin approval section */}
            {!bsafeUpload.file_url?.includes('approved') && !bsafeUpload.file_url?.includes('rejected') && (
              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Rejection Reason (if declining)</label>
                  <textarea
                    value={bsafeReason}
                    onChange={(e) => setBsafeReason(e.target.value)}
                    placeholder="e.g., Document is unclear, expired certification, etc."
                    className="w-full mt-1 p-2 border rounded text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <textarea
                    value={bsafeNotes}
                    onChange={(e) => setBsafeNotes(e.target.value)}
                    placeholder="Internal notes about this certification..."
                    className="w-full mt-1 p-2 border rounded text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBsafeApproval(true)}
                    disabled={bsafeApproving}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {bsafeApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleBsafeApproval(false)}
                    disabled={bsafeApproving || !bsafeReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {bsafeApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Update Contract Status */}
      <Card>
        <CardHeader>
          <CardTitle>Update Contract Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full mt-2 p-2 border rounded"
            >
              <option value="">Select a status...</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="signed">Signed</option>
              <option value="bsafe_pending">BSAFE Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Notification Message</label>
            <textarea
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="Optional message to include in the email notification..."
              className="w-full mt-2 p-2 border rounded"
              rows={3}
            />
          </div>

          <Button
            onClick={() => newStatus && handleContractStatusUpdate(newStatus)}
            disabled={statusUpdating || !newStatus}
            className="w-full"
          >
            {statusUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Status & Send Notification
          </Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contract.created_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Created: </span>
              <span className="font-medium">
                {new Date(contract.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          {contract.sent_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Sent: </span>
              <span className="font-medium">
                {new Date(contract.sent_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          {contract.viewed_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Viewed: </span>
              <span className="font-medium">
                {new Date(contract.viewed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          {contract.signed_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Signed: </span>
              <span className="font-medium">
                {new Date(contract.signed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
