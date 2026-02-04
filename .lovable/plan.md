

# Complete AI Voice Integration - Full Implementation Plan

## Executive Summary

This plan upgrades the `twilio-voice` edge function to create a fully conversational AI-powered phone system where **Isabel (Customer Service & Sales Expert)** answers incoming calls using speech recognition and the existing AI agent infrastructure.

---

## Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| Twilio Credentials | ✅ Connected | Account SID and Auth Token configured |
| Phone Number Sync | ✅ Complete | Both `settings_emergency_phone` and `settings_twilio_phone_number` = `+18143833159` |
| AI Agent (Isabel) | ✅ Enabled | `customer_service_expert` agent with full prompt ready |
| ai-run Function | ✅ Ready | Chat widget mode supports conversation history |
| twilio-voice Function | ⚠️ Queue Only | Currently uses `<Enqueue>` - no AI integration |
| Voice Session Storage | ❌ Missing | No table to track conversation history |

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                          AI VOICE CALL FLOW                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────────────────┐   │
│  │  Caller  │───>│ Twilio Cloud │───>│ twilio-voice?action=incoming   │   │
│  └──────────┘    └──────────────┘    └────────────────┬────────────────┘   │
│                                                       │                    │
│                                                       v                    │
│                                      ┌─────────────────────────────────┐   │
│                                      │  Greeting TwiML                 │   │
│                                      │  <Say> + <Gather input="speech">│   │
│                                      └────────────────┬────────────────┘   │
│                                                       │                    │
│                                                       v                    │
│       ┌────────────────────────────────────────────────────────────────┐   │
│       │              CONVERSATION LOOP                                 │   │
│       │                                                                │   │
│       │   ┌──────────────────────────────────────────────────────────┐ │   │
│       │   │ twilio-voice?action=transcription                        │ │   │
│       │   │ 1. Receive SpeechResult from Twilio                      │ │   │
│       │   │ 2. Load/Create voice_call_sessions record                │ │   │
│       │   │ 3. Call ai-run with customer_service_expert agent        │ │   │
│       │   │ 4. Return <Say> with AI response + loop <Gather>         │ │   │
│       │   └──────────────────────────────────────────────────────────┘ │   │
│       │                           │                                    │   │
│       │                           v                                    │   │
│       │   ┌──────────────────────────────────────────────────────────┐ │   │
│       │   │ ai-run (customer_service_expert)                         │ │   │
│       │   │ - Receives: conversationHistory, isVoiceCall, language   │ │   │
│       │   │ - Uses existing Isabel prompt                            │ │   │
│       │   │ - Returns: text response for TTS                         │ │   │
│       │   └──────────────────────────────────────────────────────────┘ │   │
│       │                                                                │   │
│       └────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│                  ESCALATION PATH                                           │
│                                                                            │
│       ┌────────────────────────────────────────────────────────────────┐   │
│       │  If AI response contains "[ESCALATE]"                          │   │
│       │  1. <Say> "Connecting you to an operator..."                   │   │
│       │  2. <Dial>staff number</Dial> OR <Enqueue>emergency</Enqueue>  │   │
│       │  3. Send notification to call centre dashboard                 │   │
│       └────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Voice Session Storage Table

Create a new table to track multi-turn voice conversations:

```sql
CREATE TABLE voice_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  caller_phone TEXT NOT NULL,
  member_id UUID REFERENCES members(id),
  language TEXT DEFAULT 'es-ES',
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_voice_sessions_call_sid ON voice_call_sessions(call_sid);
CREATE INDEX idx_voice_sessions_member ON voice_call_sessions(member_id);

-- Enable realtime for dashboard monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE voice_call_sessions;
```

### Step 2: Rewrite twilio-voice Edge Function

Replace the current queue-based flow with AI-powered conversation:

**New Action Handlers:**

| Action | Purpose |
|--------|---------|
| `incoming` | Initial greeting + first `<Gather>` for speech input |
| `transcription` | Process speech, call AI, respond, loop back |
| `timeout` | Handle no-speech with retry prompt |
| `escalate` | Transfer to human operator |
| `status` | Existing - track call completion |
| `recording` | Existing - save recordings |

**Key Implementation Details:**

1. **Incoming Call Handler (`action=incoming`)**
   - Look up member by phone number
   - Create voice session record
   - Return bilingual greeting + `<Gather input="speech">`

2. **Transcription Handler (`action=transcription`)**
   - Parse `SpeechResult` from Twilio FormData
   - Load session from database
   - Append user message to session history
   - Call `ai-run` with:
     ```json
     {
       "agentKey": "customer_service_expert",
       "context": {
         "source": "voice_call",
         "isVoiceCall": true,
         "callDirection": "inbound",
         "callerPhone": "+34...",
         "memberId": "uuid or null",
         "conversationHistory": [...],
         "currentMessage": "transcribed text",
         "userLanguage": "es"
       }
     }
     ```
   - Extract AI text response
   - Check for escalation trigger
   - Return `<Say>` + loop `<Gather>`

