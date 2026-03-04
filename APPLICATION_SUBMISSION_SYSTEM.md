# Application Submission System Guide

## Overview
The application submission system has been redesigned to provide applicants with a clear, structured process for submitting their video interviews and required documents.

## How It Works

### 1. Application Submission (Careers Page)
- Applicants fill out the basic application form on `/careers/[slug]`
- They provide: name, email, phone, cover letter, and resume
- Upon successful submission:
  - Application record created in database with status "pending"
  - Submission deadline automatically set to 3 days from submission
  - Confirmation email sent with link to submission portal

### 2. Application Submission Portal (`/apply/[id]`)
Applicants receive an email with a link to their personalized submission portal. The portal shows:

**Application Details:**
- Applicant name
- Position applied for
- Submission deadline
- Status of submission

**Interview Questions (if configured):**
- Admins can add interview questions to job postings
- Questions are displayed on the submission portal
- Applicants see what they need to address in their video

**Submission Form:**
Three parts to complete:

1. **Video Interview**
   - URL to video on Loom.com or Google Drive
   - Platform selection (Loom, Google Drive, or direct link)
   - Applicant records 3-5 minute video addressing the interview questions

2. **Government ID**
   - Link to uploaded ID document
   - Can be from Google Drive, Dropbox, OneDrive, etc.
   - Required before application can be marked complete

3. **Educational Documents**
   - Multiple links to educational certificates
   - Supports diplomas, degrees, certifications
   - One link per line

### 3. Email Template
The confirmation email now includes:
- Clear explanation of the process
- What to address in the video interview (general intro and skills match)
- Requirements for ID and educational documents
- Direct link to the submission portal
- 3-day submission deadline
- Contact info for support

### 4. Application Tracking
**Before Submission:**
- Status: "pending"
- Application visible in admin dashboard

**After Video/Document Submission:**
- Status: automatically changed to "reviewing"
- `interview_submitted_at` timestamp recorded
- `documents_submitted_at` timestamp recorded
- Admin can view all submitted materials

## Setting Up Interview Questions

As an admin, you can add interview questions to jobs:

1. Go to `/setup/jobs/[id]` (edit job page)
2. Add interview questions in the form (if field is available)
3. These questions will appear on the applicant's submission portal
4. Questions should be specific to the role

### Example Interview Questions:
- "Tell us about your professional background and relevant experience"
- "Why are you interested in this position at UNEDF?"
- "Describe a project where you made a significant impact on economic development"
- "What skills do you have that match this role's requirements?"

## Database Changes

### job_applications table additions:
- `interview_video_url` - URL to the submitted video
- `interview_video_type` - Platform type (loom, google-drive, direct-link)
- `id_document_url` - URL to government ID
- `education_documents` - Array of links to educational documents
- `submission_deadline` - When materials are due (auto-set to 3 days)
- `interview_submitted_at` - When video was submitted
- `documents_submitted_at` - When documents were submitted

### jobs table additions:
- `interview_questions` - Array of questions for the position

## Admin Dashboard Updates

When viewing applications in the admin dashboard, admins can now see:
- Interview video link (with option to view)
- ID document link
- Educational documents links
- Interview submission timestamp
- Document submission status

## Email Flow

```
Applicant applies → Application created with deadline → Email sent with portal link
                    ↓
            Applicant visits portal
                    ↓
        Submits video and documents
                    ↓
            Status changed to "reviewing"
                    ↓
        Admin reviews materials and makes hiring decision
```

## Support

If applicants have questions during submission, they can contact:
- Email: careers@unoedp.org
- The submission portal provides a help contact section

## Future Enhancements

Potential improvements:
- Video playback directly in admin dashboard
- Document preview for PDFs
- Automated status updates via email
- Applicant notifications of interview stage changes
- One-way video interview questions from admin
