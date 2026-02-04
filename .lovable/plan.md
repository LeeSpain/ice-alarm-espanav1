
# Update Homepage Phone Number to Twilio Number

## Current State

| Setting | Current Value |
|---------|---------------|
| `settings_emergency_phone` (displayed on website) | `+34 950473199` |
| `settings_twilio_phone_number` (Twilio Voice) | `+18143833159` |

The homepage phone button currently displays a different number than what's connected to Twilio - meaning callers won't reach the AI agent.

## Solution

Update the `settings_emergency_phone` value in the database to match the Twilio phone number so all public-facing pages display the number that connects to the AI-powered call system.

## Impacted Areas

Once updated, the Twilio number will appear in:

1. **Homepage/Landing Page**
   - Hero section phone button
   - Contact dialog
   - Footer contact section

2. **Client Pages**
   - Support hub emergency card
   - Device management page

3. **Sales Pages**
   - Pendant product page
   - Join/Registration wizard

4. **AI Media Generation**
   - Social media post CTAs will include the correct number

## Implementation

Run a single database update to change the emergency phone setting:

```sql
UPDATE system_settings 
SET value = '+18143833159', 
    updated_at = now() 
WHERE key = 'settings_emergency_phone';
```

## Note on Number Format

The Twilio number is a US number (`+1 814 383 3159`). If a Spanish number is preferred for display, you would need to:
1. Purchase a Spanish (+34) number through Twilio Console
2. Configure it as the Voice webhook endpoint
3. Update both `settings_twilio_phone_number` and `settings_emergency_phone` to the new Spanish number

For now, updating to the existing Twilio US number ensures callers reach the AI agent.
