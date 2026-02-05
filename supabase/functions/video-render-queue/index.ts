import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("video_projects")
      .select("id, name")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a render record with queued status
    const { data: render, error: renderError } = await supabase
      .from("video_renders")
      .insert({
        project_id,
        status: "queued",
        progress: 0,
      })
      .select()
      .single();

    if (renderError) {
      console.error("Error creating render:", renderError);
      return new Response(
        JSON.stringify({ error: "Failed to queue render" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In production, this would trigger an external worker service (Remotion, FFmpeg, etc.)
    // For now, we simulate the render process - in a real implementation,
    // you'd call an external API or queue system here
    
    // Start simulated render in background (fire and forget)
    simulateRenderCompletion(supabaseUrl, supabaseServiceKey, render.id, project_id);

    return new Response(
      JSON.stringify({
        success: true,
        render_id: render.id,
        status: "queued",
        message: "Render queued successfully. The video will be available in the Exports tab once complete.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error in video-render-queue:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simulate render completion (stub for demonstration)
async function simulateRenderCompletion(supabaseUrl: string, supabaseKey: string, renderId: string, projectId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Update to running status
    await supabase
      .from("video_renders")
      .update({ status: "running", progress: 10 } as Record<string, unknown>)
      .eq("id", renderId);

    // Simulate progress updates (slower for visibility)
    for (let progress = 20; progress <= 90; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await supabase
        .from("video_renders")
        .update({ progress } as Record<string, unknown>)
        .eq("id", renderId);
    }

    // Mark as done
    await supabase
      .from("video_renders")
      .update({ status: "done", progress: 100 } as Record<string, unknown>)
      .eq("id", renderId);

    // Create a placeholder export record
    await supabase
      .from("video_exports")
      .insert({
        project_id: projectId,
        render_id: renderId,
        mp4_url: null,
        srt_url: null,
        vtt_url: null,
        thumbnail_url: null,
      } as Record<string, unknown>);

    console.log(`Render ${renderId} completed successfully (simulated)`);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error in simulated render:", error);
    
    // Mark as failed
    await supabase
      .from("video_renders")
      .update({ 
        status: "failed", 
        error: error.message || "Unknown error during render" 
      } as Record<string, unknown>)
      .eq("id", renderId);
  }
}
