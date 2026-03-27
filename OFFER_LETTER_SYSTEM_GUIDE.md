# Automated Offer Letter Issuing & E-Signature System - Implementation Guide

## Overview

The offer letter system is now fully integrated into the unoedp.org admin portal. It enables administrators to create, preview, send, and track employment offer letters with secure e-signature capabilities for applicants.

## System Architecture

### Database Tables

#### `offer_letter_templates`
- Stores reusable offer letter templates
- Fields: id, name, description, template_html, is_default, include_ssafe_ifak, created_by, updated_by, timestamps
- Supports template variants by role/department

#### `offer_letters`
- Stores individual offer letter instances
- Key fields:
  - `applicant_id` - links to job_applications
  - `applicant_name`, `applicant_email`, `applicant_phone`
  - `job_title`, `reporting_station`, `contract_type`, `grade_level`
  - `expected_start_date`, `contract_duration`, `acceptance_deadline`
  - `salary_notes`, `custom_clauses`
  - `include_ssafe_ifak` - flag to include training requirements
  - `signature_token` - secure expiring link token
  - `token_expires_at` - token expiry (10 days by default)
  - `status` - draft | sent | viewed | signed | downloaded | expired | voided
  - Timestamps: `sent_at`, `viewed_at`, `signed_at`, `downloaded_at`

#### `offer_letter_signatures`
- Captures signature events with audit trail
- Fields: offer_letter_id, signer_name, signer_email, signature_type (typed|drawn), signature_data, signed_at, ip_address, user_agent, consent_accepted, timestamp

#### `offer_letter_audit_logs`
- Maintains compliance audit trail
- Fields: offer_letter_id, action, details (JSONB), performed_by, ip_address, timestamp
- Actions: created, sent, viewed, signed, downloaded, voided, updated

### Row Level Security (RLS)

- **Admins**: Can view, create, and update offer letters they create
- **Applicants**: Can only access their own letter through secure token links
- **Audit logs**: Maintained by system; viewed by admins only

## Admin Features

### 1. Offer Letters Dashboard (`/setup/offer-letters`)

**Features:**
- Searchable table with filters by status, date range
- Status cards showing counts (Draft, Sent, Signed, Downloaded)
- Quick actions: Edit, Preview, Send, Download, Duplicate
- Email applicant info and offer summary visible

**Status Overview:**
- **Draft** - Created but not sent
- **Sent** - Email with signing link dispatched
- **Viewed** - Applicant accessed the signing portal
- **Signed** - Offer electronically signed by applicant
- **Downloaded** - Signed PDF downloaded by applicant
- **Expired** - 10-day token expired without signature
- **Voided** - Admin revoked the offer

### 2. Create/Edit Offer Letter Form (`/setup/offer-letters/new` and `/setup/offer-letters/[id]`)

**Applicant Selection:**
- Dropdown to select from existing applicants in job_applications table
- Manual entry fallback for off-cycle or external offers
- Auto-fills name, email, phone from selected applicant
- Job title auto-populated from applicant's original application

**Employment Details:**
- Position Title (required)
- Reporting Station / Duty Station
- Contract Type (Fixed-Term, Permanent, Temporary, Consultant)
- Grade Level (e.g., NO-2, P-3, etc.)
- Expected Start Date (required)
- Contract Duration (e.g., "24 months")
- Acceptance Deadline (required)

**Compensation & Benefits:**
- Salary notes textarea (optional)
- Custom clauses textarea (optional)
- Checkbox: "Include SSAFE & IFAK 2.0 Requirement Block" (checked by default)
- Checkbox: "Allow Download Before Signing"
- Checkbox: "Require Signature Before Download" (checked by default)

**Actions:**
- Save as Draft
- Generate & Preview PDF
- Send (changes status to "ready")

### 3. Offer Letter Detail Page (`/setup/offer-letters/[id]`)

**Display:**
- Full offer details with edit capability
- Status timeline showing: Created → Sent → Viewed → Signed → Downloaded
- Quick actions: Preview, Send, Download, Edit, Duplicate
- Inline editing of applicant info, employment details, and additional notes

### 4. Preview Page (`/setup/offer-letters/[id]/preview`)

**Features:**
- Full-page HTML preview matching UNDP's formal letter format
- Professional multi-page layout with:
  - UNEDF header with logo and offer reference
  - Formal salutation
  - Opening paragraph highlighted
  - Position Details table
  - Appointment Details section with required checks
  - Compensation and Benefits section
  - Conditions of Appointment section
  - SSAFE & IFAK 2.0 requirement block (if enabled)
  - Custom clauses section (if provided)
  - Acceptance Instructions
  - Signature section with blank signature lines
  - Professional footer
- Toolbar: Download HTML, Save, Close
- Print-ready styling with proper page breaks

### 5. Send Offer Letter Page (`/setup/offer-letters/[id]/send`)

