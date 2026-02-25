-- Fix jobs table to match application code expectations
-- The application code expects: type, is_active, featured, closing_date
-- Database has: job_type, employment_type, status, deadline

-- Add missing columns if they don't exist
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'full-time';

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS closing_date TIMESTAMP WITH TIME ZONE;

-- Migrate data from old columns to new columns
UPDATE jobs 
SET type = COALESCE(job_type, employment_type, 'full-time')
WHERE type IS NULL OR type = '';

UPDATE jobs
SET is_active = CASE 
  WHEN status = 'active' OR status = 'open' THEN true
  ELSE true
END
WHERE is_active IS NULL;

UPDATE jobs
SET closing_date = deadline
WHERE closing_date IS NULL AND deadline IS NOT NULL;

-- Create index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(featured);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);

-- Drop old columns after migration (optional - keep for backup)
-- ALTER TABLE jobs DROP COLUMN job_type;
-- ALTER TABLE jobs DROP COLUMN employment_type;
-- ALTER TABLE jobs DROP COLUMN status;
-- ALTER TABLE jobs DROP COLUMN deadline;
