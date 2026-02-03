

# Add Staff Support Specialist AI Agent & Header Chat Button

## Overview

This plan adds a new AI agent called "Staff Support Specialist" designed specifically for call centre staff, and adds an AI Chat button to the Staff Dashboard header matching the Admin Dashboard style.

---

## Current State

| Component | Status |
|-----------|--------|
| Admin Header Chat Button | Uses `main_brain` agent |
| Staff Dashboard Header | No AI chat button |
| AI Agents in Database | 5 agents (main_brain, customer_service_expert, member_specialist, media_manager, sales_expert) |

---

## Target State

| Component | Status |
|-----------|--------|
| Staff Header Chat Button | Uses new `staff_support_specialist` agent |
| AI Command Centre | Shows 6 agent cards (adding Staff Support Specialist) |
| New Agent | Specialized for helping call centre staff with procedures, alerts, and member queries |

---

## Implementation Steps

### Step 1: Create New AI Agent in Database

Insert a new agent into `ai_agents` and `ai_agent_configs`:

**Agent Details:**
```
agent_key: staff_support_specialist
name: Staff Support Specialist
description: AI assistant for call centre staff. Provides guidance on procedures, helps with alert handling, member lookups, and shift operations. Available 24/7 to support operators.
enabled: true
instance_count: 1
mode: draft_only
```

**Configuration:**
- System instruction focused on staff support
- Read permissions: members, alerts, devices, documentation, shift_notes, tickets
- Write permissions: escalate, ticket_create, note_add
- Triggers: staff.help_request, staff.procedure_query

### Step 2: Create Staff Header Chat Button Component

Create `src/components/chat/StaffHeaderChatButton.tsx` matching the Admin version:
- Uses `staff_support_specialist` as the agent key
- Displays agent avatar with online indicator
- Opens `AIChatWidget` with `userRole: "staff"`

### Step 3: Add Staff Header Chat Button to CallCentreHeader

Update `src/components/layout/CallCentreHeader.tsx`:
- Import the new `StaffHeaderChatButton` component
- Add it to the right side actions, positioned before the notification bell

### Step 4: Update useAIChat Hook for Staff Role

Update `src/hooks/useAIChat.ts`:
- Add `"staff"` to the `userRole` type
- Add personalized greeting for staff users
- Include staff-specific welcome message

### Step 5: Update AIChatWidget for Staff Role

Update `src/components/chat/AIChatWidget.tsx`:
- Add `"staff"` to the `userRole` prop type
- Pass staff role correctly to the AI

### Step 6: Update AI Run Edge Function

Update `supabase/functions/ai-run/index.ts`:
- Add `STAFF_SUPPORT_CHAT_PROMPT` constant with staff-focused instructions
- Include `staff_support_specialist` in the chat widget handling
- Fetch staff-relevant data (shift info, pending alerts) for context

### Step 7: Update AI Dispatch Events

Update `supabase/functions/ai-dispatch-events/index.ts`:
- Add event mappings for the new agent:
  - `"staff.help_request": ["staff_support_specialist"]`
  - `"staff.procedure_query": ["staff_support_specialist"]`

### Step 8: Update AI Command Centre Icon Mapping

Update `src/pages/admin/AICommandCentre.tsx`:
- Add icon mapping for `staff_support_specialist` → `HeadsetIcon` (or `UserCog`)

### Step 9: Add Translations

Update both locale files:

**English (en.json):**
```json
"staffSupportSpecialist": "Staff Support Specialist"
```

**Spanish (es.json):**
```json
"staffSupportSpecialist": "Especialista de Soporte al Personal"
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/chat/StaffHeaderChatButton.tsx` | AI chat button for staff header |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/CallCentreHeader.tsx` | Add AI chat button |
| `src/hooks/useAIChat.ts` | Add staff role support |
| `src/components/chat/AIChatWidget.tsx` | Add staff role type |
| `supabase/functions/ai-run/index.ts` | Add staff agent handling |
| `supabase/functions/ai-dispatch-events/index.ts` | Add staff event mappings |
| `src/pages/admin/AICommandCentre.tsx` | Add icon mapping |
| `src/i18n/locales/en.json` | Add translations |
| `src/i18n/locales/es.json` | Add Spanish translations |

## Database Changes

1. **Insert** new `staff_support_specialist` agent into `ai_agents`
2. **Insert** configuration into `ai_agent_configs` with staff-specific settings

---

## Staff Support Specialist Capabilities

The new agent will help staff with:
- **Procedures**: "How do I handle a fall alert?"
- **Member Lookups**: "What's the status of member 12345?"
- **Shift Operations**: "What alerts are pending?"
- **Documentation**: Access to staff-visible docs
- **Escalation**: When to escalate to supervisors

---

## UI Preview

**Staff Dashboard Header (After):**
```
+------------------------------------------------------------------+
| [Search members, alerts...]  [On Duty]           🤖 🔔 👤        |
|                                                   ↑               |
|                                          Staff AI Chat Button     |
+------------------------------------------------------------------+
```

**AI Command Centre (After):**
```
+-------------------+  +---------------------+  +-------------------+
| 🧠 Main Brain     |  | 🎧 Customer Service |  | 📈 Sales Expert   |
+-------------------+  +---------------------+  +-------------------+

+-------------------+  +---------------------+  +-------------------+
| 👤 Member         |  | 🖼️ Media Manager    |  | 🛠️ Staff Support  |
| Specialist        |  |                     |  | Specialist        |
+-------------------+  +---------------------+  +-------------------+
```

---

## Technical Notes

- The agent uses `HeadsetIcon` (or `UserCog`) to distinguish from other agents
- Staff context includes their shift status, pending alerts count, and recent activity
- Documentation with `visibility: ['staff', 'ai']` is included in the AI context
- Avatar can be uploaded later via the Agent Detail page

