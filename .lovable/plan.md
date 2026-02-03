
# Complete Email System Implementation Plan

## Current State Analysis

| Stage | Status | What Exists | What's Missing |
|-------|--------|-------------|----------------|
| **Stage 1** | ~90% | `email_settings` table, `EmailSettingsTab.tsx`, `useEmailSettings.ts` | `send-test-email` edge function |
| **Stage 2** | ~15% | DB columns for tokens exist | OAuth flow, Connect/Disconnect logic, token refresh |
| **Stage 3** | 0% | Nothing | `email_log` table, central `sendEmail()` function, Gmail API integration |
| **Stage 4** | 0% | Nothing | `inbound_email_log` table, sync edge function, inbox UI |
| **Stage 5** | 0% | Nothing | Routing rules, custom headers logic |
| **Stage 6** | 0% | Nothing | `email_templates` table, templates management UI |

---

## Stage 1: Complete Send Test Email

### Edge Function Creation

Create `supabase/functions/send-test-email/index.ts`:
- Fetch email settings from database
- Use Resend API with configured from_name/from_email
- Apply signature if configured
- Return success/error status

### Config Update

Add to `supabase/config.toml`:
```text
[functions.send-test-email]
verify_jwt = false
```

---

## Stage 2: Gmail OAuth Connection

### Important Note on Gmail OAuth

Gmail OAuth for sending and reading emails requires:
1. Google Cloud Console project with Gmail API enabled
2. OAuth 2.0 credentials (Client ID + Client Secret)
3. Verified OAuth consent screen

Since we're using Resend for email sending (already configured with `RESEND_API_KEY`), and full Gmail OAuth requires Google Cloud credentials that need to be configured by the admin, this stage will be implemented as:

**Option A (Recommended - Resend Mode):** Continue using Resend for sending emails. The "Connect Gmail" button will be replaced with a simpler configuration approach that doesn't require OAuth.

**Option B (Full Gmail OAuth):** Requires adding `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` secrets. Will implement the full OAuth flow.

### Implementation (Option A - Resend-based)

Since `RESEND_API_KEY` is already configured, I'll:
1. Update the UI to show "Email Service: Resend" as connected
2. Allow configuring from_email (must match verified Resend domain)
3. Hide the Gmail-specific OAuth UI elements
4. Keep the architecture extensible for future Gmail support

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/settings/EmailSettingsTab.tsx` | Show Resend as the connected provider, update UI messaging |
| `src/hooks/useEmailSettings.ts` | Add method to test Resend connection |

---

## Stage 3: Central Email Service

### Database: Create `email_log` Table

```text
email_log
├── id (uuid, PK)
├── to_email (text)
├── from_email (text)
├── subject (text)
├── body_html (text)
├── body_text (text, nullable)
├── module (text: 'member', 'outreach', 'support', 'system')
├── related_entity_id (uuid, nullable)
├── related_entity_type (text, nullable)
├── template_id (uuid, FK → email_templates, nullable)
├── status (text: 'pending', 'sent', 'failed', 'bounced')
├── provider_message_id (text, nullable) 
├── error_message (text, nullable)
├── headers_json (jsonb, nullable)
├── sent_at (timestamptz, nullable)
├── created_at (timestamptz)
```

### Edge Function: Create `send-email/index.ts`

Central email sending function that:
1. Checks email toggles (enable_member_emails, etc.)
2. Enforces hourly/daily send limits
3. Applies from_name, from_email, signature from settings
4. Adds custom headers (X-ICE-Module, X-ICE-Entity-ID)
5. Sends via Resend API
6. Logs to `email_log` table
7. Returns provider message ID

### Function Signature

```text
POST /send-email
{
  to: string,
  subject: string,
  html_body: string,
  text_body?: string,
  module: 'member' | 'outreach' | 'support' | 'system',
  related_entity_id?: string,
  related_entity_type?: string,
  template_id?: string,
  reply_to?: string,
  thread_id?: string,
  in_reply_to?: string
}

