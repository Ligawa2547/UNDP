'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText, Plus, Eye, Send, Download, Trash2, CheckCircle2, AlertCircle,
  Loader2, Filter, Printer, FileCheck, Clock, Upload, X,
} from "lucide-react";
import Link from "next/link";

const contractStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-purple-100 text-purple-800",
  viewed: "bg-cyan-100 text-cyan-800",
  signed: "bg-blue-100 text-blue-800",
  details_pending: "bg-amber-100 text-amber-800",
  bsafe_pending: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
};

interface OffersQuickCreateProps {
  onSuccess: () => void;
}

function OffersQuickCreate({ onSuccess }: OffersQuickCreateProps) {
  const supabase = createClient();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('offer_letters')
        .select('*')
        .in('status', ['sent', 'viewed', 'signed'])
        .limit(5)
        .order('created_at', { ascending: false });

      setOffers(data || []);
    } catch (error) {
      console.error('[v0] Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (offerId: string) => {
    setCreating(offerId);

    try {
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerLetterId: offerId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Contract created and sent!\n\nPortal Link: ${window.location.origin}${data.portalLink}`);
        onSuccess();
        fetchOffers();
      } else {
        console.error('[v0] API Error Response:', data);
        alert(`Error: ${data.error || 'Failed to create contract'}`);
      }
    } catch (error) {
      console.error('[v0] Error creating contract:', error);
      alert(`Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (offers.length === 0) {
    return (
      <div className="text-sm text-blue-800">
        No issued offer letters available. Create offer letters first, then you can quickly convert them to contracts here.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {offers.map(offer => (
        <div key={offer.id} className="flex flex-col gap-2 p-3 bg-white rounded border border-blue-200">
          <div>
            <p className="font-medium text-sm">{offer.applicant_name}</p>
            <p className="text-xs text-muted-foreground">{offer.job_title}</p>
            <p className="text-xs text-muted-foreground">{offer.applicant_email}</p>
          </div>
          <Button
            size="sm"
            onClick={() => handleCreateContract(offer.id)}
            disabled={creating === offer.id}
            className="w-full"
          >
            {creating === offer.id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Create Contract
          </Button>
        </div>
      ))}
    </div>
  );
}

interface Contract {
  id: string;
  offer_letter_id: string;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  offer_letters: { id: string; applicant_name: string } | null;
}

interface ContractDetails {
  id: string;
  contract_id: string;
  bank_account_holder: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_code: string | null;
  visa_status: string | null;
  visa_expiry: string | null;
  needs_visa_assistance: boolean | null;
  ifaq_confirmed: boolean;
  ssafe_confirmed: boolean;
  ssafe_approval_number: string | null;
}

export default function ContractsPage() {
  const supabase = createClient();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);
  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);

  const [printingContractId, setPrintingContractId] = useState<string | null>(null);
  const [printStatusOpen, setPrintStatusOpen] = useState(false);

  // Load contracts
  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employment_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[v0] Error loading contracts:', error);
        return;
      }

      setContracts(data || []);
    } catch (error) {
      console.error('[v0] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContractFromOffer = async (offerLetterData: any) => {
    try {
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerLetterId: offerLetterData.id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Contract created and sent to applicant!\n\nPortal Link: ${window.location.origin}${data.portalLink}`);
        loadContracts();
      } else {
        console.error('[v0] API Error Response:', data);
        alert(`Error creating contract: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[v0] Error creating contract:', error);
      alert(`Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;

    try {
      const { error } = await supabase
        .from('employment_contracts')
        .delete()
        .eq('id', contractId);

      if (error) {
        console.error('[v0] Delete error:', error);
        return;
      }

      setContracts(contracts.filter(c => c.id !== contractId));
    } catch (error) {
      console.error('[v0] Error:', error);
    }
  };

  const handleViewDetails = async (contractId: string) => {
    setSelectedContractId(contractId);
    try {
      const { data, error } = await supabase
        .from('contract_details')
        .select('*')
        .eq('contract_id', contractId)
        .single();

      if (error) {
        console.log('[v0] No contract details yet');
        setContractDetails(null);
      } else {
        setContractDetails(data);
      }
    } catch (error) {
      console.error('[v0] Error:', error);
    }
    setContractDetailsOpen(true);
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.applicant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employment Contracts</h1>
          <p className="text-muted-foreground">Manage employee contracts and document collection</p>
        </div>
        <Link href="/setup/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Quick Create from Offer Letters */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Create Contract from Offer Letter</CardTitle>
          <CardDescription>Select an issued offer letter to instantly create and send a contract based on its details.</CardDescription>
        </CardHeader>
        <CardContent>
          <OffersQuickCreate onSuccess={() => loadContracts()} />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="details_pending">Details Pending</SelectItem>
                  <SelectItem value="bsafe_pending">BSAFE Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={loadContracts}>
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No contracts found</p>
              <Link href="/setup/contracts/new">
                <Button>Create First Contract</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.applicant_name}</p>
                          <p className="text-sm text-muted-foreground">{contract.applicant_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{contract.job_title}</TableCell>
                      <TableCell>
                        <Badge className={contractStatusColors[contract.status] || 'bg-gray-100 text-gray-800'}>
                          {contract.status.replace(/_/g, ' ').charAt(0).toUpperCase() + contract.status.slice(1).replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Link href={`/setup/contracts/${contract.id}`}>
                            <Button variant="outline" size="sm" title="Edit">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {contract.status !== 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Download PDF" 
                              onClick={() => window.open(`/api/contracts/${contract.id}/download`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="View Details" 
                            onClick={() => handleViewDetails(contract.id)}
                          >
                            <FileCheck className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Print Status" 
                            onClick={() => { 
                              setPrintingContractId(contract.id); 
                              setPrintStatusOpen(true); 
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {contract.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Delete"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={contractDetailsOpen} onOpenChange={setContractDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {contractDetails ? (
            <div className="space-y-4">
              {/* Bank Details */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold mb-2">Bank Details</h3>
                {contractDetails.bank_account_holder ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Holder</p>
                      <p className="font-medium">{contractDetails.bank_account_holder}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium">{contractDetails.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-medium">{contractDetails.bank_account_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank Code</p>
                      <p className="font-medium">{contractDetails.bank_code}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Not provided yet</p>
                )}
              </div>

              {/* Visa Details */}
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-semibold mb-2">Visa Status</h3>
                {contractDetails.visa_status ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{contractDetails.visa_status}</p>
                    </div>
                    {contractDetails.visa_expiry && (
                      <div>
                        <p className="text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">{new Date(contractDetails.visa_expiry).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Visa Assistance</p>
                      <p className="font-medium">{contractDetails.needs_visa_assistance ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Not provided yet</p>
                )}
              </div>

              {/* Security Confirmations */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold mb-2">Security Clearances</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {contractDetails.ifaq_confirmed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span>IFAQ Confirmed: {contractDetails.ifaq_confirmed ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {contractDetails.ssafe_confirmed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span>SSAFE Confirmed: {contractDetails.ssafe_confirmed ? 'Yes' : 'No'}</span>
                  </div>
                  {contractDetails.ssafe_approval_number && (
                    <div>
                      <p className="text-muted-foreground">SSAFE Approval #</p>
                      <p className="font-medium">{contractDetails.ssafe_approval_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BSAFE Status */}
              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <h3 className="font-semibold mb-2">BSAFE Certification</h3>
                <p className="text-muted-foreground text-sm">Check employee portal for uploaded BSAFE documentation</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No details submitted yet</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Status Dialog */}
      {printingContractId && (
        <Dialog open={printStatusOpen} onOpenChange={setPrintStatusOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract Status Timeline</DialogTitle>
            </DialogHeader>
            {(() => {
              const contract = contracts.find(c => c.id === printingContractId);
              if (!contract) return <p className="text-muted-foreground">Contract not found</p>;
              
              const statusTimeline = [
                { status: 'created', label: 'Created', date: contract.created_at, icon: '📄' },
                { status: 'sent', label: 'Sent to Employee', date: contract.sent_at, icon: '📤' },
                { status: 'signed', label: 'Contract Signed', date: contract.signed_at, icon: '✅' },
                { status: 'details_pending', label: 'Awaiting Bank & Visa Details', date: null, icon: '🏦' },
                { status: 'bsafe_pending', label: 'BSAFE Certification Pending', date: null, icon: '🔒' },
                { status: 'completed', label: 'Onboarding Complete', date: null, icon: '🎉' },
              ];

              const getCompletionStatus = (status: string) => {
                const order = ['created', 'sent', 'signed', 'details_pending', 'bsafe_pending', 'completed'];
                const currentIndex = order.indexOf(contract.status);
                return order.indexOf(status) <= currentIndex;
              };

              return (
                <div className="space-y-6">
                  <div className="bg-muted/40 rounded-lg p-4 border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Employee</p>
                        <p className="font-semibold">{contract.applicant_name}</p>
                        <p className="text-sm text-muted-foreground">{contract.applicant_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-semibold">{contract.job_title}</p>
                        <p className="text-sm text-muted-foreground">Created: {new Date(contract.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Onboarding Timeline</h3>
                    <div className="space-y-2">
                      {statusTimeline.map((item) => {
                        const isCompleted = getCompletionStatus(item.status);
                        
                        return (
                          <div key={item.status} className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                              isCompleted ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 pt-1">
                              <p className={`font-medium text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {item.label}
                              </p>
                              {item.date && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.date).toLocaleString()}
                                </p>
                              )}
                              {!item.date && !isCompleted && (
                                <p className="text-xs text-amber-600">Pending</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Current Status</p>
                    <Badge className={contractStatusColors[contract.status] || 'bg-gray-100 text-gray-800'}>
                      {contract.status.replace(/_/g, ' ').charAt(0).toUpperCase() + contract.status.slice(1).replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setPrintStatusOpen(false)}>Close</Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
