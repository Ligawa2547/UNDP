'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Eye, Mail, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Bell, Send, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-purple-100 text-purple-800",
  interview: "bg-cyan-100 text-cyan-800",
  offered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

interface Application {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    location: string;
  } | null;
  resume_url: string | null;
}

// Returns the start/end Date range for a given period type and reference value
function getPeriodRange(periodType: string, value: string): { from: Date; to: Date } | null {
  const now = new Date();

  if (periodType === 'day') {
    // value = "YYYY-MM-DD"
    if (!value) return null;
    const d = new Date(value);
    const from = new Date(d);
    from.setHours(0, 0, 0, 0);
    const to = new Date(d);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (periodType === 'last7') {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (periodType === 'last30') {
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  if (periodType === 'week') {
    // value = "YYYY-Www" e.g. "2026-W13"
    if (!value) return null;
    const [yearStr, weekStr] = value.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    // ISO week: Monday as start
    const jan4 = new Date(year, 0, 4);
    const startOfWeek = new Date(jan4);
    startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { from: startOfWeek, to: endOfWeek };
  }

  if (periodType === 'month') {
    // value = "YYYY-MM"
    if (!value) return null;
    const [yearStr, monthStr] = value.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const from = new Date(year, month, 1, 0, 0, 0, 0);
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }

  if (periodType === 'range') {
    // value handled separately via rangeFrom / rangeTo
    return null;
  }

  return null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('all');

  // Bulk update state
  const [bulkPeriodType, setBulkPeriodType] = useState('last7');
  const [bulkPeriodValue, setBulkPeriodValue] = useState('');
  const [bulkRangeFrom, setBulkRangeFrom] = useState('');
  const [bulkRangeTo, setBulkRangeTo] = useState('');
  const [bulkFromStatus, setBulkFromStatus] = useState('all');
  const [bulkNewStatus, setBulkNewStatus] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; success: boolean } | null>(null);

  // Reminder state
  const [reminderPeriodType, setReminderPeriodType] = useState('last7');
  const [reminderPeriodValue, setReminderPeriodValue] = useState('');
  const [reminderRangeFrom, setReminderRangeFrom] = useState('');
  const [reminderRangeTo, setReminderRangeTo] = useState('');
  const [reminderFromStatus, setReminderFromStatus] = useState('pending');
  const [reminderDeadlineDays, setReminderDeadlineDays] = useState('3');
  const [reminderCustomMessage, setReminderCustomMessage] = useState('');
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ sent: number; failed: number; success: boolean } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("job_applications")
      .select(`*, jobs (id, title, location)`)
      .order("created_at", { ascending: false });
    if (data) setApplications(data);
    setLoading(false);
  }

  // Derive the matching applications for bulk preview
  const bulkMatchedApplications = useMemo(() => {
    let range: { from: Date; to: Date } | null = null;

    if (bulkPeriodType === 'range') {
      if (bulkRangeFrom && bulkRangeTo) {
        const from = new Date(bulkRangeFrom);
        from.setHours(0, 0, 0, 0);
        const to = new Date(bulkRangeTo);
        to.setHours(23, 59, 59, 999);
        range = { from, to };
      }
    } else {
      range = getPeriodRange(bulkPeriodType, bulkPeriodValue);
    }

    if (!range) return [];

    return applications.filter(app => {
      const createdAt = new Date(app.created_at);
      const inPeriod = createdAt >= range!.from && createdAt <= range!.to;
      const matchesFromStatus = bulkFromStatus === 'all' || app.status === bulkFromStatus;
      return inPeriod && matchesFromStatus;
    });
  }, [applications, bulkPeriodType, bulkPeriodValue, bulkRangeFrom, bulkRangeTo, bulkFromStatus]);

  // Derive matching applications for reminders
  const reminderMatchedApplications = useMemo(() => {
    let range: { from: Date; to: Date } | null = null;

    if (reminderPeriodType === 'range') {
      if (reminderRangeFrom && reminderRangeTo) {
        const from = new Date(reminderRangeFrom);
        from.setHours(0, 0, 0, 0);
        const to = new Date(reminderRangeTo);
        to.setHours(23, 59, 59, 999);
        range = { from, to };
      }
    } else {
      range = getPeriodRange(reminderPeriodType, reminderPeriodValue);
    }

    if (!range) return [];

    return applications.filter(app => {
      const createdAt = new Date(app.created_at);
      const inPeriod = createdAt >= range!.from && createdAt <= range!.to;
      const matchesFromStatus = reminderFromStatus === 'all' || app.status === reminderFromStatus;
      return inPeriod && matchesFromStatus;
    });
  }, [applications, reminderPeriodType, reminderPeriodValue, reminderRangeFrom, reminderRangeTo, reminderFromStatus]);

  async function sendReminders() {
    if (reminderMatchedApplications.length === 0) return;
    setReminderSending(true);
    setReminderResult(null);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(reminderDeadlineDays || '3'));
    const deadlineStr = deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let sent = 0;
    let failed = 0;

    for (const app of reminderMatchedApplications) {
      try {
        const response = await fetch('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: app.email,
            subject: `Reminder: Required Documents for ${app.jobs?.title || 'Your Application'} - Action Required`,
            type: 'reminder',
            applicantName: app.full_name,
            jobTitle: app.jobs?.title || 'Your Application',
            deadlineStr,
            customMessage: reminderCustomMessage,
          }),
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setReminderResult({ sent, failed, success: failed === 0 });
    setReminderSending(false);
    setReminderConfirmOpen(false);
  }

  async function executeBulkUpdate() {
    if (!bulkNewStatus || bulkMatchedApplications.length === 0) return;
    setBulkUpdating(true);
    setBulkResult(null);

    const supabase = createClient();
    const ids = bulkMatchedApplications.map(a => a.id);

    const { error } = await supabase
      .from("job_applications")
      .update({ status: bulkNewStatus })
      .in("id", ids);

    if (error) {
      console.error('[v0] Bulk update error:', error.message, error.details, error.hint, error.code);
      alert(`Bulk update failed: ${error.message || 'Unknown error'}`);
      setBulkResult({ count: 0, success: false });
    } else {
      setBulkResult({ count: ids.length, success: true });
      await fetchApplications();
    }

    setBulkUpdating(false);
    setConfirmOpen(false);
  }

  // Status summary counts
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort + filter for the table
  let displayApplications = [...applications];
  if (sortBy === 'date') displayApplications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else if (sortBy === 'name') displayApplications.sort((a, b) => a.full_name.localeCompare(b.full_name));
  else if (sortBy === 'position') displayApplications.sort((a, b) => (a.jobs?.title || '').localeCompare(b.jobs?.title || ''));
  else if (sortBy === 'status') displayApplications.sort((a, b) => a.status.localeCompare(b.status));
  if (filterStatus !== 'all') displayApplications = displayApplications.filter(app => app.status === filterStatus);

  const canExecuteBulk = bulkNewStatus && bulkMatchedApplications.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {["new","reviewing","shortlisted","interview","offered","rejected","withdrawn"].map((status) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{statusCounts?.[status] || 0}</p>
              <p className="text-xs capitalize text-muted-foreground">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Status Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Bulk Status Update
          </CardTitle>
          <CardDescription>
            Filter applications by time period and current status, then update all matching records at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Period Type */}
            <div className="space-y-1.5">
              <Label>Time Period</Label>
              <Select value={bulkPeriodType} onValueChange={v => { setBulkPeriodType(v); setBulkPeriodValue(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="day">Specific Day</SelectItem>
                  <SelectItem value="week">Specific Week</SelectItem>
                  <SelectItem value="month">Specific Month</SelectItem>
                  <SelectItem value="range">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic period value input */}
            {bulkPeriodType === 'day' && (
              <div className="space-y-1.5">
                <Label>Select Day</Label>
                <Input type="date" value={bulkPeriodValue} onChange={e => setBulkPeriodValue(e.target.value)} />
              </div>
            )}
            {bulkPeriodType === 'week' && (
              <div className="space-y-1.5">
                <Label>Select Week</Label>
                <Input type="week" value={bulkPeriodValue} onChange={e => setBulkPeriodValue(e.target.value)} />
              </div>
            )}
            {bulkPeriodType === 'month' && (
              <div className="space-y-1.5">
                <Label>Select Month</Label>
                <Input type="month" value={bulkPeriodValue} onChange={e => setBulkPeriodValue(e.target.value)} />
              </div>
            )}
            {bulkPeriodType === 'range' && (
              <>
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input type="date" value={bulkRangeFrom} onChange={e => setBulkRangeFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input type="date" value={bulkRangeTo} onChange={e => setBulkRangeTo(e.target.value)} />
                </div>
              </>
            )}

            {/* Filter by current status */}
            <div className="space-y-1.5">
              <Label>Current Status (optional)</Label>
              <Select value={bulkFromStatus} onValueChange={setBulkFromStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Status</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New status to assign */}
            <div className="space-y-1.5">
              <Label>Change Status To</Label>
              <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Preview + Execute */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {bulkMatchedApplications.length > 0
                  ? <span className="text-foreground"><span className="text-lg font-bold text-primary">{bulkMatchedApplications.length}</span> application{bulkMatchedApplications.length !== 1 ? 's' : ''} will be updated</span>
                  : <span className="text-muted-foreground">No applications match the selected criteria</span>
                }
              </p>
              {bulkMatchedApplications.length > 0 && bulkNewStatus && (
                <p className="text-xs text-muted-foreground">
                  Current statuses: {Object.entries(
                    bulkMatchedApplications.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string,number>)
                  ).map(([s, c]) => `${c} ${s}`).join(', ')} → <strong>{bulkNewStatus}</strong>
                </p>
              )}
            </div>
            <Button
              disabled={!canExecuteBulk}
              onClick={() => setConfirmOpen(true)}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Bulk Update
            </Button>
          </div>

          {/* Result banner */}
          {bulkResult && (
            <div className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${bulkResult.success ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
              {bulkResult.success
                ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> Successfully updated {bulkResult.count} application{bulkResult.count !== 1 ? 's' : ''} to <strong>{bulkNewStatus}</strong>.</>
                : <><AlertTriangle className="h-4 w-4 shrink-0" /> An error occurred. Please try again.</>
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Document Reminders
          </CardTitle>
          <CardDescription>
            Send automated reminder emails to applicants who have not yet submitted required documents. Emails include a notice that they are from the UNEDP HR system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Period Type */}
            <div className="space-y-1.5">
              <Label>Application Period</Label>
              <Select value={reminderPeriodType} onValueChange={v => { setReminderPeriodType(v); setReminderPeriodValue(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="day">Specific Day</SelectItem>
                  <SelectItem value="week">Specific Week</SelectItem>
                  <SelectItem value="month">Specific Month</SelectItem>
                  <SelectItem value="range">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic period value input */}
            {reminderPeriodType === 'day' && (
              <div className="space-y-1.5">
                <Label>Select Day</Label>
                <Input type="date" value={reminderPeriodValue} onChange={e => setReminderPeriodValue(e.target.value)} />
              </div>
            )}
            {reminderPeriodType === 'week' && (
              <div className="space-y-1.5">
                <Label>Select Week</Label>
                <Input type="week" value={reminderPeriodValue} onChange={e => setReminderPeriodValue(e.target.value)} />
              </div>
            )}
            {reminderPeriodType === 'month' && (
              <div className="space-y-1.5">
                <Label>Select Month</Label>
                <Input type="month" value={reminderPeriodValue} onChange={e => setReminderPeriodValue(e.target.value)} />
              </div>
            )}
            {reminderPeriodType === 'range' && (
              <>
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input type="date" value={reminderRangeFrom} onChange={e => setReminderRangeFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input type="date" value={reminderRangeTo} onChange={e => setReminderRangeTo(e.target.value)} />
                </div>
              </>
            )}

            {/* Filter by current status */}
            <div className="space-y-1.5">
              <Label>Current Status</Label>
              <Select value={reminderFromStatus} onValueChange={setReminderFromStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Status</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline days */}
            <div className="space-y-1.5">
              <Label>Deadline (days from today)</Label>
              <Select value={reminderDeadlineDays} onValueChange={setReminderDeadlineDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="2">2 Days</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom message */}
          <div className="space-y-1.5">
            <Label>Additional Message (optional)</Label>
            <Textarea
              placeholder="Add a custom note from HR that will appear in the reminder email..."
              value={reminderCustomMessage}
              onChange={e => setReminderCustomMessage(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Preview + Execute */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {reminderMatchedApplications.length > 0
                  ? <span className="text-foreground"><span className="text-lg font-bold text-primary">{reminderMatchedApplications.length}</span> applicant{reminderMatchedApplications.length !== 1 ? 's' : ''} will receive reminders</span>
                  : <span className="text-muted-foreground">No applicants match the selected criteria</span>
                }
              </p>
              {reminderMatchedApplications.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Deadline will be set to: <strong>{(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + parseInt(reminderDeadlineDays || '3'));
                    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  })()}</strong>
                </p>
              )}
            </div>
            <Button
              disabled={reminderMatchedApplications.length === 0}
              onClick={() => setReminderConfirmOpen(true)}
              className="shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </div>

          {/* Result banner */}
          {reminderResult && (
            <div className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${reminderResult.success ? 'border-green-300 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
              {reminderResult.success
                ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> Successfully sent {reminderResult.sent} reminder{reminderResult.sent !== 1 ? 's' : ''}.</>
                : <><AlertTriangle className="h-4 w-4 shrink-0" /> Sent {reminderResult.sent} reminder{reminderResult.sent !== 1 ? 's' : ''}, {reminderResult.failed} failed.</>
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            All Applications ({displayApplications.length})
          </CardTitle>
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest First)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="position">Position</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Filter Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{application.full_name}</p>
                          <p className="text-sm text-muted-foreground">{application.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{application.jobs?.title || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{application.jobs?.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[application.status]} capitalize`}>
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(application.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/setup/applications/${application.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          <a href={`mailto:${application.email}`}>
                            <Button size="sm" variant="ghost">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </a>
                          {application.resume_url && (
                            <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No applications found</h3>
              <p className="text-muted-foreground">
                {filterStatus !== 'all' ? 'No applications match the selected filter' : 'Applications will appear here when candidates apply'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Confirmation Dialog */}
      <Dialog open={reminderConfirmOpen} onOpenChange={setReminderConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Send Document Reminders
            </DialogTitle>
            <DialogDescription>
              You are about to send automated reminder emails to <strong>{reminderMatchedApplications.length}</strong> applicant{reminderMatchedApplications.length !== 1 ? 's' : ''}. Each email will include a notice that it is from the UNEDP HR system.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1 max-h-[200px] overflow-y-auto">
            {reminderMatchedApplications.slice(0, 10).map(a => (
              <div key={a.id} className="flex justify-between">
                <span>{a.full_name}</span>
                <span className="text-muted-foreground text-xs">{a.email}</span>
              </div>
            ))}
            {reminderMatchedApplications.length > 10 && (
              <p className="text-muted-foreground text-xs pt-1">...and {reminderMatchedApplications.length - 10} more</p>
            )}
          </div>
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <strong>Email Content:</strong> Reminder to submit video interview, government ID, educational certificates, and professional certifications by <strong>{(() => {
              const d = new Date();
              d.setDate(d.getDate() + parseInt(reminderDeadlineDays || '3'));
              return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            })()}</strong>.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderConfirmOpen(false)} disabled={reminderSending}>
              Cancel
            </Button>
            <Button onClick={sendReminders} disabled={reminderSending}>
              {reminderSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {reminderMatchedApplications.length} Reminder{reminderMatchedApplications.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Bulk Status Update
            </DialogTitle>
            <DialogDescription>
              This action will update <strong>{bulkMatchedApplications.length}</strong> application{bulkMatchedApplications.length !== 1 ? 's' : ''} to <strong>{bulkNewStatus}</strong>. This cannot be undone automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            {bulkMatchedApplications.slice(0, 5).map(a => (
              <div key={a.id} className="flex justify-between">
                <span>{a.full_name}</span>
                <span className="text-muted-foreground">{a.status} → {bulkNewStatus}</span>
              </div>
            ))}
            {bulkMatchedApplications.length > 5 && (
              <p className="text-muted-foreground text-xs pt-1">...and {bulkMatchedApplications.length - 5} more</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={bulkUpdating}>
              Cancel
            </Button>
            <Button onClick={executeBulkUpdate} disabled={bulkUpdating}>
              {bulkUpdating ? 'Updating...' : `Update ${bulkMatchedApplications.length} Application${bulkMatchedApplications.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
