

# Fully Automated AI Outreach Pipeline

## Overview

Build a working end-to-end B2B outreach pipeline on top of the existing outreach tables and UI. The system will discover, enrich, rate, draft, send, track replies, and follow up -- all automatically or on-demand via admin controls.

## Current State (What Already Exists)

**Database tables:** `outreach_raw_leads`, `outreach_crm_leads`, `outreach_campaigns`, `outreach_email_drafts`, `outreach_email_threads`, `outreach_settings`, `outreach_queued_tasks`, `outreach_daily_usage`

**Edge functions:** `rate-outreach-leads` (AI scoring), `send-email` (Gmail/Resend with module routing), `email-inbound-webhook` (inbound reply handling)

**UI:** 6-tab outreach page (Leads, CRM, Campaigns, Inbox, Analytics, Settings) with lead table, basic kanban, caps widget, and settings panel

**Missing pieces:** No enrichment, no draft generation, no automated sending, no follow-up runner, no pipeline scheduler, no suppression list, no run logs, no control panel with automation toggles, limited analytics (hardcoded zeros), CRM has no drag-drop or expanded pipeline stages

---

## Phase 1: Database Schema Extensions

### 1a. Extend `outreach_raw_leads`
Add columns for enrichment data, compliance, and campaign linkage:
- `campaign_id` UUID references outreach_campaigns(id) -- missing from actual schema despite being used in code
- `enrichment_data` JSONB -- website scrape results (description, services, contacts, etc.)
- `enriched_at` TIMESTAMPTZ
- `domain` TEXT -- extracted from website/email for dedup
- `do_not_contact` BOOLEAN default false
- `unsubscribe_token` TEXT default gen_random_uuid()

### 1b. Extend `outreach_crm_leads`
Add fields for the expanded pipeline:
- `do_not_contact` BOOLEAN default false
- `unsubscribe_token` TEXT default gen_random_uuid()
- `lawful_basis` TEXT default 'legitimate_interest'
- `next_followup_at` TIMESTAMPTZ
- `followup_count` INTEGER default 0
- `bounce_count` INTEGER default 0

### 1c. Extend `outreach_email_drafts`
- `approval_required` BOOLEAN default true
- `auto_approved` BOOLEAN default false
- `draft_type` TEXT default 'initial' -- initial, followup

### 1d. Extend `outreach_campaigns`
- `messaging_tone` TEXT default 'professional' -- referenced in rate-outreach-leads but missing

### 1e. New table: `outreach_run_logs`
- `id` UUID PK
- `run_type` TEXT (full_pipeline, discover, enrich, rate, draft, send, followup)
- `started_at` TIMESTAMPTZ default now()
- `finished_at` TIMESTAMPTZ
- `steps` JSONB -- per-step counts and timing
- `totals` JSONB -- summary counts
- `errors` JSONB
- `dry_run` BOOLEAN default false
- `triggered_by` TEXT (manual, scheduler)
- `created_at` TIMESTAMPTZ default now()

### 1f. New table: `outreach_suppression`
- `id` UUID PK
- `email` TEXT unique not null
- `domain` TEXT
- `reason` TEXT (bounce, unsubscribe, dnc, invalid)
- `source` TEXT (webhook, manual, system)
- `created_at` TIMESTAMPTZ default now()

### 1g. Extend `outreach_settings` (insert new rows)
Add pipeline automation settings:
- `auto_discovery_enabled` (value: false)
- `auto_enrichment_enabled` (value: false)
- `auto_rating_enabled` (value: false)
- `auto_drafting_enabled` (value: false)
- `auto_sending_enabled` (value: false)
- `auto_followup_enabled` (value: false)
- `target_industries` (value: [])
- `target_locations` (value: ["Spain"])
- `target_keywords` (value: [])
- `exclusion_rules` (value: [])
- `daily_send_limit` (value: 20)
- `warmup_mode` (value: true)
- `min_score_to_send` (value: 60)
- `followup_schedule` (value: [2, 5, 10])
- `sender_name` (value: "ICE Alarm Espana")
- `sender_email` (value: "")
- `sender_signature` (value: "")
- `dry_run_mode` (value: true)

RLS: Staff can read, admins can update (same pattern as existing).

---

## Phase 2: Edge Functions (8 new/updated)

