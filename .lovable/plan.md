
## Problem Analysis

The user is seeing validation errors ("Name: Project name is required" and "Duration: This duration is not allowed by the selected template") only when they reach the Preview step. This creates a poor UX because:

1. **No real-time validation feedback**: Validation errors only appear after user interaction (blur) or at the final preview step
2. **No step-specific validation**: Users can proceed through steps even though required fields are empty or mismatched with template constraints
3. **Late discovery**: Only when reaching Preview do users realize their choices are invalid

## Root Cause

Looking at the code:
- Validation runs on every data change (`useEffect` in lines 200-204)
- Error display requires `touched.has(field)` to be true (showing only after blur/click)
- The `PreviewStep` shows all errors at once, but users have already invested time in the wizard

## Solution Approach

**Option 1 (Recommended): Proactive Step Validation**
- Add an **optional step-level validation** that prevents users from proceeding to the next step if the current step has errors
- Keep the blur-based error display within each step for UX
- Add a preventative check in `handleNext()` that validates current step fields before allowing progression

**Option 2: Enhanced Real-time Feedback**
- Show validation errors immediately as user types (without requiring blur)
- Add a visual indicator on the step progress bar for steps with errors
- Keep the current blur-based UX but add more guidance

**Option 3: Hybrid - Silent Validation + Clear Messaging**
- Keep current blur-based display
- But change the Preview step message to be more actionable: instead of just listing errors, include a "Fix & Continue" button that jumps back to the problematic step
- Add a summary hint at the top showing which steps need attention

## Technical Details

**For Option 1** (Recommended):
- Modify `handleNext()` to check if current step contains validation errors in touched fields
- Identify which fields belong to each step (hardcode a `STEP_FIELDS` mapping)
- If errors exist, show a toast or inline alert: "Please complete all required fields in this step before continuing"
- Don't prevent navigation, but provide clear guidance

**For better UX**, also enhance:
- `TemplateSelectionStep`: Show "Project Name" and "Template" error feedback inline even without blur (since these are critical to proceed)
- `FormatDurationStep`: Show duration/format errors clearly with template constraints displayed

## Files to Modify

1. `src/components/admin/video-hub/VideoCreateTab.tsx`
   - Add `STEP_FIELDS` constant mapping steps to their required fields
   - Modify `handleNext()` to validate current step
   - Optionally mark all fields in TemplateSelectionStep as touched on first interaction
   - Enhance step-specific field validation feedback

## Why This Fixes the Issue

- Users get **immediate feedback** when they make selections (template selection auto-touches the field)
- Users **cannot accidentally proceed** with invalid choices for that step
- The **preview step** becomes more of a review rather than a surprise error catch
- **Clear messaging** guides users on what needs fixing

## Implementation Priority

1. Add `STEP_FIELDS` mapping and step validation logic
2. Enhance `TemplateSelectionStep` to auto-touch fields on user action
3. Test full wizard flow
