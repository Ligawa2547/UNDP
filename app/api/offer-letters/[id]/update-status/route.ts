import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: offerId } = await params;
    const body = await request.json();
    const { status, message } = body;

    if (!offerId || !status) {
      return NextResponse.json(
        { error: 'Offer Letter ID and status are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch offer letter details
    const { data: offer, error: offerError } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer letter not found' },
        { status: 404 }
      );
    }

    // Update offer letter status
    const { error: updateError } = await supabase
      .from('offer_letters')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('[v0] Error updating offer letter status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update offer letter status' },
        { status: 500 }
      );
    }

    // Send email notification
    try {
      const emailTemplate = emailTemplates.offerLetterStatusUpdate(
        offer.applicant_name,
        offer.job_title,
        status,
        message || 'Your offer letter status has been updated. Please check your email for more details.'
      );

      await sendEmail({
        to: offer.applicant_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log('[v0] Offer letter status notification email sent to:', offer.applicant_email);
    } catch (emailError) {
      console.error('[v0] Error sending status email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Offer letter status updated and notification sent',
      status: status,
    });
  } catch (error) {
    console.error('[v0] Error in offer letter status update:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update offer letter status: ${errorMsg}` },
      { status: 500 }
    );
  }
}
