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
    // ───────────────────────── AUTH ─────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────────────────────── STAFF CHECK ─────────────────────────
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

    // ───────────────────────── SAFE JSON PARSE ─────────────────────────
    let post_id: string | null = null;
    try {
      const body = await req.json();
      post_id = body?.post_id;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────────────────────── ADMIN CLIENT ─────────────────────────
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ───────────────────────── FETCH POST ─────────────────────────
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

    if (post.status !== "approved") {
      return new Response(
        JSON.stringify({
          error: "Post must be approved before publishing",
          current_status: post.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ───────────────────────── FACEBOOK SETTINGS ─────────────────────────
    const { data: settings, error: settingsError } = await adminClient
      .from("system_settings")
      .select("key,value")
      .in("key", ["settings_facebook_page_id", "settings_facebook_page_access_token"]);

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: "Failed to fetch Facebook settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const pageId = settingsMap.settings_facebook_page_id;
    const accessToken = settingsMap.settings_facebook_page_access_token;

    if (!pageId || !accessToken) {
      return new Response(
        JSON.stringify({
          error: "Facebook credentials not configured. Please add Page ID and Access Token in Settings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ───────────────────────── FACEBOOK PUBLISH ─────────────────────────
    const postText = post.post_text || "";
    const imageUrl = post.image_url;

    let fbResponse: Response;
    let fbResult: any;

    if (imageUrl) {
      const params = new URLSearchParams({
        url: imageUrl,
        caption: postText,
        access_token: accessToken,
      });

      fbResponse = await fetch(`https://graph.facebook.com/v24.0/${pageId}/photos`, { method: "POST", body: params });
    } else {
      const params = new URLSearchParams({
        message: postText,
        access_token: accessToken,
      });

      fbResponse = await fetch(`https://graph.facebook.com/v24.0/${pageId}/feed`, { method: "POST", body: params });
    }

    fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      throw new Error(fbResult?.error?.message || JSON.stringify(fbResult));
    }

    const facebookPostId = fbResult.post_id || fbResult.id;

    // ───────────────────────── CREATE BLOG POST ─────────────────────────
    let blogPostId: string | null = null;
    try {
      // Extract title from post text (first sentence or first 60 chars)
      const extractTitle = (text: string): string => {
        const firstSentence = text.split(/[.!?]/)[0].trim();
        return firstSentence.length > 60 ? firstSentence.substring(0, 57) + "..." : firstSentence;
      };

      // Generate URL-safe slug
      const generateSlug = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 60);
      };

      const postText = post.post_text || "";
      const title = extractTitle(postText);
      let slug = generateSlug(title);

      // Check if slug exists and append timestamp if needed
      const { data: existingSlug } = await adminClient
        .from("blog_posts")
        .select("slug")
        .eq("slug", slug)
        .maybeSingle();

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      // Extract excerpt (first 1-2 lines, max 200 chars)
      const excerpt = postText.split("\n").slice(0, 2).join(" ").substring(0, 200);

      // Create blog post
      const { data: blogPost, error: blogError } = await adminClient.from("blog_posts").insert({
        title,
        slug,
        content: postText,
        excerpt,
        language: post.language || "en",
        published: true,
        published_at: new Date().toISOString(),
        facebook_post_id: facebookPostId,
        social_post_id: post_id,
        image_url: post.image_url,
        seo_title: title,
        seo_description: excerpt,
      }).select("id").single();

      if (blogError) {
        console.error("Error creating blog post:", blogError);
      } else {
        blogPostId = blogPost?.id;
        console.log("Blog post created successfully:", blogPostId);
      }
    } catch (blogCreationError) {
      // Log error but don't fail the Facebook publish
      console.error("Blog post creation failed:", blogCreationError);
    }

    // ───────────────────────── UPDATE SOCIAL POST ─────────────────────────
    await adminClient
      .from("social_posts")
      .update({
        status: "published",
        facebook_post_id: facebookPostId,
        published_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post_id);

    return new Response(
      JSON.stringify({
        success: true,
        facebook_post_id: facebookPostId,
        blog_post_id: blogPostId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("facebook-publish error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
