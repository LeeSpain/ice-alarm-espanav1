

# Communications Tab Redesign Plan

## Current State Analysis

The Communications tab is currently a long vertical scroll of 6 separate cards:
1. **Twilio Configuration** - Voice, SMS, WhatsApp credentials
2. **Google Maps Configuration** - Optional API key
3. **Facebook Page Configuration** - Social media publishing
4. **Voice Settings** - AI phone system scripts (VoiceSettingsSection component)
5. **Email Configuration** - Provider settings (EmailSettingsTab component)
6. **Email Templates** - Template editor (EmailTemplatesTab component)

**Problem**: Hard to navigate, no logical grouping, requires excessive scrolling.

---

## New Structure: Nested Sub-Tabs

Reorganize into 5 logical sub-tabs with clear icons:

| Sub-Tab | Icon | Contents |
|---------|------|----------|
| **Phone & SMS** | Phone | Twilio credentials + Voice Settings |
| **Email** | Mail | Email provider + Email templates |
| **Social Media** | Share2 | Facebook configuration |
| **Maps** | Map | Google Maps API key |
| **WhatsApp** | MessageCircle | WhatsApp-specific settings (extracted from Twilio) |

### Tab Layout Design

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Communications                                                       │
│ Configure phone, email, social media and messaging integrations     │
├─────────────────────────────────────────────────────────────────────┤
│ [Phone & SMS] [Email] [Social Media] [WhatsApp] [Maps]              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Selected sub-tab content renders here]                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. New Component: CommunicationsTab.tsx

Create a dedicated component that owns the nested tab structure:

```typescript
// src/components/admin/settings/CommunicationsTab.tsx
export function CommunicationsTab({
  twilioKeys,
  setTwilioKeys,
  twilioAuthTokenInput,
  setTwilioAuthTokenInput,
  twilioAuthTokenStored,
  // ... other props
}) {
  const [subTab, setSubTab] = useState("phone");
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Communications</h2>
        <p className="text-muted-foreground">
          Configure phone, email, social media and messaging integrations
        </p>
      </div>
      
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="phone">
            <Phone className="h-4 w-4 mr-2" />
            Phone & SMS
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="maps">
            <Map className="h-4 w-4 mr-2" />
            Maps
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="phone">
          <PhoneSmsSection ... />
        </TabsContent>
        
        <TabsContent value="email">
          <EmailSection ... />
        </TabsContent>
        
        {/* etc */}
      </Tabs>
    </div>
  );
}
```

### 2. Sub-Tab Components

Create focused section components for cleaner code:

| Component | Contents |
|-----------|----------|
| `PhoneSmsSection.tsx` | Twilio credentials (SID, Auth Token, Phone) + VoiceSettingsSection |
| `WhatsAppSection.tsx` | WhatsApp number + webhook info (extracted from Twilio card) |
| `SocialMediaSection.tsx` | Facebook configuration (existing card content) |
| `MapsSection.tsx` | Google Maps API key (existing card content) |

The Email sub-tab will directly render the existing `EmailSettingsTab` and `EmailTemplatesTab` components.

### 3. Visual Improvements

- **Status badges in tabs**: Show connection status (green checkmark or amber warning) next to each tab label
- **Cleaner cards**: Remove redundant headers where tab title is clear
- **Collapsible webhook sections**: Make webhook URL sections collapsible to reduce visual clutter
- **Consistent spacing**: Use consistent gap-6 between sections

### 4. Keep All Existing Functionality

All state management, save handlers, and API calls remain in SettingsPage.tsx - we just pass them down as props. This preserves:
- Twilio credential handling (including the secure token pattern)
- Test connection functionality
- Facebook token stored flag pattern
- Voice settings UPSERT logic
- Email provider switching
- Email template editor

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/settings/CommunicationsTab.tsx` | CREATE | New wrapper with nested tabs |
| `src/components/admin/settings/PhoneSmsSection.tsx` | CREATE | Twilio + Voice settings |
| `src/components/admin/settings/WhatsAppSection.tsx` | CREATE | WhatsApp configuration |
| `src/components/admin/settings/SocialMediaSection.tsx` | CREATE | Facebook configuration |
| `src/components/admin/settings/MapsSection.tsx` | CREATE | Google Maps configuration |
| `src/pages/admin/SettingsPage.tsx` | EDIT | Replace inline Communications content with CommunicationsTab component |

---

## Technical Notes

### Props Passed to CommunicationsTab

```typescript
interface CommunicationsTabProps {
  // Twilio
  twilioKeys: { account_sid: string; phone_number: string; whatsapp_number: string };
  setTwilioKeys: React.Dispatch<...>;
  twilioAuthTokenInput: string;
  setTwilioAuthTokenInput: React.Dispatch<...>;
  twilioAuthTokenStored: boolean;
  showTwilioToken: boolean;
  setShowTwilioToken: React.Dispatch<...>;
  twilioTestStatus: "idle" | "testing" | "success" | "error";
  twilioTestMessage: string;
  handleSaveTwilio: () => void;
  handleTestTwilio: () => Promise<void>;
  
  // Facebook
  facebookPageId: string;
  setFacebookPageId: React.Dispatch<...>;
  facebookTokenInput: string;
  setFacebookTokenInput: React.Dispatch<...>;
  facebookTokenStored: boolean;
  showFacebookToken: boolean;
  setShowFacebookToken: React.Dispatch<...>;
  handleSaveFacebook: () => void;
  
  // Google Maps
  googleMapsKey: string;
  setGoogleMapsKey: React.Dispatch<...>;
  handleSaveGoogleMaps: () => void;
  
  // Status helpers
  getIntegrationStatus: (keys: string[]) => boolean;
  saveMutation: UseMutationResult<...>;
  KEY: typeof KEY;
}
```

### URL Persistence

Add URL hash support so users can deep-link to sub-tabs:
- `/admin/settings#communications/email` opens Email sub-tab
- Default to "phone" if no hash specified

---

## Summary

- **No functionality removed** - all existing features preserved
- **Better organization** - 5 logical sub-tabs vs 6 stacked cards
- **Cleaner code** - extracted into focused section components
- **Better UX** - status badges, less scrolling, collapsible sections
- **Maintainable** - each communication channel in its own component

