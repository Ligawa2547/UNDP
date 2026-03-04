import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      to, 
      cc,
      subject, 
      body: emailBody, 
      htmlBody,
      inboxId,
      applicantName,
      jobTitle,
      applicationId,
      fromName = 'UNEDF Team',
      type = 'general'
    } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to and subject' },
        { status: 400 }
      );
    }

    // Build email content based on type
    let htmlContent = htmlBody || `<p>${emailBody || ''}</p>`;
    let textContent = emailBody || subject;

    if (type === 'application_confirmation') {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      const deadlineStr = deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
              .subheader { font-size: 12px; color: #666; }
              .content { margin-bottom: 30px; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 12px; border-left: 3px solid #1e40af; padding-left: 12px; }
              .highlight-box { background-color: #f0f4ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0; }
              .deadline { background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; }
              .requirement { margin-left: 20px; margin-bottom: 10px; }
              .requirement-item { margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #d1d5db; }
              .footer { background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px; font-size: 12px; color: #666; }
              a { color: #1e40af; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .contact-info { background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">UNEDF</div>
                <div class="subheader">United Nations Economic Development Foundation</div>
              </div>

              <div class="content">
                <p>Dear ${applicantName},</p>

                <div class="highlight-box">
                  <strong>Application Received</strong><br/>
                  Thank you for your interest in the <strong>${jobTitle}</strong> position. We have successfully received your application and sincerely appreciate your interest in joining our team.
                </div>

                <div class="section">
                  <div class="section-title">Next Steps</div>
                  <p>Due to the high volume of applications we receive, we are unable to schedule individual meetings with every applicant. However, we value your interest and would like to hear more about you through the following process:</p>
                </div>

                <div class="section">
                  <div class="section-title">Required Video Interview</div>
                  <p>Please record a brief video (3-5 minutes) introducing yourself and explaining why you're interested in this position and how your skills match the role requirements. You may submit your video using either:</p>
                  <div class="requirement">
                    <div class="requirement-item"><strong>Option 1:</strong> <a href="https://loom.com" target="_blank">Loom.com</a> (Recommended - easy recording and upload)</div>
                    <div class="requirement-item"><strong>Option 2:</strong> <a href="https://drive.google.com" target="_blank">Google Drive</a> (Upload video file directly)</div>
                  </div>
                  <p style="margin-top: 15px;"><strong>How to submit:</strong> Visit the application portal using the link below to upload your video and documents in one place.</p>
                </div>

                <div class="section">
                  <div class="section-title">Required Documents</div>
                  <p>Please prepare and submit the following documents:</p>
                  <div class="requirement">
                    <div class="requirement-item">✓ Valid government-issued ID (Passport, National ID, or Driver's License)</div>
                    <div class="requirement-item">✓ Educational certificates/qualifications relevant to the position</div>
                    <div class="requirement-item">✓ Any additional certifications or credentials</div>
                  </div>
                  <p style="margin-top: 15px;">You may submit these documents by:</p>
                  <div class="requirement">
                    <div class="requirement-item">• Replying to this email with the documents attached</div>
                    <div class="requirement-item">• Uploading to <a href="https://drive.google.com" target="_blank">Google Drive</a> and sharing the link</div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">Submit Your Application Materials</div>
                  <p>Please use the secure application portal to submit your video and documents:</p>
                  <p style="margin: 15px 0; text-align: center;">
                    <a href="https://www.unoedp.org/apply/${applicationId || '#'}" style="background-color: #1e40af; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; display: inline-block; font-weight: 600;">Access Application Portal</a>
                  </p>
                  <p>The portal allows you to submit your video interview and required documents securely.</p>
                </div>

                <div class="deadline">
                  <strong>Important: Submission Deadline</strong><br/>
                  Please submit your video interview and required documents by <strong>${deadlineStr}</strong> (3 days from your application submission).<br/>
                  <span style="font-size: 13px; color: #92400e;">Applications and documents received after this deadline may not be considered.</span>
                </div>

                <div class="section">
                  <div class="section-title">Questions?</div>
                  <p>If you have any questions about the application process or need assistance, please don't hesitate to reach out to us at <a href="mailto:careers@unoedp.org">careers@unoedp.org</a>.</p>
                </div>

                <p>Thank you again for your interest in the ${jobTitle} position. We look forward to learning more about you.</p>

                <p>Best regards,<br/>
                <strong>UNEDF Recruitment Team</strong><br/>
                United Nations Economic Development Foundation</p>
              </div>

              <div class="footer">
                <p><strong>UNEDF | Careers</strong></p>
                <p>This is an automated message. Please do not reply with attachments to this address. Use the reply function or submit documents through Google Drive.</p>
                <p style="margin-top: 10px; border-top: 1px solid #d1d5db; padding-top: 10px;">© ${new Date().getFullYear()} United Nations Economic Development Foundation. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      textContent = `
Application Confirmation for ${jobTitle} Position

Dear ${applicantName},

Thank you for your interest in the ${jobTitle} position at UNEDF. We have successfully received your application.

NEXT STEPS:
1. Record a video interview answering role-specific questions (use Loom.com or Google Drive)
2. Submit your government-issued ID and educational certificates
3. Reply to this email or submit documents through Google Drive

SUBMISSION DEADLINE: ${deadlineStr} (3 days from today)

For assistance, contact: careers@unoedp.org

Best regards,
UNEDF Recruitment Team
United Nations Economic Development Foundation
      `;
    }

    // Handle admin_compose type (custom from name)
    if (type === 'admin_compose') {
      htmlContent = htmlBody || `<p>${emailBody}</p>`;
      textContent = emailBody;
    }

    // Build from address with custom name
    const fromAddress = fromName && fromName !== 'noreply' 
      ? `${fromName} <noreply@unoedp.org>`
      : 'noreply@unoedp.org';

    // Send email via Resend
    console.log('[v0] Sending email to:', to, 'from:', fromAddress);
    const emailPayload: any = {
      from: fromAddress,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent,
    };

    // Add CC if provided
    if (cc) {
      emailPayload.cc = cc;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[v0] Resend API error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    const resendData = await response.json();
    console.log('[v0] Email sent successfully:', resendData.id);

    // Store reply in database if inboxId is provided
    if (inboxId) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from('email_replies')
            .insert([
              {
                inbox_id: inboxId,
                from_email: 'noreply@unoedp.org',
                to_email: to,
                subject: subject,
                body: textContent,
                html_body: htmlContent,
                status: 'sent',
                sent_at: new Date().toISOString(),
                created_by: user.id,
              },
            ]);
        }
      } catch (dbError) {
        console.error('[v0] Error storing reply:', dbError);
        // Don't fail the whole request if we can't store the reply
      }
    }

    return NextResponse.json({ success: true, id: resendData.id });
  } catch (error) {
    console.error('[v0] Send email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
