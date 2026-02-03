
# AI Outreach Lead Rating Implementation Plan

## Overview

This plan implements a complete end-to-end campaign assignment and AI rating system for outreach leads in three stages, as requested.

---

## STAGE 1: Add campaign_id to Raw Leads

### Database Changes

| Change | Details |
|--------|---------|
| Add column | `campaign_id uuid NULL` to `outreach_raw_leads` |
| Add foreign key | References `outreach_campaigns(id)` with `ON DELETE SET NULL` |
| Add index | `idx_outreach_raw_leads_campaign_id` for performance |

```text
outreach_raw_leads
├── id
├── company_name
├── campaign_id (NEW) ──────► outreach_campaigns(id)
├── ai_score
├── ai_reasoning
├── ai_rated_at
└── ...
```

### Frontend Changes

**Files to modify:**

| File | Changes |
|------|---------|
| `src/hooks/useOutreachRawLeads.ts` | Add `campaign_id` to `NewLead` interface and insert/bulk operations |
| `src/components/admin/outreach/AddOutreachLeadModal.tsx` | Pass `campaign_id` to `addLead()` function |
| `src/components/admin/outreach/ImportLeadsModal.tsx` | Pass `campaign_id` to bulk import |
| `src/components/admin/outreach/OutreachLeadsTab.tsx` | Add "Campaign" column to table, join with campaigns for display |

### Table Column Display

The leads table will show campaign names:

```text
┌─────┬──────────────┬─────────┬──────────┬────────────────┬───────┬────────┐
│  ✓  │ Company      │ Contact │ Pipeline │ Campaign       │ Score │ Status │
├─────┼──────────────┼─────────┼──────────┼────────────────┼───────┼────────┤
│ [ ] │ Acme Corp    │ John    │ Sales    │ Q1 Healthcare  │ ★★★★☆ │ New    │
│ [ ] │ Beta Inc     │ Jane    │ Partner  │ —              │ —     │ New    │
└─────┴──────────────┴─────────┴──────────┴────────────────┴───────┴────────┘
```

---

## STAGE 2: AI Rating System

### Edge Function

**Create:** `supabase/functions/rate-outreach-leads/index.ts`

This function will:
1. Accept lead IDs (or "all_new" flag)
2. For each lead, build an AI prompt including:
   - Lead fields: company_name, category, location, website_url, email
   - If campaign_id is set: fetch campaign's `target_description`, `target_locations`, `pipeline_type`
3. Call Lovable AI Gateway to get a rating
4. Write results to database: `ai_score`, `ai_reasoning`, `ai_rated_at`

**AI Prompt Structure:**
```text
You are a B2B lead qualification specialist. Rate this lead from 1.0 to 5.0.

Lead Information:
- Company: {company_name}
- Category: {category}
- Location: {location}
- Website: {website_url}
- Email: {email}

[If campaign is set:]
Campaign Target:
- Description: {target_description}
- Target Regions: {target_locations}
- Pipeline: {pipeline_type}

Rate based on:
1. Business fit for our emergency response service
2. Location match (Spain preferred)
3. Contact information quality
4. Industry relevance

Respond in JSON: {"score": 4.2, "reasoning": "Brief explanation"}
```

### Frontend Changes

**Files to modify:**

| File | Changes |
|------|---------|
| `src/hooks/useOutreachRawLeads.ts` | Add `rateLeads()` mutation that calls edge function |
| `src/components/admin/outreach/OutreachLeadsTab.tsx` | Add "AI Rate Selected" and "AI Rate All New" buttons |
| `src/i18n/locales/en.json` | Add translation keys for rating buttons |
| `src/i18n/locales/es.json` | Add Spanish translations |

### UI for Rating Buttons

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Raw Leads                                                                  │
│                                                                             │
│  [Import] [+ Add Lead]        [⚡ Rate Selected] [⚡ Rate All New]          │
│                                                                             │
│  ┌─ Filters ──────────────────────────────────────────────────────────────┐ │
│  │ Status: [All ▼]  Pipeline: [All ▼]  Source: [All ▼]  Campaign: [All ▼] │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rating Flow

