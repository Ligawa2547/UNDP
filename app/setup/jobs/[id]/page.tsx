"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  slug: string;
  location: string;
  type: string;
  department: string;
  level: string;
  salary_range: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  closing_date: string;
  is_active: boolean;
  featured: boolean;
}

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    type: "full-time",
    department: "",
    level: "mid",
    salary_range: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    closing_date: "",
    is_active: true,
    featured: false,
  });

  useEffect(() => {
    async function fetchJob() {
      try {
        console.log("[v0] Fetching job with id:", params.id);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("[v0] Error fetching job:", error);
          setError("Failed to load job: " + error.message);
          setLoading(false);
          return;
        }

        if (!data) {
          console.warn("[v0] No job data found for id:", params.id);
          setError("Job not found");
          setLoading(false);
          return;
        }

        console.log("[v0] Job fetched successfully:", data);

        setJob(data);
        setFormData({
          title: data.title || "",
          location: data.location || "",
          type: data.type || "full-time",
          department: data.department || "",
          level: data.level || "mid",
          salary_range: data.salary_range || "",
          description: data.description || "",
          requirements: Array.isArray(data.requirements) ? data.requirements.join("\n") : "",
          responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.join("\n") : "",
          benefits: Array.isArray(data.benefits) ? data.benefits.join("\n") : "",
          closing_date: data.closing_date?.split("T")[0] || "",
          is_active: data.is_active !== false,
          featured: data.featured !== false,
        });
        setLoading(false);
      } catch (err) {
        console.error("[v0] Unexpected error fetching job:", err);
        router.push("/setup/jobs");
      }
    }
    
    if (params?.id) {
      fetchJob();
    } else {
      console.warn("[v0] No params.id available");
      router.push("/setup/jobs");
    }
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { error } = await supabase
      .from("jobs")
      .update({
        title: formData.title,
        slug,
        location: formData.location,
        type: formData.type,
        department: formData.department || null,
        level: formData.level,
        salary_range: formData.salary_range || null,
        description: formData.description,
        requirements: formData.requirements
          .split("\n")
          .filter((r) => r.trim()),
        responsibilities: formData.responsibilities
          .split("\n")
          .filter((r) => r.trim()),
        benefits: formData.benefits.split("\n").filter((b) => b.trim()),
        closing_date: formData.closing_date || null,
        is_active: formData.is_active,
        featured: formData.featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      alert("Error updating job: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/setup/jobs");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/setup/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Job</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-semibold mb-4">{error}</p>
            <p className="text-red-700 mb-4">Please try again or go back to the jobs list.</p>
            <Link href="/setup/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/setup/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Job</h1>
          <p className="text-muted-foreground">Update job posting details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., New York, USA or Remote"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Employment Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="e.g., Programme Management"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  value={formData.salary_range}
                  onChange={(e) =>
                    setFormData({ ...formData, salary_range: e.target.value })
                  }
                  placeholder="e.g., $70,000 - $90,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing">Closing Date</Label>
                <Input
                  id="closing"
                  type="date"
                  value={formData.closing_date}
                  onChange={(e) =>
                    setFormData({ ...formData, closing_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">
                Requirements (one per line)
              </Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                rows={4}
                placeholder="Masters degree in relevant field&#10;5+ years experience&#10;..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">
                Responsibilities (one per line)
              </Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) =>
                  setFormData({ ...formData, responsibilities: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (one per line)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) =>
                  setFormData({ ...formData, benefits: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="active">Active (visible to public)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
                <Label htmlFor="featured">Featured Job</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Link href="/setup/jobs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
