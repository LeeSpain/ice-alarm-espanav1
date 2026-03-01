

## Run Staff Schema Migration

### Overview
You've provided a comprehensive SQL migration to expand the `staff` table with HR fields, create `staff_documents` and `staff_activity_log` tables, add RLS policies, and set up a private storage bucket.

### One Concern: CHECK Constraints
The SQL uses CHECK constraints on `status`, `document_type`, and `action` columns. Per best practices, **validation triggers** are more reliable than CHECK constraints (which must be immutable and can cause restoration failures). However, since these are simple enum-like checks (not time-based), they should work fine in practice.

### What Will Be Executed
1. **Expand `staff` table** — add ~20 new columns (status, personal info, address, emergency contact, HR fields, avatar)
2. **Replace `is_active`** — convert from a regular column to a generated column based on `status = 'active'`
3. **Create `staff_documents` table** — with RLS (admin full access, staff read own)
4. **Create `staff_activity_log` table** — with RLS (admin full access, staff read own)
5. **Create `staff-documents` storage bucket** — private, with RLS for admin upload/delete and staff read-own
6. **Add trigger** — `update_staff_updated_at` for automatic timestamp updates

### Important Note
The `DROP COLUMN is_active` + re-add as generated column will fail if existing RLS policies or functions reference `is_active`. The existing `is_staff()` function uses `is_active = true` — this should still work with the generated column, but worth verifying after migration.

I'll run this migration now using the migration tool.

