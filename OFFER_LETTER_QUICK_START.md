# Offer Letter System - Quick Start Guide

## Access Offer Letters Admin

Go to: **https://unoedp.org/setup/offer-letters**

## 5-Minute Workflow

### Step 1: Create Offer (2 min)
1. Click **"Create Offer Letter"** button
2. Select applicant from dropdown (or enter manually)
3. Fill in basic details:
   - Job Title
   - Start Date
   - Acceptance Deadline
4. Click **"Create Offer Letter"**

### Step 2: Preview (1 min)
1. Click the **eye icon** to preview PDF
2. Verify formatting and details
3. Close preview

### Step 3: Send (2 min)
1. Click **"Send"** button
2. Customize email message (optional)
3. Click **"Send Offer Letter"**
4. Status changes to "sent"
5. Applicant receives email with signing link

### Step 4: Track (ongoing)
- Watch dashboard for status updates
- Status flows: Sent → Viewed → Signed → Downloaded

## Form Fields Explained

| Field | Required? | Notes |
|-------|-----------|-------|
| Applicant Name | Yes | Auto-fills if selected from dropdown |
| Email | Yes | Must be valid email |
| Job Title | Yes | Position name |
| Start Date | Yes | Use date picker |
| Deadline | Yes | Last day to accept (usually 10-14 days out) |
| Duration | Yes | e.g., "24 months" or "Until project end" |
| Reporting Station | No | Location/city |
| Grade Level | No | e.g., NO-2, P-3 |
| Salary Notes | No | Compensation details, benefits |
| Custom Clauses | No | Any special terms or conditions |

## Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| **Draft** | Created but not sent | Edit, Preview, Send |
| **Sent** | Email dispatched to applicant | Wait for response |
| **Viewed** | Applicant opened link | Monitor for signing |
| **Signed** | Applicant signed offer | Download PDF, process |
| **Downloaded** | Signed PDF downloaded | Archive |
| **Expired** | 10-day token expired | Can resend new offer |
| **Voided** | Admin cancelled offer | Create new if needed |

## Dashboard Filters

**Search:** Type applicant name, email, or position title

**Status Filter:** View Draft, Sent, Signed, Downloaded, etc.

**Date Filter:** Today, This Week, This Month, All Time

**Quick Stats:** Top cards show counts in each status

## Common Actions

### Preview PDF
- Click eye icon in dashboard or detail page
- Full formatting preview
- Download as HTML to save

### Send Offer to Applicant
- Go to detail page
- Click "Send" button
- Customize email (optional)
- Click "Send Offer Letter"
- Applicant receives with signing link

### Resend Offer
- Go to detail page
- Click "Send" again
- Generates new 10-day token
- Sends new email with fresh link

### Edit Offer Details
- Click the offer in dashboard
- Click "Edit" button
- Modify any fields
- Click "Save Changes"
- Note: Can only edit drafts easily; if sent, create new one

### Duplicate Offer
- Click copy icon in dashboard
- Creates exact copy as draft
- Modify details as needed
- Save and send

### Download Signed PDF
- Go to signed offer
- Click download icon
- PDF saved to computer
- Archive securely

### Void Offer (Cancel)
- Click trash icon
- Offer marked as "voided"
- Token becomes invalid
- Applicant cannot sign
- Must create new offer if needed

## Typical Timeline

| Day | Applicant | Admin | Status |
|-----|-----------|-------|--------|
| 0 | - | Creates & previews offer | Draft |
| 0 | - | Sends via email | Sent |
| 1-3 | Opens email & reviews | - | Viewed |
| 1-5 | Signs electronically | Monitors dashboard | Signed |
| 5 | Downloads confirmation | Downloads PDF | Downloaded |
| 6+ | - | Archives offer | Complete |

## Email Templates Sent

### 1. Initial Offer Email
**To:** Applicant email address  
**When:** Admin clicks "Send"  
**Contains:** Position summary, signing link, deadline  
**Action:** Applicant clicks link to sign  

### 2. Acceptance Confirmation
**To:** Applicant email  
**When:** Applicant signs offer  
**Contains:** Congratulations, next steps, HR contact  
**Action:** Applicant downloads signed copy  

### 3. Admin Notification (optional)
**To:** HR email (if configured)  
**When:** Applicant signs  
**Contains:** Signing details, timestamp, next steps  
**Action:** HR processes onboarding  

## Security Features

✓ **Unique Link:** Each offer has its own expiring link  
✓ **10-Day Expiry:** Link works for 10 days, then expires  
✓ **Consent Required:** Applicant must check acceptance box  
✓ **Signature Captured:** Full legal name, timestamp, IP address  
✓ **Audit Trail:** Every action logged for compliance  
✓ **No Access Without Token:** Can't see offer without email link  

## Troubleshooting

### Email not sending?
- Check RESEND_API_KEY in settings
- Verify applicant email is correct
- Check spam folder

### PDF preview blank?
- Check browser console (F12)
- Refresh page and try again
- Clear cache if persistent

### Applicant can't access signing link?
- Verify 10 days haven't passed
- Check link format (look for /offer/[token])
- Resend with new token

### Can't find an offer?
- Check filters - may be hidden by status/date filter
- Use search box with applicant name
- Reset filters to "All Status" and "All Time"

### Status not updating?
- Refresh dashboard page
- Check if offer is voided or expired
- Verify applicant completed signing process

## Tips for Best Results

### Before Creating
✓ Gather all employment details first  
✓ Confirm start date with hiring manager  
✓ Have compensation details ready  

### Before Sending
✓ Always preview PDF first  
✓ Check all names and dates carefully  
✓ Verify applicant email is correct  

### After Sending
✓ Note deadline in your calendar  
✓ Follow up 3-5 days before deadline  
✓ Check dashboard status daily  

### When Signed
✓ Download and archive signed PDF  
✓ Forward to HR for processing  
✓ Begin onboarding procedures  

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create new offer | /setup/offer-letters/new |
| Edit offer | /setup/offer-letters/[id] |
| Send offer | /setup/offer-letters/[id]/send |
| View all offers | /setup/offer-letters |

## Contact Support

**Questions about offers?** Email: careers@unoedp.org  
**Technical issues?** Contact admin  
**Need training?** Refer to OFFER_LETTER_SYSTEM_GUIDE.md  

---

## What Applicants See

Applicants receive an email with a button "Review & Sign Offer Letter" that takes them to a professional signing page where they can:

1. **Review** the full offer letter (formatted professionally)
2. **Download** unsigned PDF (if admin allows)
3. **Sign** by typing their name or drawing signature
4. **Accept** by checking consent box
5. **Receive** confirmation email with signed PDF

The entire process takes 2-3 minutes.

---

**Last Updated:** 2026-03-27  
**System Status:** ✓ Production Ready  
**Support:** See OFFER_LETTER_SYSTEM_GUIDE.md for detailed documentation
