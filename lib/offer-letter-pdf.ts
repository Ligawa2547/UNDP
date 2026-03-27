import html2pdf from 'html2pdf.js';

export interface OfferLetterData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  reportingStation?: string;
  contractType: string;
  gradeLevel?: string;
  expectedStartDate: string;
  contractDuration: string;
  acceptanceDeadline: string;
  salaryNotes?: string;
  customClauses?: string;
  includeSsafeIfak: boolean;
  signatureDate?: string;
  signerName?: string;
  signatureImageUrl?: string;
}

export function generateOfferLetterHTML(data: OfferLetterData, isSigned: boolean = false): string {
  const formattedStartDate = new Date(data.expectedStartDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedDeadline = new Date(data.acceptanceDeadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const todayDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const ssafeSection = data.includeSsafeIfak ? `
    <section style="margin-top: 40px; page-break-inside: avoid;">
      <h3 style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 15px; border-bottom: 2px solid #003D7A; padding-bottom: 10px;">
        SSAFE and IFAK 2.0 Requirement
      </h3>
      <p style="font-size: 11px; line-height: 1.6; color: #333; margin-bottom: 10px;">
        All UNEDF staff members are required to complete and maintain the following safety training certifications:
      </p>
      <ul style="font-size: 11px; line-height: 1.8; color: #333; margin-left: 20px; margin-bottom: 15px;">
        <li><strong>SSAFE (Staff Safety Awareness and Familiarization Education):</strong> An online induction training mandatory for all UN staff.</li>
        <li><strong>IFAK 2.0 (Individual First Aid Kit):</strong> Advanced first aid certification to be completed within the first 90 days of employment.</li>
      </ul>
      <p style="font-size: 11px; line-height: 1.6; color: #333; margin-bottom: 10px;">
        <strong>Recognized Training Providers:</strong>
      </p>
      <ul style="font-size: 11px; line-height: 1.8; color: #333; margin-left: 20px; margin-bottom: 15px;">
        <li><strong>IICAR</strong> (www.iicar.org) - International Institute for Conflict Prevention and Resolution</li>
        <li><strong>UNSSC</strong> (www.unssc.org) - United Nations System Staff College</li>
        <li>Other accredited first aid certification providers approved by UNEDF</li>
      </ul>
      <p style="font-size: 11px; line-height: 1.6; color: #333;">
        Proof of completion must be provided to Human Resources within 90 days of the start date. Failure to complete these trainings may result in suspension of employment benefits.
      </p>
    </section>
  ` : '';

  const signatureSection = isSigned ? `
    <section style="margin-top: 50px; page-break-inside: avoid;">
      <h3 style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 30px; border-bottom: 2px solid #003D7A; padding-bottom: 10px;">
        ACCEPTANCE AND SIGNATURE
      </h3>
      <p style="font-size: 11px; line-height: 1.6; color: #333; margin-bottom: 30px;">
        I hereby accept the offer of employment on the terms and conditions outlined in this letter.
      </p>
      
      <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse;">
        <tr>
          <td style="width: 45%; border-bottom: 1px solid #000; padding-bottom: 10px; vertical-align: bottom; padding-right: 20px;">
            ${data.signatureImageUrl ? `<img src="${data.signatureImageUrl}" style="max-width: 100%; max-height: 60px;" alt="Signature" />` : ''}
          </td>
          <td style="width: 10%;"></td>
          <td style="width: 45%; border-bottom: 1px solid #000; padding-bottom: 10px; vertical-align: bottom;">
            <!-- HR Signature -->
          </td>
        </tr>
        <tr>
          <td style="padding-top: 5px; font-size: 10px; color: #666;">
            <strong>${data.signerName || 'Applicant Signature'}</strong><br/>
            ${data.signatureDate ? `Date: ${data.signatureDate}` : ''}
          </td>
          <td></td>
          <td style="padding-top: 5px; font-size: 10px; color: #666;">
            <strong>Authorized HR Representative</strong><br/>
            Date: ${todayDate}
          </td>
        </tr>
      </table>

      <p style="font-size: 10px; color: #666; font-style: italic; border-top: 1px solid #ccc; padding-top: 10px;">
        <strong>Signed electronically on ${data.signatureDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
      </p>
    </section>
  ` : `
    <section style="margin-top: 50px; page-break-inside: avoid;">
      <h3 style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 30px; border-bottom: 2px solid #003D7A; padding-bottom: 10px;">
        ACCEPTANCE AND ACKNOWLEDGEMENT
      </h3>
      <p style="font-size: 11px; line-height: 1.6; color: #333; margin-bottom: 30px;">
        I hereby acknowledge receipt of this offer letter and accept the offer of employment on the terms and conditions outlined herein.
      </p>
      
      <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse;">
        <tr>
          <td style="width: 45%; border-bottom: 1px solid #ccc; padding-bottom: 30px; padding-right: 20px;"></td>
          <td style="width: 10%;"></td>
          <td style="width: 45%; border-bottom: 1px solid #ccc; padding-bottom: 30px;"></td>
        </tr>
        <tr>
          <td style="padding-top: 10px; font-size: 10px; color: #666;">
            <strong>Applicant Signature</strong><br/>
            Date: _______________
          </td>
          <td></td>
          <td style="padding-top: 10px; font-size: 10px; color: #666;">
            <strong>Authorized HR Representative</strong><br/>
            Date: ${todayDate}
          </td>
        </tr>
      </table>

      <div style="background-color: #f0f4f8; border-left: 4px solid #003D7A; padding: 15px; margin-top: 30px;">
        <p style="font-size: 11px; color: #333; margin: 0;">
          <strong>⚠️ IMPORTANT:</strong> Please read this letter carefully and sign electronically to confirm your acceptance. You have until <strong>${formattedDeadline}</strong> to accept this offer.
        </p>
      </div>
    </section>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Employment Offer Letter - ${data.applicantName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background-color: #fff;
        }
        .container {
          max-width: 850px;
          margin: 0 auto;
          padding: 40px;
          background-color: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 3px solid #003D7A;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #003D7A;
          letter-spacing: 1px;
        }
        .logo-subtitle {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
          letter-spacing: 0.5px;
        }
        .date-box {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        .date-box div {
          margin-bottom: 8px;
        }
        .date-box strong {
          color: #1a1a1a;
        }
        h1, h2, h3 {
          color: #003D7A;
        }
        h1 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        h2 {
          font-size: 16px;
          font-weight: 700;
          margin-top: 30px;
          margin-bottom: 15px;
          border-bottom: 2px solid #003D7A;
          padding-bottom: 10px;
        }
        .letter-content {
          margin-bottom: 30px;
        }
        .letter-content p {
          font-size: 12px;
          line-height: 1.8;
          color: #333;
          margin-bottom: 15px;
          text-align: justify;
        }
        .salutation {
          font-size: 12px;
          margin-bottom: 20px;
          color: #333;
        }
        .opening-paragraph {
          background-color: #f9fafb;
          padding: 15px;
          border-left: 4px solid #003D7A;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11px;
        }
        .details-table tr {
          border-bottom: 1px solid #ddd;
        }
        .details-table td {
          padding: 12px;
          vertical-align: top;
        }
        .details-table td:first-child {
          width: 35%;
          font-weight: 600;
          color: #003D7A;
          background-color: #f0f4f8;
        }
        .details-table td:last-child {
          width: 65%;
          color: #333;
        }
        ul, ol {
          margin-left: 25px;
          font-size: 11px;
          line-height: 1.8;
          color: #333;
          margin-bottom: 15px;
        }
        li {
          margin-bottom: 8px;
        }
        section {
          margin-bottom: 30px;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            padding: 30px;
            max-width: 100%;
          }
          h2 {
            page-break-after: avoid;
          }
          section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div>
            <div class="logo">UNEDF</div>
            <div class="logo-subtitle">United Nations Economic Development Foundation</div>
          </div>
          <div class="date-box">
            <div><strong>OFFER LETTER</strong></div>
            <div>Date: ${todayDate}</div>
            <div>Reference: OL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
          </div>
        </div>

        <!-- Main Content -->
        <h1>EMPLOYMENT OFFER LETTER</h1>
        
        <div class="letter-content">
          <div class="salutation">Dear ${data.applicantName},</div>

          <div class="opening-paragraph">
            <p>We are pleased to extend an offer of employment to you for the position of <strong>${data.jobTitle}</strong> with the United Nations Economic Development Foundation (UNEDF).</p>
          </div>

          <p>
            We have reviewed your qualifications and experience and believe you are well-suited for this role. This letter outlines the terms and conditions of employment. Please read it carefully and, if you accept, sign and return a copy by the specified deadline.
          </p>
        </div>

        <!-- Position Details -->
        <section>
          <h2>POSITION DETAILS</h2>
          <table class="details-table">
            <tr>
              <td>Position Title</td>
              <td><strong>${data.jobTitle}</strong></td>
            </tr>
            ${data.reportingStation ? `
            <tr>
              <td>Reporting Station / Duty Station</td>
              <td><strong>${data.reportingStation}</strong></td>
            </tr>
            ` : ''}
            <tr>
              <td>Contract Type</td>
              <td><strong>${data.contractType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</strong></td>
            </tr>
            ${data.gradeLevel ? `
            <tr>
              <td>Grade Level</td>
              <td><strong>${data.gradeLevel}</strong></td>
            </tr>
            ` : ''}
            <tr>
              <td>Expected Start Date</td>
              <td><strong>${formattedStartDate}</strong></td>
            </tr>
            <tr>
              <td>Contract Duration</td>
              <td><strong>${data.contractDuration}</strong></td>
            </tr>
          </table>
        </section>

        <!-- Appointment Details -->
        <section>
          <h2>APPOINTMENT DETAILS</h2>
          <p>
            Your appointment is subject to:
          </p>
          <ul>
            <li>Satisfactory completion of pre-employment checks including medical clearance</li>
            <li>Provision of certified copies of educational credentials and professional licenses</li>
            <li>Verification of employment history and references</li>
            <li>Successful completion of background security check</li>
            <li>Fulfillment of any visa or work permit requirements</li>
          </ul>
        </section>

        <!-- Compensation and Benefits -->
        ${data.salaryNotes ? `
        <section>
          <h2>COMPENSATION AND BENEFITS</h2>
          <p>${data.salaryNotes.split('\\n').join('</p><p>')}</p>
        </section>
        ` : ''}

        <!-- Conditions of Appointment -->
        <section>
          <h2>CONDITIONS OF APPOINTMENT</h2>
          <p>
            Your employment with UNEDF is on the following basis:
          </p>
          <ul>
            <li><strong>Probation Period:</strong> A probation period of 3 months applies, during which either party may terminate the appointment with one week's written notice.</li>
            <li><strong>Code of Conduct:</strong> You must adhere to the UNEDF Code of Conduct and UN Staff Rules and Regulations.</li>
            <li><strong>Confidentiality:</strong> All information obtained during employment must be treated as confidential.</li>
            <li><strong>Conflict of Interest:</strong> You must declare any conflict of interest and comply with UN conflict resolution procedures.</li>
            <li><strong>Notice Period:</strong> After the probation period, either party must provide 30 days' written notice for termination.</li>
          </ul>
        </section>

        <!-- SSAFE and IFAK Section -->
        ${ssafeSection}

        <!-- Custom Clauses -->
        ${data.customClauses ? `
        <section>
          <h2>ADDITIONAL TERMS AND CONDITIONS</h2>
          <p>${data.customClauses.split('\\n').join('</p><p>')}</p>
        </section>
        ` : ''}

        <!-- Acceptance Instructions -->
        <section>
          <h2>ACCEPTANCE OF OFFER</h2>
          <p>
            Please confirm your acceptance of this offer by signing the electronic signature form and submitting it before <strong>${formattedDeadline}</strong>. If we do not receive your signed acceptance by this date, we may withdraw the offer and offer the position to another candidate.
          </p>
          <p>
            If you have any questions regarding this offer, please do not hesitate to contact our Human Resources department at <strong>careers@unoedp.org</strong>.
          </p>
        </section>

        <!-- Signature Section -->
        ${signatureSection}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999;">
          <p>United Nations Economic Development Foundation</p>
          <p>This is an official employment offer letter.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function generatePDF(html: string, filename: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['h2', 'h3', 'section'] }
    };

    html2pdf()
      .set(options)
      .from(element)
      .outputPdf('blob')
      .then((pdf: Blob) => {
        resolve(pdf);
      })
      .catch((error: any) => {
        reject(error);
      });
  });
}
