import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Settings,
} from "lucide-react";
import {
  useSocialPublish,
  SocialPlatform,
  PublishResult,
} from "@/hooks/useSocialPublish";
import { useSocialPosts, SocialPost } from "@/hooks/useSocialPosts";

interface SocialPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: SocialPost | null;
}

interface PlatformOption {
  id: SocialPlatform;
  label: string;
  icon: string;
}

const PLATFORMS: PlatformOption[] = [
  { id: "facebook", label: "Facebook", icon: "f" },
  { id: "instagram", label: "Instagram", icon: "ig" },
  { id: "twitter", label: "Twitter / X", icon: "x" },
  { id: "linkedin", label: "LinkedIn", icon: "in" },
  { id: "youtube", label: "YouTube", icon: "yt" },
];

export function SocialPublishDialog({
  open,
  onOpenChange,
  post,
}: SocialPublishDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    Set<SocialPlatform>
  >(new Set());
  const [results, setResults] = useState<PublishResult[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const {
    platformStatuses,
    isLoadingStatuses,
    publishToInstagram,
    publishToTwitter,
    publishToLinkedIn,
    publishToMultiple,
  } = useSocialPublish();

  const { publishPost } = useSocialPosts();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPlatforms(new Set());
      setResults([]);
      setIsPublishing(false);
    }
  }, [open]);

  const isConnected = (platform: SocialPlatform): boolean => {
    return (
      platformStatuses.find((s) => s.platform === platform)?.connected || false
    );
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    if (!post || selectedPlatforms.size === 0) return;

    setIsPublishing(true);
    setResults([]);

    const allResults: PublishResult[] = [];

    // Handle Facebook separately (uses existing publish mechanism)
    if (selectedPlatforms.has("facebook")) {
      try {
        await publishPost(post.id);
        allResults.push({
          success: true,
          platform: "facebook",
        });
      } catch (error: any) {
        allResults.push({
          success: false,
          platform: "facebook",
          error: error.message,
        });
      }
    }

    // Handle other platforms via the unified publish hook
    const otherPlatforms = Array.from(selectedPlatforms).filter(
      (p) => p !== "facebook"
    );
    if (otherPlatforms.length > 0) {
      const multiResults = await publishToMultiple(post.id, otherPlatforms);
      allResults.push(...multiResults);
    }

    setResults(allResults);
    setIsPublishing(false);
  };

  const hasResults = results.length > 0;
  const allSuccessful =
    hasResults && results.every((r) => r.success);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("social.publishDialogTitle", "Publish to Social Media")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "social.publishDialogDescription",
              "Select the platforms to publish this post to."
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Post Preview */}
        {post && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-1">
              {t("social.postPreview", "Post Preview")}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.post_text || t("social.noContent", "No content")}
            </p>
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post preview"
                className="mt-2 rounded-md max-h-32 object-cover w-full"
              />
            )}
          </div>
        )}

        <Separator />

        {/* Platform Selection */}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-3">
            {PLATFORMS.map((platform) => {
              const connected = isConnected(platform.id);
              const result = results.find(
                (r) => r.platform === platform.id
              );

              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`platform-${platform.id}`}
                      checked={selectedPlatforms.has(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                      disabled={!connected || isPublishing || hasResults}
                    />
                    <label
                      htmlFor={`platform-${platform.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {platform.label}
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Publish result indicator */}
                    {result && (
                      <>
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </>
                    )}

                    {/* Connection status badge */}
                    {isLoadingStatuses ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : connected ? (
                      <Badge variant="secondary" className="text-xs">
                        {t("social.connected", "Connected")}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => navigate("/admin/settings")}
                      >
                        <Settings className="h-3 w-3" />
                        {t("social.connect", "Connect")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Error messages from results */}
        {results.some((r) => !r.success) && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive mb-1">
              {t("social.someErrors", "Some platforms encountered errors:")}
            </p>
            {results
              .filter((r) => !r.success)
              .map((r) => (
                <p
                  key={r.platform}
                  className="text-xs text-destructive/80"
                >
                  {r.platform}: {r.error}
                </p>
              ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {hasResults
              ? t("common.close", "Close")
              : t("common.cancel", "Cancel")}
          </Button>
          {!hasResults && (
            <Button
              onClick={handlePublish}
              disabled={selectedPlatforms.size === 0 || isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("social.publishing", "Publishing...")}
                </>
              ) : (
                t("social.publish", "Publish")
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
