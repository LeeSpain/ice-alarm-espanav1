import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Render stages with progress milestones
const RENDER_STAGES = [
  { stage: "initializing", progress: 10 },
  { stage: "generating", progress: 30 },
  { stage: "processing", progress: 50 },
  { stage: "compositing", progress: 70 },
  { stage: "encoding", progress: 90 },
  { stage: "finalizing", progress: 100 },
];

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
      .select("id, name, status")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update project status to "rendering"
    await supabase
      .from("video_projects")
      .update({ status: "rendering" })
      .eq("id", project_id);

    // Create a render record with queued status
    const { data: render, error: renderError } = await supabase
      .from("video_renders")
      .insert({
        project_id,
        status: "queued",
        progress: 0,
        stage: "queued",
      })
      .select()
      .single();

    if (renderError) {
      console.error("Error creating render:", renderError);
      // Revert project status on failure
      await supabase
        .from("video_projects")
        .update({ status: project.status })
        .eq("id", project_id);
      return new Response(
        JSON.stringify({ error: "Failed to queue render" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

// Simulate render completion with stage tracking
async function simulateRenderCompletion(supabaseUrl: string, supabaseKey: string, renderId: string, projectId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Update to running status
    await supabase
      .from("video_renders")
      .update({ status: "running", progress: 5, stage: "initializing" } as Record<string, unknown>)
      .eq("id", renderId);

    console.log(`[Render ${renderId}] Started - Stage: initializing`);

    // Progress through each stage
    for (const { stage, progress } of RENDER_STAGES) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      await supabase
        .from("video_renders")
        .update({ progress, stage } as Record<string, unknown>)
        .eq("id", renderId);
      
      console.log(`[Render ${renderId}] Stage: ${stage}, Progress: ${progress}%`);
    }

    // Mark as done
    await supabase
      .from("video_renders")
      .update({ status: "done", progress: 100, stage: "finalizing" } as Record<string, unknown>)
      .eq("id", renderId);

    // Update project status to "approved"
    await supabase
      .from("video_projects")
      .update({ status: "approved" })
      .eq("id", projectId);

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

    console.log(`[Render ${renderId}] Completed successfully`);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[Render ${renderId}] Error:`, error);
    
    // Mark as failed
    await supabase
      .from("video_renders")
      .update({ 
        status: "failed", 
        error: error.message || "Unknown error during render" 
      } as Record<string, unknown>)
      .eq("id", renderId);

    // Revert project status to draft on failure
    await supabase
      .from("video_projects")
      .update({ status: "draft" })
      .eq("id", projectId);
  }
}
