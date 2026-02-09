
# Fix Voice Calling - Deploy twilio-voice Function

## Problem

When you call the phone number, you get an "application error" because the `twilio-voice` backend function failed to deploy. It uses an outdated import style (`esm.sh`) that causes deployment timeouts -- the same issue we already fixed for `facebook-metrics`, `twilio-sms`, and `twilio-call-me`.

## Fix (1 file)

**File: `supabase/functions/twilio-voice/index.ts`**

1. **Fix import** (line 2): Change `esm.sh` to `npm:` to prevent bundle timeout
2. **Fix security vulnerability** (line 215): Replace unsafe `.or()` string interpolation with two separate safe `.eq()` queries (same pattern used in the `twilio-call-me` fix)

## Technical Details

**Import fix:**
```
Before: import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
After:  import { createClient } from "npm:@supabase/supabase-js@2";
```

**SQL injection fix (line 212-216):**
```
Before:
  const { data: member } = await supabase
    .from("members")
    .select("id, first_name, last_name, preferred_language")
    .or(`phone.eq.${from},phone.eq.${from.replace("+", "")}`)
    .maybeSingle();

After:
  let member = null;
  const { data: memberByExact } = await supabase
    .from("members")
    .select("id, first_name, last_name, preferred_language")
    .eq("phone", from)
    .maybeSingle();
  if (memberByExact) {
    member = memberByExact;
  } else {
    const { data: memberByNormalized } = await supabase
      .from("members")
      .select("id, first_name, last_name, preferred_language")
      .eq("phone", from.replace("+", ""))
      .maybeSingle();
    member = memberByNormalized;
  }
```

## What This Restores

- Incoming calls answered by Isabel (AI voice assistant)
- Speech recognition and AI-powered conversation
- Call-back via "Call and Speak" feature connecting properly
- Member identification and personalized greetings

## Note

There are 42 other edge functions still using the old `esm.sh` import. They may also fail to deploy. After this fix, we can batch-update the remaining functions if needed.
