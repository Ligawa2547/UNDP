import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOfferLetterHTML } from '@/lib/offer-letter-pdf';

export async function POST(request: NextRequest) {
  try {
    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch offer letter details
    const { data: offerLetter, error: fetchError } = await supabase
      .from('offer_letters')
      .select('*')
      .eq('id', offerId)
      .single();

    if (fetchError || !offerLetter) {
      return NextResponse.json(
        { error: 'Offer letter not found' },
        { status: 404 }
      );
    }

    // Generate HTML
    const html = generateOfferLetterHTML({
      applicantName: offerLetter.applicant_name,
      applicantEmail: offerLetter.applicant_email,
      jobTitle: offerLetter.job_title,
      reportingStation: offerLetter.reporting_station,
      contractType: offerLetter.contract_type,
      gradeLevel: offerLetter.grade_level,
      expectedStartDate: offerLetter.expected_start_date,
      contractDuration: offerLetter.contract_duration,
      acceptanceDeadline: offerLetter.acceptance_deadline,
      salaryNotes: offerLetter.salary_notes,
      customClauses: offerLetter.custom_clauses,
      includeSsafeIfak: offerLetter.include_ssafe_ifak,
    });

    // For now, return the HTML directly
    // In production, you would convert to PDF using a service like pdf-lib or html2pdf
    return NextResponse.json({
      success: true,
      html: html,
      offerId: offerId
    });

  } catch (error) {
    console.error('[v0] Error generating offer letter PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
