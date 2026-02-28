import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { saveDraftSchema, validateRequest } from "../_shared/validation.ts";



Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const rawBody = await req.json();
    const validated = validateRequest(saveDraftSchema, rawBody, corsHeaders);
    if (validated.error) return validated.error;
    const { sessionId, currentStep, wizardData } = validated.data;

    // Extract key identifiable info from wizard data for quick access
    const email = wizardData?.primaryMember?.email || null;
    const phone = wizardData?.primaryMember?.phone || null;
    const firstName = wizardData?.primaryMember?.firstName || null;
    const lastName = wizardData?.primaryMember?.lastName || null;

    // Upsert the draft - update if exists, insert if new
    const { data, error } = await supabase
      .from("registration_drafts")
      .upsert(
        {
          session_id: sessionId,
          email,
          phone,
          first_name: firstName,
          last_name: lastName,
          current_step: currentStep,
          wizard_data: wizardData,
          source: "join_wizard",
          status: "in_progress",
          updated_at: new Date().toISOString(),
        },
        { 
          onConflict: "session_id",
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving draft:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save draft", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, draftId: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
