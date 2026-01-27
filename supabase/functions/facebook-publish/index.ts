import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user authentication
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is staff
    const userId = claimsData.claims.sub;
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (staffError || !staffData) {
      return new Response(JSON.stringify({ error: "Forbidden - Staff access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { post_id } = await req.json();

    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client for reading settings
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the post
    const { data: post, error: postError } = await adminClient
      .from("social_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check post status - must be approved
    if (post.status !== "approved") {
      return new Response(JSON.stringify({ 
        error: "Post must be approved before publishing",
        current_status: post.status 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Facebook credentials from system_settings
    const { data: settings, error: settingsError } = await adminClient
      .from("system_settings")
      .select("key, value")
      .in("key", ["settings_facebook_page_id", "settings_facebook_page_access_token"]);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch Facebook settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>) || {};

    const pageId = settingsMap["settings_facebook_page_id"];
    const accessToken = settingsMap["settings_facebook_page_access_token"];

    if (!pageId || !accessToken) {
      return new Response(JSON.stringify({ 
        error: "Facebook credentials not configured. Please add Page ID and Access Token in Settings." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare the post content
    const postText = post.post_text || "";
    const imageUrl = post.image_url;

    let facebookPostId: string | null = null;
    let publishError: string | null = null;

    try {
      if (imageUrl) {
        // Publish as a photo post
        const photoUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        const photoParams = new URLSearchParams({
          url: imageUrl,
          caption: postText,
          access_token: accessToken,
        });

        const photoResponse = await fetch(`${photoUrl}?${photoParams}`, {
          method: "POST",
        });

        const photoResult = await photoResponse.json();

        if (photoResult.error) {
          throw new Error(photoResult.error.message || "Failed to publish photo");
        }

        facebookPostId = photoResult.post_id || photoResult.id;
      } else {
        // Publish as a text-only post
        const feedUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
        const feedParams = new URLSearchParams({
          message: postText,
          access_token: accessToken,
        });

        const feedResponse = await fetch(`${feedUrl}?${feedParams}`, {
          method: "POST",
        });

        const feedResult = await feedResponse.json();

        if (feedResult.error) {
          throw new Error(feedResult.error.message || "Failed to publish post");
        }

        facebookPostId = feedResult.id;
      }

      // Update post status to published
      const { error: updateError } = await adminClient
        .from("social_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          facebook_post_id: facebookPostId,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post_id);

      if (updateError) {
        console.error("Error updating post status:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          facebook_post_id: facebookPostId,
          message: "Post published successfully to Facebook",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fbError: any) {
      publishError = fbError.message || "Unknown Facebook API error";
      console.error("Facebook API error:", publishError);

      // Update post status to failed
      await adminClient
        .from("social_posts")
        .update({
          status: "failed",
          error_message: publishError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post_id);

      return new Response(
        JSON.stringify({
          success: false,
          error: publishError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in facebook-publish:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
