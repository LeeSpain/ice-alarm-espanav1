
# AI Outreach Instructions Popup - Implementation Plan

## Overview

Add a professional "How to Use" help button to the AI Outreach page header that opens a detailed instructions dialog. The dialog will provide comprehensive guidance on using all five tabs (Leads, CRM, Campaigns, Inbox, Analytics) with step-by-step workflows and best practices.

---

## Current State

| Feature | Status |
|---------|--------|
| AI Outreach Page | ✅ Has header with title/subtitle |
| Help Button | ❌ None |
| Instructions Popup | ❌ None |
| Tab Guidance | ❌ None |

---

## Planned Implementation

### 1. Header Enhancement
Add a "How to Use" button next to the header title:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [📢] AI Outreach                                 [? How to Use]│
│       Automated lead discovery and outreach campaigns           │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Instructions Dialog Component
Create a professional dialog with comprehensive usage instructions:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [X]                   AI Outreach Guide                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ══════════════════════════════════════════════════════════════ │
│  OVERVIEW                                                       │
│  ══════════════════════════════════════════════════════════════ │
│  AI Outreach automates lead discovery and email campaigns       │
│  for sales and partner acquisition...                           │
│                                                                 │
│  ══════════════════════════════════════════════════════════════ │
│  📥 LEADS TAB                                                   │
│  ══════════════════════════════════════════════════════════════ │
│  • Add leads manually or import via CSV                         │
│  • AI rates leads (1-10) based on fit                           │
│  • Move qualified leads (7+) to CRM                             │
│                                                                 │
│  ══════════════════════════════════════════════════════════════ │
│  🎯 CRM TAB                                                     │
│  ══════════════════════════════════════════════════════════════ │
│  • Kanban board: New → Contacted → Replied → Converted          │
│  • AI research generates business summaries                     │
│  • AI writes personalized intro emails                          │
│                                                                 │
│  ... (Campaigns, Inbox, Analytics sections) ...                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                    [Got It]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dialog Content Structure

### Sections

| Section | Content |
|---------|---------|
| **Overview** | Purpose of AI Outreach module, workflow summary |
| **Leads Tab** | Adding leads, importing CSV, AI rating, qualification |
| **CRM Tab** | Kanban stages, AI research, email generation, conversion |
| **Campaigns Tab** | Creating campaigns, targeting, messaging config, follow-ups |
| **Inbox Tab** | Email thread management, AI classification, reply suggestions |
| **Analytics Tab** | Performance metrics, tracking conversions |
| **Best Practices** | Tips for maximizing results |

### Content Details

**Overview Section:**
- Purpose: Automate lead discovery and outreach for sales/partner pipelines
- Main workflow: Import Leads → AI Rates → Move to CRM → Research → Email → Convert

**Leads Tab Section:**
- Add leads manually with company/contact/email
- Import via CSV or paste list
- Select pipeline (Sales or Partner)
- Optionally assign to a campaign
- AI rates leads 1-10 based on business fit
- Move leads with score ≥7 to CRM

**CRM Tab Section:**
- Kanban board with 6 columns: New, Contacted, Replied, Interested, Converted, Closed
- Click "Research Business" for AI-generated company summary
- Click "Generate Intro Email" for personalized outreach
- Move cards through pipeline as relationship progresses
- Convert successful leads to Members or Partners

**Campaigns Tab Section:**
- Create targeted email campaigns by pipeline type
- Define ideal lead characteristics for AI personalization
- Configure email tone (Professional/Friendly/Neutral)
- Set outreach goals (Introduction/Partnership/Meeting)
- Enable automated follow-up sequences

**Inbox Tab Section:**
- View all email conversations in one place
- AI classifies replies (Interested/Question/Not Interested/Unsubscribe)
- AI generates suggested replies
- Edit and send responses

**Analytics Tab Section:**
- Track leads discovered vs qualified
- Monitor emails sent and replies received
- View conversion rates

