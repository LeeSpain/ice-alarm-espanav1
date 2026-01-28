import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData } = await supabase.auth.getClaims(token);
    if (!claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { post_id } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: post } = await adminClient
      .from("social_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (!post || post.status !== "approved") {
      return new Response(JSON.stringify({ error: "Post not approved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await adminClient
      .from("system_settings")
      .select("key,value")
      .in("key", [
        "settings_facebook_page_id",
        "settings_facebook_page_access_token",
      ]);

    const map = Object.fromEntries((settings || []).map(s => [s.key, s.value]));
    const pageId = map.settings_facebook_page_id;
    const tokenPage = map.settings_facebook_page_access_token;

    if (!pageId || !tokenPage) {
      return new Response(JSON.stringify({ error: "Facebook not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let fbRes;
    let fbJson;

    if (post.image_url) {
      const params = new URLSearchParams({
        url: post.image_url,
        caption: post.post_text || "",
        access_token: tokenPage,
      });

      fbRes = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/photos`,
        { method: "POST", body: params }
      );
    } else {
      const params = new URLSearchParams({
        message: post.post_text || "",
        access_token: tokenPage,
      });

      fbRes = await fetch(
        `https://graph.facebook.com/v24.0/${pageId}/feed`,
        { method: "POST", body: params }
      );
    }

    fbJson = await fbRes.json();

    if (!fbRes.ok) {
      throw new Error(fbJson?.error?.message || JSON.stringify(fbJson));
    }

    await adminClient
      .from("social_posts")
      .update({
        status: "published",
        facebook_post_id: fbJson.id,
        published_at: new Date().toISOString(),
      })
      .eq("id", post_id);

    return new Response(
      JSON.stringify({ success: true, facebook_post_id: fbJson.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
