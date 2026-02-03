
# AI Outreach Module - Complete Implementation Plan

## Overview

Create a new **AI Outreach** module as a standalone section under Admin → Communication, completely isolated from the Members CRM. This module enables automated lead discovery, AI-powered scoring, personalized outreach campaigns, and controlled email conversations.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN SIDEBAR                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Communication (existing group)                                              │
│       ├── Messages (/admin/messages)                                         │
│       ├── Media Manager (/admin/media-manager)                               │
│       └── AI Outreach (/admin/ai-outreach) ← NEW                            │
│               ├── Leads                                                      │
│               ├── CRM                                                        │
│               ├── Campaigns                                                  │
│               ├── Inbox                                                      │
│               └── Analytics                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE ISOLATION                                    │
├───────────────────────────────┬─────────────────────────────────────────────┤
│   MEMBERS CRM (existing)      │   AI OUTREACH (new - isolated)              │
├───────────────────────────────┼─────────────────────────────────────────────┤
│   • members                   │   • outreach_raw_leads                      │
│   • leads                     │   • outreach_crm_leads                      │
│   • crm_contacts              │   • outreach_campaigns                      │
│   • crm_profiles              │   • outreach_email_drafts                   │
│   • conversations             │   • outreach_email_threads                  │
│   • messages                  │   • outreach_settings                       │
├───────────────────────────────┴─────────────────────────────────────────────┤
│   ❌ NO CROSS-REFERENCES - Complete isolation                               │
│   ✅ Explicit conversion only via "Convert" action                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 0: Navigation & Module Structure

### Changes to AdminSidebar.tsx

Add "AI Outreach" as a new item under the "communications" group:

```typescript
// In menuGroups array, update id: "communications"
{
  id: "communications",
  icon: MessageSquare,
  labelKey: "sidebar.communications",
  items: [
    { icon: MessageSquare, labelKey: "sidebar.messages", path: "/admin/messages" },
    { icon: Share2, labelKey: "sidebar.mediaManager", path: "/admin/media-manager" },
    { icon: Megaphone, labelKey: "sidebar.aiOutreach", path: "/admin/ai-outreach" }  // NEW
  ]
}
```

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/AIOutreachPage.tsx` | Main page with tabbed navigation (Leads, CRM, Campaigns, Inbox, Analytics) |
| `src/components/admin/outreach/OutreachLeadsTab.tsx` | Raw leads management tab |
| `src/components/admin/outreach/OutreachCRMTab.tsx` | Qualified leads CRM pipeline |
| `src/components/admin/outreach/OutreachCampaignsTab.tsx` | Campaign management |
| `src/components/admin/outreach/OutreachInboxTab.tsx` | Email inbox view |
| `src/components/admin/outreach/OutreachAnalyticsTab.tsx` | Performance metrics |

### Route Addition in App.tsx

```typescript
// Add lazy import
const AIOutreachPage = lazy(() => import("./pages/admin/AIOutreachPage"));

// Add route under admin
<Route path="ai-outreach" element={<AIOutreachPage />} />
```

---

## Stage 1: Database Tables (Isolated Storage)

### Table 1: outreach_raw_leads

```sql
CREATE TABLE public.outreach_raw_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type TEXT NOT NULL DEFAULT 'sales' CHECK (pipeline_type IN ('sales', 'partner')),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  website_url TEXT,
  phone TEXT,
  location TEXT,
  category TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- AI Rating fields
  ai_score NUMERIC(2,1) CHECK (ai_score >= 1.0 AND ai_score <= 5.0),
  ai_reasoning TEXT,
  ai_rated_at TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'rejected')),
  
  -- Metadata
  raw_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_raw_leads_email ON public.outreach_raw_leads(email);
CREATE INDEX idx_outreach_raw_leads_pipeline ON public.outreach_raw_leads(pipeline_type);
CREATE INDEX idx_outreach_raw_leads_status ON public.outreach_raw_leads(status);
CREATE INDEX idx_outreach_raw_leads_created ON public.outreach_raw_leads(created_at DESC);

