import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateToken } from '@/lib/token-generator';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Contract creation request received');
    
    const body = await request.json();
    console.log('[v0] Request body:', body);
    
    const { offerLetterId } = body;

    if (!offerLetterId) {
      console.error('[v0] No offer letter ID provided');
      return NextResponse.json(
        { error: 'Offer letter ID is required' },
        { status: 400 }
      );
    }

    console.log('[v0] Creating Supabase client...');
    const supabase = await createClient();
    console.log('[v0] Supabase client created successfully');

    // Fetch the offer letter
    console.log('[v0] Fetching offer letter with ID:', offerLetterId);
    const { data: offerLetter, error: offerError } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('id', offerLetterId)
      .single();

    console.log('[v0] Offer letter fetch result - error:', offerError, 'data:', offerLetter);

    if (offerError || !offerLetter) {
      console.error('[v0] Offer letter not found - error:', JSON.stringify(offerError, null, 2));
      console.error('[v0] Offer ID requested:', offerLetterId);
      return NextResponse.json(
        { error: `Offer letter not found: ${offerError?.message || 'No offer found'}` },
        { status: 404 }
      );
    }

    console.log('[v0] Offer letter found:', offerLetter.applicant_name);

    // Generate contract token (valid for 30 days)
    console.log('[v0] Generating contract token...');
    const token = generateToken(48);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    // Create contract from offer letter details
    console.log('[v0] Creating employment contract...');
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

    console.log('[v0] Contract creation result - error:', error, 'data id:', data?.id);

    if (error) {
      console.error('[v0] Contract creation error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      });
      return NextResponse.json(
        { error: `Failed to create contract: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    console.log('[v0] Contract created successfully with ID:', data.id);

    // Create contract details record
    console.log('[v0] Creating contract details record...');
    const { error: detailsError } = await supabase
      .from('contract_details')
      .insert({
        contract_id: data.id,
        ifaq_confirmed: false,
        ssafe_confirmed: false,
      });

    if (detailsError) {
      console.error('[v0] Contract details creation error:', detailsError);
    } else {
      console.log('[v0] Contract details created successfully');
    }

    // Send contract issuance email to applicant
    try {
      console.log('[v0] Preparing to send contract email...');
      const baseUrl = 'https://www.unoedp.org';
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

    console.log('[v0] Contract creation process completed successfully');
    return NextResponse.json({
      success: true,
      contract: data,
      portalLink: `/contract/${token}`,
    });

  } catch (error) {
    console.error('[v0] Unhandled error in contract creation:', error);
    console.error('[v0] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
