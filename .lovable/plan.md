

# AI Command Centre - Full Review & Issues Report

## Overview

I've completed a comprehensive review of the AI Command Centre. Below is a detailed analysis of all 5 agents, their configurations, integrations, and the issues that need to be addressed.

---

## Current Agent Inventory

| Agent Key | Name | Status | Mode | Has Config | Avatar |
|-----------|------|--------|------|------------|--------|
| main_brain | Main Brain | Enabled | auto_act | Yes | Yes |
| customer_service_expert | Customer Service Expert | Enabled | draft_only | Yes | Yes |
| member_specialist | Member Support Specialist | Enabled | draft_only | Yes | No |
| media_manager | ICE Media Manager | Enabled | draft_only | Yes | No |
| sales_expert | Sales Expert | Enabled | draft_only | Yes | No |

---

## Critical Issues Found

### Issue 1: Sales Expert Configuration Format (CRITICAL)

The `sales_expert` agent configuration uses an **incompatible format** for permissions:

**Current (Wrong):**
```json
read_permissions: { "tables": ["leads", "members", "subscriptions", "products", "pricing_settings"] }
write_permissions: { "tables": ["leads", "crm_events"] }
```

**Expected (Correct - matches other agents):**
```json
read_permissions: ["leads", "members", "subscriptions", "products", "pricing_settings"]
write_permissions: ["lead_create", "crm_update", "quote_send"]
```

**Impact:** The `ai-run` function uses array iteration on permissions (line 291: `for (const permission of config.read_permissions || [])`). With an object format, this will fail silently or behave unexpectedly.

---

### Issue 2: Sales Expert Not Handled in Chat Widget Mode

The `ai-run` function only handles chat widget requests for `customer_service_expert` and `member_specialist` (line 121):

```typescript
if (isChatWidget && (agentKey === "customer_service_expert" || agentKey === "member_specialist")) {
```

**Impact:** If the `sales_expert` agent is ever used in a chat context, it won't get the specialized chat handling and will fall through to the general agent logic.

---

### Issue 3: Member Specialist Has Empty Permissions

The `member_specialist` agent has:
- `write_permissions: []` - Cannot take any actions
- `triggers: []` - Won't be automatically triggered by events

**Impact:** This agent can only respond in chat mode but cannot escalate, create tickets, or take any proactive actions for member issues.

---

### Issue 4: Documentation Integration Missing from AI

The Documentation system was created to support AI visibility, but:
- No documents currently have `'ai'` in their visibility array
- The `ai-run` function does **not** query the `documentation` table

**Impact:** AI agents cannot access company procedures/documentation that were intended to be in their knowledge base.

---

### Issue 5: Missing Avatar Images

Three agents lack avatar images:
- `member_specialist` - No avatar_url
- `media_manager` - No avatar_url  
- `sales_expert` - No avatar_url

**Impact:** These agents display fallback icons instead of professional avatars in the command centre.

---

## What's Working Correctly

### UI Components
- AI Command Centre displays all 5 agents dynamically
- Correct icons mapped to each agent
- Stats (runs, actions, escalations) load correctly
- Agent detail pages with all 6 tabs work properly

### Edge Functions
- `ai-run` - Properly handles chat and event-based requests
- `ai-dispatch-events` - Correctly routes events to agents
- `ai-execute-action` - All 9 action types implemented

### Event Routing (ai-dispatch-events)
```text
sale.created         → main_brain
partner.joined       → main_brain
conversation.started → customer_service_expert
message.received     → customer_service_expert
lead.created         → sales_expert
sale.enquiry         → sales_expert
member.support_request → member_specialist
social.content_needed  → media_manager
```

### Agent Configurations (except sales_expert)
- Main Brain - Full permissions, auto-act mode
- Customer Service Expert - Chat-focused, proper tool policy
- Member Specialist - Read-only, personalized context
- Media Manager - Content-focused with research capability

---

## Recommended Fixes

### Fix 1: Correct Sales Expert Configuration

Update the `sales_expert` config to use array format:

```sql
UPDATE ai_agent_configs 
SET 
  read_permissions = '["leads", "members", "subscriptions", "products", "pricing_settings"]'::jsonb,
  write_permissions = '["lead_create", "quote_send", "escalate", "schedule_callback"]'::jsonb,
  tool_policy = '{"lead_create": true, "quote_send": true, "escalate": true, "schedule_callback": true}'::jsonb,
  triggers = '["lead.created", "sale.enquiry", "quote.requested"]'::jsonb
WHERE agent_id = (SELECT id FROM ai_agents WHERE agent_key = 'sales_expert');
```

### Fix 2: Add Sales Expert to Chat Widget Handling

Modify `ai-run` function to include `sales_expert`:

```typescript
if (isChatWidget && (agentKey === "customer_service_expert" || agentKey === "member_specialist" || agentKey === "sales_expert")) {
```

Also add a `SALES_EXPERT_CHAT_PROMPT` constant with sales-focused instructions.

### Fix 3: Add Member Specialist Write Permissions

```sql
UPDATE ai_agent_configs 
SET 
  write_permissions = '["escalate", "ticket_create", "request_human"]'::jsonb,
  tool_policy = '{"escalate": true, "ticket_create": true, "request_human": true}'::jsonb
WHERE agent_id = (SELECT id FROM ai_agents WHERE agent_key = 'member_specialist');
```

### Fix 4: Integrate Documentation into AI Context

Modify the `ai-run` function to load AI-visible documentation:

```typescript
// After loading memories, also load documentation
const { data: documentation } = await supabase
  .from("documentation")
  .select("title, content, category, importance")
  .contains("visibility", ["ai"])
  .eq("status", "published")
  .order("importance", { ascending: false })
  .limit(10);

// Include in system prompt
const docsText = documentation?.map(d => `[${d.category}/${d.title}]: ${d.content}`).join("\n\n") || "";
```

### Fix 5: Prompt Admins to Upload Avatars

For member_specialist, media_manager, and sales_expert - these can be uploaded via the existing AIAvatarUpload component on each agent's detail page.

---

## Summary of Changes Needed

| Priority | Fix | Files Affected |
|----------|-----|----------------|
| CRITICAL | Fix sales_expert config format | Database migration |
| HIGH | Add sales_expert to chat handling | supabase/functions/ai-run/index.ts |
| MEDIUM | Add member_specialist permissions | Database migration |
| MEDIUM | Integrate documentation into AI | supabase/functions/ai-run/index.ts |
| LOW | Upload missing avatars | Via UI only |

---

## Technical Details

### Database Tables Involved
- `ai_agents` - Agent definitions
- `ai_agent_configs` - Agent configurations (instructions, permissions)
- `ai_memory` - Knowledge base items
- `ai_events` - Event queue
- `ai_runs` - Execution history
- `ai_actions` - Proposed/executed actions
- `documentation` - Company procedures (needs AI integration)

### Edge Functions
- `ai-run` - Main execution endpoint
- `ai-dispatch-events` - Event routing
- `ai-execute-action` - Action execution

