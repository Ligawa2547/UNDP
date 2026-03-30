'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface OfferLetter {
  id: string;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  reporting_station: string | null;
  contract_type: string | null;
  grade_level: string | null;
  expected_start_date: string;
  contract_duration: string | null;
  acceptance_deadline: string;
  salary_notes: string | null;
  custom_clauses: string | null;
  status: string;
}

interface FormData {
  offerLetterId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  reportingStation: string;
  contractType: string;
  gradeLevel: string;
  expectedStartDate: string;
  contractDuration: string;
  acceptanceDeadline: string;
  salaryNotes: string;
  customClauses: string;
}

export default function NewContractPage() {
  const router = useRouter();
  const supabase = createClient();

  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    offerLetterId: '',
    applicantName: '',
    applicantEmail: '',
    jobTitle: '',
    reportingStation: '',
    contractType: 'fixed-term',
    gradeLevel: '',
    expectedStartDate: '',
    contractDuration: '2 years',
    acceptanceDeadline: '',
    salaryNotes: '',
    customClauses: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdContractId, setCreatedContractId] = useState('');

  // Load offers on mount
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('offer_letters')
        .select('*')
        .in('status', ['sent', 'viewed', 'signed'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[v0] Error fetching offers:', fetchError);
        return;
      }

      setOffers(data || []);
    } catch (err) {
      console.error('[v0] Error:', err);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectOffer = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setFormData({
        offerLetterId: offer.id,
        applicantName: offer.applicant_name,
        applicantEmail: offer.applicant_email,
        jobTitle: offer.job_title,
        reportingStation: offer.reporting_station || '',
        contractType: offer.contract_type || 'fixed-term',
        gradeLevel: offer.grade_level || '',
        expectedStartDate: offer.expected_start_date,
        contractDuration: offer.contract_duration || '2 years',
        acceptanceDeadline: offer.acceptance_deadline,
        salaryNotes: offer.salary_notes || '',
        customClauses: offer.custom_clauses || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.applicantName || !formData.applicantEmail || !formData.jobTitle || 
          !formData.expectedStartDate || !formData.acceptanceDeadline) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create contract via API
      const res = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create contract');
      }

      const data = await res.json();
      setSuccess(`Contract created successfully! Portal link: ${data.portalLink}`);
      setCreatedContractId(data.contract.id);

      // Reset form
      setFormData({
        offerLetterId: '',
        applicantName: '',
        applicantEmail: '',
        jobTitle: '',
        reportingStation: '',
        contractType: 'fixed-term',
        gradeLevel: '',
        expectedStartDate: '',
        contractDuration: '2 years',
        acceptanceDeadline: '',
        salaryNotes: '',
        customClauses: '',
      });

      // Redirect to contracts page after 2 seconds
      setTimeout(() => {
        router.push('/setup/contracts');
      }, 2000);
    } catch (err) {
      console.error('[v0] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-900 mb-2">Contract Created Successfully</h2>
              <p className="text-green-800 mb-4">{success}</p>
              <p className="text-sm text-green-700 mb-4">Redirecting to contracts page...</p>
              <Link href="/setup/contracts">
                <Button>View All Contracts</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/setup/contracts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Contract</h1>
          <p className="text-muted-foreground">Create an employment contract for a new employee</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
          <CardDescription>Enter the employment contract details. All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Offer Letter */}
            <div>
              <h3 className="font-semibold mb-4">Select Offer Letter (Recommended)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Choose an issued offer letter to automatically populate contract details. This ensures consistency between the offer and contract.
              </p>
              {offersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : offers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {offers.map(offer => (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => handleSelectOffer(offer.id)}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        formData.offerLetterId === offer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium">{offer.applicant_name}</p>
                      <p className="text-sm text-muted-foreground">{offer.applicant_email}</p>
                      <p className="text-sm text-muted-foreground">{offer.job_title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <span className="capitalize font-medium">{offer.status}</span>
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg mb-6">
                  <p className="text-sm text-amber-800">
                    No issued offer letters found. You can create a contract manually below, but it&apos;s recommended to issue offer letters first.
                  </p>
                </div>
              )}
            </div>

            {/* Manual Entry Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Contract Details {formData.offerLetterId && '(Loaded from Offer Letter)'}</h3>
              <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Employee Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicantName">Full Name *</Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => handleInputChange('applicantName', e.target.value)}
                    placeholder="Employee full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicantEmail">Email Address *</Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    value={formData.applicantEmail}
                    onChange={(e) => handleInputChange('applicantEmail', e.target.value)}
                    placeholder="employee@un.org"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Position Information */}
            <div>
              <h4 className="font-medium mb-4">Position Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="e.g., Senior Program Officer"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                    placeholder="e.g., P-4"
                  />
                </div>
                <div>
                  <Label htmlFor="reportingStation">Reporting Station</Label>
                  <Input
                    id="reportingStation"
                    value={formData.reportingStation}
                    onChange={(e) => handleInputChange('reportingStation', e.target.value)}
                    placeholder="e.g., Kampala"
                  />
                </div>
              </div>
            </div>

            {/* Contract Terms */}
            <div>
              <h4 className="font-medium mb-4">Contract Terms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractType">Contract Type *</Label>
                  <Select value={formData.contractType} onValueChange={(value) => handleInputChange('contractType', value)}>
                    <SelectTrigger id="contractType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed-term">Fixed-Term</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contractDuration">Contract Duration *</Label>
                  <Input
                    id="contractDuration"
                    value={formData.contractDuration}
                    onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                    placeholder="e.g., 2 years"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expectedStartDate">Expected Start Date *</Label>
                  <Input
                    id="expectedStartDate"
                    type="date"
                    value={formData.expectedStartDate}
                    onChange={(e) => handleInputChange('expectedStartDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="acceptanceDeadline">Acceptance Deadline *</Label>
                  <Input
                    id="acceptanceDeadline"
                    type="date"
                    value={formData.acceptanceDeadline}
                    onChange={(e) => handleInputChange('acceptanceDeadline', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h4 className="font-medium mb-4">Additional Information</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="salaryNotes">Salary Notes</Label>
                  <Textarea
                    id="salaryNotes"
                    value={formData.salaryNotes}
                    onChange={(e) => handleInputChange('salaryNotes', e.target.value)}
                    placeholder="Any special salary arrangements or notes..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="customClauses">Custom Clauses</Label>
                  <Textarea
                    id="customClauses"
                    value={formData.customClauses}
                    onChange={(e) => handleInputChange('customClauses', e.target.value)}
                    placeholder="Any additional contract clauses or terms..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Link href="/setup/contracts" className="flex-1">
                <Button variant="outline" className="w-full" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Contract
              </Button>
            </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
