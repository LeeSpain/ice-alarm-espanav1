## Goal

Produce `docs/TECHNICAL_SPEC.md` — a single exhaustive reference document covering every route, table, edge function, integration, Isabella AI rule, key flow, and scheduled job currently in the codebase, with file-path citations for every item so a rebuild can be diff-checked against it.

## Approach

Because the codebase is very large (100+ tables, 100+ edge functions, ~80 pages across 5 portals), I will fan out read-only research agents in parallel, each owning one section. Each agent returns a structured markdown block with citations. I then assemble the final document, normalize formatting, and write the single file.

## Research fan-out (parallel subagents)

1. **Routes & pages** — Walk `src/App.tsx` and `src/pages/**`. For every route: path, portal, component file, purpose, data sources (hooks/queries), user actions (buttons, mutations, navigations). Grouped by portal: Public, Auth, Client/Member, Partner, Call-Centre/Staff, Admin.

2. **Database tables** — For each of the ~105 tables in `<supabase-tables>`: query schema via `supabase--read_query` against `information_schema` + `pg_policies`. Output: purpose (inferred from name + usage), column list with types, FKs, RLS policies, GRANTs. Group by domain (Core, CRM, Partner, AI/SOS, Media, Staff, Outreach, Billing).

3. **Edge functions** — List `supabase/functions/*/index.ts`, read each. For each function: trigger (HTTP/cron/webhook), purpose, inputs, outputs, external services called (Twilio, Stripe, Mollie, Resend, Gmail, Lovable AI, Facebook, YouTube, Meta), secrets used, `verify_jwt` setting from `config.toml`.

4. **Integrations** — Deep-dive doc per integration:
   - Twilio: voice-handler, twilio-voice wrapper, twilio-outbound, twilio-call-me, conference (sos-conference-*), SMS, WhatsApp (Isabella alerts), numbers/credentials storage.
   - Stripe: create-checkout, stripe-webhook, subscription lifecycle.
   - Mollie: create-mollie-checkout, mollie-webhook, cancel-mollie-subscription.
   - Email: Gmail SMTP via `_shared/email.ts`, Resend, branded auth-email-hook, templates, `email-assets` bucket.
   - Facebook/social: facebook-publish, media pipeline.
   - EV-07B pendant: ev07b-checkin, ev07b-stock-sync, GPS gateway (`gps-gateway/`), render-worker.
   - Isabella AI: ai-run, ai_agents table, isabella_settings, function mapping, voice context injection.
   - Google OAuth, YouTube publishing, Firebase push, Sentry.

5. **Isabella AI** — From `ai_agents` rows (live query), `isabella_settings` (all 50 functions), `src/lib/isabella-function-config.ts`, agent system prompts, voice-handler logic, sos-false-alarm-resolve safety checks. Document: every agent (Isabel, Member Support Specialist, Main Brain, others), every one of the 50 capability toggles, hard rules / non-negotiables (verification rules, escalation triggers, what she must NEVER do — e.g. no medical decisions, no emergency-service dispatch, mandatory human handoff after 2 failed verifications, false-alarm safety gates).

6. **Key flows** — Step-by-step sequence diagrams (ASCII) with file refs for: member registration (`/join` wizard → drafts → checkout → webhook → member creation → device provisioning), device provisioning (EV-07B assignment, SIM, IMEI, gateway pairing), SOS flow (pendant SOS → ev07b-checkin → alert insert → realtime → voice-handler → sos-conference-create → Isabella triage → escalation chain levels 1-5 → emergency contact notification → resolution / false-alarm), billing/subscription (Stripe/Mollie monthly+annual, renewal, cancel, refund, commission trigger), partner referral (tracked link → attribution → signup → order delivered → commission pending_release → 7-day auto-approve cron).

7. **Scheduled jobs / cron** — Enumerate every `cron.schedule` entry via `supabase--read_query` on `cron.job`, plus any in migrations. For each: name, cron expression, target function, purpose. Known: staff-shift-monitor (*/2 min), process-commissions (daily), shift-daily-reminders, outreach pipeline jobs, expire_pending_covers.

## Document structure (docs/TECHNICAL_SPEC.md)

```text
1. Overview & architecture (stack, portals, auth model)
2. Routes & pages
   2.1 Public
   2.2 Auth
   2.3 Client/Member portal
   2.4 Partner portal
   2.5 Call-Centre/Staff portal
   2.6 Admin portal
3. Database schema
   3.1 Core operations
   3.2 CRM & communications
   3.3 Partner ecosystem
   3.4 AI & SOS response
   3.5 Staff & scheduling
   3.6 Media & video hub
   3.7 Outreach pipeline
   3.8 Billing & subscriptions
   3.9 Database functions & triggers
4. Edge functions (alphabetical, grouped by domain)
5. Integrations
   5.1 Twilio  5.2 Stripe  5.3 Mollie  5.4 Email (Gmail/Resend)
   5.5 Facebook/social  5.6 EV-07B + GPS gateway  5.7 Google/YouTube
   5.8 Firebase push  5.9 Sentry
6. Isabella AI
   6.1 Agents roster (with full system prompts referenced)
   6.2 50 capability toggles
   6.3 Hard rules / non-negotiables
   6.4 Escalation & verification protocol
   6.5 Voice context injection
7. Key flows (with ASCII sequence diagrams)
   7.1 Member registration  7.2 Device provisioning
   7.3 SOS/fall emergency end-to-end
   7.4 Billing & subscription lifecycle
   7.5 Partner referral & commission
8. Scheduled jobs / cron
9. Secrets & environment variables
10. Storage buckets
11. RLS & security model
12. Appendix: file-path index
```

Every item cites the source file (e.g. `src/pages/admin/MembersPage.tsx:42`, `supabase/functions/voice-handler/index.ts`, `supabase/migrations/20260302184156_*.sql`).

## Execution steps

1. Spawn 7 research agents in parallel (one per fan-out section above), each instructed to return markdown with citations and no prose padding.
2. Query Postgres for live cron jobs, table columns, and policies in parallel with the agents.
3. Assemble outputs into the structure above, deduplicate, normalize headings.
4. Write `docs/TECHNICAL_SPEC.md` in one shot.
5. Report final file size and section counts.

## Caveats

- Expect the final document to be very large (likely 80–150 KB). It is intended as a reference, not for reading top-to-bottom.
- Agent system prompts will be quoted from the live `ai_agents` table at write time; if you later edit them via the AI Command Centre the spec will drift.
- Spec reflects the codebase at time of generation; it is not auto-updated.
