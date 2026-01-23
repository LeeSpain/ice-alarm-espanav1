import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Event type to agent mapping
const EVENT_AGENT_MAP: Record<string, string[]> = {
  "sale.created": ["main_brain"],
  "sale.paid": ["main_brain"],
  "partner.joined": ["main_brain"],
  "ticket.created": ["main_brain"],
  "conversation.escalated": ["main_brain"],
  "alert.created": ["main_brain"],
  "conversation.started": ["customer_service_expert"],
  "message.received": ["customer_service_expert"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const body = await req.json();
    
    // Handle manual event creation
    if (body.createEvent) {
      const { event_type, entity_type, entity_id, payload } = body;
      
      const { data: newEvent, error: eventError } = await supabase
        .from("ai_events")
        .insert({
          event_type,
          entity_type,
          entity_id,
          payload: payload || {},
        })
        .select()
        .single();

      if (eventError) {
        throw new Error(`Failed to create event: ${eventError.message}`);
      }

      // Dispatch immediately
      const agents = EVENT_AGENT_MAP[event_type] || [];
      const dispatchResults = [];

      for (const agentKey of agents) {
        try {
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/ai-run`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentKey,
                eventId: newEvent.id,
              }),
            }
          );

          if (response.ok) {
            dispatchResults.push({ agentKey, success: true, result: await response.json() });
          } else {
            dispatchResults.push({ agentKey, success: false, error: await response.text() });
          }
        } catch (e) {
          dispatchResults.push({ agentKey, success: false, error: e instanceof Error ? e.message : "Unknown error" });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          eventId: newEvent.id,
          dispatchedTo: agents,
          results: dispatchResults,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process unprocessed events (batch mode)
    const { data: pendingEvents, error: fetchError } = await supabase
      .from("ai_events")
      .select("*")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    const results = [];

    for (const event of pendingEvents || []) {
      const agents = EVENT_AGENT_MAP[event.event_type] || [];
      
      if (agents.length === 0) {
        // No agents configured for this event type, mark as processed
        await supabase
          .from("ai_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", event.id);
        
        results.push({ eventId: event.id, skipped: true, reason: "No agents configured" });
        continue;
      }

      for (const agentKey of agents) {
        try {
          // Check if agent is enabled
          const { data: agent } = await supabase
            .from("ai_agents")
            .select("enabled")
            .eq("agent_key", agentKey)
            .single();

          if (!agent?.enabled) {
            results.push({ eventId: event.id, agentKey, skipped: true, reason: "Agent disabled" });
            continue;
          }

          // Trigger agent run
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/ai-run`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentKey,
                eventId: event.id,
              }),
            }
          );

          if (response.ok) {
            const runResult = await response.json();
            results.push({ 
              eventId: event.id, 
              agentKey, 
              success: true, 
              runId: runResult.runId 
            });
          } else {
            const errorText = await response.text();
            results.push({ 
              eventId: event.id, 
              agentKey, 
              success: false, 
              error: errorText 
            });
          }
        } catch (e) {
          results.push({ 
            eventId: event.id, 
            agentKey, 
            success: false, 
            error: e instanceof Error ? e.message : "Unknown error" 
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-dispatch-events error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
