

# Complete Staff Documentation - Implementation Plan

## Overview

Populate the `documentation` table with comprehensive, professionally-written documents across all 6 categories for ICE Alarm España's staff and AI systems. All documents will be created in both English and Spanish, published status, with appropriate visibility and importance ratings.

---

## Document Categories & Content Plan

### 1. Emergency Protocols (category: `emergency`)
**Importance: 9-10** | **Visibility: staff, ai** | **Priority: Highest**

| Document Title | Language | Importance | Tags |
|---------------|----------|------------|------|
| SOS Alert Response Protocol | EN/ES | 10 | sos, emergency, response |
| Fall Detection Alert Protocol | EN/ES | 10 | fall, detection, response |
| Device Offline Alert Procedure | EN/ES | 9 | offline, device, troubleshooting |
| Emergency Escalation Guidelines | EN/ES | 10 | escalation, supervisor, 112 |
| Member Non-Response Protocol | EN/ES | 9 | non-response, safety-check |

**Content includes:**
- Step-by-step response procedures
- Response time requirements (<30 seconds)
- When to call 112 (Spanish emergency number)
- Supervisor escalation triggers
- Documentation requirements

---

### 2. Device Guides (category: `device`)
**Importance: 7-9** | **Visibility: staff, ai, member**

| Document Title | Language | Importance | Tags |
|---------------|----------|------------|------|
| EV-07B Pendant Complete Guide | EN/ES | 9 | ev07b, pendant, setup |
| Pendant Charging & Battery Care | EN/ES | 8 | battery, charging, maintenance |
| Pendant Troubleshooting Guide | EN/ES | 8 | troubleshooting, issues, support |
| GPS & Location Features | EN/ES | 7 | gps, location, tracking |
| Fall Detection Settings | EN/ES | 8 | fall-detection, sensitivity |

**Content includes:**
- Device specifications (IP67, LTE, 5-day battery)
- Setup instructions
- Charging procedures (magnetic USB, 2-hour full charge)
- Common issues and solutions
- Care and maintenance tips

---

### 3. Staff Instructions (category: `staff`)
**Importance: 7-9** | **Visibility: staff, ai**

| Document Title | Language | Importance | Tags |
|---------------|----------|------------|------|
| Daily Shift Procedures | EN/ES | 9 | shift, procedures, daily |
| Member Information Lookup | EN/ES | 8 | member, lookup, crm |
| Courtesy Call Guidelines | EN/ES | 7 | courtesy-calls, check-in |
| Shift Handover Protocol | EN/ES | 8 | handover, shift-change |
| Communication Standards | EN/ES | 7 | communication, professionalism |

**Content includes:**
- Start/end shift checklists
- How to search and access member profiles
- Courtesy call scripts and timing
- Handover documentation requirements
- Professional communication guidelines (bilingual EN/ES)

---

### 4. General (category: `general`)
**Importance: 5-7** | **Visibility: admin, staff, ai**

| Document Title | Language | Importance | Tags |
|---------------|----------|------------|------|
| Company Overview | EN/ES | 7 | company, about, mission |
| Service Pricing & Plans | EN/ES | 8 | pricing, membership, plans |
| Data Privacy & GDPR Compliance | EN/ES | 8 | gdpr, privacy, data-protection |
| Working Hours & Contact Information | EN/ES | 6 | hours, contact, support |
| Glossary of Terms | EN/ES | 5 | glossary, terminology |

**Content includes:**
- ICE Alarm España company background
- Pricing structure (Single €27.49/mo, Couple €38.49/mo, Pendant €151.25)
- GDPR/LOPD compliance information
- 24/7 support center details
- Common terminology definitions

---

### 5. Member Guides (category: `member_guide`)
**Importance: 6-8** | **Visibility: member, staff, ai**

| Document Title | Language | Importance | Tags |
|---------------|----------|------------|------|
| Getting Started with ICE Alarm | EN/ES | 8 | getting-started, onboarding |
| Managing Your Emergency Contacts | EN/ES | 8 | contacts, emergency, update |
| Updating Medical Information | EN/ES | 8 | medical, health, update |
| Using the Member Dashboard | EN/ES | 7 | dashboard, account, profile |
| How to Test Your Pendant | EN/ES | 7 | testing, pendant, functionality |
| Billing & Subscription FAQ | EN/ES | 6 | billing, subscription, payment |

**Content includes:**
- First-time setup guide
- How to add/edit up to 3 emergency contacts
- Medical profile management (conditions, medications, allergies)
- Dashboard navigation
- Monthly test procedures
- Subscription management

---

### 6. Partner Info (category: `partner`)
**Importance: 6-8** | **Visibility: staff, ai**

| Document Title | Language | Importance | Tags |
|---------------|----------|------------|------|
| Partner Program Overview | EN/ES | 8 | partner, referral, program |
| Commission Structure & Payments | EN/ES | 8 | commission, payment, earnings |
| Partner Dashboard Guide | EN/ES | 7 | dashboard, tools, referrals |
| Marketing Materials & Guidelines | EN/ES | 7 | marketing, branding, materials |
| Partner Agreement Requirements | EN/ES | 8 | agreement, legal, compliance |

**Content includes:**
- €50 commission per referral
- 7-day holding period before payment approval
- Referral link and QR code generation
- Marketing presentation downloads (PDF/PPTX)
- Spanish ID (NIF/NIE/CIF) requirement
- Legal agreement signing process

---

## Database Migration

Create a single migration to insert all documentation records:

```sql
-- Insert all documentation records
-- Each document includes:
--   - Unique slug
--   - Category (emergency/device/staff/general/member_guide/partner)
--   - Full professional content
--   - Visibility array
--   - Importance (1-10)
--   - Tags array
--   - Language (en/es)
--   - Status: published
```

---

## Document Content Standards

### Formatting
- Use Markdown formatting for structure
- Include headers (##, ###) for sections
- Use bullet points for lists
- Include numbered steps for procedures
- Add **bold** for emphasis on critical points

### Length Guidelines
- Emergency protocols: 400-600 words (detailed procedures)
- Device guides: 300-500 words (practical instructions)
- Staff instructions: 300-400 words (clear procedures)
- General: 200-400 words (informational)
- Member guides: 250-400 words (user-friendly)
- Partner info: 300-400 words (professional)

### Bilingual Requirement
- Each document created in both EN and ES
- Total: ~60 documents (30 in each language)

---

## Implementation Summary

| Category | Documents (EN) | Documents (ES) | Total |
|----------|----------------|----------------|-------|
| Emergency Protocols | 5 | 5 | 10 |
| Device Guides | 5 | 5 | 10 |
| Staff Instructions | 5 | 5 | 10 |
| General | 5 | 5 | 10 |
| Member Guides | 6 | 6 | 12 |
| Partner Info | 5 | 5 | 10 |
| **TOTAL** | **31** | **31** | **62** |

---

## Technical Implementation

### Migration File
- Single SQL migration file with all INSERT statements
- Uses proper escaping for content with apostrophes
- Sets `status = 'published'` for immediate availability
- Sets `created_by` and `updated_by` to NULL (system-generated)

### Content Delivery
After migration runs:
- Staff can view documents at `/call-centre/documents`
- Documents with `member` visibility appear in member Help Center
- AI agents receive documents with `ai` visibility in their context

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[timestamp]_seed_documentation.sql` | Insert all 62 documents |

No code changes required - documentation system is already fully functional.

