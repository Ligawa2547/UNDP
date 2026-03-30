import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContractHTML, generatePDF } from '@/lib/contract-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch contract details
    const { data: contract, error: fetchError } = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      console.error('[v0] Contract not found:', fetchError);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract is expired
    if (contract.status === 'expired') {
      return NextResponse.json(
        { error: 'This contract has expired' },
        { status: 403 }
      );
    }

    // Determine if this is a signed contract
    const isSigned = contract.status === 'signed' || contract.status === 'details_pending' || 
                     contract.status === 'bsafe_pending' || contract.status === 'completed';

    // Generate HTML
    const html = generateContractHTML({
      applicantName: contract.applicant_name,
      applicantEmail: contract.applicant_email,
      jobTitle: contract.job_title,
      reportingStation: contract.reporting_station,
      contractType: contract.contract_type,
      gradeLevel: contract.grade_level,
      expectedStartDate: contract.expected_start_date,
      contractDuration: contract.contract_duration,
      acceptanceDeadline: contract.acceptance_deadline,
      salaryNotes: contract.salary_notes,
      customClauses: contract.custom_clauses,
      signerName: isSigned ? contract.applicant_name : undefined,
      signatureDate: isSigned && contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined,
      signatureData: isSigned && contract.signature_data ? contract.signature_data : undefined,
      signatureType: isSigned && contract.signature_type ? contract.signature_type : undefined,
    }, isSigned);

    // Wrap HTML for PDF conversion
    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const filename = `contract-${contract.applicant_name.replace(/\s+/g, '-')}-${contractId}`;

    // Try to convert to PDF
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePDF(wrappedHtml);
    } catch (error) {
      console.log('[v0] PDF conversion skipped:', error);
    }

    // If PDF conversion succeeded, return PDF
    if (pdfBuffer) {
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Fallback: Return HTML that can be printed to PDF
    return new NextResponse(wrappedHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}.html"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[v0] Error in contract download:', error);
    return NextResponse.json(
      { error: 'Failed to download contract' },
      { status: 500 }
    );
  }
}
