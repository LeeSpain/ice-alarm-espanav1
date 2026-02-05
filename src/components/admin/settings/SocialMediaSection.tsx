import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Facebook,
  Check,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SocialMediaSectionProps {
  facebookPageId: string;
  setFacebookPageId: React.Dispatch<React.SetStateAction<string>>;
  facebookTokenInput: string;
  setFacebookTokenInput: React.Dispatch<React.SetStateAction<string>>;
  facebookTokenStored: boolean;
  showFacebookToken: boolean;
  setShowFacebookToken: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveFacebook: () => void;
  isSaving: boolean;
  isConfigured: boolean;
}

export function SocialMediaSection({
  facebookPageId,
  setFacebookPageId,
  facebookTokenInput,
  setFacebookTokenInput,
  facebookTokenStored,
  showFacebookToken,
  setShowFacebookToken,
  handleSaveFacebook,
  isSaving,
  isConfigured,
}: SocialMediaSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Facebook Page
            {isConfigured ? (
              <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
                <Check className="mr-1 h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 ml-2">
                <AlertCircle className="mr-1 h-3 w-3" />
                Not Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Connect your Facebook Page to publish social media posts. Get credentials from the{" "}
            <a
              href="https://developers.facebook.com/tools/explorer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Meta Graph API Explorer
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page ID</Label>
              <Input
                value={facebookPageId}
                onChange={(e) => setFacebookPageId(e.target.value)}
                placeholder="123456789012345"
              />
              <p className="text-xs text-muted-foreground">
                Use the numeric Page ID from <code>/me/accounts</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Page Access Token</Label>
              {facebookTokenStored && !facebookTokenInput && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Token saved (hidden for security). Paste a new token below to replace it.</span>
                </div>
              )}
              <div className="relative">
                <Input
                  type={showFacebookToken ? "text" : "password"}
                  value={facebookTokenInput}
                  onChange={(e) => setFacebookTokenInput(e.target.value)}
                  placeholder={facebookTokenStored ? "Paste new token to replace..." : "EAA..."}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 z-10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowFacebookToken((prev) => !prev)}
                >
                  {showFacebookToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use a <strong>Page Access Token</strong> (from <code>/me/accounts</code>) with{" "}
                <code>pages_manage_posts</code>.
              </p>
            </div>
          </div>

          <Button onClick={handleSaveFacebook} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Facebook Configuration
          </Button>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Required Permissions</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                • <code>pages_manage_posts</code> - Publish and manage posts
              </li>
              <li>
                • <code>pages_read_engagement</code> - Read post metrics
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
