

## SOS Response System — Phase 1: Database Foundation

### What will be created

**4 new tables:**
- `conference_rooms` — Twilio conference tracking per alert
- `conference_participants` — who's in each conference (member, staff, AI, emergency contact)
- `alert_escalations` — escalation chain tracking (levels 1–5)
- `isabella_assessment_notes` — AI triage observations and decisions

**4 new enums:**
- `participant_type`, `participant_join_method`, `escalation_target_type`, `isabella_note_type`

**2 extended tables:**
- `alerts` — adds `is_unresponsive`, `conference_id`, `accepted_by_staff_id`, `accepted_at`, `is_false_alarm`, `escalation_level_reached`
- `staff` — adds `personal_mobile`, `escalation_priority`, `is_on_call` (these columns already exist per the type definition, so those ALTERs will be no-ops via `IF NOT EXISTS`)

**RLS:** All new tables have SELECT policies restricted to authenticated staff via `is_staff()`.

### Potential issue
The `staff` table already has `personal_mobile`, `escalation_priority`, and `is_on_call` columns from the previous HR migration. The `ADD COLUMN IF NOT EXISTS` will skip them safely.

### Plan
1. Run sections 1–6 as a single migration
2. Verify tables and columns were created
3. Fix any TypeScript errors if the updated `types.ts` causes issues in existing hooks/components