**Process:**
1. Display offer details summary
2. Customize email message to applicant
3. Generate secure signing token (UUID)
4. Set token expiry to 10 days
5. Send via Resend email service with signing link
6. Update status to "sent" and set sent_at timestamp
7. Log action in audit trail

**Email Content:**
- Subject: "Employment Offer Letter - [Job Title]"
- Body: Customizable message with mandatory signing link
- Link: `https://unoedp.org/offer/[signing-token]`
- Includes acceptance deadline reminder

## Applicant-Facing Portal

### Secure Signing Portal (`/offer/[token]`)

**Access Control:**
- Requires valid signing token from email link
- Token validation: must exist, not expired (10 days), offer status not voided
- Auto-marks as "viewed" on first access
- Logs IP address, user agent, timestamp

**Three-Step Flow:**

#### Step 1: Review Offer Letter
- Display full formal offer letter HTML
- Sidebar shows: Position, Contract Type, Start Date, Acceptance Deadline
- Download button (if allow_download_unsigned = true)
- Button to proceed to signing

#### Step 2: Sign Electronically
- Full Legal Name input
- Signature Method selector:
  - **Typed**: Render name in signature-style font
  - **Drawn**: HTML5 canvas for hand-drawn signature
- Clear button for drawn signatures
- Consent checkbox (required):
  > "I certify that I have read and understand the terms of this offer letter and accept the offer of employment on the terms and conditions outlined herein. I confirm that all information provided is accurate and complete."
- Submit button

#### Step 3: Confirmation
- Success message
- Option to download signed PDF
- Confirmation email sent to applicant
- Notification email sent to HR

**Captured Data:**
- Signer name
- Signature type and data (canvas image or typed text)
- Signature timestamp (ISO 8601)
- IP address
- User agent (browser info)
- Consent checkbox state
- Email address

**Audit Trail:**
- viewed action logged with timestamp, IP
- signed action logged with signature metadata
- Signature record created with all details

## Email Notifications

### Email Types

#### 1. Offer Letter Sent (`offer_letter_sent`)
- Recipient: Applicant
- Trigger: Admin clicks "Send Offer Letter"
- Contains: Job title, position summary, personalized signing link
- Includes acceptance deadline reminder
- Template: Professional UNEDF branding with clear CTA

#### 2. Offer Letter Signed Confirmation (`offer_letter_signed`)
- Recipient: Applicant
- Trigger: Applicant successfully signs
- Contains: Confirmation message, next steps info, download link
- States when HR will follow up

#### 3. Offer Letter Signed Notification (Future)
- Recipient: HR email (configured in admin)
- Trigger: Applicant signs offer
- Contains: Applicant info, signature timestamp, next actions

### Email Configuration

**Sender:** noreply@unoedp.org (via Resend)
**Service:** Resend API integration (already configured)
**Template Variables:**
- applicantName
- jobTitle
- signingLink (unique per offer)
- acceptanceDeadline

## PDF Generation & Storage

### HTML Template (`lib/offer-letter-pdf.ts`)

**Design Principles:**
- Preserves UNDP formal document style
- Professional typography and spacing
- Fixed page width (850px for A4 layout)
- Multi-page capable with print-friendly styling
- SSAFE/IFAK block is reusable protected section by default

**Dynamic Fields:**
- Applicant name (salutation and signature)
- Job title (multiple sections)
- Reporting station
- Contract type and grade
- Start date and duration
- Acceptance deadline
- Salary/benefits notes
- Custom clauses
- SSAFE/IFAK block toggle

**Signature Placement:**
- Two signature lines: Applicant | HR Rep
- Auto-filled dates
- Signed version shows signature image or typed name
- "Signed electronically on [date]" footer for signed PDFs

### PDF Conversion

**Method:** HTML to Canvas to PDF (via html2pdf.js)
**Approach:**
- Generate formatted HTML with all dynamic content
- Use html2pdf.js library on client for preview
- Server-side conversion: Use Puppeteer or external service (future enhancement)
- Output: Print-ready PDF with proper formatting

**Storage:**
- unsigned PDF: Stored in Supabase Storage or Vercel Blob
- signed PDF: Stored with signature metadata
- File naming: `offer-letter-{applicantName}-{offerId}.pdf`

## API Routes

### POST `/api/offer-letters/generate`
- Input: offerId
- Fetches offer details from database
- Generates formatted HTML
- Returns HTML for preview
- Future: Converts to PDF and stores

### POST `/api/emails/send`
Enhanced with offer letter templates:
- `type: 'offer_letter_sent'` - Initial offer email with signing link
- `type: 'offer_letter_signed'` - Confirmation to applicant
- `type: 'offer_letter_signed_admin'` - Notification to HR (future)
- Includes signature_token and link generation
- Stores email log in email_logs table

### GET `/api/offer-letters/[id]/download` (Future)
- Generates signed PDF from offer letter record
- Returns PDF file with proper headers
- Logs download action in audit trail

## Security Features

