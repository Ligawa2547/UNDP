# Employment Contract Management System Guide

## Overview

This guide documents the complete Employment Contract Management System, which allows admins to create and manage employment contracts, and employees to review, sign, and provide required documentation through a secure web portal.

## System Components

### 1. Admin Contract Management Portal (`/setup/contracts`)

#### Main Contracts Page
- **Location:** `/app/setup/contracts/page.tsx`
- **Features:**
  - View all employment contracts with filtering and search
  - Status indicators for contract lifecycle (Draft, Sent, Signed, Details Pending, BSAFE Pending, Completed)
  - Download contracts as PDF
  - View employee details and confirmations
  - Print contract status timeline
  - Delete draft contracts

#### Create New Contract Page
- **Location:** `/app/setup/contracts/new/page.tsx`
- **Features:**
  - Form to create new employment contracts
  - Fields include:
    - Employee information (name, email)
    - Position details (title, grade, reporting station)
    - Contract terms (type, duration, start date, acceptance deadline)
    - Additional clauses and salary notes
  - Generates unique token-based portal link for employee

### 2. Employee Contract Portal (`/contract/[token]`)

#### Multi-Step Portal
- **Location:** `/app/contract/[token]/page.tsx`
- **Features:**
  - Token-based secure access
  - 7-step workflow:
    1. **Contract Review** - Review contract details
    2. **Bank Details** - Provide banking information
    3. **Visa Status** - Specify visa status and assistance needs
    4. **Security Confirmations** - Confirm IFAQ and SSAFE completion
    5. **Sign Contract** - Digitally sign (typed or drawn signature)
    6. **Upload BSAFE** - Upload BSAFE certification
    7. **Completion** - Confirmation of successful onboarding

#### Security Features
- Token expires after 30 days
- Automatic expiration tracking
- Audit logging for all interactions
- Secure bank detail encryption
- Digital signature storage

### 3. Status Printing Feature

#### Admin Offer Letter Status
- **Location:** Added to `/app/setup/offer-letters/page.tsx`
- **Features:**
  - Print status timeline for offer letters
  - Shows all lifecycle stages
  - Printable format with employee details

#### Admin Contract Status
- **Location:** Added to `/app/setup/contracts/page.tsx`
- **Features:**
  - Print contract onboarding timeline
  - 6-stage timeline (Created → Sent → Signed → Details Pending → BSAFE Pending → Completed)
  - Employee and position information
  - Current status badge

## Database Schema

### Tables Required

#### `employment_contracts`
```sql
- id (UUID, Primary Key)
- offer_letter_id (UUID, Foreign Key)
- applicant_name (Text)
- applicant_email (Text)
- job_title (Text)
- reporting_station (Text)
- contract_type (Text: 'fixed-term' or 'indefinite')
- grade_level (Text)
- expected_start_date (Date)
- contract_duration (Text)
- acceptance_deadline (Date)
- salary_notes (Text)
- custom_clauses (Text)
- status (Text: 'draft', 'sent', 'viewed', 'signed', 'details_pending', 'bsafe_pending', 'completed', 'expired')
- contract_token (Text, Unique)
- token_expires_at (Timestamp)
- created_at (Timestamp)
- sent_at (Timestamp)
- viewed_at (Timestamp)
- signed_at (Timestamp)
- signature_data (Text)
- signature_type (Text: 'typed' or 'drawn')
- created_by (UUID, Foreign Key to auth.users)
```

