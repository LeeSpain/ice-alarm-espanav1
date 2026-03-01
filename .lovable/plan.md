

## Staff Rota, Holidays & Shift Cover Migration

### What exists
- The `staff_shifts`, `staff_holidays`, and `staff_shift_covers` tables do **not** exist yet
- The `annual_holiday_days` and `contracted_hours_per_week` columns are **not** on the `staff` table yet
- Both `pg_cron` and `pg_net` extensions are enabled

### Plan

**Step 1: Run sections 1–12 as a single migration**
Execute the full SQL (staff table columns, 3 new tables, triggers, indexes, views, functions, RLS policies, realtime) via the migration tool.

**Step 2: Run the cron job separately via the insert tool**
The cron section (13) uses `current_setting()` which won't resolve. I'll use the actual project URL and anon key directly in the `net.http_post` call, run via the insert tool (not migration) since it contains project-specific data.

**Step 3: Verify**
Query the new tables and views to confirm everything was created successfully.

### One concern
The SQL uses CHECK constraints on `shift_type`, `status`, and `end_date >= start_date`. These are simple enum/range checks and should work fine, though validation triggers would be more robust for future flexibility.

### No code changes needed
The existing hooks (`useStaffShifts.ts`, `useShiftCovers.ts`, `useStaffHolidays`) and components already reference these tables — they were built in anticipation of this schema. The `types.ts` file will auto-update after migration.