-- RLS
ALTER TABLE public.outreach_raw_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage outreach raw leads"
ON public.outreach_raw_leads FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_raw_leads;
```

### Table 2: outreach_crm_leads

```sql
CREATE TABLE public.outreach_crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_lead_id UUID REFERENCES public.outreach_raw_leads(id) ON DELETE SET NULL,
  
  -- Contact info (copied for independence)
  pipeline_type TEXT NOT NULL DEFAULT 'sales' CHECK (pipeline_type IN ('sales', 'partner')),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  website_url TEXT,
  phone TEXT,
  location TEXT,
  category TEXT,
  source TEXT NOT NULL,
  
  -- AI data
  ai_score NUMERIC(2,1),
  research_summary TEXT,
  personalization_hooks JSONB,
  assigned_ai_agent TEXT,
  
  -- Pipeline status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'interested', 'converted', 'closed')),
  
  -- Campaign tracking
  campaign_id UUID,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  email_count INTEGER DEFAULT 0,
  
  -- Conversion tracking (explicit only)
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_to_member_id UUID,
  converted_to_partner_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_crm_leads_email ON public.outreach_crm_leads(email);
CREATE INDEX idx_outreach_crm_leads_pipeline ON public.outreach_crm_leads(pipeline_type);
CREATE INDEX idx_outreach_crm_leads_status ON public.outreach_crm_leads(status);
CREATE INDEX idx_outreach_crm_leads_created ON public.outreach_crm_leads(created_at DESC);

-- RLS
ALTER TABLE public.outreach_crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage outreach CRM leads"
ON public.outreach_crm_leads FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_crm_leads;
```

### Table 3: outreach_campaigns

```sql
CREATE TABLE public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  pipeline_type TEXT NOT NULL DEFAULT 'sales' CHECK (pipeline_type IN ('sales', 'partner')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  
  -- Targeting
  target_categories TEXT[],
  target_locations TEXT[],
  min_ai_score NUMERIC(2,1) DEFAULT 3.5,
  
  -- Email sequence
  email_sequence JSONB DEFAULT '[]'::jsonb,
  days_between_emails INTEGER DEFAULT 3,
  max_emails_per_lead INTEGER DEFAULT 5,
  
  -- Stats
  leads_count INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage outreach campaigns"
ON public.outreach_campaigns FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));
```

### Table 4: outreach_email_drafts

```sql
CREATE TABLE public.outreach_email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_lead_id UUID NOT NULL REFERENCES public.outreach_crm_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
  
  -- Email content
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed')),
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  sequence_number INTEGER DEFAULT 1,
  external_message_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.outreach_email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage outreach email drafts"
ON public.outreach_email_drafts FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));
```

### Table 5: outreach_email_threads

```sql
CREATE TABLE public.outreach_email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_lead_id UUID NOT NULL REFERENCES public.outreach_crm_leads(id) ON DELETE CASCADE,
  
  -- Thread info
  subject TEXT NOT NULL,
  thread_id TEXT,
  
  -- Latest message
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  message_body TEXT NOT NULL,
  
  -- Classification (for inbound)
  ai_classification TEXT CHECK (ai_classification IN ('interested', 'question', 'not_interested', 'unsubscribe')),
  ai_suggested_reply TEXT,
  
  -- Status
  requires_action BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.outreach_email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage outreach email threads"
