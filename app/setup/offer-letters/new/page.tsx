'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  jobs: {
    id: string;
    title: string;
  } | null;
}

interface Job {
  id: string;
  title: string;
}

export default function NewOfferLetterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [reportingStation, setReportingStation] = useState('');
  const [contractType, setContractType] = useState('fixed-term');
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
    async function fetchData() {
      const supabase = createClient();

      const { data: appsData } = await supabase
        .from("job_applications")
        .select(`
          id,
          full_name,
          email,
          phone,
          jobs (
            id,
            title
          )
        `);

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("is_active", true);

      if (appsData) setApplications(appsData);
      if (jobsData) setJobs(jobsData);
      setLoading(false);
    }

    fetchData();
  }, []);

  const handleApplicantSelect = (appId: string) => {
    setSelectedApplicant(appId);
    const app = applications.find(a => a.id === appId);
    if (app) {
      setApplicantName(app.full_name);
      setApplicantEmail(app.email);
      setApplicantPhone(app.phone || '');
      if (app.jobs) {
        setJobTitle(app.jobs.title);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      
      // Calculate 10-day expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 10);

      const { data, error } = await supabase
        .from("offer_letters")
        .insert({
          applicant_id: selectedApplicant || null,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          applicant_phone: applicantPhone || null,
          job_title: jobTitle,
          reporting_station: reportingStation || null,
          contract_type: contractType,
          grade_level: gradeLevel || null,
          expected_start_date: expectedStartDate || null,
          contract_duration: contractDuration || null,
          acceptance_deadline: acceptanceDeadline,
          salary_notes: salaryNotes || null,
          custom_clauses: customClauses || null,
          include_ssafe_ifak: includeSsafeIfak,
          allow_download_unsigned: allowDownloadUnsigned,
          require_signature_before_download: requireSignatureBeforeDownload,
          status: 'draft',
          token_expires_at: expiryDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase
        .from("offer_letter_audit_logs")
        .insert({
          offer_letter_id: data.id,
          action: 'created',
          details: { created_from: 'form' },
        });

      router.push(`/setup/offer-letters/${data.id}`);
    } catch (error) {
      console.error('[v0] Error creating offer letter:', error);
      alert('Error creating offer letter');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/setup/offer-letters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Offer Letter</h1>
          <p className="text-muted-foreground mt-1">Create a new employment offer letter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Applicant Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Applicant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="applicant-select">Select Applicant from Applications</Label>
              <Select value={selectedApplicant} onValueChange={handleApplicantSelect}>
                <SelectTrigger id="applicant-select" className="mt-2">
                  <SelectValue placeholder="Choose an applicant..." />
                </SelectTrigger>
                <SelectContent>
                  {applications.map(app => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.full_name} - {app.jobs?.title || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Or fill in details manually below</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="position">Position Title *</Label>
                <Input
                  id="position"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  className="mt-2"
                  placeholder="e.g., Program Officer"
                />
              </div>
              <div>
                <Label htmlFor="reporting">Reporting Station</Label>
                <Input
                  id="reporting"
                  value={reportingStation}
                  onChange={(e) => setReportingStation(e.target.value)}
                  className="mt-2"
                  placeholder="e.g., Nairobi"
                />
              </div>
              <div>
                <Label htmlFor="contract">Contract Type *</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger id="contract" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed-term">Fixed-Term</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="grade">Grade Level</Label>
                <Input
                  id="grade"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="mt-2"
                  placeholder="e.g., NO-2"
                />
              </div>
              <div>
                <Label htmlFor="start-date">Expected Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={expectedStartDate}
                  onChange={(e) => setExpectedStartDate(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="duration">Contract Duration *</Label>
                <Input
                  id="duration"
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  required
                  className="mt-2"
                  placeholder="e.g., 24 months"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Acceptance Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={acceptanceDeadline}
                  onChange={(e) => setAcceptanceDeadline(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation & Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="salary">Salary & Benefits Notes</Label>
              <Textarea
                id="salary"
                value={salaryNotes}
                onChange={(e) => setSalaryNotes(e.target.value)}
                className="mt-2"
                rows={4}
                placeholder="Details about compensation, benefits, allowances, etc."
              />
            </div>

            <div>
              <Label htmlFor="custom">Custom Clauses or Additional Terms</Label>
              <Textarea
                id="custom"
                value={customClauses}
                onChange={(e) => setCustomClauses(e.target.value)}
                className="mt-2"
                rows={4}
                placeholder="Any additional clauses, conditions, or special terms"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ssafe"
                  checked={includeSsafeIfak}
                  onCheckedChange={(checked) => setIncludeSsafeIfak(checked as boolean)}
                />
                <Label htmlFor="ssafe" className="font-normal">
                  Include SSAFE & IFAK 2.0 Requirement Block
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="unsigned-download"
                  checked={allowDownloadUnsigned}
                  onCheckedChange={(checked) => setAllowDownloadUnsigned(checked as boolean)}
                />
                <Label htmlFor="unsigned-download" className="font-normal">
                  Allow Download Before Signing
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="signature-required"
                  checked={requireSignatureBeforeDownload}
                  onCheckedChange={(checked) => setRequireSignatureBeforeDownload(checked as boolean)}
                />
                <Label htmlFor="signature-required" className="font-normal">
                  Require Signature Before Download
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/setup/offer-letters">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Offer Letter
          </Button>
        </div>
      </form>
    </div>
  );
}
