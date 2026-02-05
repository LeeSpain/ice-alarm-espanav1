

# YouTube Integration Plan

## Overview

Add YouTube API integration to Admin Settings → Communications with OAuth-based channel connection and publish-to-YouTube functionality in Video Hub. This follows the existing Facebook integration pattern.

---

## Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Admin Settings → Communications → Social Media (sub-tab)               │
├─────────────────────────────────────────────────────────────────────────┤
│ [Facebook Card]  [YouTube Card - NEW]                                   │
│                                                                          │
│ YouTube Integration                                                     │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Status: Connected / Not Connected                                   │ │
│ │ Channel: ICE Alarm España (UCT9_R7Czan0lPFvq5XyV5kg)               │ │
│ │ Last used: Feb 5, 2026                                              │ │
│ │                                                                      │ │
│ │ [Connect YouTube]  [Refresh]  [Disconnect]                          │ │
│ │                                                                      │ │
│ │ Default Settings (collapsible):                                     │ │
│ │   • Default visibility: Unlisted                                    │ │
│ │   • Default playlist: ICE Alarm Videos                              │ │
│ │   • Default tags: ice alarm, elderly care, spain                    │ │
│ │   • Default description footer: (auto-disclaimer)                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Database Schema

### New Table: `system_integrations`

Stores OAuth tokens and integration metadata securely (tokens encrypted via service role):

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| integration_type | text | `youtube` |
| provider | text | `google` |
| channel_id | text | YouTube channel ID |
| channel_name | text | Channel display name |
| access_token_encrypted | text | Encrypted OAuth access token |
| refresh_token_encrypted | text | Encrypted OAuth refresh token |
| scopes | text[] | Authorized OAuth scopes |
| status | text | `connected` / `disconnected` / `expired` |
| connected_at | timestamptz | When first connected |
| last_used_at | timestamptz | Last successful API call |
| expires_at | timestamptz | Token expiration time |
| connected_by | uuid | Staff user who connected |
| metadata | jsonb | Extra data (thumbnail URL, etc.) |

### Extend `video_exports` Table

Add YouTube publishing fields:

| Column | Type | Description |
|--------|------|-------------|
| youtube_video_id | text | YouTube video ID after upload |
| youtube_url | text | Full YouTube URL |
| youtube_status | text | `queued` / `uploading` / `published` / `failed` |
| youtube_error | text | Error message if failed |
| youtube_published_at | timestamptz | When published to YouTube |

### New `system_settings` Keys

| Key | Description |
|-----|-------------|
| `settings_youtube_default_visibility` | `public` / `unlisted` / `private` |
| `settings_youtube_default_playlist` | Playlist ID |
| `settings_youtube_default_tags` | Comma-separated tags |
| `settings_youtube_default_description_footer` | Footer text for all videos |

---

## Stage 2: Edge Functions

### 2.1 `youtube-oauth-start` (NEW)

Initiates OAuth flow:
- Validates staff user is admin
- Generates state token, stores in DB
- Returns Google OAuth authorization URL

### 2.2 `youtube-oauth-callback` (NEW)

Handles OAuth callback:
- Validates state token
- Exchanges authorization code for tokens
- Fetches channel info via YouTube API
- Validates channel ID matches `UCT9_R7Czan0lPFvq5XyV5kg`
- Stores encrypted tokens in `system_integrations`
- Shows warning if channel doesn't match expected

### 2.3 `youtube-refresh-token` (NEW)

Refreshes expired access tokens:
- Called automatically before API calls
- Uses refresh_token to get new access_token
- Updates expiry in database

### 2.4 `youtube-disconnect` (NEW)

Disconnects YouTube:
- Revokes Google OAuth token
- Deletes integration record
- Clears related settings

### 2.5 `youtube-publish` (NEW)

Uploads video to YouTube:
- Input: `video_export_id`, metadata (title, description, visibility, tags, playlist)
- Validates integration exists and tokens valid
- Refreshes token if needed
- Uploads video using YouTube Data API v3 resumable upload
- Updates `video_exports` with YouTube URL and status
- Handles errors gracefully

### 2.6 `youtube-integration-status` (NEW)

Returns integration status for UI:
- Channel name, ID, connected status
- Last used timestamp
- Validates against expected channel ID

---

## Stage 3: Admin UI - YouTube Settings

### Update `SocialMediaSection.tsx`