ON public.outreach_email_threads FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- Realtime for inbox
ALTER PUBLICATION supabase_realtime ADD TABLE public.outreach_email_threads;
```

### Settings Storage

Add to `system_settings` table:
- `outreach_min_score_threshold` (default: 3.5)

---

## Stage 2: Leads Page - Import/Search/Add

### Components to Create

| Component | Purpose |
|-----------|---------|
| `OutreachLeadsTab.tsx` | Main leads tab with table and filters |
| `AddOutreachLeadModal.tsx` | Manual lead entry form |
| `ImportLeadsModal.tsx` | CSV import + paste list functionality |
| `OutreachLeadFilters.tsx` | Filter controls (pipeline, status, source, score) |

### Features

1. **Manual Add** - Form with: company_name, contact_name, email, website_url, location, category, pipeline_type
2. **CSV Import** - Parse columns: company, contact, email, website, location, category, pipeline
3. **Paste List** - One line per lead: `company | email | website (optional)`
4. **Filters** - pipeline_type, status, source, ai_score range
5. **No email sending** - Raw leads cannot be emailed

### Hooks to Create

| Hook | Purpose |
|------|---------|
| `useOutreachRawLeads.ts` | CRUD for outreach_raw_leads table |
| `useOutreachImport.ts` | CSV parsing and bulk insert logic |

---

## Stage 3: AI Rating + Qualification Gate

### Components

| Component | Purpose |
|-----------|---------|
| `AIRatingControls.tsx` | "Rate Selected" and "Rate All New" buttons |
| `LeadScoreDisplay.tsx` | Star rating display with reasoning tooltip |
| `QualificationActions.tsx` | "Move to CRM" and "Reject" buttons |

### Edge Function

```typescript
// supabase/functions/outreach-ai-rate/index.ts
// Input: Lead data (company, website, category, location, pipeline_type)
// Output: { score: 1.0-5.0, reasoning: "1-3 lines" }
```

### Qualification Flow

1. Admin sets `outreach_min_score_threshold` in settings (default 3.5)
2. "Rate Selected" / "Rate All New" triggers AI scoring
3. AI returns score (1.0-5.0) + reasoning
4. "Move Qualified to CRM" button:
   - Filters leads where `ai_score >= threshold`
   - Creates records in `outreach_crm_leads`
   - Updates raw lead `status = 'qualified'`
5. "Reject Lead" sets `status = 'rejected'`

---

## Stage 4: Research Agent + Email Drafts

### Components

| Component | Purpose |
|-----------|---------|
| `OutreachCRMTab.tsx` | Kanban-style pipeline view |
| `CRMLeadCard.tsx` | Individual lead card with actions |
| `LeadDetailDrawer.tsx` | Full lead details + research + drafts |
| `ResearchSummaryCard.tsx` | Display research + personalization hooks |
| `EmailDraftEditor.tsx` | Compose/edit email drafts |

### Edge Functions

```typescript
// supabase/functions/outreach-research/index.ts
// Input: { website_url, company_name, category }
// Output: { research_summary, personalization_hooks: { hook1, hook2, hook3 } }