```text
User clicks "Rate All New"
         │
         ▼
    ┌─────────────┐
    │ Get leads   │
    │ status=new  │
    │ no ai_score │
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │ For each    │──────────────┐
    │ lead        │              │
    └─────┬───────┘              │
          │                      │
          ▼                      │
    ┌─────────────┐              │
    │ If has      │              │
    │ campaign_id │              │
    │ → fetch     │              │
    │   campaign  │              │
    └─────┬───────┘              │
          │                      │
          ▼                      │
    ┌─────────────┐              │
    │ Build AI    │              │
    │ prompt with │              │
    │ lead +      │              │
    │ campaign    │              │
    │ context     │              │
    └─────┬───────┘              │
          │                      │
          ▼                      │
    ┌─────────────┐              │
    │ Call Lovable│              │
    │ AI Gateway  │              │
    └─────┬───────┘              │
          │                      │
          ▼                      │
    ┌─────────────┐              │
    │ Update lead │              │
    │ ai_score    │              │
    │ ai_reasoning│              │
    │ ai_rated_at │              │
    └─────┬───────┘              │
          │                      │
          ▼                      │
    ┌─────────────┐              │
    │ Next lead   │◄─────────────┘
    └─────────────┘
```

---

## STAGE 3: Campaign Threshold Qualification

### Logic Change

Currently `handleMoveQualified` in OutreachLeadsTab uses:
```javascript
Number(l.ai_score) >= 3.5  // Hard-coded
```

New logic:
```javascript
// For each lead:
// 1. If lead.campaign_id exists → get campaign.min_ai_score
// 2. Else use default 3.5
// 3. Check if lead.ai_score >= threshold
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useOutreachRawLeads.ts` | Update `qualifyLeadsMutation` to: 1) Check campaign thresholds, 2) Copy `campaign_id` to CRM leads |
| `src/components/admin/outreach/OutreachLeadsTab.tsx` | Remove hard-coded 3.5 check, let hook handle threshold logic |

### Updated Qualification Logic

```text
┌───────────────────────────────────────────────────────────────────────────┐
│  qualifyLeads(selectedLeadIds)                                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Fetch selected leads from outreach_raw_leads                          │
│                                                                           │
│  2. Group leads by campaign_id                                            │
│     ├── Leads with campaign_id → fetch campaign.min_ai_score              │
│     └── Leads without campaign → use default threshold (3.5)              │
│                                                                           │
│  3. Filter leads where ai_score >= threshold                              │
│                                                                           │
│  4. Create CRM leads (INCLUDING campaign_id!)                             │
│     {                                                                     │
│       raw_lead_id,                                                        │
│       company_name,                                                       │
│       campaign_id,  ◄── NEW: Copy from raw lead                           │
│       ai_score,                                                           │
│       ...                                                                 │
│     }                                                                     │
│                                                                           │
│  5. Update raw leads status → 'qualified'                                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Files Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/rate-outreach-leads/index.ts` | Edge function for AI rating |

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useOutreachRawLeads.ts` | Add campaign_id to types, add rateLeads mutation, update qualify logic |
| `src/components/admin/outreach/AddOutreachLeadModal.tsx` | Pass campaign_id to addLead |
| `src/components/admin/outreach/ImportLeadsModal.tsx` | Pass campaign_id to bulk import |
| `src/components/admin/outreach/OutreachLeadsTab.tsx` | Add rating buttons, campaign column, campaign filter, remove hard-coded threshold |
| `src/i18n/locales/en.json` | Add translation keys |
| `src/i18n/locales/es.json` | Add Spanish translations |

### Database Migration

```sql
-- Add campaign_id to outreach_raw_leads
ALTER TABLE outreach_raw_leads 
ADD COLUMN campaign_id uuid NULL 
REFERENCES outreach_campaigns(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_outreach_raw_leads_campaign_id 
ON outreach_raw_leads(campaign_id);
```

---

## Translation Keys to Add

```json
{
  "outreach": {
    "leads": {
      "rateSelected": "AI Rate Selected",
      "rateAllNew": "AI Rate All New",
      "rating": "Rating leads...",
      "ratingComplete": "Successfully rated {{count}} leads",
      "noLeadsToRate": "No unrated leads to process",
      "columns": {
        "campaign": "Campaign"
      }
    }
  }
}
```

---

## Done Criteria Checklist

### Stage 1
- [ ] campaign_id column added to outreach_raw_leads
- [ ] Foreign key constraint to outreach_campaigns
- [ ] Index created for performance
- [ ] AddOutreachLeadModal saves campaign_id
- [ ] ImportLeadsModal saves campaign_id
- [ ] Campaign column displays in table

### Stage 2
- [ ] Edge function created for AI rating
- [ ] "AI Rate Selected" button works
- [ ] "AI Rate All New" button works
- [ ] AI considers campaign context when rating
- [ ] ai_score, ai_reasoning, ai_rated_at populated

### Stage 3
- [ ] Qualification uses campaign.min_ai_score when available
- [ ] Default 3.5 used for leads without campaign
- [ ] campaign_id copied to outreach_crm_leads
- [ ] Hard-coded 3.5 removed from UI
