
# Fix Member Deletion and AI Emergency Contact Hallucination

## Problems Identified

### Problem 1: Member Deletion Fails
The current delete logic in `MemberDetailPage.tsx` performs a simple `DELETE FROM members` which fails silently due to 5 foreign key constraints without `ON DELETE CASCADE`:

- `internal_tickets.member_id`
- `leads.converted_member_id`
- `registration_drafts.converted_member_id`
- `crm_contacts.linked_member_id`
- `crm_import_rows.imported_member_id`

### Problem 2: AI Hallucinated Emergency Contact Name
When you asked about your emergency contact, the AI said "Sarah Wakeman" but the database shows **Daisy Wakeman**. 

**Why?** The voice call handler in `ai-run` does NOT fetch emergency contacts - it only passes member name, location, and subscription data to the AI. The AI invented "Sarah" because it had no actual data to reference.

---

## Solution Overview

### Fix 1: Database Migration - Add Cascading Deletes
Update the 5 foreign key constraints to use `ON DELETE SET NULL` so member deletion succeeds:

```sql
-- internal_tickets: SET NULL on delete
ALTER TABLE internal_tickets 
  DROP CONSTRAINT internal_tickets_member_id_fkey;
ALTER TABLE internal_tickets 
  ADD CONSTRAINT internal_tickets_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

-- leads: SET NULL on delete  
ALTER TABLE leads
  DROP CONSTRAINT leads_converted_member_id_fkey;
ALTER TABLE leads
  ADD CONSTRAINT leads_converted_member_id_fkey
  FOREIGN KEY (converted_member_id) REFERENCES members(id) ON DELETE SET NULL;

-- registration_drafts: SET NULL on delete
ALTER TABLE registration_drafts
  DROP CONSTRAINT registration_drafts_converted_member_id_fkey;
ALTER TABLE registration_drafts
  ADD CONSTRAINT registration_drafts_converted_member_id_fkey
  FOREIGN KEY (converted_member_id) REFERENCES members(id) ON DELETE SET NULL;

-- crm_contacts: SET NULL on delete
ALTER TABLE crm_contacts
  DROP CONSTRAINT crm_contacts_linked_member_id_fkey;
ALTER TABLE crm_contacts
  ADD CONSTRAINT crm_contacts_linked_member_id_fkey
  FOREIGN KEY (linked_member_id) REFERENCES members(id) ON DELETE SET NULL;

-- crm_import_rows: SET NULL on delete
ALTER TABLE crm_import_rows
  DROP CONSTRAINT crm_import_rows_imported_member_id_fkey;
ALTER TABLE crm_import_rows
  ADD CONSTRAINT crm_import_rows_imported_member_id_fkey
  FOREIGN KEY (imported_member_id) REFERENCES members(id) ON DELETE SET NULL;
```

### Fix 2: Add Emergency Contacts to AI Voice Context
Update `supabase/functions/ai-run/index.ts` to fetch and include emergency contacts when handling voice calls:

```typescript
// After fetching member data (~line 1032)
// Fetch emergency contacts
const { data: emergencyContacts } = await supabase
  .from("emergency_contacts")
  .select("contact_name, relationship, phone, priority_order")
  .eq("member_id", memberId)
  .order("priority_order", { ascending: true });

// Include in memberContext (~line 1046)
memberContext = `
## Caller Identity (VERIFIED MEMBER)
- Name: ${member.first_name} ${member.last_name}
- Location: ${member.city || "Spain"}
- Status: ${member.status}
- Subscription: ${subscription?.plan_type || "Unknown"}

## Emergency Contacts on File
${emergencyContacts?.length 
  ? emergencyContacts.map((c, i) => `${i+1}. ${c.contact_name} (${c.relationship}) - ${c.phone}`).join('\n')
  : "No emergency contacts configured"}

Use their name naturally in conversation. When discussing emergency contacts, use the EXACT names above.
`;
```

---

## Implementation Summary

| Change | Type | File/Location |
|--------|------|---------------|
| Update 5 FK constraints | Database Migration | New migration SQL |
| Fetch emergency contacts | Edge Function | `ai-run/index.ts` lines 1029-1057 |
| Add contacts to AI context | Edge Function | `ai-run/index.ts` memberContext variable |

---

## After Implementation

### Deletion will work because:
1. Child tables will SET NULL instead of blocking
2. Tables with CASCADE already handle cleanup automatically
3. No manual cascade logic needed in application code

### AI will provide accurate emergency contact info because:
1. Voice calls fetch actual emergency contacts from database
2. Contact names, relationships, and phones are passed to AI
3. AI is instructed to use EXACT names from the data

---

## Verification Steps

After implementation:
1. Test deleting a member with related data - should succeed
2. Call the AI and ask about emergency contacts - should say "Daisy Wakeman" not "Sarah"
3. Verify database shows `Daisy Wakeman` unchanged (the AI never actually modified it)