Response:
{
  success: boolean,
  message_id?: string,
  log_id?: string,
  error?: string
}
```

### Update Existing Edge Functions

Modify these functions to use the central email service:
- `partner-admin-create`
- `staff-register`
- `send-member-update-request`
- `stripe-webhook`
- `partner-send-invite`

---

## Stage 4: Inbound Email Sync

### Implementation Approach

Since we're using Resend (not Gmail) for sending, inbound email handling will be implemented using **Resend Webhooks** rather than Gmail inbox polling.

### Database: Create `inbound_email_log` Table

```text
inbound_email_log
├── id (uuid, PK)
├── from_email (text)
├── to_email (text)
├── subject (text)
├── body_snippet (text)
├── body_html (text, nullable)
├── provider_message_id (text)
├── provider_thread_id (text, nullable)
├── received_at (timestamptz)
├── module_matched (text, nullable)
├── linked_entity_id (uuid, nullable)
├── linked_entity_type (text, nullable)
├── is_reply (boolean)
├── original_email_log_id (uuid, FK → email_log, nullable)
├── processed_at (timestamptz, nullable)
├── created_at (timestamptz)
```

### Edge Function: Create `email-inbound-webhook/index.ts`

Webhook handler that:
1. Receives inbound email notifications
2. Parses headers to identify the original email (via X-ICE-* headers)
3. Links replies to outreach leads or member tickets
4. Stores in `inbound_email_log`
5. Triggers appropriate UI updates

### UI Updates

Add inbox display to:
- `OutreachInboxTab.tsx` - Show replies to outreach emails
- Member detail page - Show email correspondence

---

## Stage 5: Email Routing Rules

### Routing Logic

Implement in `send-email/index.ts`:

| Module | Headers Added | Purpose |
|--------|---------------|---------|
| `member` | `X-ICE-Module: member`, `X-ICE-Entity-ID: {member_id}` | Registration, welcome, verification |
| `outreach` | `X-ICE-Module: outreach`, `X-ICE-Entity-ID: {lead_id}` | AI Outreach campaigns |
| `support` | `X-ICE-Module: support`, `X-ICE-Entity-ID: {ticket_id}` | Support tickets |
| `system` | `X-ICE-Module: system` | Internal notifications |

### Inbound Matching Logic

In `email-inbound-webhook/index.ts`:
1. Check `In-Reply-To` and `References` headers
2. Look up original email in `email_log` by `provider_message_id`
3. Use the `module` and `related_entity_id` from original email
4. Link inbound to the same entity

---

## Stage 6: Email Templates

### Database: Create `email_templates` Table

```text
email_templates
├── id (uuid, PK)
├── slug (text, unique) 
├── name (text)
├── description (text, nullable)
├── module (text: 'member', 'outreach', 'support', 'system')
├── subject_en (text)
├── subject_es (text)
├── body_html_en (text)
├── body_html_es (text)
├── body_text_en (text, nullable)
├── body_text_es (text, nullable)
├── variables (jsonb) 
├── is_active (boolean)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

### Seed Default Templates

| Slug | Module | Purpose |
|------|--------|---------|
| `member-welcome` | member | Welcome email after registration |
| `member-verification` | member | Email verification |
| `member-password-reset` | member | Password reset request |
| `member-billing-notice` | member | Billing/payment notices |
| `support-ticket-created` | support | Support ticket confirmation |
| `outreach-intro` | outreach | Initial outreach email |
| `outreach-followup-1` | outreach | First follow-up |
| `outreach-followup-2` | outreach | Second follow-up |

### UI: Email Templates Management

Create new component `EmailTemplatesTab.tsx`:
- List all templates with module badges
- Edit template subject and body (EN/ES)
- Preview with sample variables
- Activate/deactivate templates

Add tab to Settings page under Communications.

### Hook: Create `useEmailTemplates.ts`

CRUD operations for email templates.

### Update `send-email/index.ts`

Add template rendering:
1. Accept optional `template_slug` and `variables`
2. Fetch template from database
3. Replace variables in subject and body
4. Support language-based template selection

---

## Files Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-test-email/index.ts` | Test email sending |
| `supabase/functions/send-email/index.ts` | Central email service |
| `supabase/functions/email-inbound-webhook/index.ts` | Inbound email handler |
| `src/hooks/useEmailTemplates.ts` | Templates CRUD hook |
| `src/components/admin/settings/EmailTemplatesTab.tsx` | Templates management UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/settings/EmailSettingsTab.tsx` | Update connection UI for Resend |
| `src/hooks/useEmailSettings.ts` | Add connection test method |
| `src/pages/admin/SettingsPage.tsx` | Add Templates tab |
| `supabase/functions/partner-admin-create/index.ts` | Use central email service |
| `supabase/functions/staff-register/index.ts` | Use central email service |
| `supabase/functions/send-member-update-request/index.ts` | Use central email service |
| `supabase/functions/stripe-webhook/index.ts` | Use central email service |
| `supabase/config.toml` | Add new function configs |

### Database Migrations

```sql
-- Stage 1: No DB changes needed

