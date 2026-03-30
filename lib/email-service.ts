const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = 'noreply@unoedp.org',
}: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.error('[v0] RESEND_API_KEY is not set');
    throw new Error('Email service is not configured');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: html || (text ? `<p>${text}</p>` : undefined),
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[v0] Resend API error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[v0] Error sending email:', error);
    throw error;
  }
}

// Email templates
export const emailTemplates = {
  applicationConfirmation: (applicantName: string, jobTitle: string) => ({
    subject: `Application Confirmation - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Received</h2>
        <p>Dear ${applicantName},</p>
        <p>Thank you for applying for the position of <strong>${jobTitle}</strong>.</p>
        <p>We have received your application and will review it shortly. You will be notified if you are selected for an interview.</p>
        <p>Best regards,<br/>The UNDP Team</p>
      </div>
    `,
  }),

  applicationDecision: (applicantName: string, jobTitle: string, approved: boolean) => ({
    subject: approved 
      ? `Interview Invitation - ${jobTitle}`
      : `Application Update - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${approved ? 'Interview Invitation' : 'Application Update'}</h2>
        <p>Dear ${applicantName},</p>
        ${
          approved
            ? `<p>Congratulations! We are pleased to invite you for an interview for the position of <strong>${jobTitle}</strong>.</p>
               <p>Please contact us to schedule your interview.</p>`
            : `<p>Thank you for your interest in the position of <strong>${jobTitle}</strong>.</p>
               <p>While your application was strong, we have decided to move forward with other candidates at this time.</p>
               <p>We encourage you to apply for future opportunities.</p>`
        }
        <p>Best regards,<br/>The UNDP Team</p>
      </div>
    `,
  }),

  newsletterSignup: () => ({
    subject: 'Welcome to UNDP Updates',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome!</h2>
        <p>Thank you for subscribing to UNDP news and updates.</p>
        <p>You will now receive the latest information about our programs and opportunities.</p>
        <p>Best regards,<br/>The UNDP Team</p>
      </div>
    `,
  }),

  contractIssuance: (applicantName: string, jobTitle: string, contractLink: string, deadline: string) => ({
    subject: `Employment Contract - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-top: 4px solid #1f2937; padding: 20px 0;">
          <h2>Employment Contract</h2>
          <p>Dear ${applicantName},</p>
          <p>We are pleased to issue your employment contract for the position of <strong>${jobTitle}</strong>.</p>
          <p>Please review the contract details and complete the required steps by <strong>${deadline}</strong>:</p>
          <ol style="line-height: 1.8;">
            <li>Review the employment contract</li>
            <li>Provide your bank details</li>
            <li>Confirm visa status</li>
            <li>Confirm IFAQ and SSAFE certifications</li>
            <li>Digitally sign the contract</li>
            <li>Upload your BSAFE certification</li>
          </ol>
          <p style="margin: 20px 0;">
            <a href="${contractLink}" style="display: inline-block; background-color: #1f2937; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Access Your Contract Portal
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">
            <strong>BSAFE Certification:</strong> You can obtain your BSAFE certification from:
            <br/>• UNSSC: <a href="https://unssc.org">https://unssc.org</a>
            <br/>• IICAR: <a href="https://iicar.org">https://iicar.org</a>
          </p>
          <p>If you have any questions, please contact our HR department.</p>
          <p>Best regards,<br/><strong>UNDP Human Resources</strong></p>
        </div>
      </div>
    `,
  }),

  bsafeApproved: (applicantName: string, jobTitle: string) => ({
    subject: `BSAFE Certification Approved - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-top: 4px solid #10b981; padding: 20px 0;">
          <h2 style="color: #10b981;">BSAFE Certification Approved</h2>
          <p>Dear ${applicantName},</p>
          <p>We are pleased to inform you that your BSAFE certification (Basic Security Awareness in the Field) has been <strong style="color: #10b981;">approved</strong>.</p>
          <p>Your employment contract for the position of <strong>${jobTitle}</strong> is now complete and verified.</p>
          <p>Next steps:</p>
          <ul style="line-height: 1.8;">
            <li>Orientation training will be scheduled</li>
            <li>Deployment assignments will be confirmed</li>
            <li>You will be added to payroll</li>
          </ul>
          <p>Thank you for completing all onboarding requirements. We look forward to working with you!</p>
          <p>Best regards,<br/><strong>UNDP Human Resources</strong></p>
        </div>
      </div>
    `,
  }),

  bsafeRejected: (applicantName: string, jobTitle: string, reason: string) => ({
    subject: `BSAFE Certification - Additional Information Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-top: 4px solid #ef4444; padding: 20px 0;">
          <h2 style="color: #ef4444;">BSAFE Certification Review</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for submitting your BSAFE certification for the position of <strong>${jobTitle}</strong>.</p>
          <p><strong>Issue:</strong> ${reason}</p>
          <p>Please address the issue and resubmit your BSAFE certification. You can upload a corrected version through your contract portal.</p>
          <p>If you have any questions about the requirements, please contact our HR department.</p>
          <p>Best regards,<br/><strong>UNDP Human Resources</strong></p>
        </div>
      </div>
    `,
  }),

  contractStatusUpdate: (applicantName: string, jobTitle: string, status: string, message: string) => ({
    subject: `Contract Status Update - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-top: 4px solid #1f2937; padding: 20px 0;">
          <h2>Contract Status Update</h2>
          <p>Dear ${applicantName},</p>
          <p>Your employment contract for the position of <strong>${jobTitle}</strong> has been updated.</p>
          <p><strong>Status:</strong> <span style="background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px; text-transform: capitalize;">${status}</span></p>
          <p>${message}</p>
          <p>Best regards,<br/><strong>UNDP Human Resources</strong></p>
        </div>
      </div>
    `,
  }),

  offerLetterStatusUpdate: (applicantName: string, jobTitle: string, status: string, message: string) => ({
    subject: `Offer Letter Status Update - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-top: 4px solid #1f2937; padding: 20px 0;">
          <h2>Offer Letter Status Update</h2>
          <p>Dear ${applicantName},</p>
          <p>Your offer letter for the position of <strong>${jobTitle}</strong> has been updated.</p>
          <p><strong>Status:</strong> <span style="background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px; text-transform: capitalize;">${status}</span></p>
          <p>${message}</p>
          <p>Best regards,<br/><strong>UNDP Human Resources</strong></p>
        </div>
      </div>
    `,
  }),
};
