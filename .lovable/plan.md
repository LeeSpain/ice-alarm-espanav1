# Project Plan

This file is used for tracking implementation plans for features in progress.

---

## Recently Completed

### Partner Invite Link Tracking (Jan 2026)
- Added "viewed" status to `invite_status` enum
- Added `viewed_at` and `view_count` columns to `partner_invites` table
- Created `track-invite-view` edge function (public, no auth required)
- Landing page now tracks when referral links are opened
- Status colors updated in PartnerInvitesPage, PartnerDetailPage, and ReferralPipeline
- Translations added for "viewed" status in EN/ES

### Member Update Feature (Jan 2026)
- Created `member_update_tokens` table for secure 7-day tokens
- Three edge functions: `send-member-update-request`, `validate-member-update-token`, `submit-member-update`
- Public `/member-update` page for members to update info without login
- "Request Member Update" button on CRM Tab in member detail
- Bilingual email templates via Resend
