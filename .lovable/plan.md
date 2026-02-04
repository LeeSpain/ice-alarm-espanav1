

# Fix Twilio 11200 Error - Simplified Queue Approach

## Problem Analysis

The current AI-powered `incoming` handler performs multiple async operations (member lookup, session creation, alert insertion) before returning TwiML. If **any** of these fail, Twilio gets no response → error 11200.

## Your Proposed Fix

Simplify the `incoming` action to return minimal valid TwiML immediately:

```xml
<Response>
  <Say language="es-ES">Gracias por llamar a ICE Alarm. Un operador le atenderá en breve.</Say>
  <Say language="en-GB">Thank you for calling ICE Alarm. An operator will be with you shortly.</Say>
  <Enqueue waitUrl="...?action=wait">ice-alarm-queue</Enqueue>
</Response>
```

And add a `wait` action handler for the queue hold message.

## Trade-off

| Approach | Pros | Cons |
|----------|------|------|
| **Your Simple Queue Fix** | Guaranteed valid TwiML, immediate stability | No AI agent (Isabel), just hold music/queue |
| **Current AI Flow** | Full AI conversation | Multiple failure points causing 11200 |

## Recommendation

I suggest a **hybrid approach**:

1. **Add try/catch wrapping** around database operations in the current AI flow
2. **Return basic queue TwiML as fallback** if any errors occur
3. **Keep AI integration** when everything works

This gives you stability (fallback to queue if something fails) while preserving the AI capability.

---

## Implementation Plan

### Option A: Your Simple Queue Fix (Quick)

Replace `incoming` block (lines 52-118) and add `wait` handler.

**Changes:**
- Replace lines 52-118 with simple greeting + `<Enqueue>` 
- Add `wait` handler after line 118 (before `transcription` block)

**Result:** Stable calls, but no AI - callers go straight to queue.

---

### Option B: Robust AI with Fallback (Recommended)

Wrap the current AI flow in try/catch with graceful fallback:

```typescript
if (action === "incoming") {
  try {
    // Existing AI flow code...
    const formData = await req.formData();
    // ... member lookup, session creation, etc.
    // Return AI-powered TwiML with <Gather>
  } catch (error) {
    console.error("Incoming call error, falling back to queue:", error);
    // FALLBACK: Return simple queue TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES">Gracias por llamar a ICE Alarm. Un operador le atenderá en breve.</Say>
  <Say language="en-GB">Thank you for calling ICE Alarm. An operator will be with you shortly.</Say>
  <Enqueue waitUrl="${baseUrl}/functions/v1/twilio-voice?action=wait">ice-alarm-queue</Enqueue>
</Response>`;
    return new Response(twiml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
}
```

Also add the `wait` handler for Enqueue stability.

**Result:** AI works when database is healthy, falls back to queue if any errors.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/twilio-voice/index.ts` | Wrap incoming in try/catch, add `wait` handler |

---

## Which Approach?

- **If you want to test connectivity first** → Option A (your simple queue)
- **If you want AI with safety net** → Option B (try/catch with fallback)

Let me know which you'd prefer, or approve this plan and I'll implement Option B (robust AI with fallback).

