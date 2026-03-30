import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateToken } from '@/lib/token-generator';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      offerLetterId,
      applicantName,
      applicantEmail,
      jobTitle,
      reportingStation,
      contractType,
      gradeLevel,
      expectedStartDate,
      contractDuration,
      acceptanceDeadline,
      salaryNotes,
      customClauses,
    } = body;

    if (!applicantName || !applicantEmail || !jobTitle || !expectedStartDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Generate contract token (valid for 30 days)
    const token = generateToken(48);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    // Create contract
    const { data, error } = await supabase
      .from('employment_contracts')
      .insert({
        offer_letter_id: offerLetterId,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        job_title: jobTitle,
        reporting_station: reportingStation,
        contract_type: contractType || 'fixed-term',
        grade_level: gradeLevel,
        expected_start_date: expectedStartDate,
        contract_duration: contractDuration,
        acceptance_deadline: acceptanceDeadline,
        salary_notes: salaryNotes,
        custom_clauses: customClauses,
        status: 'draft',
        contract_token: token,
        token_expires_at: tokenExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[v0] Contract creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create contract' },
        { status: 500 }
      );
    }

    // Create contract details record
    await supabase
      .from('contract_details')
      .insert({
        contract_id: data.id,
        ifaq_confirmed: false,
        ssafe_confirmed: false,
      });

    // Send contract issuance email to applicant
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://www.unoedp.org';
      const contractLink = `${baseUrl}/contract/${token}`;
      
      const emailTemplate = emailTemplates.contractIssuance(
        applicantName,
        jobTitle,
        contractLink,
        new Date(acceptanceDeadline).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );

      await sendEmail({
        to: applicantEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (emailError) {
      console.error('[v0] Error sending contract email:', emailError);
      // Don't fail the contract creation if email fails
    }

    return NextResponse.json({
      success: true,
      contract: data,
      portalLink: `/contract/${token}`,
    });

  } catch (error) {
    console.error('[v0] Error in contract creation:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
