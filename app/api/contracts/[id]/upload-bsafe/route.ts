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

    // Validate file type - Accept PDF and all image formats
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, JPG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check contract exists
    const { data: contract, error: contractError } = await supabase
      .from('employment_contracts')
      .select('id')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('[v0] Contract not found:', contractError);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Convert file to base64 for preview and storage
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('[v0] Uploading BSAFE file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Store in database with file data as base64
    const { data: uploadData, error: uploadError } = await supabase
      .from('bsafe_uploads')
      .upsert({
        contract_id: contractId,
        file_name: file.name,
        file_size: file.size,
        file_url: dataUrl, // Store base64 data URL
        uploaded_at: new Date().toISOString(),
      }, {
        onConflict: 'contract_id',
      })
      .select()
      .single();

    if (uploadError) {
      console.error('[v0] Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('[v0] BSAFE upload successful');

    return NextResponse.json({
      success: true,
      message: 'BSAFE file uploaded successfully',
      fileName: file.name,
      preview: dataUrl,
    });

  } catch (error) {
    console.error('[v0] Error in BSAFE upload:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process upload: ${errorMsg}` },
      { status: 500 }
    );
  }
}
