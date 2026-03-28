-- Fix Row Level Security for public offer letter access
-- Run this migration in your Supabase SQL editor to allow public token-based access

-- Step 1: Drop existing restrictive policies on offer_letters if they exist
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "offer_letters_public_select" ON offer_letters;
  DROP POLICY IF EXISTS "offer_letters_admin" ON offer_letters;
  DROP POLICY IF EXISTS "offer_letters_authenticated" ON offer_letters;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Continue if tables don't exist yet
END
$$;

-- Step 2: Enable RLS (if not already enabled)
ALTER TABLE IF EXISTS offer_letters ENABLE ROW LEVEL SECURITY;

-- Step 3: Create permissive policy for public token-based access
CREATE POLICY "Public access via valid signature token"
ON offer_letters
FOR SELECT
USING (
  -- Allow access if signature_token is set (means it's been sent to applicant)
  -- This allows anyone with the link to view their offer letter
  signature_token IS NOT NULL
);

-- Step 4: Allow admin access
CREATE POLICY "Admin full access"
ON offer_letters
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Step 5: Enable RLS on related tables
ALTER TABLE IF EXISTS offer_letter_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offer_letter_audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for signatures (allow public insertion for signing)
DROP POLICY IF EXISTS "Signatures public insert" ON offer_letter_signatures;
CREATE POLICY "Signatures public insert"
ON offer_letter_signatures
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Signatures public select" ON offer_letter_signatures;
CREATE POLICY "Signatures public select"
ON offer_letter_signatures
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Signatures admin update" ON offer_letter_signatures;
CREATE POLICY "Signatures admin update"
ON offer_letter_signatures
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Step 7: Create policies for audit logs (allow public insertion for tracking views)
DROP POLICY IF EXISTS "Audit logs public insert" ON offer_letter_audit_logs;
CREATE POLICY "Audit logs public insert"
ON offer_letter_audit_logs
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Audit logs admin select" ON offer_letter_audit_logs;
CREATE POLICY "Audit logs admin select"
ON offer_letter_audit_logs
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
