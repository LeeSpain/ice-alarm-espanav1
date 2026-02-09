

# Fix twilio-voice Deployment -- Missing Import Fix

## Problem

The `twilio-voice` function is NOT deployed because line 1 still uses the old Deno `serve` import that causes a bundle timeout:

```
Line 1:  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";  // BROKEN
Line 11: serve(async (req) => {  // uses old serve
```

The previous fix only updated the `createClient` import on line 2 but missed this one. No logs exist because the function never deployed.

## Fix (2 line changes, same file)

**File: `supabase/functions/twilio-voice/index.ts`**

1. **Delete line 1** -- remove `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";`
2. **Line 11** -- change `serve(async (req) => {` to `Deno.serve(async (req) => {`

Then deploy the function.

## What This Restores

- Incoming calls answered by Isabel (AI voice assistant)
- Speech recognition and AI conversation
- "Call and Speak" callback connections
- Member identification and personalized greetings

