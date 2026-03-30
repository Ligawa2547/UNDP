'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck, Plus, Eye, Send, Download, Trash2, Copy,
  Clock, X, Layers, Loader2, AlertTriangle, CheckCircle2, Filter,
  Bold, Italic, List, Type, Printer, ScrollText,
} from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  ready: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  viewed: "bg-cyan-100 text-cyan-800",
  signed: "bg-green-100 text-green-800",
  downloaded: "bg-emerald-100 text-emerald-800",
  expired: "bg-orange-100 text-orange-800",
  voided: "bg-red-100 text-red-800",
};

interface OfferLetter {
  id: string;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  acceptance_deadline: string;
}

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  jobs: { id: string; title: string } | null;
}

export default function OfferLettersPage() {
  const supabase = createClient();

  // Offer letters list state
  const [letters, setLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriodType, setFilterPeriodType] = useState('all');
  const [filterPeriodValue, setFilterPeriodValue] = useState('');
  const [filterRangeFrom, setFilterRangeFrom] = useState('');
  const [filterRangeTo, setFilterRangeTo] = useState('');

  // Bulk issue state
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [bulkAppFilter, setBulkAppFilter] = useState('accepted'); // filter apps by status
  const [bulkAppPeriodType, setBulkAppPeriodType] = useState('all');
  const [bulkAppPeriodValue, setBulkAppPeriodValue] = useState('');
  const [bulkAppRangeFrom, setBulkAppRangeFrom] = useState('');
  const [bulkAppRangeTo, setBulkAppRangeTo] = useState('');
  const [bulkAppSearch, setBulkAppSearch] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());

  // Bulk offer settings
  const [bulkContractType, setBulkContractType] = useState('fixed-term');
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkDuration, setBulkDuration] = useState('');
  const [bulkDeadline, setBulkDeadline] = useState('');
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkStation, setBulkStation] = useState('');
  const [bulkSalaryNotes, setBulkSalaryNotes] = useState('');
  const salaryNotesRef = useRef<HTMLTextAreaElement>(null);
  const [bulkIncludeSsafe, setBulkIncludeSsafe] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ issued: number; failed: number } | null>(null);

  // Print status state
  const [printingOfferId, setPrintingOfferId] = useState<string | null>(null);
  const [printOffersOpen, setPrintOffersOpen] = useState(false);

  // Contract creation state
  const [contractCreatingOfferId, setContractCreatingOfferId] = useState<string | null>(null);
  const [contractCreating, setContractCreating] = useState(false);

  useEffect(() => {
    fetchLetters();
    fetchApplications();
  }, []);

  async function fetchLetters() {
    const { data } = await supabase
      .from("offer_letters")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLetters(data);
    setLoading(false);
  }

  async function fetchApplications() {
    const { data } = await supabase
      .from("job_applications")
      .select("id, full_name, email, phone, status, created_at, jobs(id, title)")
      .order("created_at", { ascending: false });
    if (data) setApplications(data as Application[]);
    setAppsLoading(false);
  }

  // Helper: compute date range from period selector
  function getPeriodRange(type: string, value: string, rangeFrom: string, rangeTo: string) {
    const now = new Date();
    if (type === 'all') return null;
    if (type === 'today') {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { from: s, to: e };
    }
    if (type === 'week') {
      const s = new Date(now.getTime() - 7 * 86400000); s.setHours(0, 0, 0, 0);
      return { from: s, to: now };
    }
    if (type === 'month') {
      const s = new Date(now.getTime() - 30 * 86400000); s.setHours(0, 0, 0, 0);
      return { from: s, to: now };
    }
    if (type === 'day' && value) {
      const s = new Date(value); s.setHours(0, 0, 0, 0);
      const e = new Date(value); e.setHours(23, 59, 59, 999);
      return { from: s, to: e };
    }
    if (type === 'specific-week' && value) {
      const [yr, wk] = value.split('-W').map(Number);
      const jan1 = new Date(yr, 0, 1);
      const days = (wk - 1) * 7 - jan1.getDay() + 1;
      const s = new Date(yr, 0, days); s.setHours(0, 0, 0, 0);
      const e = new Date(s.getTime() + 6 * 86400000); e.setHours(23, 59, 59, 999);
      return { from: s, to: e };
    }
    if (type === 'specific-month' && value) {
      const [yr, mo] = value.split('-').map(Number);
      const s = new Date(yr, mo - 1, 1);
      const e = new Date(yr, mo, 0, 23, 59, 59, 999);
      return { from: s, to: e };
    }
    if (type === 'range' && rangeFrom && rangeTo) {
      const s = new Date(rangeFrom); s.setHours(0, 0, 0, 0);
      const e = new Date(rangeTo); e.setHours(23, 59, 59, 999);
      return { from: s, to: e };
    }
    return null;
  }

  // Filtered offer letters
  const filteredLetters = useMemo(() => {
    let result = letters;
    if (filterStatus !== 'all') result = result.filter(l => l.status === filterStatus);
    const range = getPeriodRange(filterPeriodType, filterPeriodValue, filterRangeFrom, filterRangeTo);
    if (range) result = result.filter(l => {
      const d = new Date(l.created_at);
      return d >= range.from && d <= range.to;
    });
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.applicant_name.toLowerCase().includes(q) ||
        l.applicant_email.toLowerCase().includes(q) ||
        l.job_title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [letters, filterStatus, filterPeriodType, filterPeriodValue, filterRangeFrom, filterRangeTo, searchTerm]);

  // Filtered applications for bulk issue panel
  const filteredApps = useMemo(() => {
    let result = applications;
    if (bulkAppFilter !== 'all') result = result.filter(a => a.status === bulkAppFilter);
    const range = getPeriodRange(bulkAppPeriodType, bulkAppPeriodValue, bulkAppRangeFrom, bulkAppRangeTo);
    if (range) result = result.filter(a => {
      const d = new Date(a.created_at);
      return d >= range.from && d <= range.to;
    });
    if (bulkAppSearch) {
      const q = bulkAppSearch.toLowerCase();
      result = result.filter(a =>
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.jobs?.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applications, bulkAppFilter, bulkAppPeriodType, bulkAppPeriodValue, bulkAppRangeFrom, bulkAppRangeTo, bulkAppSearch]);

  const selectedApps = filteredApps.filter(a => selectedAppIds.has(a.id));

  function toggleApp(id: string) {
    setSelectedAppIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedAppIds.size === filteredApps.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredApps.map(a => a.id)));
    }
  }

  // Rich text formatting helpers
  function insertFormatting(before: string, after: string = '') {
    const textarea = salaryNotesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bulkSalaryNotes.substring(start, end) || 'text';
    const newText =
      bulkSalaryNotes.substring(0, start) +
      before + selectedText + after +
      bulkSalaryNotes.substring(end);

    setBulkSalaryNotes(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  }

  function insertBulletPoint() {
    const textarea = salaryNotesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = bulkSalaryNotes.lastIndexOf('\n', start - 1) + 1;
    const beforeLine = bulkSalaryNotes.substring(0, lineStart);
    const afterLine = bulkSalaryNotes.substring(lineStart);

    const newText = beforeLine + '• ' + afterLine;
    setBulkSalaryNotes(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + 2, lineStart + 2);
    }, 0);
  }

  const handleCreateContract = async (offerId: string) => {
    setContractCreatingOfferId(offerId);
    setContractCreating(true);

    try {
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerLetterId: offerId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Contract created and sent to applicant!\n\nPortal Link: ${window.location.origin}${data.portalLink}`);
        // Refresh the contracts list if needed
      } else {
        alert(`Error creating contract: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[v0] Error creating contract:', error);
      alert('Failed to create contract. Please try again.');
    } finally {
      setContractCreating(false);
      setContractCreatingOfferId(null);
    }
  };

  async function executeBulkIssue() {
    if (selectedApps.length === 0 || !bulkStartDate || !bulkDuration || !bulkDeadline) return;
    setBulkIssuing(true);
    setBulkResult(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBulkIssuing(false); return; }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10);

    let issued = 0;
    let failed = 0;

    for (const app of selectedApps) {
      const { error } = await supabase.from("offer_letters").insert({
        applicant_id: app.id,
        applicant_name: app.full_name,
        applicant_email: app.email,
        applicant_phone: app.phone || null,
        job_title: app.jobs?.title || '',
        reporting_station: bulkStation || null,
        contract_type: bulkContractType,
        grade_level: bulkGrade || null,
        expected_start_date: bulkStartDate,
        contract_duration: bulkDuration,
        acceptance_deadline: bulkDeadline,
        salary_notes: bulkSalaryNotes || null,
        include_ssafe_ifak: bulkIncludeSsafe,
        allow_download_unsigned: false,
        require_signature_before_download: true,
        status: 'draft',
        token_expires_at: expiryDate.toISOString(),
        created_by: user.id,
      });
      if (error) {
        console.error('[v0] Bulk issue error for', app.full_name, error.message);
        failed++;
      } else {
        issued++;
      }
    }

    setBulkResult({ issued, failed });
    setBulkIssuing(false);
    setConfirmOpen(false);
    setSelectedAppIds(new Set());
    fetchLetters();
  }

  const handleDuplicate = async (letterId: string) => {
    const { data: original } = await supabase.from("offer_letters").select("*").eq("id", letterId).single();
    if (original) {
      const { error } = await supabase.from("offer_letters").insert({
        ...original, id: undefined, created_at: undefined, updated_at: undefined,
        status: 'draft', signature_token: undefined, sent_at: null, viewed_at: null, signed_at: null,
      });
      if (!error) fetchLetters();
    }
  };

  const handleDelete = async (letterId: string) => {
    if (!window.confirm('Are you sure you want to delete this offer letter? This action cannot be undone.')) return;
    const { error } = await supabase.from("offer_letters").delete().eq("id", letterId);
    if (error) alert('Error deleting offer letter');
    else fetchLetters();
  };

  const handleRevoke = async (letterId: string) => {
    if (!window.confirm('Are you sure you want to revoke this offer letter?')) return;
    const { error } = await supabase.from("offer_letters").update({ status: 'voided', token_expires_at: new Date().toISOString() }).eq("id", letterId);
    if (error) alert('Error revoking offer letter');
    else fetchLetters();
  };

  const statusCounts = letters.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCheck className="h-8 w-8" />
            Offer Letters
          </h1>
          <p className="text-muted-foreground mt-1">Manage and send employment offer letters</p>
        </div>
        <Link href="/setup/offer-letters/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Offer Letter
          </Button>
        </Link>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {['draft', 'sent', 'signed', 'expired'].map(status => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Bulk Issue Panel ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Bulk Issue Offer Letters
          </CardTitle>
          <CardDescription>
            Select multiple applicants and issue offer letters with shared employment settings in one action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Applicant filters */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Application Status</Label>
              <Select value={bulkAppFilter} onValueChange={v => { setBulkAppFilter(v); setSelectedAppIds(new Set()); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Application Period</Label>
              <Select value={bulkAppPeriodType} onValueChange={v => { setBulkAppPeriodType(v); setBulkAppPeriodValue(''); setSelectedAppIds(new Set()); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="day">Specific Day</SelectItem>
                  <SelectItem value="specific-week">Specific Week</SelectItem>
                  <SelectItem value="specific-month">Specific Month</SelectItem>
                  <SelectItem value="range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAppPeriodType === 'day' && (
              <div className="space-y-1.5">
                <Label>Select Day</Label>
                <Input type="date" value={bulkAppPeriodValue} onChange={e => setBulkAppPeriodValue(e.target.value)} />
              </div>
            )}
            {bulkAppPeriodType === 'specific-week' && (
              <div className="space-y-1.5">
                <Label>Select Week</Label>
                <Input type="week" value={bulkAppPeriodValue} onChange={e => setBulkAppPeriodValue(e.target.value)} />
              </div>
            )}
            {bulkAppPeriodType === 'specific-month' && (
              <div className="space-y-1.5">
                <Label>Select Month</Label>
                <Input type="month" value={bulkAppPeriodValue} onChange={e => setBulkAppPeriodValue(e.target.value)} />
              </div>
            )}
            {bulkAppPeriodType === 'range' && (
              <>
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input type="date" value={bulkAppRangeFrom} onChange={e => setBulkAppRangeFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input type="date" value={bulkAppRangeTo} onChange={e => setBulkAppRangeTo(e.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-1.5 lg:col-span-1">
              <Label>Search Applicant</Label>
              <Input placeholder="Name, email, or position..." value={bulkAppSearch} onChange={e => setBulkAppSearch(e.target.value)} />
            </div>
          </div>

          {/* Applicant selection table */}
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted/40 px-4 py-2 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={filteredApps.length > 0 && selectedAppIds.size === filteredApps.length}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
                <span className="text-sm font-medium">
                  {filteredApps.length} applicant{filteredApps.length !== 1 ? 's' : ''} shown
                  {selectedAppIds.size > 0 && <span className="ml-2 text-primary font-semibold">({selectedAppIds.size} selected)</span>}
                </span>
              </div>
              {selectedAppIds.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedAppIds(new Set())}>
                  Clear selection
                </Button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto">
              {appsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : filteredApps.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">No applicants match the selected filters</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {filteredApps.map(app => (
                      <tr
                        key={app.id}
                        className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${selectedAppIds.has(app.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleApp(app.id)}
                      >
                        <td className="px-4 py-2.5 w-8">
                          <Checkbox checked={selectedAppIds.has(app.id)} onCheckedChange={() => toggleApp(app.id)} onClick={e => e.stopPropagation()} />
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{app.full_name}</p>
                          <p className="text-xs text-muted-foreground">{app.email}</p>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{app.jobs?.title || '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={statusColors[app.status] || 'bg-gray-100 text-gray-800'}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Shared offer settings */}
          {selectedAppIds.size > 0 && (
            <div className="border rounded-md p-4 space-y-4 bg-muted/20">
              <p className="text-sm font-semibold">Offer Settings (applied to all {selectedAppIds.size} selected applicants)</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Contract Type *</Label>
                  <Select value={bulkContractType} onValueChange={setBulkContractType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed-term">Fixed-Term</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Expected Start Date *</Label>
                  <Input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contract Duration *</Label>
                  <Input placeholder="e.g. 24 months" value={bulkDuration} onChange={e => setBulkDuration(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Acceptance Deadline *</Label>
                  <Input type="date" value={bulkDeadline} onChange={e => setBulkDeadline(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Grade Level</Label>
                  <Input placeholder="e.g. NO-2" value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reporting Station</Label>
                  <Input placeholder="e.g. Nairobi" value={bulkStation} onChange={e => setBulkStation(e.target.value)} />
                </div>
                <div className="space-y-1.5 lg:col-span-3">
                  <Label>Salary &amp; Benefits Notes</Label>
                  <div className="border rounded-md overflow-hidden bg-white">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 bg-muted/40 border-b p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('**', '**')}
                        title="Bold"
                        className="h-8 w-8 p-0"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('_', '_')}
                        title="Italic"
                        className="h-8 w-8 p-0"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1"></div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={insertBulletPoint}
                        title="Add bullet point"
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('**Heading:** ')}
                        title="Add heading"
                        className="h-8 w-8 p-0"
                      >
                        <Type className="h-4 w-4" />
                      </Button>
                      <div className="flex-1"></div>
                      <span className="text-xs text-muted-foreground px-2">
                        Use **text** for bold, _text_ for italic
                      </span>
                    </div>
                    {/* Text Area */}
                    <Textarea
                      ref={salaryNotesRef}
                      placeholder="Enter compensation details, benefits, allowances, and other salary-related information. Supports rich formatting with the tools above."
                      value={bulkSalaryNotes}
                      onChange={e => setBulkSalaryNotes(e.target.value)}
                      className="rounded-none border-0 focus-visible:ring-0 min-h-32 font-mono text-sm"
                    />
                    {/* Preview */}
                    <div className="border-t bg-muted/20 p-3 text-xs text-muted-foreground max-h-24 overflow-y-auto">
                      <p className="font-semibold mb-2">Preview:</p>
                      <div className="whitespace-pre-wrap break-words text-foreground">
                        {bulkSalaryNotes || 'Your formatted text will appear here...'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:col-span-3">
                  <Checkbox id="bulk-ssafe" checked={bulkIncludeSsafe} onCheckedChange={v => setBulkIncludeSsafe(v as boolean)} />
                  <Label htmlFor="bulk-ssafe" className="font-normal">Include SSAFE &amp; IFAK 2.0 Requirement Block</Label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Offer letters will be created as <Badge className="bg-slate-100 text-slate-800 ml-1">draft</Badge> — you can review and send each one individually.
                </p>
                <Button
                  disabled={!bulkStartDate || !bulkDuration || !bulkDeadline}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Issue {selectedAppIds.size} Offer Letter{selectedAppIds.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* Bulk result banner */}
          {bulkResult && (
            <div className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${bulkResult.failed === 0 ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
              {bulkResult.failed === 0
                ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> Successfully created {bulkResult.issued} offer letter{bulkResult.issued !== 1 ? 's' : ''}. They are now available as drafts below.</>
                : <><AlertTriangle className="h-4 w-4 shrink-0" /> Created {bulkResult.issued}, failed {bulkResult.failed}. Check console for details.</>
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Offer Letters Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter &amp; Search Offer Letters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search name, email, position..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusColors).map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPeriodType} onValueChange={v => { setFilterPeriodType(v); setFilterPeriodValue(''); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Date Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="day">Specific Day</SelectItem>
                <SelectItem value="specific-week">Specific Week</SelectItem>
                <SelectItem value="specific-month">Specific Month</SelectItem>
                <SelectItem value="range">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {filterPeriodType === 'day' && (
              <Input type="date" className="w-40" value={filterPeriodValue} onChange={e => setFilterPeriodValue(e.target.value)} />
            )}
            {filterPeriodType === 'specific-week' && (
              <Input type="week" className="w-44" value={filterPeriodValue} onChange={e => setFilterPeriodValue(e.target.value)} />
            )}
            {filterPeriodType === 'specific-month' && (
              <Input type="month" className="w-40" value={filterPeriodValue} onChange={e => setFilterPeriodValue(e.target.value)} />
            )}
            {filterPeriodType === 'range' && (
              <>
                <Input type="date" className="w-40" value={filterRangeFrom} onChange={e => setFilterRangeFrom(e.target.value)} placeholder="From" />
                <Input type="date" className="w-40" value={filterRangeTo} onChange={e => setFilterRangeTo(e.target.value)} placeholder="To" />
              </>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredLetters.length === 0 ? (
            <div className="text-center py-10">
              <FileCheck className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No offer letters match the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLetters.map(letter => (
                    <TableRow key={letter.id}>
                      <TableCell>
                        <p className="font-semibold">{letter.applicant_name}</p>
                        <p className="text-xs text-muted-foreground">{letter.applicant_email}</p>
                      </TableCell>
                      <TableCell>{letter.job_title}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[letter.status] || 'bg-gray-100 text-gray-800'}>
                          {letter.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {new Date(letter.acceptance_deadline).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(letter.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Link href={`/setup/offer-letters/${letter.id}`}>
                            <Button variant="outline" size="sm" title="View / Edit"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          {letter.status === 'draft' && (
                            <Link href={`/setup/offer-letters/${letter.id}/send`}>
                              <Button variant="outline" size="sm" title="Send"><Send className="h-4 w-4" /></Button>
                            </Link>
                          )}
                          {letter.status !== 'draft' && (
                            <Button variant="outline" size="sm" title="Download PDF" onClick={() => window.open(`/api/offer-letters/${letter.id}/download`, '_blank')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" title="Print Status" onClick={() => { setPrintingOfferId(letter.id); setPrintOffersOpen(true); }}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          {letter.status !== 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Create Contract" 
                              onClick={() => handleCreateContract(letter.id)}
                              disabled={contractCreating && contractCreatingOfferId === letter.id}
                            >
                              {contractCreating && contractCreatingOfferId === letter.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ScrollText className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" title="Duplicate" onClick={() => handleDuplicate(letter.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          {letter.status !== 'voided' && letter.status !== 'draft' && (
                            <Button variant="outline" size="sm" title="Revoke" onClick={() => handleRevoke(letter.id)} className="text-orange-600 hover:text-orange-700">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" title="Delete" onClick={() => handleDelete(letter.id)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground text-right pt-2">{filteredLetters.length} of {letters.length} offer letters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Status Dialog */}
      {printingOfferId && (
        <Dialog open={printOffersOpen} onOpenChange={setPrintOffersOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Offer Letter Status Timeline</DialogTitle>
            </DialogHeader>
            {(() => {
              const letter = letters.find(l => l.id === printingOfferId);
              if (!letter) return <p className="text-muted-foreground">Offer letter not found</p>;
              
              const statusTimeline = [
                { status: 'created', label: 'Created', date: letter.created_at, icon: '📄' },
                { status: 'sent', label: 'Sent to Applicant', date: letter.sent_at, icon: '📤' },
                { status: 'viewed', label: 'Viewed by Applicant', date: null, icon: '👁️' },
                { status: 'signed', label: 'Digitally Signed', date: letter.signed_at, icon: '✅' },
                { status: 'downloaded', label: 'Downloaded', date: null, icon: '📥' },
              ];

              return (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="bg-muted/40 rounded-lg p-4 border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Applicant</p>
                        <p className="font-semibold">{letter.applicant_name}</p>
                        <p className="text-sm text-muted-foreground">{letter.applicant_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-semibold">{letter.job_title}</p>
                        <p className="text-sm text-muted-foreground">Deadline: {new Date(letter.acceptance_deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Status Timeline</h3>
                    <div className="space-y-2">
                      {statusTimeline.map((item, idx) => {
                        const isCompleted = 
                          (item.status === 'created') ||
                          (item.status === 'sent' && letter.status !== 'draft') ||
                          (item.status === 'signed' && (letter.status === 'signed' || letter.status === 'downloaded')) ||
                          (item.status === 'viewed' && (letter.status === 'viewed' || letter.status === 'signed' || letter.status === 'downloaded'));
                        
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

                  {/* Current Status Badge */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Current Status</p>
                    <Badge className={statusColors[letter.status] || 'bg-gray-100 text-gray-800'}>
                      {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setPrintOffersOpen(false)}>Close</Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Issue Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Confirm Bulk Offer Issuance
            </DialogTitle>
            <DialogDescription>
              You are about to create <strong>{selectedApps.length}</strong> offer letter{selectedApps.length !== 1 ? 's' : ''} as drafts. You can review and send each one individually afterward.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1 max-h-48 overflow-y-auto">
            {selectedApps.map(a => (
              <div key={a.id} className="flex justify-between">
                <span className="font-medium">{a.full_name}</span>
                <span className="text-muted-foreground text-xs">{a.jobs?.title || '—'}</span>
              </div>
            ))}
          </div>
          <div className="text-sm space-y-1 bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800">
            <p><strong>Contract:</strong> {bulkContractType} &bull; {bulkDuration}</p>
            <p><strong>Start Date:</strong> {bulkStartDate ? new Date(bulkStartDate).toLocaleDateString() : '—'}</p>
            <p><strong>Acceptance Deadline:</strong> {bulkDeadline ? new Date(bulkDeadline).toLocaleDateString() : '—'}</p>
            {bulkStation && <p><strong>Station:</strong> {bulkStation}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={bulkIssuing}>Cancel</Button>
            <Button onClick={executeBulkIssue} disabled={bulkIssuing}>
              {bulkIssuing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : <><Layers className="h-4 w-4 mr-2" /> Create {selectedApps.length} Offer Letter{selectedApps.length !== 1 ? 's' : ''}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