### 2a. `outreach-enrich-lead` (NEW)
- Input: `{ lead_id }` or `{ enrich_all_unenriched: true }`
- Uses Lovable AI (`google/gemini-3-flash-preview`) to analyze the lead's website URL
- Extracts: description, services, location, contact emails, decision-maker hints
- Saves enrichment_data JSONB + sets enriched_at
- Respects `max_ai_research_per_day` cap
- Logs to outreach_daily_usage

### 2b. `outreach-rate-leads` (UPDATE existing `rate-outreach-leads`)
- Change scoring to 0-100 scale (from 1-5)
- Add "recommended_next_step" to AI output
- Rate only enriched leads (enriched_at IS NOT NULL, ai_score IS NULL)
- Auto-queue for drafting if score >= threshold

### 2c. `outreach-generate-drafts` (NEW)
- Input: `{ lead_ids }` or `{ draft_all_qualified: true }`
- For each qualified CRM lead without a draft, generate personalized email
- Uses Lovable AI with ICE Alarm branding context
- Incorporates enrichment data + campaign settings (tone, goal, language)
- Creates `outreach_email_drafts` rows with status='draft' or 'approved' (if auto-approve enabled)
- Respects `max_ai_emails_per_day` cap
- Adds unsubscribe footer automatically

### 2d. `outreach-send-email` (NEW)
- Input: `{ draft_ids }` or `{ send_all_approved: true }`
- Checks suppression list before sending
- Calls existing `send-email` function internally (or duplicates its logic) with module='outreach'
- Updates draft status to 'sent', sets sent_at, stores external_message_id
- Creates outreach_email_threads entry
- Updates CRM lead status to 'contacted', sets last_contacted_at
- Increments campaign emails_sent counter
- Respects daily_send_limit + warmup_mode
- Supports dry_run mode (logs but doesn't actually send)

### 2e. `outreach-followup-runner` (NEW)
- Finds CRM leads where: status='contacted' AND next_followup_at <= now() AND NOT do_not_contact AND followup_count < max_emails_per_lead
- Generates follow-up draft using AI (different tone from initial)
- Sends if auto-sending enabled, otherwise marks for approval
- Stops if lead replied/DNC/bounced

### 2f. `outreach-pipeline-runner` (NEW)
- Master orchestrator that runs pipeline steps in order:
  1. Discover (if enabled -- placeholder, manual/CSV only for now)
  2. Enrich unenriched leads
  3. Rate unrated enriched leads
  4. Draft for qualified leads
  5. Send approved drafts
  6. Run follow-ups
- Writes a run log to `outreach_run_logs`
- Each step checks its automation toggle before executing
- Returns full run summary

### 2g. Update `email-inbound-webhook`
- When a reply matches an outreach email, also update the `outreach_crm_leads` status to 'replied'
- Set last_reply_at
- Create crm_event
- Clear any pending follow-ups

### 2h. `outreach-unsubscribe` (NEW, verify_jwt=false)
- Public endpoint: `?token=UUID`
- Looks up lead by unsubscribe_token
- Sets do_not_contact=true
- Adds email to outreach_suppression
- Returns a simple HTML "You have been unsubscribed" page

---

## Phase 3: UI Enhancements

### 3a. Outreach Control Panel (new tab or section in Settings)
Replace/extend the existing Settings tab with:
- **Automation Toggles**: 6 switches (auto-discovery through auto-followup)
- **Pipeline Settings**: Target industries, locations, keywords, exclusions
- **Send Settings**: Daily limit, warmup mode, min score, follow-up schedule
- **Sender Identity**: Name, email, signature
- **Test Mode**: Dry run toggle
- **Action Buttons**: "Discover Now", "Enrich Now", "Rate Now", "Draft Now", "Send Approved", "Run Full Pipeline"
- Each button calls the corresponding edge function and shows progress/results

### 3b. Enhanced CRM/Pipeline View
Expand the kanban from 6 columns to 12 stages:
Discovered | Enriched | Rated | Drafted | Approved | Sent | Replied | Interested | Meeting Booked | Converted | Not Interested | DNC/Bounced

Each card shows company name, score, last action. Clicking opens a lead detail dialog.

### 3c. Lead Detail Dialog
When clicking a CRM lead card, show:
- Company info, website, contacts
- Enrichment summary
- Score + reasoning
- Draft history (all emails in thread)
- Follow-up schedule
- Action buttons: Approve & Send, Mark DNC, Regenerate Draft, Convert to CRM Contact

### 3d. Live Analytics
Replace hardcoded zeros in OutreachAnalyticsTab with real queries:
- Leads discovered (count from outreach_raw_leads)
- Leads qualified (count from outreach_crm_leads)
- Emails sent (from outreach_email_drafts where status='sent')
- Replies received (from outreach_email_threads where direction='inbound')
- Conversions (from outreach_crm_leads where status='converted')
- Run logs table showing recent pipeline runs

### 3e. Run Pipeline Button
Add a prominent "Run Full Pipeline Now" button to the outreach page header. When clicked:
- Calls `outreach-pipeline-runner`
- Shows a progress dialog with step-by-step updates
- Displays results summary (discovered, enriched, rated, drafted, sent, errors)

---

## Phase 4: Translations

Add all new UI strings to both `en.json` and `es.json` covering:
- Pipeline stage names (12 stages)
- Control panel labels and descriptions
- Action button labels
- Lead detail dialog labels
- Analytics metric labels
- Run log display strings
- Error and success messages

---

## Phase 5: Compliance

- Every outreach email includes an unsubscribe link at the bottom
- Suppression list checked before every send
- DNC flag prevents all future contact
- Lawful basis stored per lead (default: legitimate_interest)
- Unsubscribe tokens auto-generated per lead

---

## Files Summary

| Action | File |
|--------|------|
| **Migration** | Schema extensions (7 ALTER TABLEs + 2 CREATE TABLEs + INSERT settings) |
| **New Edge Function** | `supabase/functions/outreach-enrich-lead/index.ts` |
| **New Edge Function** | `supabase/functions/outreach-generate-drafts/index.ts` |
| **New Edge Function** | `supabase/functions/outreach-send-email/index.ts` |
| **New Edge Function** | `supabase/functions/outreach-followup-runner/index.ts` |
| **New Edge Function** | `supabase/functions/outreach-pipeline-runner/index.ts` |
| **New Edge Function** | `supabase/functions/outreach-unsubscribe/index.ts` |
| **Update Edge Function** | `supabase/functions/rate-outreach-leads/index.ts` |
| **Update Edge Function** | `supabase/functions/email-inbound-webhook/index.ts` |
| **Update Config** | `supabase/config.toml` (add verify_jwt=false for new functions) |
| **New Hook** | `src/hooks/useOutreachPipeline.ts` (pipeline runner + settings) |
| **New Component** | `src/components/admin/outreach/OutreachControlPanel.tsx` |
| **New Component** | `src/components/admin/outreach/OutreachLeadDetailDialog.tsx` |
| **New Component** | `src/components/admin/outreach/PipelineRunDialog.tsx` |
| **Rewrite** | `src/components/admin/outreach/OutreachCRMTab.tsx` (12-stage kanban) |
| **Rewrite** | `src/components/admin/outreach/OutreachAnalyticsTab.tsx` (live data) |
| **Update** | `src/components/admin/outreach/OutreachSettingsTab.tsx` (add control panel) |
| **Update** | `src/pages/admin/AIOutreachPage.tsx` (add Run Pipeline button + Control tab) |
| **Update** | `src/hooks/useOutreachRawLeads.ts` (enrichment mutations) |
| **Update** | `src/hooks/useOutreachCRMLeads.ts` (expanded statuses) |
| **Update** | `src/i18n/locales/en.json` |
| **Update** | `src/i18n/locales/es.json` |

## Implementation Order

Due to the massive scope, this will be implemented in batches:
1. Database migration (all schema changes at once)
2. Edge functions (enrich, rate update, generate-drafts, send-email, followup, pipeline-runner, unsubscribe)
3. New hooks and control panel UI
4. Enhanced CRM kanban + lead detail dialog
5. Live analytics
6. Translations
7. Config updates

## Important Notes

- The system uses Lovable AI (LOVABLE_API_KEY, already configured) for enrichment, rating, and draft generation
- Email sending uses the existing `send-email` edge function infrastructure (Gmail SMTP or Resend)
- The `outreach-pipeline-runner` is the master orchestrator -- calling it runs the entire pipeline
- Dry run mode is ON by default for safety
- Warmup mode starts with low send volume
- No external lead discovery API is integrated initially -- leads come from manual entry and CSV import

