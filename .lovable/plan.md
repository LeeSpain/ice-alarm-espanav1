
# Final Integration: Isabella Operations - Complete & Test

## Current Status
✅ **Completed:**
- Database migration (`isabella_settings` table created with 19 functions)
- Hook implementation (`useIsabellaSettings.ts`) with all 4 functions
- IsabellaOperationsPage created with full toggle UI
- AICommandCentre rewritten with 3-card layout
- Route added (`/admin/ai/operations`)
- Sidebar updated with Headphones icon and Isabella Operations menu item
- IsabellaStatusBanner created and integrated into AdminDashboard
- Locale files partially updated

❌ **Still Needed:**
1. **Translation Keys** - Add missing isabella, aiCommandCentre, and sidebar keys to both en.json and es.json
2. **Function Configuration Mapping** - Create `src/lib/isabella-function-config.ts` to link functions to AI agents
3. **Advanced Configuration Links** - Add section to IsabellaOperationsPage with quick links to AI agent config pages
4. **End-to-End Testing** - Verify all toggles work, persist, and update stats correctly

## Phase 1: Add Missing Translation Keys

**Location:** `src/i18n/locales/en.json` and `src/i18n/locales/es.json`

**Keys to Add:**
- `sidebar.isabellaOperations`: "Isabella Operations"
- `isabella.*`: 80+ keys covering function names, descriptions, sections, status messages, banner text
- `aiCommandCentre.*`: 10+ keys for card titles, descriptions, buttons

**Implementation Pattern:**
```json
{
  "isabella": {
    "title": "Isabella Operations",
    "subtitle": "Control which functions Isabella handles automatically",
    "sections": {
      "alertHandling": "Alert Handling",
      "inboundCommunications": "Inbound Communications",
      "outboundCommunications": "Outbound Communications",
      "salesAndLeads": "Sales & Leads",
      "alwaysHuman": "Always Human"
    },
    "functions": {
      "deviceOfflineResponse": "Device Offline Response",
      "deviceOfflineResponseDesc": "When device offline 5+ min, Isabella calls member, then emergency contacts. Escalates if no response.",
      // ... 18 more functions
    },
    "alwaysHumanItems": {
      "emergencyDispatch": "112 Emergency Dispatch - Human only, legal requirement",
      "physicalHandling": "Physical Device Handling - Human only, requires hands",
      "bankTransfers": "Bank Transfers - Human only, financial authority",
      "largeRefunds": "Refunds Over €100 - Human only, approval required"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "functionsActive": "{{count}} functions active",
      "interactionsToday": "{{count}} interactions today",
      "escalatedToHumans": "{{count}} escalated to humans"
    },
    "banner": {
      "isabellaActive": "ISABELLA ACTIVE",
      "humanMode": "HUMAN MODE: All alerts and communications routed to staff",
      "managing": "Managing {{interactions}} interactions today | {{escalated}} escalated to humans"
    }
  },
  "aiCommandCentre": {
    "title": "AI Command Centre",
    "subtitle": "Manage Isabella and AI-powered automation",
    "isabellaOperations": {
      "title": "Isabella Operations",
      "description": "Customer, member, and alert handling",
      "button": "Manage Functions"
    },
    "outreachPipeline": {
      "title": "AI Outreach Pipeline",
      "description": "B2B lead discovery, research, and sales automation",
      "button": "Open Pipeline"
    },
    "isabellaContent": {
      "title": "Isabella Content",
      "description": "Social media, blog posts, and video generation",
      "button": "Content Manager"
    }
  }
}
```

## Phase 2: Create isabella-function-config.ts

**Location:** `src/lib/isabella-function-config.ts`

**Purpose:** Map each Isabella function to its underlying AI agent, triggers, and capabilities for future automation hooks.

**Structure:**
```typescript
export const ISABELLA_FUNCTION_CONFIG = {
  device_offline_response: {
    agent_key: "customer_service_expert",
    triggers: ["device.offline", "alert.device_offline"],
    capabilities: ["voice_call", "sms", "escalate"],
  },
  // ... 18 more functions
}

// Helper function to check if a function is enabled
export async function isIsabellaFunctionEnabled(functionKey: string): Promise<boolean>
```

