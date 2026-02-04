

## Goal
Completely remove the **Sales Expert** (`sales_expert`) agent from the database so it no longer appears in the AI Command Centre. The agent is currently disabled but still visible.

## Current State

| Agent | Key | Status | Issue |
|-------|-----|--------|-------|
| Sales Expert | `sales_expert` | Disabled | Still visible in AI Command Centre |

## Database Records to Delete

The following records need to be removed:

1. **`ai_agent_configs`** - Config entry for sales_expert
   - ID: `f8e2ee1e-665a-4674-b46e-42c031860367`
   - `agent_id`: `09acff97-775e-4321-8416-6ca047d867a0`

2. **`ai_agents`** - The agent record itself
   - ID: `09acff97-775e-4321-8416-6ca047d867a0`
   - `agent_key`: `sales_expert`

## Implementation

### Database Migration

Execute a SQL migration to delete the sales_expert agent and its config:

```sql
-- Delete the config first (foreign key constraint)
DELETE FROM ai_agent_configs 
WHERE agent_id = '09acff97-775e-4321-8416-6ca047d867a0';

-- Delete the agent record
DELETE FROM ai_agents 
WHERE agent_key = 'sales_expert';
```

## Result After Deletion

The AI Command Centre will show only **5 agents**:

| # | Agent | Key |
|---|-------|-----|
| 1 | Main Brain | `main_brain` |
| 2 | Customer Service & Sales Expert | `customer_service_expert` |
| 3 | Member Support Specialist | `member_specialist` |
| 4 | ICE Media Manager | `media_manager` |
| 5 | Staff Support Specialist | `staff_support_specialist` |

## Files Changed
- Database migration only (no code changes needed)

