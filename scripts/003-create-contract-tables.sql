-- Employment Contracts Table
CREATE TABLE IF NOT EXISTS employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_letter_id UUID NOT NULL REFERENCES offer_letters(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  
  -- Contract Details
  contract_type VARCHAR(50) NOT NULL DEFAULT 'fixed-term', -- 'fixed-term', 'permanent', 'consultancy', 'temporary'
  grade_level VARCHAR(50),
  job_title VARCHAR(255) NOT NULL,
  reporting_station VARCHAR(255),
  expected_start_date DATE,
  contract_duration VARCHAR(100), -- e.g., "2 years", "12 months"
  acceptance_deadline DATE,
  
  -- Applicant Bank Details (encrypted in Supabase)
  bank_name VARCHAR(255),
  account_holder_name VARCHAR(255),
  account_number VARCHAR(100),
  swift_code VARCHAR(20),
  iban VARCHAR(50),
  bank_details_encrypted BOOLEAN DEFAULT false,
  
  -- Visa & Work Authorization
  visa_status VARCHAR(50), -- 'not-required', 'required', 'approved', 'in-progress'
  visa_notes TEXT,
  work_permit_number VARCHAR(100),
  
  -- Certifications & Compliance
  ifaq_status VARCHAR(50) DEFAULT 'not-submitted', -- 'not-submitted', 'submitted', 'approved', 'rejected'
  ifaq_confirmed_at TIMESTAMP,
  ssafe_status VARCHAR(50) DEFAULT 'not-submitted', -- 'not-submitted', 'submitted', 'approved', 'rejected'
  ssafe_confirmed_at TIMESTAMP,
  bsafe_required BOOLEAN DEFAULT true,
  bsafe_status VARCHAR(50) DEFAULT 'not-submitted', -- 'not-submitted', 'submitted', 'approved', 'rejected'
  bsafe_file_url VARCHAR(500),
  bsafe_submitted_at TIMESTAMP,
  
  -- Assistance & Logistics
  needs_assistance BOOLEAN DEFAULT false,
  assistance_type VARCHAR(100), -- e.g., 'visa-processing', 'accommodation', 'travel'
  assistance_notes TEXT,
  
  -- Signing & Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'awaiting-details', 'awaiting-signature', 'signed', 'completed', 'voided'
  signature_token VARCHAR(255) UNIQUE,
  signature_token_expires_at TIMESTAMP,
  
  -- Contract Status Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  signed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contract Signatures Table
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
  
  signer_name VARCHAR(255),
  signer_email VARCHAR(255),
  
  -- Signature Options: typed, drawn, or file upload
  signature_type VARCHAR(50) NOT NULL, -- 'typed', 'drawn'
  signature_data TEXT NOT NULL, -- Base64 for drawn, plain text for typed
  signature_date TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- BSAFE Uploads Table
CREATE TABLE IF NOT EXISTS bsafe_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
  
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_url VARCHAR(500) NOT NULL,
  
  -- BSAFE Source and Validation
  source_url VARCHAR(500), -- Link to UNSSC or IICAR where downloaded
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Contract Templates (optional, for future enhancements)
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- HTML template
  
  contract_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'archived'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsafe_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employment_contracts
-- Allow authenticated users to view their own contracts (by email)
CREATE POLICY "Users can view own contracts" ON employment_contracts
  FOR SELECT USING (
    auth.jwt() ->> 'email' = (SELECT applicant_email FROM offer_letters WHERE id = offer_letter_id)
    OR auth.role() = 'service_role'
  );

-- Allow admins (service_role) to manage all contracts
CREATE POLICY "Admins can manage contracts" ON employment_contracts
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for contract_signatures
-- Allow authenticated users to sign their own contracts
CREATE POLICY "Users can sign own contracts" ON contract_signatures
  FOR SELECT USING (
    auth.jwt() ->> 'email' = (SELECT applicant_email FROM offer_letters ol WHERE ol.id = (SELECT offer_letter_id FROM employment_contracts WHERE id = contract_id))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can insert own signatures" ON contract_signatures
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for bsafe_uploads
-- Allow users to upload their own BSAFE
CREATE POLICY "Users can upload own BSAFE" ON bsafe_uploads
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view own BSAFE" ON bsafe_uploads
  FOR SELECT USING (
    auth.jwt() ->> 'email' = (SELECT applicant_email FROM offer_letters ol WHERE ol.id = (SELECT offer_letter_id FROM employment_contracts WHERE id = contract_id))
    OR auth.role() = 'service_role'
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employment_contracts_offer_letter_id ON employment_contracts(offer_letter_id);
CREATE INDEX IF NOT EXISTS idx_employment_contracts_status ON employment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_employment_contracts_applicant_id ON employment_contracts(applicant_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_bsafe_uploads_contract_id ON bsafe_uploads(contract_id);
CREATE INDEX IF NOT EXISTS idx_bsafe_uploads_status ON bsafe_uploads(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employment_contracts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employment_contracts_timestamp
BEFORE UPDATE ON employment_contracts
FOR EACH ROW
EXECUTE FUNCTION update_employment_contracts_timestamp();