This file serves as a single source of truth for integrating Isabella toggles with the broader AI infrastructure.

## Phase 3: Add Advanced Configuration Section to IsabellaOperationsPage

**Location:** `src/pages/admin/IsabellaOperationsPage.tsx`

**Addition:** Below the "Always Human" section, add a new Card showing:
- Title: "Advanced Configuration"
- Description: "Configure the AI agents that power Isabella's functions"
- Links to each agent detail page:
  - Customer Service Expert (`/admin/ai/agents/customer_service_expert`)
  - Main Brain (`/admin/ai/agents/main_brain`)
  - Member Specialist (`/admin/ai/agents/member_specialist`)

This allows admins to drill down and customize agent prompts, memory, training data, and permissions.

## Phase 4: End-to-End Testing Checklist

After all code changes are complete, verify:

**Database & Persistence:**
- [ ] Navigate to `/admin/ai/operations`
- [ ] Toggle "Low Battery Alerts" ON
- [ ] Verify toast shows "Saved"
- [ ] Refresh page
- [ ] Verify "Low Battery Alerts" is still ON
- [ ] Check database: `isabella_settings` row for `low_battery_alerts` has `enabled=true` and `enabled_at` is recent

**Navigation & UI:**
- [ ] `/admin/ai` shows 3-card layout (Isabella Operations, Outreach Pipeline, Isabella Content)
- [ ] `/admin/ai/operations` shows 5 sections (Alert Handling, Inbound, Outbound, Sales, Always Human)
- [ ] Sidebar shows "Isabella Operations" under AI Command Centre
- [ ] Can click cards to navigate between routes

**Dashboard Integration:**
- [ ] AdminDashboard shows IsabellaStatusBanner at the top
- [ ] Banner shows "ISABELLA ACTIVE" when any function is enabled
- [ ] Banner shows list of enabled functions
- [ ] Banner shows interaction count and escalation count
- [ ] "Manage" link goes to `/admin/ai/operations`

**Stats & Real-time:**
- [ ] Enable 3+ functions
- [ ] AICommandCentre card 1 shows "3 functions active"
- [ ] Stats refresh every 30 seconds
- [ ] Escalation count updates when escalations occur

**Chat Widgets (Critical):**
- [ ] HeaderChatButton on public site still works
- [ ] MemberChatButton on member portal still works
- [ ] StaffHeaderChatButton on staff portal still works
- [ ] AdminHeaderChatButton on admin panel still works

**Agent Configuration (Preserved):**
- [ ] `/admin/ai/agents/main_brain` page loads
- [ ] `/admin/ai/agents/customer_service_expert` page loads
- [ ] All 6 tabs work (Instructions, Tools, Memory, Training, Simulator, Audit)
- [ ] Can edit agent instructions and see changes persist

**Translations:**
- [ ] Toggle language to Spanish
- [ ] IsabellaOperationsPage titles and labels appear in Spanish
- [ ] AICommandCentre titles and labels appear in Spanish
- [ ] No "isabella.functions.*" keys show as untranslated

## Files to Modify

| File | Changes |
|------|---------|
| `src/i18n/locales/en.json` | Add ~80 isabella & aiCommandCentre keys |
| `src/i18n/locales/es.json` | Add ~80 isabella & aiCommandCentre keys (Spanish) |
| `src/lib/isabella-function-config.ts` | Create new file with function-to-agent mapping |
| `src/pages/admin/IsabellaOperationsPage.tsx` | Add Advanced Configuration section at bottom |

## Success Criteria

✅ All 19 functions show correct UI state (enabled/disabled)
✅ Toggles persist after page refresh
✅ Dashboard banner shows real-time stats
✅ All translations display correctly in EN/ES
✅ Advanced config links let admins access agent details
✅ Chat widgets remain fully functional
✅ No console errors related to missing translations or components
