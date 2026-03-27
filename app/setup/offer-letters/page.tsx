'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FileCheck, Plus, Eye, Send, Download, Trash2, Copy, Clock } from "lucide-react";
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

export default function OfferLettersPage() {
  const [letters, setLetters] = useState<OfferLetter[]>([]);
  const [filteredLetters, setFilteredLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    async function fetchLetters() {
      const supabase = createClient();

      const { data } = await supabase
        .from("offer_letters")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setLetters(data);
      }
      setLoading(false);
    }

    fetchLetters();
  }, []);

  // Filter and search
  useEffect(() => {
    let result = letters;

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(l => l.status === filterStatus);
    }

    // Date filter
    const today = new Date();
    if (filterDate === 'today') {
      result = result.filter(l => {
        const letterDate = new Date(l.created_at);
        return letterDate.toDateString() === today.toDateString();
      });
    } else if (filterDate === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(l => new Date(l.created_at) >= weekAgo);
    } else if (filterDate === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(l => new Date(l.created_at) >= monthAgo);
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(l =>
        l.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.applicant_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.job_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLetters(result);
  }, [letters, searchTerm, filterStatus, filterDate]);

  const statusCounts = letters.reduce(
    (acc, letter) => {
      acc[letter.status] = (acc[letter.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleDuplicate = async (letterId: string) => {
    const supabase = createClient();
    
    const { data: original } = await supabase
      .from("offer_letters")
      .select("*")
      .eq("id", letterId)
      .single();

    if (original) {
      const { error } = await supabase
        .from("offer_letters")
        .insert({
          ...original,
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          status: 'draft',
          signature_token: undefined,
          sent_at: null,
          viewed_at: null,
          signed_at: null,
          downloaded_at: null,
        });

      if (!error) {
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCheck className="h-8 w-8" />
            Offer Letters
          </h1>
          <p className="text-muted-foreground mt-2">Manage and send employment offer letters</p>
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
        {['draft', 'sent', 'signed', 'downloaded'].map(status => (
          <Card key={status} className="bg-gradient-to-br from-slate-50 to-white">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name, email, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(statusColors).map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Letters ({filteredLetters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No offer letters found</p>
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
                  {filteredLetters.map((letter) => (
                    <TableRow key={letter.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{letter.applicant_name}</p>
                          <p className="text-xs text-muted-foreground">{letter.applicant_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{letter.job_title}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[letter.status]}>
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
                        <div className="flex gap-2">
                          <Link href={`/setup/offer-letters/${letter.id}`}>
                            <Button variant="outline" size="sm" title="Edit">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {letter.status === 'draft' && (
                            <Link href={`/setup/offer-letters/${letter.id}/send`}>
                              <Button variant="outline" size="sm" title="Send">
                                <Send className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {letter.status !== 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Download PDF"
                              onClick={() => window.open(`/api/offer-letters/${letter.id}/download`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Duplicate"
                            onClick={() => handleDuplicate(letter.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
