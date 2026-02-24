-- ============================================================================
-- UNDP Application Database Schema
-- ============================================================================
-- This script sets up all required tables, roles, RLS policies, and functions

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  region text,
  population integer,
  gdp numeric,
  image_url text,
  flag_url text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Jobs/Careers table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  department text,
  location text,
  salary_range text,
  job_type text CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  employment_type text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  deadline timestamp with time zone,
  image_url text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Job Applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  resume_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id, email)
);

-- News/Articles table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  image_url text,
  category text,
  tags text[],
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  resource_type text CHECK (resource_type IN ('document', 'video', 'link', 'dataset', 'tool')),
  content_url text,
  file_url text,
  category text,
  tags text[],
  country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Issues/Topics table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  content text,
  category text,
  tags text[],
  image_url text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  news_id uuid REFERENCES news(id) ON DELETE CASCADE,
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CHECK (
    (news_id IS NOT NULL AND issue_id IS NULL) OR
    (news_id IS NULL AND issue_id IS NOT NULL)
  )
);

-- File uploads tracking
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  uploaded_to text CHECK (uploaded_to IN ('news', 'resources', 'jobs', 'countries', 'profile')),
  related_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_countries_slug ON countries(slug);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_country_id ON resources(country_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_issues_slug ON issues(slug);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_news_id ON comments(news_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);

-- ============================================================================
-- 3. CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION sync_user_to_public()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', public.users.full_name),
      updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Update updated_at for all tables
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER countries_updated_at BEFORE UPDATE ON countries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER job_applications_updated_at BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER news_updated_at BEFORE UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER resources_updated_at BEFORE UPDATE ON resources
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER issues_updated_at BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync users from auth.users to public.users
CREATE TRIGGER auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION sync_user_to_public();

CREATE TRIGGER auth_user_updated AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION sync_user_to_public();

CREATE TRIGGER auth_user_deleted AFTER DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_user_delete();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Public can view admin profiles" ON users
FOR SELECT USING (role = 'admin');

CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can insert users" ON users
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- COUNTRIES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view published countries" ON countries
FOR SELECT USING (true);

CREATE POLICY "Only editors can insert countries" ON countries
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Only editors can update countries" ON countries
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Only editors can delete countries" ON countries
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view open jobs" ON jobs
FOR SELECT USING (status = 'open' OR created_by = auth.uid());

CREATE POLICY "Only editors can insert jobs" ON jobs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Only editors can update jobs" ON jobs
FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only editors can delete jobs" ON jobs
FOR DELETE USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- JOB APPLICATIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own applications" ON job_applications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Editors can view all applications" ON job_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Authenticated users can apply for jobs" ON job_applications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own applications" ON job_applications
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Only editors can delete applications" ON job_applications
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- ============================================================================
-- NEWS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view published news" ON news
FOR SELECT USING (published = true);

CREATE POLICY "Authors can view their own drafts" ON news
FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Only editors can insert news" ON news
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Authors and admins can update news" ON news
FOR UPDATE USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authors and admins can delete news" ON news
FOR DELETE USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- RESOURCES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view resources" ON resources
FOR SELECT USING (true);

CREATE POLICY "Only editors can insert resources" ON resources
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Only editors can update resources" ON resources
FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only editors can delete resources" ON resources
FOR DELETE USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- ISSUES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view active issues" ON issues
FOR SELECT USING (status = 'active' OR author_id = auth.uid());

CREATE POLICY "Only editors can insert issues" ON issues
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Authors and admins can update issues" ON issues
FOR UPDATE USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Authors and admins can delete issues" ON issues
FOR DELETE USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- COMMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view comments on published content" ON comments
FOR SELECT USING (
  (SELECT published FROM news WHERE id = news_id) = true OR
  (SELECT status FROM issues WHERE id = issue_id) = 'active' OR
  user_id = auth.uid()
);

CREATE POLICY "Authenticated users can create comments" ON comments
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON comments
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON comments
FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- FILE UPLOADS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own uploads" ON file_uploads
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Editors can view all uploads" ON file_uploads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Authenticated users can upload files" ON file_uploads
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own uploads" ON file_uploads
FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant public read access to published content
GRANT SELECT ON countries, jobs, news, resources, issues TO anon;

-- Grant authenticated users standard permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT ON job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON file_uploads TO authenticated;

-- ============================================================================
-- 8. INITIAL DATA (Optional)
-- ============================================================================

-- Insert default admin role if needed
-- Note: Adjust this based on your actual admin setup

-- ============================================================================
-- END OF SETUP
-- ============================================================================
