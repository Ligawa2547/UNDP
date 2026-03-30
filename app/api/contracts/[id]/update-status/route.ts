import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, emailTemplates } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();
    const { status, message } = body;

    if (!contractId || !status) {
      return NextResponse.json(
        { error: 'Contract ID and status are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Update contract status
    const { error: updateError } = await supabase
      .from('employment_contracts')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('[v0] Error updating contract status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contract status' },
        { status: 500 }
      );
    }

    // Send email notification
    try {
      const emailTemplate = emailTemplates.contractStatusUpdate(
        contract.applicant_name,
        contract.job_title,
        status,
        message || 'Your contract status has been updated. Please log in to check the details.'
      );

      await sendEmail({
        to: contract.applicant_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log('[v0] Contract status notification email sent to:', contract.applicant_email);
    } catch (emailError) {
      console.error('[v0] Error sending status email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Contract status updated and notification sent',
      status: status,
    });
  } catch (error) {
    console.error('[v0] Error in contract status update:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update contract status: ${errorMsg}` },
      { status: 500 }
    );
  }
}
