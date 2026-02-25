"use client";

import React from "react"

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Send, Upload } from "lucide-react";

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
}

export function ApplicationForm({ jobId, jobTitle }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    current_company: "",
    current_title: "",
    years_experience: "",
    cover_letter: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let resumeUrl: string | null = null;

      // Upload resume to Vercel Blob if provided
      if (resumeFile) {
        const blob = await upload(resumeFile.name, resumeFile, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        resumeUrl = blob.url;
      }

      const supabase = createClient();

      const { error: insertError } = await supabase
        .from("job_applications")
        .insert({
          job_id: jobId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          cover_letter: formData.cover_letter || null,
          resume_url: resumeUrl,
          status: "pending",
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit application"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold">Application Submitted!</h3>
          <p className="mt-2 text-muted-foreground">
            Thank you for applying for the <strong>{jobTitle}</strong> position.
            We will review your application and contact you if your profile
            matches our requirements.
          </p>
          <Button
            variant="outline"
            className="mt-4 bg-transparent"
            onClick={() => (window.location.href = "/careers")}
          >
            View Other Positions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Apply Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_title">Current Title</Label>
              <Input
                id="current_title"
                value={formData.current_title}
                onChange={(e) =>
                  setFormData({ ...formData, current_title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_company">Company</Label>
              <Input
                id="current_company"
                value={formData.current_company}
                onChange={(e) =>
                  setFormData({ ...formData, current_company: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_experience">Years of Experience</Label>
            <Input
              id="years_experience"
              type="number"
              min="0"
              max="50"
              value={formData.years_experience}
              onChange={(e) =>
                setFormData({ ...formData, years_experience: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) =>
                setFormData({ ...formData, linkedin_url: e.target.value })
              }
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio / Website</Label>
            <Input
              id="portfolio_url"
              type="url"
              value={formData.portfolio_url}
              onChange={(e) =>
                setFormData({ ...formData, portfolio_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume / CV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => document.getElementById("resume")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {resumeFile ? resumeFile.name : "Upload Resume (PDF, DOC)"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_letter">Cover Letter</Label>
            <Textarea
              id="cover_letter"
              value={formData.cover_letter}
              onChange={(e) =>
                setFormData({ ...formData, cover_letter: e.target.value })
              }
              placeholder="Tell us why you're interested in this role and what makes you a great fit..."
              rows={5}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to our privacy policy and consent to UNEDF
            processing your data for recruitment purposes.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
