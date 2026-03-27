'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from 'uuid';

interface OfferLetter {
  id: string;
  applicant_name: string;
  applicant_email: string;
  job_title: string;
  acceptance_deadline: string;
  status: string;
}

export default function SendOfferLetterPage() {
  const router = useRouter();
  const params = useParams();
  const [letter, setLetter] = useState<OfferLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

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
      
      // Set default email message
      const deadline = new Date(data.acceptance_deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      setEmailMessage(`Dear ${data.applicant_name},

Please find attached your employment offer letter for the position of ${data.job_title} at UNEDF.

Please review the terms and conditions carefully. If you accept this offer, you will need to sign the letter electronically. You have until ${deadline} to accept.

Should you have any questions, please do not hesitate to contact us.

Best regards,
UNEDF Human Resources Team`);

      setLoading(false);
    }

    if (params.id) {
      fetchLetter();
    }
  }, [params.id, router]);

  const handleSend = async () => {
    if (!letter) return;
    setSending(true);

    try {
      const supabase = createClient();
      
      // Generate secure token
      const token = uuidv4();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 10); // 10-day expiry

      // Update offer letter with token
      const { error: updateError } = await supabase
        .from('offer_letters')
        .update({
          signature_token: token,
          token_expires_at: expiryDate.toISOString(),
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', letter.id);

      if (updateError) throw updateError;

      // Send email via Resend
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: letter.applicant_email,
          subject: `Employment Offer Letter - ${letter.job_title}`,
          applicantName: letter.applicant_name,
          jobTitle: letter.job_title,
          type: 'offer_letter_sent',
          body: emailMessage,
          offerLetterId: letter.id,
          signatureToken: token,
        })
      });

      const emailData = await response.json();
      if (!response.ok) throw new Error(emailData.error);

      // Log audit trail
      await supabase
        .from('offer_letter_audit_logs')
        .insert({
          offer_letter_id: letter.id,
          action: 'sent',
          details: { 
            recipient: letter.applicant_email,
            token_expires_at: expiryDate.toISOString()
          },
        });

      alert('Offer letter sent successfully!');
      router.push(`/setup/offer-letters/${letter.id}`);
    } catch (error) {
      console.error('[v0] Error sending offer:', error);
      alert('Error sending offer letter. Please try again.');
    } finally {
      setSending(false);
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
      <div className="flex items-center gap-4">
        <Link href={`/setup/offer-letters/${letter.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Send Offer Letter</h1>
          <p className="text-muted-foreground mt-1">Send employment offer to {letter.applicant_name}</p>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Offer Details:</strong> {letter.job_title} | Acceptance Deadline: {new Date(letter.acceptance_deadline).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Email Composition */}
      <Card>
        <CardHeader>
          <CardTitle>Email Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">To</label>
            <div className="mt-2 p-3 bg-muted rounded text-sm">{letter.applicant_email}</div>
          </div>

          <div>
            <label className="text-sm font-medium">Subject</label>
            <div className="mt-2 p-3 bg-muted rounded text-sm">Employment Offer Letter - {letter.job_title}</div>
          </div>

          <div>
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <Textarea
              id="message"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={12}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              A secure signing link will be automatically included in the email sent to the applicant.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm mb-3">Important Information</h4>
          <ul className="text-sm space-y-2 text-amber-900">
            <li>✓ A secure signing link will be sent to {letter.applicant_email}</li>
            <li>✓ The applicant will have 10 days to sign and accept the offer</li>
            <li>✓ You will receive notifications when the offer is viewed and signed</li>
            <li>✓ An audit trail will be maintained for compliance</li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href={`/setup/offer-letters/${letter.id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSend} disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Offer Letter
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
