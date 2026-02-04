

# Add Configurable Voice Scripts and CRM Note Logging to Twilio Voice

## Overview

This plan adds 4 key improvements to the `twilio-voice` edge function:

1. **Voice Script Settings** - Make greetings, hold messages, and error prompts editable via `system_settings`
2. **Safe getSetting Helper** - Ensure missing settings don't break calls (graceful fallbacks)
3. **Recording Notice** - Add GDPR-compliant recording disclosure to greetings
4. **CRM Note Logging** - Save completed calls as member notes for visibility in Member → Notes tab

---

## Changes Summary

| Location | Change |
|----------|--------|
| Lines 26-31 | Add 8 new settings keys for voice scripts |
| After line 36 | Add `getSetting()` helper function |
| Lines 52-62 (wait action) | Use editable hold messages |
| Lines 107-140 (incoming action) | Use editable greetings with recording notice |
| After line 459 (status action) | Insert member note on call completion |

---

## Technical Details

### 1. Expand Settings Keys (lines 26-31)

```typescript
.in("key", [
  "settings_twilio_account_sid",
  "settings_twilio_auth_token",
  "settings_twilio_phone_number",
  "settings_emergency_phone",
  // Voice script settings (editable via Admin Settings)
  "voice_greeting_es",
  "voice_greeting_en",
  "voice_hold_es",
  "voice_hold_en",
  "voice_error_es",
  "voice_error_en",
  "voice_recording_notice_es",
  "voice_recording_notice_en"
]);
```

### 2. Add getSetting Helper (after line 36)

```typescript
// Safe helper to get settings with fallback for missing/empty values
const getSetting = (key: string, fallback: string): string => {
  const v = twilioConfig[key];
  return (v && String(v).trim().length > 0) ? String(v) : fallback;
};
```

### 3. Update Wait Action (lines 52-62)

Replace hardcoded Spanish/English hold messages with:
```typescript
const holdEs = getSetting("voice_hold_es", 
  "Por favor, permanezca en la línea. Le conectamos en breve.");
const holdEn = getSetting("voice_hold_en", 
  "Please stay on the line. We are connecting you now.");
```

### 4. Update Incoming Greeting (lines 107-128)

Add recording notice and make greetings configurable:
```typescript
// Get configurable greetings with fallbacks
const baseGreetingEs = getSetting("voice_greeting_es", 
  "Gracias por llamar a ICE Alarm España. Soy Isabel, su asistente virtual.");
const baseGreetingEn = getSetting("voice_greeting_en", 
  "Thank you for calling ICE Alarm Spain. I'm Isabel, your virtual assistant.");
const recordingEs = getSetting("voice_recording_notice_es", 
  "Esta llamada puede ser grabada para mejorar el servicio.");
const recordingEn = getSetting("voice_recording_notice_en", 
  "This call may be recorded to improve our service.");

// Build personalized greeting if member known
const greetingEs = member?.first_name 
  ? `Hola ${member.first_name}, bienvenido a ICE Alarm. Soy Isabel. ${recordingEs} ¿En qué puedo ayudarle hoy?`
  : `${baseGreetingEs} ${recordingEs} ¿En qué puedo ayudarle hoy?`;

const greetingEn = member?.first_name
  ? `Hello ${member.first_name}, welcome to ICE Alarm. I'm Isabel. ${recordingEn} How can I help you today?`
  : `${baseGreetingEn} ${recordingEn} How can I help you today?`;
```

### 5. Add CRM Note on Call Completion (after line 459)

Insert member note when call completes:
```typescript
// If call completed, create a CRM note for the member
if (callStatus === "completed") {
  const from = formData.get("From") as string | null;
  const to = formData.get("To") as string | null;

  if (from) {
    const normalizedFrom = from.replace("+", "");

    const { data: member } = await supabase
      .from("members")
      .select("id, first_name, last_name")
      .or(`phone.eq.${from},phone.eq.${normalizedFrom}`)
      .maybeSingle();

    if (member) {
      const dur = duration ? parseInt(duration) : 0;

      const noteText =
        `📞 AI Voice Call Completed\n` +
        `• Member: ${member.first_name || ""} ${member.last_name || ""}\n` +
        `• From: ${from}\n` +
        `• To: ${to || ""}\n` +
        `• Duration: ${dur} seconds\n` +
        (recordingUrl ? `• Recording: ${recordingUrl}\n` : "") +
        `• Status: ${callStatus}\n\n` +
        `Summary: Call handled by AI voice assistant.`;

      await supabase.from("member_notes").insert({
        member_id: member.id,
        content: noteText,
        note_type: "support",
        is_pinned: false
      });
    }
  }
}
```

---

## Files to Modify

| File | Lines Changed |
|------|---------------|
| `supabase/functions/twilio-voice/index.ts` | ~26-31, ~36, ~52-62, ~107-128, ~459-480 |

---

## Benefits

1. **Platform Control** - Change voice scripts from Admin Settings without code changes
2. **GDPR Compliance** - Recording notice at call start
3. **CRM Visibility** - Every completed call creates a member note with duration/recording link
4. **Resilience** - getSetting helper ensures missing settings don't break calls

---

## Future Enhancement (Optional)

After this change, you could add a "Voice Scripts" section to Admin Settings to edit:
- `voice_greeting_es` / `voice_greeting_en`
- `voice_hold_es` / `voice_hold_en`
- `voice_recording_notice_es` / `voice_recording_notice_en`

