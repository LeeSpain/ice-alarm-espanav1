
# Add Caller Name to "Call and Speak" Feature

## Overview
Enhance the "Call and Speak" feature to collect the caller's name so the AI agent (Isabel) can greet them personally when calling back. For logged-in members, the name will be pre-populated from their profile.

## Current Flow
1. User clicks "Call and Speak" in chat widget
2. Modal collects: Phone Number + Language
3. Twilio calls user → AI greets generically

## New Flow
1. User clicks "Call and Speak" in chat widget
2. Modal collects: **Name** + Phone Number + Language
3. Name is passed through the call chain
4. AI greets: "Hello **[Name]**, I'm Isabel from ICE Alarm..."

---

## Implementation Details

### 1. Frontend - CallMeModal.tsx
**Add name input field above phone number:**
- New state: `callerName`
- Add text input with label "Your Name" / "Su nombre"
- For logged-in members: pre-populate from `memberName` prop
- Pass `callerName` to edge function call
- Validation: name should be trimmed, max 50 chars (optional but recommended)

**Props to add:**
- `defaultName?: string` - allows pre-population for logged-in users

### 2. Frontend - AIChatWidget.tsx
**Pass member name to CallMeModal:**
- The widget already receives `memberName` prop
- Pass it as `defaultName` to CallMeModal component

### 3. Edge Function - twilio-call-me/index.ts
**Accept and forward caller name:**
- Read `callerName` from request JSON body
- Sanitize the name (remove special characters, limit length)
- Add to voice webhook URL as query parameter: `&caller_name=<encoded-name>`
- Log the name in console for debugging

### 4. Edge Function - twilio-voice/index.ts
**Use caller name in greeting:**
- Read `caller_name` from URL query parameters
- If `caller_name` is provided AND no member is found in database, use caller_name
- Priority order for greeting personalization:
  1. Known member's first_name from database
  2. caller_name from query param (website callback)
  3. Generic greeting (no name)
- Build personalized greeting: "Hello [Name], I'm Isabel..."

---

## Technical Details

### Security Considerations
- Name input validation: max 50 characters
- URL-encode the name when passing as query parameter
- Sanitize for TwiML/XML (escape special characters)
- Name is only used for greeting, not for identity verification

### Greeting Logic (twilio-voice)
```text
if (member found in DB)
    → Use member.first_name
else if (caller_name query param exists)
    → Use caller_name
else
    → Generic greeting without name
```

### Sample Personalized Greetings
**Spanish (with name):**
> "Hola María, bienvenida a ICE Alarm. Soy Isabel, su asistente virtual..."

**English (with name):**
> "Hello John, welcome to ICE Alarm. I'm Isabel, your virtual assistant..."

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chat/CallMeModal.tsx` | Add name input field, state, validation, and API call update |
| `src/components/chat/AIChatWidget.tsx` | Pass `memberName` as `defaultName` prop to CallMeModal |
| `supabase/functions/twilio-call-me/index.ts` | Accept `callerName`, sanitize, add to voice URL |
| `supabase/functions/twilio-voice/index.ts` | Read `caller_name` param, use in greeting if no member found |

---

## Testing Checklist
- [ ] Open homepage (not logged in)
- [ ] Click "Call and Speak" → Name field should be empty
- [ ] Enter name "Maria", phone "+34612345678", select Spanish
- [ ] Click "Call me now"
- [ ] Answer phone → AI should say: "Hola Maria, bienvenida a ICE Alarm..."
- [ ] For logged-in member: Name should be pre-filled from profile