#### `contract_details`
```sql
- id (UUID, Primary Key)
- contract_id (UUID, Foreign Key, Unique)
- bank_account_holder (Text)
- bank_name (Text)
- bank_account_number (Text)
- bank_code (Text)
- visa_status (Text: 'valid', 'expired', 'not-required', 'applying')
- visa_expiry (Date)
- needs_visa_assistance (Boolean)
- ifaq_confirmed (Boolean)
- ssafe_confirmed (Boolean)
- ssafe_approval_number (Text)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### `contract_signatures`
```sql
- id (UUID, Primary Key)
- contract_id (UUID, Foreign Key)
- signature_data (Text, stores signature image or typed name)
- signature_type (Text: 'typed' or 'drawn')
- signer_name (Text)
- signed_at (Timestamp)
- created_at (Timestamp)
```

#### `bsafe_uploads`
```sql
- id (UUID, Primary Key)
- contract_id (UUID, Foreign Key, Unique)
- file_name (Text)
- file_type (Text)
- file_size (Integer)
- file_data (Text, Base64 encoded)
- uploaded_at (Timestamp)
- verified_at (Timestamp)
- verified_by (UUID, Foreign Key to auth.users)
```

### Migration Script
Located at: `/scripts/003-create-contract-tables.sql`

**Execute this script in your Supabase database to create all required tables with RLS policies.**

## API Endpoints

### Contract Management

#### POST `/api/contracts/create`
- **Purpose:** Create a new employment contract
- **Body:**
  ```json
  {
    "offerLetterId": "uuid",
    "applicantName": "string",
    "applicantEmail": "string",
    "jobTitle": "string",
    "reportingStation": "string",
    "contractType": "fixed-term|indefinite",
    "gradeLevel": "string",
    "expectedStartDate": "YYYY-MM-DD",
    "contractDuration": "string",
    "acceptanceDeadline": "YYYY-MM-DD",
    "salaryNotes": "string",
    "customClauses": "string"
  }
  ```
- **Returns:** Created contract object and portal link

#### GET `/api/contracts/[id]/download`
- **Purpose:** Download contract as PDF
- **Params:** `id` - Contract UUID
- **Returns:** PDF file or HTML (if PDF generation unavailable)

#### POST `/api/contracts/[id]/upload-bsafe`
- **Purpose:** Upload BSAFE certification file
- **Params:** `id` - Contract UUID
- **Body:** FormData with `file` field
- **Returns:** Upload confirmation

## File Structure

```
app/
  setup/
    contracts/
      page.tsx                 # Admin contracts dashboard
      new/
        page.tsx              # Create new contract form
      [id]/
        page.tsx              # Edit/view contract (optional)
  contract/
    [token]/
      page.tsx                # Employee portal
  api/
    contracts/
      create/
        route.ts              # Contract creation endpoint
      [id]/
        download/
          route.ts            # PDF download endpoint
        upload-bsafe/
          route.ts            # BSAFE upload endpoint
      offer-letters/
        [id]/
          download/
            route.ts          # Offer letter download
lib/
  contract-pdf.ts            # PDF generation utilities
  offer-letter-pdf.ts        # Existing offer letter PDF
scripts/
  003-create-contract-tables.sql  # Database setup
```

## Workflow Examples

### Admin Creates Contract
1. Navigate to `/setup/contracts`
2. Click "New Contract" button
3. Fill in employee and contract details
4. Click "Create Contract"
5. System generates unique token link
6. Admin sends link to employee via email

### Employee Completes Onboarding
1. Receives email with contract link
2. Opens `/contract/[token]` portal
3. Reviews contract details
4. Provides bank account information
5. Specifies visa status
6. Confirms IFAQ and SSAFE completion
7. Signs contract digitally (typed or drawn)
8. Uploads BSAFE certification from UNSSC or IICAR
9. System marks contract as completed
10. Admin receives notification for payroll processing

### Admin Views Contract Status
1. Open `/setup/contracts`
2. Find contract in list
3. Click "Print Status" button
4. Review timeline
5. Print or close

## Security Considerations

1. **Token-Based Access:** Each contract has a unique token valid for 30 days
2. **Automatic Expiration:** Expired contracts automatically change to "expired" status
3. **Bank Details:** Encrypted in database (requires Supabase encryption at rest)
4. **Digital Signatures:** Stored as image data (canvas) or typed text
5. **File Uploads:** Validated by type and size (max 10MB)
6. **Audit Trail:** All interactions logged for compliance

## BSAFE Certification

Employees can obtain BSAFE certification from:
- **UNSSC:** https://unssc.org
- **IICAR:** https://iicar.org

The employee portal provides links to both resources during the BSAFE upload step.

## Customization

### Modify Contract Template
Edit `/lib/contract-pdf.ts` to customize:
- Letterhead and branding
- Contract clauses and sections
- Formatting and styling
- Logo and company information

### Change Acceptance Deadline
The default acceptance deadline is set when creating the contract. Adjust in the form or via API.

### Add Custom Clauses
Use the "Custom Clauses" field in the contract creation form to add position-specific terms.

## Troubleshooting

### Contract Portal Not Loading
- Verify token is valid: `contract_token` exists in database
- Check token expiration: `token_expires_at` > current time
- Ensure contract status is not "expired" or "revoked"

### BSAFE Upload Failing
- File size should be < 10MB
- Supported formats: PDF, DOC, DOCX, JPG, PNG
- Check file permissions and internet connection

### PDF Download Returns HTML
- Puppeteer PDF generation is not available in your environment
- Browser can still print to PDF using browser's print dialog
- Alternative: Use "Print" option from browser menu

### Bank Details Not Saving
- Verify Supabase connection is active
- Check user has proper permissions
- Ensure `contract_details` table exists

## Support

For issues or questions:
1. Check Supabase database for errors
2. Review browser console for JavaScript errors
3. Check server logs for API errors
4. Verify all tables exist and RLS policies are set correctly
