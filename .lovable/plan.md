

## Test Mode for Free Registration Flow

### Overview
Add a "Test Mode" option to the Join Wizard payment step that allows completing the full registration flow without actual payment. This is useful for testing the end-to-end process (member creation, order creation, subscription setup, confirmation page) without going through Stripe.

### How It Works

When test mode is enabled:
1. A "Complete Order (FREE - Test Mode)" button appears on the payment step
2. Clicking it bypasses Stripe checkout entirely
3. The registration is still created in the database with all member/order/subscription records
4. The order is marked as a test order
5. User is redirected to the confirmation page as if payment succeeded

### Implementation

#### 1. Add Admin Setting for Test Mode
Create a new `system_settings` entry: `registration_test_mode_enabled`
- Default: `false`
- When `true`: Shows the free test button in the payment step
- Controlled from Admin Settings → Pricing tab

#### 2. Update `usePricingSettings` Hook
Add a new field `testModeEnabled` that reads the `registration_test_mode_enabled` setting.

#### 3. Update `JoinPaymentStep` Component
- Import the new `testModeEnabled` flag from `usePricingSettings`
- Add a second button: "Complete FREE (Test Mode)" 
- This button calls `submit-registration` but skips `create-checkout`
- Instead, directly marks payment as complete and redirects to confirmation

#### 4. Update `submit-registration` Edge Function
- Accept an optional `testMode: boolean` parameter
- When `testMode = true`:
  - Mark payment status as `completed` (not `pending`)
  - Mark order status as `completed`
  - Mark subscription as `active`
  - Mark member as `active`
  - Add a note indicating this was a test order
  - Skip Stripe checkout step

#### 5. Add Settings UI Control
In Admin Settings → Pricing tab, add a toggle:
- "Enable Test Mode (allows free registration for testing)"
- Warning text explaining this should only be used in test environments

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/usePricingSettings.ts` | Add `testModeEnabled` field |
| `src/components/join/steps/JoinPaymentStep.tsx` | Add test mode button and handler |
| `supabase/functions/submit-registration/index.ts` | Handle `testMode` flag to auto-complete |
| `src/pages/admin/SettingsPage.tsx` | Add test mode toggle in Pricing tab |

### Database Changes
Insert new setting via migration:
```sql
INSERT INTO system_settings (key, value, updated_at)
VALUES ('registration_test_mode_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;
```

### Detailed Code Changes

#### A. Update `usePricingSettings.ts`
```typescript
// Add to query keys array
.in("key", ["registration_fee_enabled", "registration_fee_discount", "registration_test_mode_enabled"])

// Add to return object
testModeEnabled: settings?.testModeEnabled ?? false,
```

#### B. Update `JoinPaymentStep.tsx`
```tsx
const { registrationFeeEnabled, registrationFeeDiscount, testModeEnabled } = usePricingSettings();

const handleTestModeComplete = async () => {
  setIsProcessing(true);
  setError(null);
  try {
    // Submit registration with testMode flag
    const { data: registrationResult, error: registrationError } = await supabase.functions.invoke(
      "submit-registration", 
      { body: { ...registrationData, testMode: true } }
    );
    
    if (registrationError) throw new Error(registrationError.message);
    if (!registrationResult?.success) throw new Error(registrationResult?.error);
    
    onUpdate({ 
      memberId: registrationResult.memberId, 
      orderId: registrationResult.orderNumber,
      paymentComplete: true 
    });
    
    onPaymentInitiated();
    clearReferralData();
    
    // Navigate directly to success
    window.location.href = `${window.location.origin}/join?success=true&order=${registrationResult.orderNumber}`;
  } catch (err) {
    setError(err instanceof Error ? err.message : "An unexpected error occurred");
  } finally {
    setIsProcessing(false);
  }
};

// In render, add test mode button if enabled
{testModeEnabled && (
  <Button 
    onClick={handleTestModeComplete}
    variant="outline"
    className="w-full h-12 text-base gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
    disabled={isProcessing}
  >
    <Gift className="h-5 w-5" />
    Complete FREE (Test Mode)
  </Button>
)}
```

#### C. Update `submit-registration/index.ts`
```typescript
interface RegistrationRequest {
  // ... existing fields
  testMode?: boolean; // NEW
}

// After creating all records, if testMode:
if (body.testMode) {
  // Mark everything as completed
  await supabase.from("payments").update({ 
    status: "completed", 
    paid_at: new Date().toISOString(),
    notes: "TEST MODE - No payment collected"
  }).eq("id", paymentData.id);
  
  await supabase.from("orders").update({ 
    status: "completed" 
  }).eq("id", orderData.id);
  
  await supabase.from("subscriptions").update({ 
    status: "active",
    registration_fee_paid: true
  }).eq("id", subscriptionData.id);
  
  await supabase.from("members").update({ 
    status: "active" 
  }).eq("id", primaryMemberData.id);
  
  if (partnerMemberData) {
    await supabase.from("members").update({ 
      status: "active" 
    }).eq("id", partnerMemberData.id);
  }
  
  console.log("TEST MODE: All records marked as completed without payment");
}
```

#### D. Add Settings Toggle
In the Pricing tab of SettingsPage, add:
```tsx
<div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200">
  <div>
    <Label htmlFor="test-mode">Enable Test Mode</Label>
    <p className="text-sm text-muted-foreground">
      Allow completing registrations for free (testing only)
    </p>
  </div>
  <Switch 
    id="test-mode"
    checked={testModeEnabled}
    onCheckedChange={(checked) => handleSaveTestMode(checked)}
  />
</div>
```

### Security Considerations
- Test mode button is only visible when enabled in admin settings
- All test orders are clearly marked in the database
- The toggle is only accessible to super_admin users
- Consider adding an audit log entry when test mode is used

### Testing Flow
1. Go to Admin Settings → Pricing
2. Enable "Test Mode"
3. Go to /join and complete the wizard
4. On payment step, click "Complete FREE (Test Mode)"
5. Verify you reach the confirmation page
6. Check database: member is active, order is completed, payment shows "TEST MODE" note