### Token Management
- Secure UUID token generation
- 10-day expiry window (configurable)
- Token validation on every access
- One-time use prevention (status check)
- Expiry email reminders (future enhancement)

### Audit Trail
- All actions logged: created, sent, viewed, signed, voided
- IP address capture for compliance
- User agent logging
- Timestamp every action
- Immutable audit logs (RLS prevents deletion)

### Data Protection
- RLS policies prevent unauthorized access
- Applicants only see their own letter via token
- Admins see only letters they created
- Email addresses encrypted in transit
- Password-protected PDFs (future enhancement)

### Consent & Acceptance
- Explicit consent checkbox on signing form
- Timestamp captured at moment of signing
- Signature metadata includes legal name
- Confirmation email provides signed copy

## Testing Workflow

### Demo Data
The system includes one demo applicant and job for testing:
- Applicant: "Demo Applicant" (demo@example.com)
- Position: "Program Officer"
- Can create sample offer letters from dashboard

### Testing Steps

1. **Create Offer Letter**
   - Go to `/setup/offer-letters` → "Create Offer Letter"
   - Select demo applicant or manually enter details
   - Fill in employment details
   - Preview the PDF
   - Save as draft

2. **Send Offer**
   - Click "Send" on the offer letter
   - Customize email message (optional)
   - Click "Send Offer Letter"
   - Status changes to "sent"
   - Email dispatched with signing link

3. **Sign Offer (Applicant)**
   - Open email and click signing link (or use token directly at `/offer/[token]`)
   - Review full offer letter
   - Enter full legal name
   - Choose signature method (typed or drawn)
   - Check consent box
   - Click "Sign & Accept"
   - Receive confirmation email
   - Download signed PDF

4. **Verify Status**
   - Go back to dashboard
   - Offer status shows as "signed"
   - Timestamp shows when signed
   - Download signed PDF

## Future Enhancements

### Phase 2 Features
- [ ] Template library with role variants
- [ ] Clause presets and section locking
- [ ] Bulk offer generation for multiple candidates
- [ ] Offer letter countersigning by department head
- [ ] Expiry reminder emails (3 days before deadline)
- [ ] Conditional clauses based on role/location
- [ ] Multi-language support
- [ ] API for third-party HR systems
- [ ] Applicant portal to download signed copies
- [ ] Signature verification with certificate

### Performance Optimization
- [ ] PDF generation as background job (Bull queue)
- [ ] Signed PDF caching in Blob storage
- [ ] Email delivery status webhooks
- [ ] Database indexing optimization

### Compliance & Audit
- [ ] Digital signature certificates (eSignature compliance)
- [ ] GDPR data retention policies
- [ ] Configurable offer expiry periods per country
- [ ] Compliance report generation
- [ ] Integration with background check services

## Configuration Variables

**Environment Variables Needed:**
- `RESEND_API_KEY` - Email service API key (already configured)
- `NEXT_PUBLIC_BASE_URL` - Base URL for signing links (e.g., https://unoedp.org)
- `SUPABASE_URL` - Database connection (already configured)
- `SUPABASE_ANON_KEY` - Public key for client access (already configured)

**Database Configuration:**
- RLS policies automatically configured
- 10-day token expiry (configurable in code)
- Status enum values: draft | ready | sent | viewed | signed | downloaded | expired | voided

## Support & Troubleshooting

### Common Issues

**Signing link not working:**
- Verify token is in database: `SELECT signature_token FROM offer_letters WHERE id = '...'`
- Check token_expires_at hasn't passed
- Verify status is not 'voided'
- Clear browser cache and try again

**Email not sending:**
- Check RESEND_API_KEY is set in environment
- Verify recipient email is correct format
- Check Resend dashboard for delivery status
- Review API error response in console

**PDF preview blank:**
- Check browser console for JavaScript errors
- Verify HTML generation produced valid output
- Check all dynamic fields are populated
- Clear localStorage cache

**Applicant can't access portal:**
- Verify signing token matches exactly
- Check URL format: `/offer/[token-uuid-here]`
- Ensure 10-day expiry hasn't passed
- Check that offer status isn't "voided"

## Admin Guidelines

### Best Practices

1. **Before Sending:**
   - Always preview the PDF first
   - Check all details are correct
   - Verify dates are accurate
   - Confirm applicant email is correct

2. **Custom Clauses:**
   - Keep language professional and clear
   - Cross-reference legal/HR requirements
   - Use plain language, avoid jargon
   - Test with preview before sending

3. **Tracking:**
   - Review dashboard regularly for expired offers
   - Follow up on unsigned offers after 5 days
   - Void offers if circumstances change
   - Archive completed offers annually

4. **Record Keeping:**
   - Maintain copies of signed PDFs
   - Export audit logs quarterly
   - Document any offer modifications
   - Keep signed letters per retention policy

## Support Contact

For technical issues or questions about the offer letter system:
- HR Team: careers@unoedp.org
- Technical Support: contact admin
- Documentation: See this file and inline code comments