// supabase/functions/outreach-generate-email/index.ts
// Input: { lead_data, pipeline_type, research_summary, personalization_hooks }
// Output: { subject, body_text }
// - sales: customer-focused, reassurance, safety benefits
// - partner: professional opportunity, commission structure
// - Always includes opt-out line
```

### CRM Pipeline Columns

| Column | Description |
|--------|-------------|
| New | Qualified leads, not yet contacted |
| Contacted | First email sent |
| Replied | Received a response |
| Interested | Positive engagement |
| Converted | Moved to Members CRM |
| Closed | Not interested / unsubscribed |

---

## Stage 5: Inbox + AI Reply Assistant

### Components

| Component | Purpose |
|-----------|---------|
| `OutreachInboxTab.tsx` | Email threads view |
| `ThreadList.tsx` | List of conversations |
| `ThreadDetail.tsx` | Individual thread with messages |
| `AIReplyAssistant.tsx` | Suggested reply with approve/edit/send |

### Features

1. **Thread View** - Outbound and inbound messages per lead
2. **AI Classification** - Classify inbound as: interested, question, not_interested, unsubscribe
3. **AI Suggested Reply** - Draft response based on classification
4. **Approval-First** - All replies require manual send (no auto-send)
5. **Status Update** - Auto-update `outreach_crm_leads.status` based on reply type

### Edge Function

```typescript
// supabase/functions/outreach-classify-reply/index.ts
// Input: { inbound_message, conversation_history }
// Output: { classification, suggested_reply }
```

---

## Stage 6: Conversion Bridge

### Conversion Actions

In CRM Lead Detail, add "Convert" dropdown with:
- **Convert to Member** → Creates record in `members` table
- **Convert to Partner** → Creates record in `partners` table

### Conversion Logic

```typescript
async function convertToMember(outreachLeadId: string) {
  // 1. Get outreach CRM lead data
  const lead = await getOutreachCRMLead(outreachLeadId);
  
  // 2. Create member record
  const member = await createMember({
    first_name: lead.contact_name?.split(' ')[0],
    last_name: lead.contact_name?.split(' ').slice(1).join(' '),
    email: lead.email,
    phone: lead.phone,
    source: 'ai_outreach',
    outreach_lead_id: lead.id
  });
  
  // 3. Update outreach lead
  await updateOutreachCRMLead(outreachLeadId, {
    status: 'converted',
    converted_at: new Date().toISOString(),
    converted_to_member_id: member.id
  });
}
```

### Database Changes

Add columns to `members` table:
- `source TEXT DEFAULT 'website'` (values: 'website', 'admin', 'partner', 'ai_outreach')
- `outreach_lead_id UUID` (nullable, references outreach_crm_leads.id)

---

## Translation Keys

Add to `en.json` and `es.json`:

```json
"outreach": {
  "title": "AI Outreach",
  "subtitle": "Automated lead discovery and outreach campaigns",
  "tabs": {
    "leads": "Leads",
    "crm": "CRM",
    "campaigns": "Campaigns",
    "inbox": "Inbox",
    "analytics": "Analytics"
  },
  "leads": {
    "title": "Raw Leads",
    "subtitle": "Discovered leads awaiting AI rating",
    "addLead": "Add Lead",
    "importLeads": "Import Leads",
    "pasteList": "Paste List",
    "rateSelected": "Rate Selected",
    "rateAllNew": "Rate All New",
    "moveQualified": "Move Qualified to CRM",
    "rejectLead": "Reject",
    "columns": {
      "company": "Company",
      "contact": "Contact",
      "email": "Email",
      "website": "Website",
      "location": "Location",
      "category": "Category",
      "pipeline": "Pipeline",
      "score": "AI Score",
      "status": "Status",
      "source": "Source"
    },
    "status": {
      "new": "New",
      "qualified": "Qualified",
      "rejected": "Rejected"
    },
    "pipeline": {
      "sales": "Sales",
      "partner": "Partner"
    },
    "sources": {
      "manual": "Manual",
      "csv_import": "CSV Import",
      "paste_list": "Paste List",
      "scrape": "Web Scrape"
    },
    "import": {
      "title": "Import Leads",
      "csvTab": "CSV Upload",
      "pasteTab": "Paste List",
      "pasteInstructions": "One lead per line: company | email | website (optional)",
      "csvInstructions": "Upload a CSV file with columns: company, contact, email, website, location, category, pipeline",
      "importButton": "Import",
      "importing": "Importing..."
    },
    "noLeads": "No leads found",
    "loading": "Loading leads..."
  },
  "crm": {
    "title": "Outreach CRM",
    "subtitle": "Manage qualified leads through your pipeline",
    "columns": {
      "new": "New",
      "contacted": "Contacted",
      "replied": "Replied",
      "interested": "Interested",
      "converted": "Converted",
      "closed": "Closed"
    },
    "actions": {
      "research": "Research Business",
      "generateEmail": "Generate Intro Email",
      "sendEmail": "Send Email",
      "convert": "Convert",
      "close": "Close Lead"
    },
    "convert": {
      "toMember": "Convert to Member",
      "toPartner": "Convert to Partner",
      "success": "Lead converted successfully",
      "error": "Failed to convert lead"
    },
    "research": {
      "title": "Business Research",
      "generating": "Researching...",
      "summary": "Summary",
      "hooks": "Personalization Hooks"
    },
    "email": {
      "title": "Email Draft",
      "generating": "Generating...",
      "subject": "Subject",
      "body": "Body",
      "send": "Send Email",
      "approve": "Approve",
      "edit": "Edit"
    }
  },
  "campaigns": {
    "title": "Campaigns",
    "subtitle": "Create and manage outreach email campaigns",
    "newCampaign": "New Campaign",
    "noCampaigns": "No campaigns yet",
    "status": {
      "draft": "Draft",
      "active": "Active",
      "paused": "Paused",
      "completed": "Completed"
    }
  },
  "inbox": {
    "title": "Inbox",
    "subtitle": "View and respond to email conversations",
    "noThreads": "No conversations yet",
    "classification": {
      "interested": "Interested",
      "question": "Question",
      "not_interested": "Not Interested",
      "unsubscribe": "Unsubscribe"
    },
    "suggestedReply": "Suggested Reply",
    "sendReply": "Send Reply",
    "editReply": "Edit"
  },
  "analytics": {
    "title": "Analytics",
    "subtitle": "Track outreach performance metrics",
    "metrics": {
      "leadsDiscovered": "Leads Discovered",
      "leadsQualified": "Leads Qualified",
      "emailsSent": "Emails Sent",
      "repliesReceived": "Replies Received",
      "conversions": "Conversions"
    }
  },
  "settings": {
    "minScore": "Minimum Qualification Score",
    "minScoreDesc": "Only leads rated at or above this score can be moved to CRM"
  },
  "rating": {
    "success": "Leads rated successfully",
    "error": "Failed to rate leads",
    "noLeadsToRate": "No leads to rate"
  }
}
```

Spanish translations to be added to `es.json` with equivalent keys.

---

## Files Summary

### New Files to Create

| Category | Files |
|----------|-------|
| **Pages** | `src/pages/admin/AIOutreachPage.tsx` |
| **Components** | `src/components/admin/outreach/OutreachLeadsTab.tsx`<br>`src/components/admin/outreach/OutreachCRMTab.tsx`<br>`src/components/admin/outreach/OutreachCampaignsTab.tsx`<br>`src/components/admin/outreach/OutreachInboxTab.tsx`<br>`src/components/admin/outreach/OutreachAnalyticsTab.tsx`<br>`src/components/admin/outreach/AddOutreachLeadModal.tsx`<br>`src/components/admin/outreach/ImportLeadsModal.tsx`<br>`src/components/admin/outreach/CRMLeadCard.tsx`<br>`src/components/admin/outreach/LeadDetailDrawer.tsx`<br>`src/components/admin/outreach/EmailDraftEditor.tsx` |
| **Hooks** | `src/hooks/useOutreachRawLeads.ts`<br>`src/hooks/useOutreachCRMLeads.ts`<br>`src/hooks/useOutreachCampaigns.ts`<br>`src/hooks/useOutreachInbox.ts`<br>`src/hooks/useOutreachAI.ts` |
| **Edge Functions** | `supabase/functions/outreach-ai-rate/index.ts`<br>`supabase/functions/outreach-research/index.ts`<br>`supabase/functions/outreach-generate-email/index.ts`<br>`supabase/functions/outreach-classify-reply/index.ts` |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/AdminSidebar.tsx` | Add AI Outreach nav item under Communications |
| `src/App.tsx` | Add route for `/admin/ai-outreach` |
| `src/i18n/locales/en.json` | Add outreach translations (~100 keys) |
| `src/i18n/locales/es.json` | Add Spanish outreach translations (~100 keys) |
| `src/integrations/supabase/types.ts` | Auto-updated with new table types |

### Database Migration

Single migration file creating all 5 tables with:
- RLS policies (staff-only access)
- Indexes on email, pipeline_type, status, created_at
- Realtime enabled for raw_leads, crm_leads, and email_threads

---

## Implementation Order

1. **Stage 0**: Create page structure, navigation, placeholder tabs
2. **Stage 1**: Database migration (all 5 tables)
3. **Stage 2**: Leads tab with manual add, CSV import, paste list
4. **Stage 3**: AI rating edge function + qualification flow
5. **Stage 4**: CRM tab + research + email generation
6. **Stage 5**: Inbox + reply classification
7. **Stage 6**: Conversion bridge to Members CRM

This plan ensures complete isolation from the Members CRM while providing a full-featured AI-powered outreach system.
