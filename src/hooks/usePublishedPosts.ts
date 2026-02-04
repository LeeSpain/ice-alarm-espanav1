import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SocialPost } from "@/hooks/useSocialPosts";

export type ConnectionStatus = "connected" | "token_expired" | "not_configured" | "unknown";

export interface SocialPostMetrics {
  id: string;
  social_post_id: string;
  facebook_post_id: string;
  reactions_total: number;
  reactions_breakdown: Record<string, number>;
  comments_count: number;
  shares_count: number;
  impressions: number;
  fetched_at: string;
}

export interface PublishedPostWithMetrics extends SocialPost {
  metrics?: SocialPostMetrics | null;
}

export interface AggregatedMetrics {
  totalPosts: number;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
}

export function usePublishedPosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("unknown");
  const [lastError, setLastError] = useState<string | null>(null);

  // Fetch all published posts with their cached metrics
  const postsQuery = useQuery({
    queryKey: ["published-posts-with-metrics"],
    queryFn: async () => {
      // First, get all published posts
      const { data: posts, error: postsError } = await supabase
        .from("social_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (postsError) throw postsError;

      // Then, get all metrics
      const { data: metrics, error: metricsError } = await supabase
        .from("social_post_metrics")
        .select("*");

      if (metricsError) throw metricsError;

      // Create a map of metrics by social_post_id
      const metricsMap = new Map<string, SocialPostMetrics>();
      for (const m of (metrics || [])) {
        metricsMap.set(m.social_post_id, m as SocialPostMetrics);
      }

      // Combine posts with their metrics
      const postsWithMetrics: PublishedPostWithMetrics[] = (posts || []).map((post) => ({
        ...post,
        status: post.status as SocialPost["status"],
        language: post.language as SocialPost["language"],
        metrics: metricsMap.get(post.id) || null,
      }));

      return postsWithMetrics;
    },
  });

  // Calculate aggregated metrics
  const aggregatedMetrics: AggregatedMetrics = {
    totalPosts: postsQuery.data?.length || 0,
    totalReactions: postsQuery.data?.reduce((sum, post) => sum + (post.metrics?.reactions_total || 0), 0) || 0,
    totalComments: postsQuery.data?.reduce((sum, post) => sum + (post.metrics?.comments_count || 0), 0) || 0,
    totalShares: postsQuery.data?.reduce((sum, post) => sum + (post.metrics?.shares_count || 0), 0) || 0,
    totalReach: postsQuery.data?.reduce((sum, post) => sum + (post.metrics?.impressions || 0), 0) || 0,
  };

  // Test Facebook connection
  const testConnection = useCallback(async (): Promise<ConnectionStatus> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        setConnectionStatus("unknown");
        return "unknown";
      }

      const { data, error } = await supabase.functions.invoke("facebook-metrics", {
        body: { test_connection: true },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (error) {
        setConnectionStatus("unknown");
        setLastError(error.message);
        return "unknown";
      }

      if (data?.error === "token_expired") {
        setConnectionStatus("token_expired");
        setLastError(data.message || "Token expired");
        return "token_expired";
      }

      if (data?.success) {
        setConnectionStatus("connected");
        setLastError(null);
        return "connected";
      }

      setConnectionStatus("unknown");
      setLastError(data?.message || "Unknown error");
      return "unknown";
    } catch (err) {
      setConnectionStatus("unknown");
      setLastError(err instanceof Error ? err.message : "Connection test failed");
      return "unknown";
    }
  }, []);

  // Refresh metrics for a single post
  const refreshSingleMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("facebook-metrics", {
        body: { post_id: postId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (error) throw error;
      
      // Check for token expiry error
      if (data?.error === "token_expired") {
        setConnectionStatus("token_expired");
        setLastError(data.message);
        throw new Error(data.message || "Facebook token expired");
      }

      if (data?.error) throw new Error(data.error);
      
      setConnectionStatus("connected");
      setLastError(null);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-posts-with-metrics"] });
      toast({ title: "Metrics refreshed", description: "Post engagement data has been updated." });
    },
    onError: (error: Error) => {
      const isTokenError = error.message.toLowerCase().includes("token") || 
                           error.message.toLowerCase().includes("expired");
      toast({
        title: isTokenError ? "Facebook Token Expired" : "Failed to refresh metrics",
        description: isTokenError 
          ? "Please update your Facebook access token in Settings → Integrations."
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Refresh metrics for all published posts
  const refreshAllMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("facebook-metrics", {
        body: { refresh_all: true },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (error) throw error;
      
      // Check for token expiry error
      if (data?.error === "token_expired") {
        setConnectionStatus("token_expired");
        setLastError(data.message);
        throw new Error(data.message || "Facebook token expired");
      }

      if (data?.error) throw new Error(data.error);
      
      setConnectionStatus("connected");
      setLastError(null);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-posts-with-metrics"] });
      toast({ title: "All metrics refreshed", description: "Engagement data for all posts has been updated." });
    },
    onError: (error: Error) => {
      const isTokenError = error.message.toLowerCase().includes("token") || 
                           error.message.toLowerCase().includes("expired");
      toast({
        title: isTokenError ? "Facebook Token Expired" : "Failed to refresh metrics",
        description: isTokenError 
          ? "Please update your Facebook access token in Settings → Integrations."
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Check if metrics need auto-refresh (older than 15 min)
  const needsAutoRefresh = () => {
    if (!postsQuery.data || postsQuery.data.length === 0) return false;

    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

    // Check if any post has stale or missing metrics
    return postsQuery.data.some((post) => {
      if (!post.metrics) return true;
      const fetchedAt = new Date(post.metrics.fetched_at).getTime();
      return fetchedAt < fifteenMinutesAgo;
    });
  };

  return {
    posts: postsQuery.data || [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    aggregatedMetrics,
    refreshMetrics: refreshSingleMutation.mutateAsync,
    refreshAllMetrics: refreshAllMutation.mutateAsync,
    isRefreshing: refreshSingleMutation.isPending,
    isRefreshingAll: refreshAllMutation.isPending,
    needsAutoRefresh,
    // New connection status features
    connectionStatus,
    lastError,
    testConnection,
  };
}
