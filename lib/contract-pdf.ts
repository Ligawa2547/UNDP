/**
 * Contract PDF Generation Library
 * Generates employment contract HTML and PDFs with company letterhead and branding
 */

export interface ContractParams {
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
  signerName?: string;
  signatureDate?: string;
  signatureData?: string;
  signatureType?: 'typed' | 'drawn';
}

const letterheadHTML = `
  <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #003366; padding-bottom: 20px;">
    <div style="font-size: 24px; font-weight: bold; color: #003366; margin-bottom: 5px;">
      UNITED NATIONS
    </div>
    <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
      ORGANIZATION
    </div>
    <div style="font-size: 11px; color: #666;">
      Office of Human Resources
    </div>
  </div>
`;

export function generateContractHTML(
  params: ContractParams,
  isSigned: boolean = false
): string {
  const {
    applicantName,
    applicantEmail,
    jobTitle,
    reportingStation,
    contractType,
    gradeLevel,
    expectedStartDate,
    contractDuration,
    acceptanceDeadline,
    salaryNotes,
    customClauses,
    signerName,
    signatureDate,
    signatureData,
    signatureType,
  } = params;

  const startDate = new Date(expectedStartDate);
  const deadline = new Date(acceptanceDeadline);

  const signatureHTML = isSigned && signerName ? `
    <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div>
          <div style="height: 60px; margin-bottom: 10px;">
            ${signatureType === 'drawn' && signatureData 
              ? `<img src="${signatureData}" style="max-height: 60px; max-width: 200px;" alt="Signature">`
              : `<div style="border-bottom: 1px solid #333; width: 200px; font-family: 'Brush Script MT', cursive; font-size: 24px; padding-top: 10px;">${signerName}</div>`
            }
          </div>
          <div style="font-size: 11px;">Signature</div>
        </div>
        <div>
          <div style="border-bottom: 1px solid #333; width: 150px; text-align: center; padding-bottom: 10px;">
            ${signatureDate || ''}
          </div>
          <div style="font-size: 11px;">Date</div>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          page-break-after: always;
        }
        .container {
          max-width: 850px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        h1 {
          text-align: center;
          color: #003366;
          margin-bottom: 30px;
          font-size: 20px;
        }
        h2 {
          color: #003366;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 14px;
          border-bottom: 2px solid #003366;
          padding-bottom: 8px;
        }
        p {
          margin-bottom: 12px;
          text-align: justify;
          font-size: 11px;
        }
        .section {
          margin-bottom: 20px;
        }
        .recipient-info {
          background-color: #f5f5f5;
          padding: 15px;
          margin-bottom: 20px;
          border-left: 4px solid #003366;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 11px;
        }
        .info-label {
          font-weight: bold;
          width: 150px;
          color: #003366;
        }
        .info-value {
          flex: 1;
        }
        table {
          width: 100%;
          margin: 15px 0;
          border-collapse: collapse;
          font-size: 11px;
        }
        th {
          background-color: #003366;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .signature-section {
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .signature-block {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .signature-item {
          width: 200px;
        }
        .signature-line {
          border-bottom: 1px solid #333;
          height: 50px;
          display: flex;
          align-items: flex-end;
          padding-bottom: 5px;
          margin-bottom: 5px;
          font-family: 'Brush Script MT', cursive;
          font-size: 18px;
        }
        .signature-label {
          font-size: 10px;
          font-weight: bold;
        }
        .dated {
          margin-top: 20px;
          font-size: 11px;
        }
        .watermark {
          position: fixed;
          opacity: 0.1;
          font-size: 60px;
          color: #003366;
          transform: rotate(-45deg);
          top: 50%;
          left: 50%;
          z-index: 0;
        }
        @media print {
          body {
            background: white;
          }
          .container {
            padding: 20px;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${letterheadHTML}
        
        <h1>EMPLOYMENT CONTRACT</h1>
        
        <div class="section">
          <p style="text-align: center; font-weight: bold; margin-bottom: 20px;">
            This Employment Contract ("Contract") is entered into as of ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, between the United Nations and the below-named individual.
          </p>
        </div>

        <div class="recipient-info">
          <div class="info-row">
            <span class="info-label">Employee Name:</span>
            <span class="info-value">${applicantName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email Address:</span>
            <span class="info-value">${applicantEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Position:</span>
            <span class="info-value">${jobTitle}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Grade Level:</span>
            <span class="info-value">${gradeLevel || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Reporting Station:</span>
            <span class="info-value">${reportingStation || 'Headquarters'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contract Type:</span>
            <span class="info-value">${contractType.charAt(0).toUpperCase() + contractType.slice(1).replace('-', ' ')}</span>
          </div>
        </div>

        <h2>1. POSITION AND DUTIES</h2>
        <div class="section">
          <p>
            The United Nations hereby engages the Employee in the position of <strong>${jobTitle}</strong> at the ${reportingStation || 'Headquarters'} office. The Employee agrees to perform all duties and responsibilities as assigned by the United Nations and in accordance with the United Nations Staff Regulations and Rules.
          </p>
        </div>

        <h2>2. DURATION OF CONTRACT</h2>
        <div class="section">
          <p>
            This is a <strong>${contractType === 'fixed-term' ? 'Fixed-Term' : 'Indefinite'}</strong> contract with an expected duration of <strong>${contractDuration}</strong>. The employment relationship shall commence on <strong>${startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
          </p>
          ${contractType === 'fixed-term' ? `
            <p>
              The Employee must provide written confirmation of acceptance of this contract by <strong>${deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. Failure to provide such confirmation may result in the withdrawal of this offer.
            </p>
          ` : ''}
        </div>

        <h2>3. COMPENSATION</h2>
        <div class="section">
          <p>
            The Employee shall receive compensation as determined by the United Nations salary structure for the position and grade level. Details regarding salary, benefits, and allowances will be provided separately.
          </p>
          ${salaryNotes ? `<p><strong>Additional Salary Notes:</strong><br/>${salaryNotes}</p>` : ''}
        </div>

        <h2>4. SECURITY CLEARANCES</h2>
        <div class="section">
          <p>
            The Employee is required to complete the following security clearances before commencing employment:
          </p>
          <ul style="margin-left: 20px; font-size: 11px;">
            <li style="margin-bottom: 5px;">IFAQ (UNAC Induction) - Mandatory</li>
            <li style="margin-bottom: 5px;">SSAFE (Security Awareness) - Mandatory</li>
            <li style="margin-bottom: 5px;">BSAFE (Background Security Awareness) - Required for payroll processing</li>
          </ul>
        </div>

        <h2>5. CONDUCT AND COMPLIANCE</h2>
        <div class="section">
          <p>
            The Employee shall adhere to the United Nations Standards of Conduct, Code of Ethics, and all applicable policies. The Employee agrees to maintain confidentiality regarding all United Nations information and operations.
          </p>
        </div>

        <h2>6. TERMINATION</h2>
        <div class="section">
          <p>
            Either party may terminate this contract in accordance with the United Nations Staff Regulations and Rules. The United Nations reserves the right to terminate this contract at any time with appropriate notice as per regulations.
          </p>
        </div>

        ${customClauses ? `
          <h2>7. ADDITIONAL TERMS</h2>
          <div class="section">
            <p>${customClauses}</p>
          </div>
        ` : ''}

        <h2>ACKNOWLEDGMENT AND SIGNATURE</h2>
        <div class="signature-section">
          <p>
            By signing below, the Employee acknowledges having read and understood the terms and conditions of this Employment Contract and agrees to abide by all United Nations regulations and policies.
          </p>

          ${signatureHTML}

          <div class="dated">
            <p style="margin-top: 30px;">
              <strong>Date of Execution:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function generatePDF(html: string): Promise<Buffer | null> {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });
    
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.log('[v0] PDF generation not available:', error);
    return null;
  }
}
