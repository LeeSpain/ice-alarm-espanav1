

## Goal
Merge the **Sales Expert** agent into the **Customer Service Expert** agent to create a unified **Customer Service & Sales Expert** that handles 100% of both responsibilities.

## Current State

| Agent | Key | Description | Events Handled |
|-------|-----|-------------|----------------|
| Customer Service Expert | `customer_service_expert` | Support, questions, troubleshooting | `conversation.started`, `message.received` |
| Sales Expert | `sales_expert` | Leads, sales enquiries, conversions | `lead.created`, `sale.enquiry`, `quote.requested` |

## After Merge

| Agent | Key | Description | Events Handled |
|-------|-----|-------------|----------------|
| Customer Service & Sales Expert | `customer_service_expert` | Full 24/7 coverage: support + sales | All 5 events combined |

## Implementation Plan

### Step 1: Update Database Agent Record
Update the `ai_agents` table to change the name and description:

```sql
UPDATE ai_agents 
SET 
  name = 'Customer Service & Sales Expert',
  description = '24/7 coverage for sales enquiries, lead qualification, pricing discussions, support questions, device troubleshooting, and general customer assistance.'
WHERE agent_key = 'customer_service_expert';
```

### Step 2: Merge System Prompts in Edge Function
Update `supabase/functions/ai-run/index.ts`:
- Combine `CUSTOMER_SERVICE_CHAT_PROMPT` and `SALES_EXPERT_CHAT_PROMPT` into a single comprehensive prompt
- Remove the `sales_expert` case from the prompt selection logic
- Keep the `customer_service_expert` key (used by chat widgets)

**New Combined Prompt** will include:
- Customer service role (answering questions, troubleshooting)
- Sales role (qualifying leads, handling objections, presenting value)
- Pricing information (already shared between both)
- Sales techniques (from sales expert)
- Response guidelines (from customer service)

### Step 3: Update Event Dispatch Mapping
Update `supabase/functions/ai-dispatch-events/index.ts`:
- Redirect all sales events to `customer_service_expert`

```typescript
// Customer Service & Sales Expert - combined
"conversation.started": ["customer_service_expert"],
"message.received": ["customer_service_expert"],
"lead.created": ["customer_service_expert"],
"sale.enquiry": ["customer_service_expert"],
"quote.requested": ["customer_service_expert"],
```

### Step 4: Update AI Command Centre Icon
Update `src/pages/admin/AICommandCentre.tsx`:
- Remove `TrendingUp` import (no longer needed for sales_expert)
- Keep `Headphones` icon for the combined agent

### Step 5: Update Translations
Update both locale files:

**English (`en.json`):**
```json
"customerServiceExpert": "Customer Service & Sales Expert"
```

**Spanish (`es.json`):**
```json
"customerServiceExpert": "Experto en Atención al Cliente y Ventas"
```

### Step 6: Disable/Remove Sales Expert Agent
Option A (Safe - Disable):
```sql
UPDATE ai_agents SET enabled = false WHERE agent_key = 'sales_expert';
```

Option B (Clean - Delete):
```sql
DELETE FROM ai_agent_configs WHERE agent_id = (SELECT id FROM ai_agents WHERE agent_key = 'sales_expert');
DELETE FROM ai_agents WHERE agent_key = 'sales_expert';
```

We'll use Option A initially to keep the data, then Option B can be run later.

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-run/index.ts` | Merge prompts, remove sales_expert case |
| `supabase/functions/ai-dispatch-events/index.ts` | Redirect sales events |
| `src/pages/admin/AICommandCentre.tsx` | Remove sales_expert icon case |
| `src/i18n/locales/en.json` | Update translation |
| `src/i18n/locales/es.json` | Update translation |
| Database migration | Update agent name/description, disable sales_expert |

## Combined System Prompt (Technical Details)

```text
You are a friendly, professional Customer Service & Sales Specialist for 
ICE Alarm España, a 24/7 emergency response service for seniors and expats 
living in Spain.

## Your Dual Role
CUSTOMER SERVICE:
- Answer questions about ICE Alarm services, pricing, and features
- Help with device troubleshooting and technical support
- Be warm, helpful, and professional

SALES:
- Qualify leads and understand their specific needs
- Present ICE Alarm's value proposition compellingly
- Handle objections with empathy and facts
- Guide prospects toward purchase decisions

[Pricing information...]

## Sales Techniques:
1. Ask qualifying questions: "Who would be using the device?" 
2. Identify pain points: worry about falls, living far from family
3. Present value: "For less than €1/day, you get 24/7 peace of mind"
4. Handle objections: "I understand - many members felt the same..."
5. Create urgency gently

## Response Guidelines:
1. Be conversational and helpful, not robotic
2. If asked about pricing, provide clear, specific numbers
3. Encourage visitors to join or contact us
4. Never make up information
5. Lead with value and benefits, not just features
6. Use social proof when appropriate

Remember: You handle both support AND sales. Be welcoming to new 
prospects and supportive to existing customers.
```

## Acceptance Criteria

1. AI Command Centre shows "Customer Service & Sales Expert" (not two agents)
2. Chat widget continues to work using `customer_service_expert` key
3. Sales-related events (`lead.created`, `sale.enquiry`, `quote.requested`) are handled
4. Combined agent can answer both support and sales questions
5. No broken references to `sales_expert` in frontend