3. **Timeout Handler (`action=timeout`)**
   - Gentle prompt: "I didn't catch that, could you repeat?"
   - Loop back to `<Gather>` (max 3 retries before escalate)

4. **Escalation Handler (`action=escalate`)**
   - Update session with escalation reason
   - Return `<Dial>` to staff or `<Enqueue>` to emergency queue
   - Trigger notification to call centre

### Step 3: Add Voice-Specific AI Context

Enhance the `ai-run` function to detect voice calls and add voice-specific instructions:

```typescript
// In ai-run, when context.source === "voice_call"
const voiceInstructions = `
## VOICE CALL MODE - CRITICAL INSTRUCTIONS

You are on a LIVE PHONE CALL. Adapt your responses:

1. **Keep responses SHORT** - Max 2-3 sentences per turn (under 100 words)
2. **Use conversational speech** - No bullet points, markdown, or lists
3. **Confirm understanding** - "Let me make sure I understood correctly..."
4. **Natural pacing** - Use commas and periods for natural TTS pauses
5. **Avoid spelling out** - Say "twenty-seven euros" not "€27"

## Call Context
- Direction: ${context.callDirection}
- Caller Phone: ${context.callerPhone}
- Identified Member: ${context.memberId ? "YES" : "NO - treat as potential new customer"}

## Escalation Trigger
If you determine the call needs a human operator, end your response with:
[ESCALATE: reason here]

This will immediately transfer the call to a staff member.
`;
```

### Step 4: Update ai-run to Handle Voice Context

Modify the existing chat widget handler in `ai-run` to also handle `source: "voice_call"`:

- Add voice-specific instructions to the system prompt
- Keep token limit lower (300 tokens for voice vs 500 for chat)
- Add escalation detection in response

### Step 5: Language Detection Logic

Implement smart language selection:

1. **Check member profile** (if matched) for `preferred_language`
2. **Analyze first speech** - Twilio provides language confidence
3. **Default to Spanish** (es-ES) for unidentified callers in Spain

### Step 6: Escalation & Human Handoff

When Isabel determines escalation is needed:

```xml
<Response>
  <Say language="es-ES">
    Entiendo. Voy a conectarle con uno de nuestros especialistas.
    Por favor, espere un momento.
  </Say>
  <Dial timeout="30">+34STAFFNUMBER</Dial>
  <Say language="es-ES">
    Lo sentimos, nuestros operadores están ocupados. 
    Por favor, inténtelo de nuevo más tarde.
  </Say>
</Response>
```

---

## Database Changes Summary

| Change | Type | Description |
|--------|------|-------------|
| `voice_call_sessions` | New Table | Stores multi-turn voice conversations |
| Realtime enabled | Config | For dashboard live monitoring |

---

## Edge Function Changes Summary

| Function | Changes |
|----------|---------|
| `twilio-voice` | Complete rewrite with AI integration |
| `ai-run` | Add voice call context handling (minor modification) |

---

## Twilio Console Configuration

After deployment, configure in Twilio Console:

1. **Phone Number Voice Configuration**
   - Webhook URL: `https://pduhccavshrhfkfbjgmj.supabase.co/functions/v1/twilio-voice?action=incoming`
   - HTTP Method: POST

2. **Enable Speech Recognition**
   - Already included in `<Gather input="speech">`
   - Twilio handles transcription automatically

---

## Testing Checklist

After implementation:

| Test | Expected Result |
|------|-----------------|
| Call the Twilio number | Hear bilingual greeting |
| Speak in Spanish | Isabel responds in Spanish |
| Ask about pricing | Correct pricing info provided |
| Say "I want to cancel" | Verification protocol triggered |
| Stay silent for 10s | Timeout prompt heard |
| Request human operator | Call transferred/escalated |
| Check dashboard | Voice session visible in real-time |

---

## Files to Create/Modify

1. **New Database Table:** `voice_call_sessions`
2. **Rewrite:** `supabase/functions/twilio-voice/index.ts`
3. **Modify:** `supabase/functions/ai-run/index.ts` (voice context handling)

---

## Estimated Costs

| Service | Cost |
|---------|------|
| Twilio Speech Recognition | ~$0.02-0.04 per 15 seconds |
| Lovable AI (Gemini Flash) | Included in plan |
| Twilio Voice (inbound) | Standard per-minute rates |

---

## Summary

This implementation creates a seamless voice experience where callers are greeted by Isabel, can have natural conversations about ICE Alarm services, and are smoothly escalated to human operators when needed. The system uses the existing AI agent infrastructure, ensuring consistency between chat and voice channels.

