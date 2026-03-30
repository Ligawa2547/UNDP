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
    const { approved, reason, adminNotes } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
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

    // Update BSAFE upload status
    const { error: updateError } = await supabase
      .from('bsafe_uploads')
      .update({
        status: approved ? 'approved' : 'rejected',
        approved_by: 'admin', // In production, get from auth context
        approved_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('contract_id', contractId);

    if (updateError) {
      console.error('[v0] Error updating BSAFE status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update BSAFE status' },
        { status: 500 }
      );
    }

    // Update contract status
    const newContractStatus = approved ? 'completed' : 'bsafe_rejected';
    await supabase
      .from('employment_contracts')
      .update({
        status: newContractStatus,
        bsafe_status: approved ? 'approved' : 'rejected',
      })
      .eq('id', contractId);

    // Send email to applicant
    try {
      const emailTemplate = approved
        ? emailTemplates.bsafeApproved(contract.applicant_name, contract.job_title)
        : emailTemplates.bsafeRejected(
            contract.applicant_name,
            contract.job_title,
            reason || 'Your BSAFE certification does not meet our requirements.'
          );

      await sendEmail({
        to: contract.applicant_email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log('[v0] BSAFE status email sent to:', contract.applicant_email);
    } catch (emailError) {
      console.error('[v0] Error sending BSAFE status email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `BSAFE certification ${approved ? 'approved' : 'rejected'} successfully`,
      status: newContractStatus,
    });
  } catch (error) {
    console.error('[v0] Error in BSAFE approval:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process BSAFE approval: ${errorMsg}` },
      { status: 500 }
    );
  }
}
