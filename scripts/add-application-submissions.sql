-- Add columns to job_applications for video interview and document submissions
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_video_url TEXT,
ADD COLUMN IF NOT EXISTS interview_video_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS education_documents TEXT[],
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS interview_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMP WITH TIME ZONE;

-- Add interview_questions column to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS interview_questions TEXT[];

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_submission_deadline ON job_applications(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_job_applications_interview_video_url ON job_applications(interview_video_url);
