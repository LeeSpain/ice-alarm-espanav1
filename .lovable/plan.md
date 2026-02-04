
# Fix "Call and Speak" Data Capture & Call Stability

## Issues Identified

### Issue 1: Missing Data in Admin Leads
The "Call and Speak" feature collects caller name, phone, and language, but **never creates a lead record** in the `leads` table. The `twilio-call-me` edge function initiates the Twilio call but does not insert into `leads`.

### Issue 2: Call Cut Off After Answering
The call was cut off because the `voice_call_sessions` table is missing the `conversation_id` column. The code tries to insert with this column, fails, then the fallback insert may also have issues. When the call proceeds to transcription, it can't find the session and returns an error, causing Twilio to hang up.

---

## Solution Overview

### Part A: Add Lead Creation to twilio-call-me
When someone uses "Call and Speak", create a lead record immediately with the information we have.

### Part B: Add conversation_id column to voice_call_sessions
Add the missing database column so voice sessions can properly link to conversations.

### Part C: Save CRM Notes for Non-Members  
When a call completes and no member is found, save the summary to the `conversations` table or create a minimal lead record with notes.

---

## Implementation Details

### 1. Database Migration
Add the missing `conversation_id` column to `voice_call_sessions`:

```sql
ALTER TABLE voice_call_sessions 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id);
```

### 2. Update twilio-call-me Edge Function
After validating the phone number and before initiating the call:

1. Check if caller is an existing member (by phone)
2. If NOT a member, create a lead record:
   - `first_name`: from `callerName` (split if contains space) or "Website"
   - `last_name`: from `callerName` (second part) or "Caller"
   - `email`: placeholder like `callme-{timestamp}@pending.icealarm.es`
   - `phone`: the caller's phone number
   - `preferred_language`: from the request
   - `enquiry_type`: "callback"
   - `source`: "website_call_me"
   - `message`: "Requested callback via Call and Speak feature"
   - `status`: "new"
3. Store the lead ID in the conversation for later linking
4. Pass lead_id to the voice webhook URL

### 3. Update twilio-voice Edge Function
**In status callback (call completed):**

1. If no member_id but we have a conversation with lead_id:
   - Update the lead's `notes` field with the CRM summary
   - Mark lead as `contacted`
2. If no member_id and no lead_id:
   - Store the summary in the conversation's metadata or subject field as fallback

---

## Technical Details

### Lead Record Structure for "Call and Speak"

| Field | Value |
|-------|-------|
| first_name | Extracted from callerName or "Website" |
| last_name | Extracted from callerName or "Caller" |
| email | `call-{timestamp}@pending.icealarm.es` |
| phone | The provided phone number |
| preferred_language | "en" or "es" |
| enquiry_type | "callback" |
| source | "website_call_me" |
| message | "Requested callback via Call and Speak feature" |
| status | "new" → "contacted" after call completes |

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `conversation_id` column to `voice_call_sessions` |
| `supabase/functions/twilio-call-me/index.ts` | Create lead record before initiating call |
| `supabase/functions/twilio-voice/index.ts` | Link lead_id to conversation; update lead notes on call completion |
| `src/integrations/supabase/types.ts` | Will auto-update after migration |

---

## Testing Plan

1. Open website (not logged in)
2. Click "Call and Speak"  
3. Enter name "Maria Garcia", phone "+34612345678", select Spanish
4. Click "Call me now"
5. Check Admin → Leads → Should see new lead with:
   - Name: Maria Garcia
   - Phone: +34612345678
   - Source: website_call_me
   - Status: new
6. Answer the call → AI should greet "Hola Maria..."
7. Have a short conversation
8. Hang up
9. Check Admin → Leads again:
   - Status should be "contacted"
   - Notes should contain the conversation summary
