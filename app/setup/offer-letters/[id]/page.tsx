'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Send, Download, Eye, Copy, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface OfferLetter {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  job_title: string;
  reporting_station: string | null;
  contract_type: string;
  grade_level: string | null;
  expected_start_date: string;
  contract_duration: string;
  acceptance_deadline: string;
  salary_notes: string | null;
  custom_clauses: string | null;
  include_ssafe_ifak: boolean;
  allow_download_unsigned: boolean;
  require_signature_before_download: boolean;
  status: string;
  signature_token: string | null;
  token_expires_at: string | null;
  pdf_file_url: string | null;
  signed_pdf_url: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  created_at: string;
}

export default function OfferLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [letter, setLetter] = useState<OfferLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [reportingStation, setReportingStation] = useState('');
  const [contractType, setContractType] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [contractDuration, setContractDuration] = useState('');
  const [acceptanceDeadline, setAcceptanceDeadline] = useState('');
  const [salaryNotes, setSalaryNotes] = useState('');
  const [customClauses, setCustomClauses] = useState('');
  const [includeSsafeIfak, setIncludeSsafeIfak] = useState(true);
  const [allowDownloadUnsigned, setAllowDownloadUnsigned] = useState(false);
  const [requireSignatureBeforeDownload, setRequireSignatureBeforeDownload] = useState(true);

  useEffect(() => {
    async function fetchLetter() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('offer_letters')
        .select('*')
        .eq('id', params.id as string)
        .single();

      if (error || !data) {
        router.push('/setup/offer-letters');
        return;
      }

      setLetter(data);
      setApplicantName(data.applicant_name);
      setApplicantEmail(data.applicant_email);
      setApplicantPhone(data.applicant_phone || '');
      setJobTitle(data.job_title);
      setReportingStation(data.reporting_station || '');
      setContractType(data.contract_type);
      setGradeLevel(data.grade_level || '');
      setExpectedStartDate(data.expected_start_date);
      setContractDuration(data.contract_duration);
      setAcceptanceDeadline(data.acceptance_deadline);
      setSalaryNotes(data.salary_notes || '');
      setCustomClauses(data.custom_clauses || '');
      setIncludeSsafeIfak(data.include_ssafe_ifak);
      setAllowDownloadUnsigned(data.allow_download_unsigned);
      setRequireSignatureBeforeDownload(data.require_signature_before_download);
      setLoading(false);
    }

    if (params.id) {
      fetchLetter();
    }
  }, [params.id, router]);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/offer-letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: params.id })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      // Store HTML and open preview
      localStorage.setItem(`offer-letter-${params.id}`, data.html);
      window.open(`/setup/offer-letters/${params.id}/preview`, '_blank');
    } catch (error) {
      console.error('[v0] Error generating PDF:', error);
      alert('Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!letter) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('offer_letters')
        .update({
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          applicant_phone: applicantPhone || null,
          job_title: jobTitle,
          reporting_station: reportingStation || null,
          contract_type: contractType,
          grade_level: gradeLevel || null,
          expected_start_date: expectedStartDate,
          contract_duration: contractDuration,
          acceptance_deadline: acceptanceDeadline,
          salary_notes: salaryNotes || null,
          custom_clauses: customClauses || null,
          include_ssafe_ifak: includeSsafeIfak,
          allow_download_unsigned: allowDownloadUnsigned,
          require_signature_before_download: requireSignatureBeforeDownload,
        })
        .eq('id', letter.id);

      if (error) throw error;

      setEditing(false);
      alert('Offer letter updated successfully');
      window.location.reload();
    } catch (error) {
      console.error('[v0] Error saving:', error);
      alert('Error saving offer letter');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!letter) {
    return <div>Offer letter not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/setup/offer-letters">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{letter.applicant_name}</h1>
            <p className="text-muted-foreground mt-1">{letter.job_title}</p>
          </div>
        </div>
        <Badge className={`
          ${letter.status === 'draft' ? 'bg-slate-100 text-slate-800' : ''}
          ${letter.status === 'sent' ? 'bg-purple-100 text-purple-800' : ''}
          ${letter.status === 'signed' ? 'bg-green-100 text-green-800' : ''}
          ${letter.status === 'viewed' ? 'bg-cyan-100 text-cyan-800' : ''}
        `}>
          {letter.status}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleGeneratePDF} disabled={generating} variant="outline">
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
          Preview
        </Button>
        {letter.status === 'draft' && (
          <Link href={`/setup/offer-letters/${letter.id}/send`}>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send Offer
            </Button>
          </Link>
        )}
        {letter.pdf_file_url && (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel Edit' : 'Edit'}
        </Button>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-semibold">{new Date(letter.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sent</p>
              <p className="font-semibold">{letter.sent_at ? new Date(letter.sent_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Viewed</p>
              <p className="font-semibold">{letter.viewed_at ? new Date(letter.viewed_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Signed</p>
              <p className="font-semibold">{letter.signed_at ? new Date(letter.signed_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deadline</p>
              <p className="font-semibold">{new Date(letter.acceptance_deadline).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Full Name</Label>
                  <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} type="email" className="mt-2" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Position Title</Label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Reporting Station</Label>
                  <Input value={reportingStation} onChange={(e) => setReportingStation(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Contract Duration</Label>
                  <Input value={contractDuration} onChange={(e) => setContractDuration(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Grade Level</Label>
                  <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Expected Start Date</Label>
                  <Input type="date" value={expectedStartDate} onChange={(e) => setExpectedStartDate(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label>Acceptance Deadline</Label>
                  <Input type="date" value={acceptanceDeadline} onChange={(e) => setAcceptanceDeadline(e.target.value)} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Salary & Benefits Notes</Label>
                <Textarea value={salaryNotes} onChange={(e) => setSalaryNotes(e.target.value)} className="mt-2" rows={4} />
              </div>
              <div>
                <Label>Custom Clauses</Label>
                <Textarea value={customClauses} onChange={(e) => setCustomClauses(e.target.value)} className="mt-2" rows={4} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={includeSsafeIfak} onCheckedChange={(c) => setIncludeSsafeIfak(c as boolean)} />
                  <Label>Include SSAFE & IFAK Block</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* View Mode */}
      {!editing && (
        <Card>
          <CardHeader>
            <CardTitle>Offer Letter Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Applicant</p>
                <p className="font-semibold">{letter.applicant_name}</p>
                <p className="text-sm text-muted-foreground">{letter.applicant_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Position</p>
                <p className="font-semibold">{letter.job_title}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contract Type</p>
                <p className="font-semibold">{letter.contract_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold">{letter.contract_duration}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-semibold">{new Date(letter.expected_start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Acceptance By</p>
                <p className="font-semibold">{new Date(letter.acceptance_deadline).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
