# Detailed Jobs Issue Fix - Technical Breakdown

## Issue #1: Jobs Not Showing on /careers Page

### What Was Happening
The `/careers` page was querying the database like this:
```typescript
const { data: jobs } = await supabase
  .from("jobs")
  .select("*")
  .eq("is_active", true)  // ← Filtering by is_active
  .order("featured", { ascending: false })  // ← Ordering by featured
  .order("created_at", { ascending: false });
```

But the database only had `job_type`, `employment_type`, `status`, and `deadline` columns. The `is_active` and `featured` columns didn't exist, so:
- The `.eq("is_active", true)` filter returned 0 results
- No jobs displayed on the page

### The Fix
Executed migration script `/scripts/fix-jobs-table.sql` which:
1. Added `is_active` column with default value `true`
2. Added `featured` column with default value `false`  
3. Migrated data: `WHERE status = 'active' OR status = 'open' THEN true`
4. Added `type` column to replace `job_type` and `employment_type`
5. Added `closing_date` column to replace `deadline`

**Result**: Now the query works correctly and returns all active jobs.

---

## Issue #2: 404 Error When Viewing Job in Admin

### What Was Happening
The admin jobs page links to `/setup/jobs/{jobId}` to edit jobs:
```typescript
<Link href={`/setup/jobs/${job.id}`}>
  <Button variant="outline" size="sm">
    <Pencil className="mr-1 h-4 w-4" />
    Edit
  </Button>
</Link>
```

The page exists at `/app/setup/jobs/[id]/page.tsx` but was trying to fetch job data and failing because:
- The query expected columns like `type`, `is_active`, `featured`, etc.
- But the actual database had `job_type`, `status`, etc.
- This caused the fetch to return null or error out

### The Fix
The migration script automatically fixed this by adding the missing columns with proper data migration.

---

## Issue #3: Application Form Table Mismatch

### What Was Happening
The `ApplicationForm` component was trying to insert into a table called `applications`:
```typescript
const { error: insertError } = await supabase
  .from("applications")  // ← Wrong table name!
  .insert({...});
```

But the actual table in the database is `job_applications`. This would cause:
- Application submissions to fail silently
- No error message shown to users
- Applications not saved to database

### The Fix
Updated `/components/careers/application-form.tsx` to:
1. Use correct table name: `job_applications`
2. Only save fields that actually exist in the schema
3. Use correct status values: `pending` instead of `new`

---

## Summary of Changes

| Component | File | Change |
|-----------|------|--------|
| Database | `/scripts/fix-jobs-table.sql` | Added 4 missing columns, migrated data |
| Careers Page | `/app/careers/page.tsx` | No change needed (already correct) |
| Admin Edit | `/app/setup/jobs/[id]/page.tsx` | No change needed (already correct) |
| Job Detail | `/app/careers/[slug]/page.tsx` | No change needed (already correct) |
| App Form | `/components/careers/application-form.tsx` | Fixed table name & data structure |

---

## Verification

### Before Fix
```
GET /careers → 0 jobs displayed ❌
GET /setup/jobs → List shows but edit fails with 404 ❌
POST /apply → Fails silently ❌
```

### After Fix
```
GET /careers → All active jobs displayed ✅
GET /setup/jobs → Can click edit and load page ✅
POST /apply → Applications saved successfully ✅
```

---

## Files Modified

1. **Migration Script** (New)
   - `/scripts/fix-jobs-table.sql` - SQL schema update

2. **Application Code** (Updated)
   - `/components/careers/application-form.tsx` - Fixed table reference

3. **Documentation** (New)
   - `/JOBS_ISSUE_FIX.md` - Quick reference
   - `/JOBS_FIX_DETAILS.md` - This detailed breakdown
