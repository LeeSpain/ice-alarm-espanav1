import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FacebookMetrics {
  reactions_total: number;
  reactions_breakdown: Record<string, number>;
  comments_count: number;
  shares_count: number;
  impressions: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Facebook credentials from system_settings (using settings_ prefix)
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["settings_facebook_page_id", "settings_facebook_page_access_token"]);

    const settingsMap = Object.fromEntries(
      (settings || []).map((s: { key: string; value: string }) => [s.key.replace(/^settings_/, ''), s.value])
    );

    const pageAccessToken = settingsMap.facebook_page_access_token;

    if (!pageAccessToken) {
      return new Response(
        JSON.stringify({ error: "Facebook credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { post_id, refresh_all } = await req.json();

    // If refresh_all is true, fetch all published posts
    let postsToFetch: { id: string; facebook_post_id: string }[] = [];

    if (refresh_all) {
      const { data: publishedPosts } = await supabase
        .from("social_posts")
        .select("id, facebook_post_id")
        .eq("status", "published")
        .not("facebook_post_id", "is", null);

      postsToFetch = publishedPosts || [];
    } else if (post_id) {
      const { data: post } = await supabase
        .from("social_posts")
        .select("id, facebook_post_id")
        .eq("id", post_id)
        .single();

      if (!post || !post.facebook_post_id) {
        return new Response(
          JSON.stringify({ error: "Post not found or not published to Facebook" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      postsToFetch = [post];
    } else {
      return new Response(
        JSON.stringify({ error: "Either post_id or refresh_all is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { post_id: string; metrics: FacebookMetrics; error?: string }[] = [];

    for (const post of postsToFetch) {
      try {
        const metrics = await fetchFacebookMetrics(post.facebook_post_id, pageAccessToken);

        // Upsert metrics into the cache table
        const { error: upsertError } = await supabase
          .from("social_post_metrics")
          .upsert({
            social_post_id: post.id,
            facebook_post_id: post.facebook_post_id,
            reactions_total: metrics.reactions_total,
            reactions_breakdown: metrics.reactions_breakdown,
            comments_count: metrics.comments_count,
            shares_count: metrics.shares_count,
            impressions: metrics.impressions,
            fetched_at: new Date().toISOString(),
          }, {
            onConflict: "social_post_id",
          });

        if (upsertError) {
          console.error("Error upserting metrics:", upsertError);
        }

        results.push({ post_id: post.id, metrics });
      } catch (err) {
        console.error(`Error fetching metrics for post ${post.id}:`, err);
        results.push({ 
          post_id: post.id, 
          metrics: { reactions_total: 0, reactions_breakdown: {}, comments_count: 0, shares_count: 0, impressions: 0 },
          error: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in facebook-metrics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchFacebookMetrics(
  facebookPostId: string,
  accessToken: string
): Promise<FacebookMetrics> {
  const apiVersion = "v24.0";
  
  // Fetch reactions, comments, shares
  const engagementUrl = `https://graph.facebook.com/${apiVersion}/${facebookPostId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
  
  const engagementRes = await fetch(engagementUrl);
  const engagementData = await engagementRes.json();

  if (engagementData.error) {
    console.error("Facebook API error:", engagementData.error);
    throw new Error(engagementData.error.message || "Facebook API error");
  }

  // Try to fetch impressions (may require additional permissions)
  let impressions = 0;
  try {
    const insightsUrl = `https://graph.facebook.com/${apiVersion}/${facebookPostId}/insights?metric=post_impressions&access_token=${accessToken}`;
    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (insightsData.data && insightsData.data.length > 0) {
      impressions = insightsData.data[0]?.values?.[0]?.value || 0;
    }
  } catch (err) {
    // Impressions might not be available for all posts
    console.warn("Could not fetch impressions:", err);
  }

  // Try to get reaction breakdown
  let reactionsBreakdown: Record<string, number> = {};
  try {
    const reactionsUrl = `https://graph.facebook.com/${apiVersion}/${facebookPostId}/reactions?summary=total_count&access_token=${accessToken}`;
    const reactionsRes = await fetch(reactionsUrl);
    const reactionsData = await reactionsRes.json();

    if (reactionsData.data) {
      // Count each reaction type
      for (const reaction of reactionsData.data) {
        const type = reaction.type?.toLowerCase() || "like";
        reactionsBreakdown[type] = (reactionsBreakdown[type] || 0) + 1;
      }
    }
  } catch (err) {
    console.warn("Could not fetch reaction breakdown:", err);
  }

  return {
    reactions_total: engagementData.reactions?.summary?.total_count || 0,
    reactions_breakdown: reactionsBreakdown,
    comments_count: engagementData.comments?.summary?.total_count || 0,
    shares_count: engagementData.shares?.count || 0,
    impressions,
  };
}
