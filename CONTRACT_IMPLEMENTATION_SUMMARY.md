# Employment Contract System - Implementation Summary

## Overview
The employment contract system is now fully integrated with the offer letter system, enabling seamless workflow from offer letter issuance to contract completion with digital signing and security clearance tracking.

## Key Features Implemented

### 1. Contract Creation from Offer Letters
- **Location**: Admin Offer Letters page (`/setup/offer-letters`)
- **Action**: "Create Contract" button on each non-draft offer letter
- **Workflow**: 
  - Clicking the button calls `/api/contracts/create` with the offer letter ID
  - Contract is automatically created with all offer letter details
  - Unique secure token is generated (valid for 30 days)
  - Employee portal link is generated: `/contract/[token]`
  - **Email is automatically sent** to the applicant with the portal link

### 2. Email Notifications
- **Service**: Resend API (configured via RESEND_API_KEY environment variable)
- **Template**: `contractIssuance` template in `lib/email-service.ts`
- **Content**:
  - Professional employment contract notification
  - 6-step process explanation
  - Direct link to employee contract portal
  - BSAFE certification resource links (UNSSC and IICAR)
  - Acceptance deadline

### 3. Admin Contracts Dashboard
- **Location**: `/setup/contracts`
- **Features**:
  - View all contracts with status tracking
  - Filter by status (draft, sent, viewed, signed, details_pending, bsafe_pending, completed, expired)
  - Search by applicant name, email, or job title
  - Download contracts as PDF
  - Print contract status timeline
  - View employee details (bank info, visa, security confirmations)
  - Monitor BSAFE upload status

### 4. Employee Contract Portal
- **Location**: `/contract/[token]`
- **7-Step Workflow**:
  1. **Contract Review**: Read and download contract PDF
  2. **Bank Details**: Provide account holder, bank name, account number, bank code
  3. **Visa Status**: Specify visa type and expiry, indicate if assistance needed
  4. **Security Confirmations**: Confirm IFAQ and SSAFE certifications
  5. **Digital Signature**: Sign with typed name or drawn signature
  6. **BSAFE Upload**: Upload BSAFE certification file
  7. **Completion**: Confirmation page

- **Features**:
  - Progress tracking with visual indicators
  - Save and resume capability
  - Auto-generated portal links from secure tokens
  - 30-day expiration with auto-expiry handling
  - Signature canvas for digital signing
  - File upload for BSAFE documents

### 5. Contract PDF Generation
- **Library**: `lib/contract-pdf.ts`
- **Includes**:
  - UN letterhead and branding
  - Digital signatures (typed or drawn)
  - Proper formatting for printing
  - Fallback HTML rendering if PDF generation unavailable

## Database Tables

### employment_contracts
```sql
- id (UUID, primary key)
- offer_letter_id (UUID, foreign key to offer_letters)
- applicant_name
- applicant_email
- job_title, reporting_station, contract_type, grade_level
- expected_start_date, contract_duration, acceptance_deadline
- salary_notes, custom_clauses, include_ssafe_ifak
- contract_token (unique, 48-char secure token)
- token_expires_at (30 days from creation)
- status (sent, viewed, signed, details_pending, bsafe_pending, completed, expired)
- sent_at, viewed_at, signed_at
- signature_data, signature_type
- created_at, updated_at
```

### contract_details
```sql
- id, contract_id (foreign key)
- bank_account_holder, bank_name, bank_account_number, bank_code
- visa_status, visa_expiry, needs_visa_assistance
- ifaq_confirmed, ssafe_confirmed, ssafe_approval_number
```

### bsafe_uploads
```sql
- id, contract_id (foreign key)
- file_url, file_name, file_size, uploaded_at
```

### contract_signatures
```sql
- id, contract_id (foreign key)
- signature_data, signature_type (typed|drawn), signed_at
```

## API Endpoints

### POST /api/contracts/create
**Purpose**: Create employment contract from offer letter
**Request**: `{ offerLetterId: string }`
**Response**: 
```json
{
  "success": true,
  "contract": { ... },
  "portalLink": "/contract/[token]"
}
```

### GET /api/contracts/[id]/download
**Purpose**: Download contract as PDF or HTML
**Returns**: PDF or printable HTML with all contract details

### POST /api/contracts/[id]/upload-bsafe
**Purpose**: Upload BSAFE certification file
**Multipart form data**: Contains file upload

## Admin Sidebar Integration
- Added "Contracts" link to admin sidebar under Setup section
- Icon: ScrollText (lucide-react)
- Route: `/setup/contracts`

## Email Configuration

**Required Environment Variable**: `RESEND_API_KEY`

To enable contract emails:
1. Sign up at https://resend.com
2. Get your API key
3. Add to environment variables as `RESEND_API_KEY`
4. Verify sender domain (default: noreply@unoedp.org)

## Security Features

- **Token-based Access**: Contracts accessed via secure 48-character tokens
- **Token Expiration**: 30-day automatic expiration with status update to 'expired'
- **RLS Policies**: Row-level security on all contract tables
- **Bank Details Encryption**: Sensitive financial information stored securely
- **Audit Trail**: All interactions tracked with timestamps

## Printing Capabilities

Both offer letters and contracts can be:
- Downloaded as PDF
- Printed directly from browser
- Printed via "Print Status" button showing timeline

## Testing Checklist

- [ ] Create offer letter and issue it
- [ ] Click "Create Contract" button
- [ ] Verify email is sent to applicant
- [ ] Access contract portal via email link
- [ ] Complete all 7 steps
- [ ] Download contract PDF
- [ ] Verify contract appears in admin dashboard
- [ ] Check contract status updates in real-time

## Troubleshooting

### Emails Not Being Sent
1. Verify `RESEND_API_KEY` is set in environment variables
2. Check email service logs at `/vercel/share/v0-project/app/api/contracts/create/route.ts` (look for `[v0] Sending contract email` logs)
3. Ensure sender email (noreply@unoedp.org) is verified in Resend dashboard
4. Check spam folder - emails might be filtered

### Contract Not Found
- Verify token is correct and not expired
- Check contract_token in database matches URL
- Ensure token_expires_at hasn't passed

### PDF Not Downloading
- Browser may be blocking downloads - check browser permissions
- Fallback to HTML view and use browser print-to-PDF
- Ensure contract status is not 'expired'