**Best Practices Section:**
- Start with a focused campaign targeting specific regions
- Rate all new leads before moving to CRM
- Personalize AI emails with research before sending
- Follow up within 3-5 days if no response
- Convert interested leads promptly

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/outreach/OutreachHelpDialog.tsx` | Help dialog component with all instructions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AIOutreachPage.tsx` | Add HelpCircle button, dialog trigger |
| `src/i18n/locales/en.json` | Add `outreach.help.*` translation keys |
| `src/i18n/locales/es.json` | Add Spanish translations |

---

## Translation Keys to Add

```json
{
  "outreach": {
    "help": {
      "title": "AI Outreach Guide",
      "howToUse": "How to Use",
      "gotIt": "Got It",
      "overview": {
        "title": "Overview",
        "content": "AI Outreach automates lead discovery and email campaigns for sales and partner acquisition. The workflow is simple: Import leads, let AI rate them, move qualified leads to CRM, research their business, generate personalized emails, and convert to members or partners."
      },
      "leads": {
        "title": "Leads Tab",
        "intro": "Manage raw leads before they enter your sales pipeline.",
        "steps": [
          "Add leads manually or import via CSV/paste list",
          "Select pipeline type: Sales or Partner",
          "Optionally assign leads to a campaign",
          "Click 'Rate All New' to let AI score leads 1-10",
          "Leads scoring 7+ can be moved to CRM"
        ]
      },
      "crm": {
        "title": "CRM Tab",
        "intro": "Work qualified leads through your pipeline with AI assistance.",
        "steps": [
          "Leads appear in the 'New' column",
          "Click 'Research Business' for AI company insights",
          "Click 'Generate Intro Email' for personalized outreach",
          "Drag cards to update status as relationships progress",
          "Convert successful leads to Members or Partners"
        ]
      },
      "campaigns": {
        "title": "Campaigns Tab",
        "intro": "Create and manage automated email campaigns.",
        "steps": [
          "Click 'New Campaign' to create a targeted campaign",
          "Define the ideal lead profile for AI personalization",
          "Configure email tone and outreach goals",
          "Enable follow-up sequences for non-responders",
          "Assign leads to campaigns for organized outreach"
        ]
      },
      "inbox": {
        "title": "Inbox Tab",
        "intro": "Manage email conversations and responses.",
        "steps": [
          "View all email threads in one unified inbox",
          "AI classifies replies: Interested, Question, Not Interested",
          "Review AI-suggested responses",
          "Edit and send personalized replies"
        ]
      },
      "analytics": {
        "title": "Analytics Tab",
        "intro": "Track outreach performance and conversions.",
        "metrics": [
          "Leads Discovered: Total leads imported",
          "Leads Qualified: Leads moved to CRM",
          "Emails Sent: Total outreach emails",
          "Replies Received: Response count",
          "Conversions: Successful member/partner signups"
        ]
      },
      "bestPractices": {
        "title": "Best Practices",
        "tips": [
          "Start with focused campaigns targeting specific regions or industries",
          "Rate all new leads before moving to CRM for better qualification",
          "Always review and personalize AI-generated emails before sending",
          "Follow up within 3-5 days if no response",
          "Document notes on each lead for better context"
        ]
      }
    }
  }
}
```

---

## Component Implementation

### OutreachHelpDialog.tsx Structure

```tsx
// Key features:
// - Uses Dialog component with ScrollArea for long content
// - Sections with icons matching tab icons
// - Numbered/bulleted lists for steps
// - Professional styling with proper spacing
// - Fully translated using i18n
```

### AIOutreachPage.tsx Changes

```tsx
// Add to header:
<div className="flex items-center gap-3">
  {/* ... existing icon and title ... */}
</div>
<Button variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
  <HelpCircle className="h-4 w-4 mr-2" />
  {t("outreach.help.howToUse")}
</Button>

// Add dialog:
<OutreachHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
```

---

## Summary

| Feature | Implementation |
|---------|----------------|
| Help Button | Outline button with HelpCircle icon in header |
| Instructions Dialog | Full-screen dialog with ScrollArea |
| Content Sections | 7 sections covering all tabs + best practices |
| Translations | Full EN/ES bilingual support |
| Styling | Professional, consistent with existing UI patterns |
