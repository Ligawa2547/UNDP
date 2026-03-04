'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Video, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationSubmissionPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [job, setJob] = useState<any>(null);

  const [formData, setFormData] = useState({
    interview_video_url: '',
    interview_video_type: 'loom', // 'loom' or 'google-drive' or 'direct-link'
    id_document_url: '',
    education_documents: [] as string[],
  });

  useEffect(() => {
    async function initializeApplication() {
      try {
        let resolvedParams = params;
        if (params instanceof Promise) {
          resolvedParams = await params;
        }

        const id = (resolvedParams as { id: string }).id;
        if (!id) {
          setError('Invalid application ID');
          setLoading(false);
          return;
        }

        setApplicationId(id);
        await fetchApplication(id);
      } catch (err) {
        console.error('[v0] Error initializing:', err);
        setError('Failed to load application');
        setLoading(false);
      }
    }

    initializeApplication();
  }, [params]);

  async function fetchApplication(id: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            title,
            description,
            interview_questions,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('[v0] Error fetching application:', error);
        setError('Application not found');
        setLoading(false);
        return;
      }

      setApplication(data);
      setJob(data.jobs);

      // Check if deadline has passed
      if (data.submission_deadline) {
        const deadline = new Date(data.submission_deadline);
        if (new Date() > deadline) {
          setError('The submission deadline for this application has passed');
        }
      }

      // Pre-fill any existing submissions
      if (data.interview_video_url) {
        setFormData(prev => ({
          ...prev,
          interview_video_url: data.interview_video_url,
          interview_video_type: data.interview_video_type || 'loom'
        }));
      }

      setLoading(false);
    } catch (err) {
      console.error('[v0] Error fetching application:', err);
      setError('Failed to load application');
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!applicationId || !formData.interview_video_url) {
      setError('Please provide a video interview link');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('job_applications')
        .update({
          interview_video_url: formData.interview_video_url,
          interview_video_type: formData.interview_video_type,
          id_document_url: formData.id_document_url || null,
          education_documents: formData.education_documents.length > 0 ? formData.education_documents : null,
          interview_submitted_at: new Date().toISOString(),
          status: 'reviewing',
        })
        .eq('id', applicationId);

      if (error) {
        console.error('[v0] Error submitting:', error);
        setError('Failed to submit application materials');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch (err) {
      console.error('[v0] Unexpected error:', err);
      setError('An unexpected error occurred');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="container mx-auto px-4">
          <Link href="/careers">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Careers
            </Button>
          </Link>
          <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-bold text-red-800">Unable to Load Application</h2>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <p className="text-red-700">Please contact our careers team for assistance: careers@unoedp.org</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="container mx-auto px-4">
          <Card className="border-green-200 bg-green-50 max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-4">Submission Successful!</h2>
              <p className="text-green-700 mb-4">
                Thank you for submitting your video interview and documents. We have received your application materials.
              </p>
              <p className="text-green-700 mb-6">
                Our team will review your application and be in touch within 5-7 business days.
              </p>
              <Link href="/careers">
                <Button>Back to Careers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="container mx-auto px-4">
        <Link href="/careers">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Careers
          </Button>
        </Link>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Application Submission Portal</h1>
            <p className="text-lg text-muted-foreground">
              Complete your application for the <strong>{job?.title}</strong> position
            </p>
          </div>

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applicant Name</p>
                <p className="text-lg font-semibold">{application?.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position Applied For</p>
                <p className="text-lg font-semibold">{job?.title}</p>
              </div>
              {application?.submission_deadline && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submission Deadline</p>
                  <p className="text-lg font-semibold">
                    {new Date(application.submission_deadline).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Questions */}
          {job?.interview_questions && Array.isArray(job.interview_questions) && job.interview_questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Interview Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Please address these questions in your video interview (3-5 minutes):
                </p>
                <ol className="space-y-3 list-decimal list-inside">
                  {job.interview_questions.map((question: string, index: number) => (
                    <li key={index} className="text-muted-foreground">
                      {question}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Submission Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Video Interview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Submit Video Interview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Video Interview Link <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://loom.com/share/... or https://drive.google.com/..."
                    value={formData.interview_video_url}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      interview_video_url: e.target.value
                    }))}
                    required
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the shareable link to your video on Loom.com or Google Drive
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select
                    value={formData.interview_video_type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      interview_video_type: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="loom">Loom.com</option>
                    <option value="google-drive">Google Drive</option>
                    <option value="direct-link">Direct Link</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Government ID Document <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="Link to your ID (Google Drive, Dropbox, etc.)"
                    value={formData.id_document_url}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      id_document_url: e.target.value
                    }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a scan/photo of your government-issued ID (Passport, National ID, or Driver's License)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Educational Certificates</label>
                  <Textarea
                    placeholder="Paste links to educational documents, separated by line breaks&#10;Example:&#10;https://drive.google.com/file1&#10;https://drive.google.com/file2"
                    value={formData.education_documents.join('\n')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      education_documents: e.target.value.split('\n').filter(link => link.trim())
                    }))}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste links to your educational certificates, diplomas, and relevant qualifications
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={submitting || !formData.interview_video_url}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
              <Link href="/careers" className="flex-1">
                <Button variant="outline" type="button" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>

          {/* Help Text */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>Need help?</strong> If you have any questions about submitting your application materials,
                please contact us at <a href="mailto:careers@unoedp.org" className="underline font-semibold">careers@unoedp.org</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
