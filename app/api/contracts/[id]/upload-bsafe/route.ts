import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check contract exists
    const { data: contract, error: contractError } = await supabase
      .from('employment_contracts')
      .select('id')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Convert file to base64 for storage (since we can't use direct blob storage without integration)
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Store in database
    const { error: uploadError } = await supabase
      .from('bsafe_uploads')
      .upsert({
        contract_id: contractId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: base64,
        uploaded_at: new Date().toISOString(),
      }, {
        onConflict: 'contract_id',
      });

    if (uploadError) {
      console.error('[v0] Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'BSAFE file uploaded successfully',
      fileName: file.name,
    });

  } catch (error) {
    console.error('[v0] Error in BSAFE upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
