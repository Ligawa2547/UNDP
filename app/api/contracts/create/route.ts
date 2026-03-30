import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateToken } from '@/lib/token-generator';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerLetterId } = body;

    if (!offerLetterId) {
      return NextResponse.json(
        { error: 'Offer letter ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch the offer letter
    const { data: offerLetter, error: offerError } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('id', offerLetterId)
      .single();

    if (offerError || !offerLetter) {
      console.error('[v0] Offer letter fetch error:', JSON.stringify(offerError, null, 2));
      console.error('[v0] Offer ID requested:', offerLetterId);
      return NextResponse.json(
        { error: 'Offer letter not found' },
        { status: 404 }
      );
    }

    // Generate contract token (valid for 30 days)
    const token = generateToken(48);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    // Create contract from offer letter details
    const { data, error } = await supabase
      .from('employment_contracts')
      .insert({
        offer_letter_id: offerLetterId,
        applicant_name: offerLetter.applicant_name,
        applicant_email: offerLetter.applicant_email,
        job_title: offerLetter.job_title,
        reporting_station: offerLetter.reporting_station,
        contract_type: offerLetter.contract_type || 'fixed-term',
        grade_level: offerLetter.grade_level,
        expected_start_date: offerLetter.expected_start_date,
        contract_duration: offerLetter.contract_duration,
        acceptance_deadline: offerLetter.acceptance_deadline,
        salary_notes: offerLetter.salary_notes,
        custom_clauses: offerLetter.custom_clauses,
        include_ssafe_ifak: offerLetter.include_ssafe_ifak,
        status: 'sent',
        contract_token: token,
        token_expires_at: tokenExpiresAt.toISOString(),
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[v0] Contract creation error:', JSON.stringify(error, null, 2));
      console.error('[v0] Error details - Message:', error.message);
      console.error('[v0] Error details - Code:', error.code);
      return NextResponse.json(
        { error: `Failed to create contract: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Create contract details record
    const { error: detailsError } = await supabase
      .from('contract_details')
      .insert({
        contract_id: data.id,
        ifaq_confirmed: false,
        ssafe_confirmed: false,
      });

    if (detailsError) {
      console.error('[v0] Contract details creation error:', detailsError);
    }

    // Send contract issuance email to applicant
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://www.unoedp.org';
      const contractLink = `${baseUrl}/contract/${token}`;
      
      const deadline = new Date(offerLetter.acceptance_deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailTemplate = emailTemplates.contractIssuance(
        offerLetter.applicant_name,
        offerLetter.job_title,
        contractLink,
        deadline
      );

      console.log('[v0] Sending contract email to:', offerLetter.applicant_email);

      await sendEmail({
        to: offerLetter.applicant_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log('[v0] Contract email sent successfully');
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create contract: ${errorMessage}` },
      { status: 500 }
    );
  }
}