-- Stage 3: email_log table
CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  module text NOT NULL,
  related_entity_id uuid,
  related_entity_type text,
  template_id uuid,
  status text NOT NULL DEFAULT 'pending',
  provider_message_id text,
  error_message text,
  headers_json jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stage 4: inbound_email_log table  
CREATE TABLE public.inbound_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text,
  body_snippet text,
  body_html text,
  provider_message_id text,
  provider_thread_id text,
  received_at timestamptz NOT NULL,
  module_matched text,
  linked_entity_id uuid,
  linked_entity_type text,
  is_reply boolean DEFAULT false,
  original_email_log_id uuid REFERENCES email_log(id),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stage 6: email_templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  module text NOT NULL,
  subject_en text NOT NULL,
  subject_es text NOT NULL,
  body_html_en text NOT NULL,
  body_html_es text NOT NULL,
  body_text_en text,
  body_text_es text,
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Translation Keys to Add

```json
{
  "settings": {
    "email": {
      "title": "Email Settings",
      "provider": "Email Provider",
      "resendConnected": "Resend API Connected",
      "resendNotConnected": "Resend API Not Connected",
      "fromName": "From Name",
      "fromEmail": "From Email",
      "replyTo": "Reply-To Email",
      "signature": "Email Signature (HTML)",
      "dailyLimit": "Daily Send Limit",
      "hourlyLimit": "Hourly Send Limit",
      "memberEmails": "Member Emails",
      "outreachEmails": "Outreach Emails",
      "systemEmails": "System Emails",
      "testEmail": "Send Test Email",
      "testEmailSent": "Test email sent successfully",
      "testEmailFailed": "Failed to send test email",
      "saveSettings": "Save Email Settings",
      "settingsSaved": "Email settings saved"
    },
    "templates": {
      "title": "Email Templates",
      "subtitle": "Manage email templates used across the platform",
      "name": "Template Name",
      "slug": "Slug",
      "module": "Module",
      "subjectEn": "Subject (English)",
      "subjectEs": "Subject (Spanish)",
      "bodyEn": "Body (English)",
      "bodyEs": "Body (Spanish)",
      "variables": "Available Variables",
      "preview": "Preview",
      "active": "Active",
      "inactive": "Inactive",
      "save": "Save Template",
      "saved": "Template saved"
    }
  }
}
```

---

## Done Criteria Checklist

### Stage 1
- [ ] `send-test-email` edge function created
- [ ] Test email sends successfully from UI
- [ ] Uses configured from_name and from_email

### Stage 2
- [ ] Connection status shows correctly
- [ ] UI explains Resend is the email provider
- [ ] From email validation for Resend domain

### Stage 3
- [ ] `email_log` table created with RLS
- [ ] `send-email` central function works
- [ ] All existing email functions migrated
- [ ] Send limits enforced
- [ ] All emails logged

### Stage 4
- [ ] `inbound_email_log` table created
- [ ] Inbound webhook receives emails
- [ ] Replies linked to original emails
- [ ] Replies display in Outreach inbox

### Stage 5
- [ ] Custom headers added to all outbound emails
- [ ] Routing correctly identifies module
- [ ] Inbound emails linked to correct entities

### Stage 6
- [ ] `email_templates` table created
- [ ] Default templates seeded
- [ ] Template management UI works
- [ ] Templates support variables
- [ ] EN/ES language versions work

---

## Implementation Order

1. **Stage 1** - Create `send-test-email` function (quick win)
2. **Stage 2** - Update UI for Resend provider display
3. **Stage 6** - Create templates system (needed by Stage 3)
4. **Stage 3** - Create central email service with templates
5. **Stage 5** - Add routing headers (part of Stage 3)
6. **Stage 4** - Inbound email handling (after outbound works)

This order ensures each stage builds on the previous, and templates are available before the central service needs them.
