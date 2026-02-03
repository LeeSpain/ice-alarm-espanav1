

# AI Command Centre Upgrade - Show All 4 Agents

## Overview

This plan upgrades the AI Command Centre to display **all 4 AI agents** in the system as separate, individually trainable cards. Currently, only 2 cards are shown (Main Brain and Customer Service & Sales Expert). The upgrade will:

1. Split "Customer Service & Sales Expert" into two separate agents: **Customer Service** and **Sales Expert**
2. Display all 4 agents with appropriate icons and descriptions
3. Keep all existing functionality intact

---

## Current State (Database)

| Agent Key | Name | Description |
|-----------|------|-------------|
| `main_brain` | Main Brain | Central decision-maker and orchestrator |
| `customer_service_expert` | Customer Service & Sales Expert | 24/7 frontend coverage for sales enquiries, support questions... |
| `member_specialist` | Member Support Specialist | Personalized AI assistant for logged-in members |
| `media_manager` | ICE Media Manager | Creates marketing Facebook post drafts |

---

## Target State (After Changes)

| Agent Key | Display Name | Icon | Purpose |
|-----------|-------------|------|---------|
| `main_brain` | Main Brain | Brain | Central orchestrator (as is) |
| `customer_service_expert` | Customer Service Expert | HeadsetIcon | Support questions, member help |
| `sales_expert` | Sales Expert | TrendingUp | Sales enquiries, lead conversion |
| `member_specialist` | Member Support Specialist | UserCircle | Logged-in member personalized support |
| `media_manager` | ICE Media Manager | Image | Facebook posts, marketing content |

---

## Implementation Steps

### Step 1: Database - Create New Sales Expert Agent

Insert a new agent record to split sales from customer service:

```text
agent_key: sales_expert
name: Sales Expert
description: Dedicated AI for sales enquiries, lead qualification, pricing discussions, and conversion optimization. Works 24/7 to capture and nurture prospects.
enabled: true
instance_count: 1
mode: draft_only
```

Also update the existing `customer_service_expert` description to focus on support only:
```text
name: Customer Service Expert
description: 24/7 support coverage for member questions, technical help, device troubleshooting, and general enquiries.
```

### Step 2: Update AI Command Centre UI

Modify `src/pages/admin/AICommandCentre.tsx` to:
- Remove hardcoded agent filtering
- Dynamically render ALL agents from the database
- Assign appropriate icons based on `agent_key`
- Use a responsive 2-column grid (4 cards)

**Icon Mapping:**
```text
main_brain       → Brain
customer_service → Headphones
sales_expert     → TrendingUp  
member_specialist → UserCircle
media_manager    → ImageIcon
```

### Step 3: Update Event Dispatch Mapping

Modify `supabase/functions/ai-dispatch-events/index.ts` to route events to the correct agents:

```text
Before:
  "conversation.started": ["customer_service_expert"]
  "message.received": ["customer_service_expert"]

After:
  "conversation.started": ["customer_service_expert"]
  "message.received": ["customer_service_expert"]
  "lead.created": ["sales_expert"]
  "sale.enquiry": ["sales_expert"]
  "member.support_request": ["member_specialist"]
  "social.content_needed": ["media_manager"]
```

### Step 4: Add Translations

Add translation keys for the new agents:

**English (en.json):**
```json
"salesExpert": "Sales Expert",
"memberSpecialist": "Member Support Specialist",
"mediaManager": "ICE Media Manager"
```

**Spanish (es.json):**
```json
"salesExpert": "Experto en Ventas",
"memberSpecialist": "Especialista de Soporte al Miembro",
"mediaManager": "Gestor de Medios ICE"
```

### Step 5: Create Agent Config for Sales Expert

Insert the active configuration for the new sales agent:
- System instruction focused on sales skills
- Tool policy for CRM access
- Appropriate read/write permissions

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AICommandCentre.tsx` | Dynamic agent rendering with icon mapping |
| `supabase/functions/ai-dispatch-events/index.ts` | Add new event-to-agent mappings |
| `src/i18n/locales/en.json` | Add new agent translations |
| `src/i18n/locales/es.json` | Add Spanish translations |

## Database Changes

1. **Insert** new `sales_expert` agent into `ai_agents`
2. **Update** `customer_service_expert` name and description
3. **Insert** active config for `sales_expert` into `ai_agent_configs`

---

## UI Preview

After implementation, the AI Command Centre will show:

```text
+--------------------------------------------------+
| AI Command Centre                                 |
| Monitor and manage your AI agents                 |
+--------------------------------------------------+
|                                                   |
|  +-------------------+  +---------------------+   |
|  | 🧠 Main Brain     |  | 🎧 Customer Service |   |
|  | Auto Act          |  | Draft Only          |   |
|  | Enabled ●         |  | Enabled ●           |   |
|  | [Open Agent]      |  | [Open Agent]        |   |
|  +-------------------+  +---------------------+   |
|                                                   |
|  +-------------------+  +---------------------+   |
|  | 📈 Sales Expert   |  | 👤 Member Specialist|   |
|  | Draft Only        |  | Draft Only          |   |
|  | Enabled ●         |  | Enabled ●           |   |
|  | [Open Agent]      |  | [Open Agent]        |   |
|  +-------------------+  +---------------------+   |
|                                                   |
|  +-------------------+                            |
|  | 🖼️ Media Manager  |                            |
|  | Draft Only        |                            |
|  | Enabled ●         |                            |
|  | [Open Agent]      |                            |
|  +-------------------+                            |
|                                                   |
|  System Overview                                  |
|  [5 Total] [5 Active] [6 Instances] [Phase 2]    |
+--------------------------------------------------+
```

---

## Technical Notes

- The `AgentCard` component already works dynamically - no changes needed
- Each agent can be independently trained via their detail page (`/admin/ai/agents/{agent_key}`)
- The icon is determined by a simple mapping function based on `agent_key`
- Stats (runs, actions, escalations) will auto-populate per agent