Add YouTube card below Facebook card:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Youtube className="h-5 w-5 text-red-600" />
      YouTube Channel
      {youtubeConfigured ? (
        <Badge className="bg-alert-resolved">Connected</Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-500/10">Not Connected</Badge>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent>
    {youtubeIntegration ? (
      <>
        <div className="space-y-2 mb-4">
          <p><strong>Channel:</strong> {youtubeIntegration.channel_name}</p>
          <p className="text-sm text-muted-foreground">
            ID: {youtubeIntegration.channel_id}
            {youtubeIntegration.channel_id !== EXPECTED_CHANNEL_ID && (
              <AlertCircle className="inline ml-2 text-amber-500" />
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Last used: {format(youtubeIntegration.last_used_at, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshYouTube}>Refresh</Button>
          <Button variant="destructive" onClick={handleDisconnectYouTube}>Disconnect</Button>
        </div>
      </>
    ) : (
      <Button onClick={handleConnectYouTube}>
        <Youtube className="mr-2 h-4 w-4" />
        Connect YouTube Channel
      </Button>
    )}

    {/* Collapsible Default Settings */}
    <Collapsible className="mt-6">
      <CollapsibleTrigger>Publishing Defaults</CollapsibleTrigger>
      <CollapsibleContent>
        {/* Default visibility, playlist, tags, description footer */}
      </CollapsibleContent>
    </Collapsible>
  </CardContent>
</Card>
```

### Props Flow

Add to `CommunicationsTabProps`:
- `youtubeIntegration` - fetched integration status
- `youtubeConfigured` - boolean
- `handleConnectYouTube()` - opens OAuth popup
- `handleDisconnectYouTube()` - calls disconnect endpoint
- `handleRefreshYouTube()` - refreshes connection
- YouTube default settings state

---

## Stage 4: Video Hub - Publish to YouTube

### Update `VideoExportsTab.tsx`

Add YouTube publish button per export:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => handlePublishToYouTube(exp)}
  disabled={!youtubeConnected || exp.youtube_status === "published"}
>
  <Youtube className="mr-1 h-4 w-4 text-red-600" />
  {exp.youtube_status === "published" ? "Published" : "Publish to YouTube"}
</Button>

{exp.youtube_url && (
  <a href={exp.youtube_url} target="_blank" className="text-primary underline">
    Open on YouTube
  </a>
)}
```

### YouTube Publish Dialog

Modal with fields:
- **Title** (required) - pre-filled from project name
- **Description** (required) - pre-filled with AI-generated or default
- **Visibility** - Public / Unlisted / Private (default from settings)
- **Tags** (optional) - comma-separated, pre-filled from defaults
- **Playlist** (optional) - dropdown of playlists
- **Made for kids** - toggle (default OFF, required by YouTube)

### Not Connected State

If YouTube not connected, show banner:

```tsx
{!youtubeConnected && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>YouTube Not Connected</AlertTitle>
    <AlertDescription>
      Connect your YouTube channel in 
      <Link to="/admin/settings#communications/social">Admin Settings</Link>
      to publish videos.
    </AlertDescription>
  </Alert>
)}
```

---

## Stage 5: Secrets Required

The following secrets need to be configured (via Cloud secrets):

| Secret | Description |
|--------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |

These are obtained from Google Cloud Console:
1. Create OAuth 2.0 credentials
2. Set authorized redirect URI to edge function callback URL
3. Enable YouTube Data API v3

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | CREATE | Add `system_integrations` table, extend `video_exports` |
| `supabase/functions/youtube-oauth-start/index.ts` | CREATE | Initiate OAuth flow |
| `supabase/functions/youtube-oauth-callback/index.ts` | CREATE | Handle OAuth callback |
| `supabase/functions/youtube-publish/index.ts` | CREATE | Upload video to YouTube |
| `supabase/functions/youtube-disconnect/index.ts` | CREATE | Disconnect integration |
| `supabase/functions/youtube-integration-status/index.ts` | CREATE | Get connection status |
| `supabase/config.toml` | EDIT | Add new edge functions |
| `src/components/admin/settings/SocialMediaSection.tsx` | EDIT | Add YouTube card |
| `src/components/admin/settings/CommunicationsTab.tsx` | EDIT | Pass YouTube props |
| `src/pages/admin/SettingsPage.tsx` | EDIT | Add YouTube state and handlers |
| `src/components/admin/video-hub/VideoExportsTab.tsx` | EDIT | Add YouTube publish button |
| `src/components/admin/video-hub/YouTubePublishDialog.tsx` | CREATE | Publish form modal |
| `src/hooks/useYouTubeIntegration.ts` | CREATE | Hook for integration status |
| `src/i18n/locales/en.json` | EDIT | Add YouTube translations |
| `src/i18n/locales/es.json` | EDIT | Add YouTube translations |

---

## Security Considerations

1. **Tokens never exposed to frontend** - All token storage and API calls happen in edge functions
2. **Admin-only access** - OAuth connect/disconnect requires `super_admin` role
3. **Channel verification** - Warns if connected channel doesn't match expected ID
4. **Encrypted storage** - Access/refresh tokens stored encrypted in database
5. **Token refresh** - Automatic refresh before expiry

---

## OAuth Flow Diagram

```text
1. Admin clicks "Connect YouTube"
   ↓
2. Frontend calls youtube-oauth-start edge function
   ↓
3. Edge function returns Google OAuth URL with scopes
   ↓
4. Browser opens popup to Google consent screen
   ↓
5. User authorizes, Google redirects to callback URL
   ↓
6. youtube-oauth-callback exchanges code for tokens
   ↓
7. Edge function fetches channel info via YouTube API
   ↓
8. Validates channel ID, stores tokens in system_integrations
   ↓
9. Popup closes, UI refreshes to show connected status
```

---

## Implementation Order

1. **Database migration** - Create tables and columns
2. **Edge functions** - OAuth flow, publish, status
3. **Admin UI** - YouTube settings card
4. **Video Hub** - Publish dialog and buttons
5. **Translations** - EN/ES locale keys
6. **Testing** - End-to-end OAuth and upload flow

---

## Expected Channel Verification

The target channel ID `UCT9_R7Czan0lPFvq5XyV5kg` will be verified after OAuth connection. If the connected account's channel ID differs, a warning will be displayed but connection will still be allowed (in case the channel needs to change in the future).

