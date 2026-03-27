-- Create offer letter templates table
CREATE TABLE IF NOT EXISTS offer_letter_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_html TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  include_ssafe_ifak BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offer letters table
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID REFERENCES job_applications(id),
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20),
  job_title VARCHAR(255) NOT NULL,
  reporting_station VARCHAR(255),
  contract_type VARCHAR(50),
  grade_level VARCHAR(50),
  expected_start_date DATE,
  contract_duration VARCHAR(100),
  acceptance_deadline DATE NOT NULL,
  salary_notes TEXT,
  custom_clauses TEXT,
  include_ssafe_ifak BOOLEAN DEFAULT TRUE,
  allow_download_unsigned BOOLEAN DEFAULT FALSE,
  require_signature_before_download BOOLEAN DEFAULT TRUE,
  template_id UUID REFERENCES offer_letter_templates(id),
  pdf_file_url VARCHAR(500),
  signed_pdf_url VARCHAR(500),
  signature_token VARCHAR(255) UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offer letter signatures table
CREATE TABLE IF NOT EXISTS offer_letter_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_letter_id UUID REFERENCES offer_letters(id) ON DELETE CASCADE NOT NULL,
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  signature_type VARCHAR(50),
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  consent_accepted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table for offer letters
CREATE TABLE IF NOT EXISTS offer_letter_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_letter_id UUID REFERENCES offer_letters(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add offer_letter_id to job_applications if it doesn't exist
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS offer_letter_id UUID REFERENCES offer_letters(id);

-- Create indexes for better query performance
CREATE INDEX idx_offer_letters_applicant_id ON offer_letters(applicant_id);
CREATE INDEX idx_offer_letters_status ON offer_letters(status);
CREATE INDEX idx_offer_letters_created_at ON offer_letters(created_at DESC);
CREATE INDEX idx_offer_letters_signature_token ON offer_letters(signature_token);
CREATE INDEX idx_offer_letter_signatures_offer_letter_id ON offer_letter_signatures(offer_letter_id);
CREATE INDEX idx_offer_letter_audit_logs_offer_letter_id ON offer_letter_audit_logs(offer_letter_id);

-- Enable RLS on all tables
ALTER TABLE offer_letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letter_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letter_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offer_letter_templates
CREATE POLICY "Admins can view templates" ON offer_letter_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create templates" ON offer_letter_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update own templates" ON offer_letter_templates
  FOR UPDATE USING (auth.uid() = updated_by OR auth.uid() = created_by);

-- RLS Policies for offer_letters
CREATE POLICY "Admins can view offer letters" ON offer_letters
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create offer letters" ON offer_letters
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update own offer letters" ON offer_letters
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for offer_letter_signatures
CREATE POLICY "Applicants can sign their own letters" ON offer_letter_signatures
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins and applicants can view signatures" ON offer_letter_signatures
  FOR SELECT USING (TRUE);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON offer_letter_audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can create audit logs" ON offer_letter_audit_logs
  FOR INSERT WITH CHECK (TRUE);
