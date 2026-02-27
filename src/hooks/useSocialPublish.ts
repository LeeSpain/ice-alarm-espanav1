import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "youtube";

export interface PlatformStatus {
  platform: SocialPlatform;
  connected: boolean;
  accountName?: string;
  lastPublished?: string;
}

export interface PublishResult {
  success: boolean;
  platform: SocialPlatform;
  externalPostId?: string;
  error?: string;
}

/**
 * Unified hook for multi-platform social media publishing.
 * Note: Instagram, Twitter/X, LinkedIn, and YouTube edge functions do not yet exist.
 * These hooks will call functions that return graceful errors until the backend is built.
 */
export function useSocialPublish() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [publishingPlatforms, setPublishingPlatforms] = useState<
    Set<SocialPlatform>
  >(new Set());

  /**
   * Fetch connection status for all platforms.
   * Checks system_settings for stored tokens/connection flags.
   */
  const connectionStatusQuery = useQuery({
    queryKey: ["social-platform-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "facebook_page_token",
          "instagram_access_token",
          "twitter_access_token",
          "linkedin_access_token",
          "youtube_access_token",
        ]);

      if (error) throw error;

      const settingsMap = (data || []).reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, string>
      );

      const statuses: PlatformStatus[] = [
        {
          platform: "facebook",
          connected: !!settingsMap.facebook_page_token,
        },
        {
          platform: "instagram",
          connected: !!settingsMap.instagram_access_token,
        },
        {
          platform: "twitter",
          connected: !!settingsMap.twitter_access_token,
        },
        {
          platform: "linkedin",
          connected: !!settingsMap.linkedin_access_token,
        },
        {
          platform: "youtube",
          connected: !!settingsMap.youtube_access_token,
        },
      ];

      return statuses;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Helper to invoke a platform-specific edge function.
   * Returns a graceful error for platforms without backend implementation.
   */
  const invokePlatformPublish = useCallback(
    async (
      platform: SocialPlatform,
      postId: string,
      functionName: string
    ): Promise<PublishResult> => {
      // Check if platform is connected first
      const statuses = connectionStatusQuery.data || [];
      const platformStatus = statuses.find((s) => s.platform === platform);

      if (!platformStatus?.connected) {
        return {
          success: false,
          platform,
          error: t(
            "social.notConnected",
            "{{platform}} is not connected. Please connect it in Settings.",
            { platform: platform.charAt(0).toUpperCase() + platform.slice(1) }
          ),
        };
      }

      try {
        // Get auth token for the request
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (sessionError || !accessToken) {
          throw new Error("Not authenticated. Please log in again.");
        }

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { post_id: postId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return {
          success: true,
          platform,
          externalPostId: data?.external_post_id || data?.post_id,
        };
      } catch (error: any) {
        return {
          success: false,
          platform,
          error:
            error.message ||
            t("social.publishError", "Failed to publish to {{platform}}", {
              platform,
            }),
        };
      }
    },
    [connectionStatusQuery.data, t]
  );

  /** Publish to Instagram */
  const publishToInstagram = useCallback(
    async (postId: string): Promise<PublishResult> => {
      setPublishingPlatforms((prev) => new Set(prev).add("instagram"));
      const result = await invokePlatformPublish(
        "instagram",
        postId,
        "instagram-publish"
      );
      setPublishingPlatforms((prev) => {
        const next = new Set(prev);
        next.delete("instagram");
        return next;
      });

      if (result.success) {
        toast({
          title: t("social.publishedToInstagram", "Published to Instagram"),
          description: t(
            "social.publishSuccess",
            "Your post has been published successfully."
          ),
        });
        queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      } else {
        toast({
          title: t("social.instagramError", "Instagram publishing failed"),
          description: result.error,
          variant: "destructive",
        });
      }

      return result;
    },
    [invokePlatformPublish, toast, t, queryClient]
  );

  /** Publish to Twitter/X */
  const publishToTwitter = useCallback(
    async (postId: string): Promise<PublishResult> => {
      setPublishingPlatforms((prev) => new Set(prev).add("twitter"));
      const result = await invokePlatformPublish(
        "twitter",
        postId,
        "twitter-publish"
      );
      setPublishingPlatforms((prev) => {
        const next = new Set(prev);
        next.delete("twitter");
        return next;
      });

      if (result.success) {
        toast({
          title: t("social.publishedToTwitter", "Published to Twitter/X"),
          description: t(
            "social.publishSuccess",
            "Your post has been published successfully."
          ),
        });
        queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      } else {
        toast({
          title: t("social.twitterError", "Twitter/X publishing failed"),
          description: result.error,
          variant: "destructive",
        });
      }

      return result;
    },
    [invokePlatformPublish, toast, t, queryClient]
  );

  /** Publish to LinkedIn */
  const publishToLinkedIn = useCallback(
    async (postId: string): Promise<PublishResult> => {
      setPublishingPlatforms((prev) => new Set(prev).add("linkedin"));
      const result = await invokePlatformPublish(
        "linkedin",
        postId,
        "linkedin-publish"
      );
      setPublishingPlatforms((prev) => {
        const next = new Set(prev);
        next.delete("linkedin");
        return next;
      });

      if (result.success) {
        toast({
          title: t("social.publishedToLinkedIn", "Published to LinkedIn"),
          description: t(
            "social.publishSuccess",
            "Your post has been published successfully."
          ),
        });
        queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      } else {
        toast({
          title: t("social.linkedInError", "LinkedIn publishing failed"),
          description: result.error,
          variant: "destructive",
        });
      }

      return result;
    },
    [invokePlatformPublish, toast, t, queryClient]
  );

  /** Publish to multiple platforms at once */
  const publishToMultiple = useCallback(
    async (
      postId: string,
      platforms: SocialPlatform[]
    ): Promise<PublishResult[]> => {
      const publishFns: Record<
        SocialPlatform,
        (postId: string) => Promise<PublishResult>
      > = {
        facebook: async (id) => {
          // Facebook uses existing publish mechanism via useSocialPosts
          return {
            success: false,
            platform: "facebook" as SocialPlatform,
            error: "Use the existing Facebook publish flow",
          };
        },
        instagram: publishToInstagram,
        twitter: publishToTwitter,
        linkedin: publishToLinkedIn,
        youtube: async (id) => ({
          success: false,
          platform: "youtube" as SocialPlatform,
          error: t(
            "social.youtubeNotSupported",
            "YouTube publishing is not yet available."
          ),
        }),
      };

      const results = await Promise.all(
        platforms.map((platform) => publishFns[platform](postId))
      );

      return results;
    },
    [publishToInstagram, publishToTwitter, publishToLinkedIn, t]
  );

  return {
    platformStatuses: connectionStatusQuery.data || [],
    isLoadingStatuses: connectionStatusQuery.isLoading,
    publishingPlatforms,
    publishToInstagram,
    publishToTwitter,
    publishToLinkedIn,
    publishToMultiple,
    getConnectionStatus: connectionStatusQuery.refetch,
    isPublishing: publishingPlatforms.size > 0,
  };
}
