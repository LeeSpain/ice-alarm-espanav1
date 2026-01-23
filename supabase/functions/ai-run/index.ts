import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentConfig {
  id: string;
  system_instruction: string;
  business_context: string;
  tool_policy: Record<string, boolean>;
  language_policy: Record<string, any>;
  read_permissions: string[];
  write_permissions: string[];
  triggers: string[];
}

interface AgentRun {
  agentKey: string;
  eventId?: string;
  context?: Record<string, any>;
  simulationMode?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { agentKey, eventId, context, simulationMode = false }: AgentRun = await req.json();

    if (!agentKey) {
      throw new Error("agentKey is required");
    }

    // Load agent and config
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("agent_key", agentKey)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentKey}`);
    }

    if (!agent.enabled && !simulationMode) {
      return new Response(
        JSON.stringify({ success: false, message: "Agent is disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load active config
    const { data: config, error: configError } = await supabase
      .from("ai_agent_configs")
      .select("*")
      .eq("agent_id", agent.id)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      throw new Error(`No active config for agent: ${agentKey}`);
    }

    // Load memory relevant to this agent
    const { data: memories } = await supabase
      .from("ai_memory")
      .select("*")
      .or(`scope.eq.global,and(scope.eq.agent,agent_id.eq.${agent.id})`)
      .order("importance", { ascending: false })
      .limit(20);

    // Load event if provided
    let eventData = null;
    if (eventId) {
      const { data: event } = await supabase
        .from("ai_events")
        .select("*")
        .eq("id", eventId)
        .single();
      eventData = event;
    }

    // Build context based on read permissions
    const enrichedContext: Record<string, any> = { ...context };
    
    // Load relevant data based on permissions (limited for performance)
    for (const permission of config.read_permissions || []) {
      try {
        if (permission === "orders" && eventData?.entity_type === "order") {
          const { data } = await supabase
            .from("orders")
            .select("*, order_items(*), members(first_name, last_name, email)")
            .eq("id", eventData.entity_id)
            .single();
          enrichedContext.order = data;
        } else if (permission === "members" && eventData?.entity_type === "member") {
          const { data } = await supabase
            .from("members")
            .select("*")
            .eq("id", eventData.entity_id)
            .single();
          enrichedContext.member = data;
        } else if (permission === "alerts" && eventData?.entity_type === "alert") {
          const { data } = await supabase
            .from("alerts")
            .select("*, members(first_name, last_name, phone)")
            .eq("id", eventData.entity_id)
            .single();
          enrichedContext.alert = data;
        } else if (permission === "tickets" && eventData?.entity_type === "ticket") {
          const { data } = await supabase
            .from("internal_tickets")
            .select("*, members(first_name, last_name)")
            .eq("id", eventData.entity_id)
            .single();
          enrichedContext.ticket = data;
        } else if (permission === "conversations" && eventData?.entity_type === "conversation") {
          const { data: conv } = await supabase
            .from("conversations")
            .select("*, members(first_name, last_name, preferred_language)")
            .eq("id", eventData.entity_id)
            .single();
          const { data: msgs } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", eventData.entity_id)
            .order("created_at", { ascending: true })
            .limit(20);
          enrichedContext.conversation = conv;
          enrichedContext.messages = msgs;
        } else if (permission === "partners" && eventData?.entity_type === "partner") {
          const { data } = await supabase
            .from("partners")
            .select("*")
            .eq("id", eventData.entity_id)
            .single();
          enrichedContext.partner = data;
        }
      } catch (e) {
        console.error(`Error loading ${permission}:`, e);
      }
    }

    // Build the system prompt
    const memoryText = memories?.map(m => `[${m.title}]: ${m.content}`).join("\n") || "";
    const systemPrompt = `${config.system_instruction}

## Business Context
${config.business_context || ""}

## Knowledge Base
${memoryText}

## Current Mode
You are operating in "${agent.mode}" mode:
- advise_only: Analyze and provide recommendations only, do not propose actions
- draft_only: Propose actions but wait for human approval before execution
- auto_act: Execute approved action types automatically

## Available Actions (based on your permissions)
${JSON.stringify(config.write_permissions || [])}

## Tool Policy
${JSON.stringify(config.tool_policy || {})}

When you need to take action, respond with a JSON object containing an "actions" array. Each action should have:
- action_type: one of ${JSON.stringify(config.write_permissions || [])}
- payload: the action-specific data
- reason: why you're taking this action

If no action is needed, respond with {"actions": [], "analysis": "your analysis here"}.`;

    // Build user message
    const userMessage = eventData 
      ? `Event received: ${eventData.event_type}\n\nEvent payload:\n${JSON.stringify(eventData.payload, null, 2)}\n\nEnriched context:\n${JSON.stringify(enrichedContext, null, 2)}`
      : `Context provided:\n${JSON.stringify(enrichedContext, null, 2)}`;

    // Create the run record
    const startTime = Date.now();
    const { data: runRecord, error: runError } = await supabase
      .from("ai_runs")
      .insert({
        agent_id: agent.id,
        trigger_event_id: eventId || null,
        input_context: enrichedContext,
        status: "running",
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create run record: ${runError.message}`);
    }

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      // Update run with error
      await supabase
        .from("ai_runs")
        .update({
          status: "failed",
          error_message: `AI Gateway error: ${aiResponse.status}`,
          duration_ms: Date.now() - startTime,
        })
        .eq("id", runRecord.id);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const responseContent = aiResult.choices?.[0]?.message?.content || "";
    const tokensUsed = aiResult.usage?.total_tokens || 0;

    // Parse the AI response
    let parsedOutput: { actions: any[]; analysis?: string } = { actions: [] };
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedOutput = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Could not parse JSON from response, treating as analysis only");
      parsedOutput = { actions: [], analysis: responseContent };
    }

    // Update run with output
    await supabase
      .from("ai_runs")
      .update({
        status: "completed",
        output: parsedOutput,
        model_used: "google/gemini-3-flash-preview",
        tokens_used: tokensUsed,
        duration_ms: Date.now() - startTime,
      })
      .eq("id", runRecord.id);

    // Process actions
    const createdActions = [];
    for (const action of parsedOutput.actions || []) {
      // Validate action type is allowed
      if (!config.write_permissions?.includes(action.action_type)) {
        console.log(`Action type ${action.action_type} not permitted for this agent`);
        continue;
      }

      // Determine initial status based on mode and tool policy
      let actionStatus = "proposed";
      if (agent.mode === "auto_act" && config.tool_policy?.[action.action_type]) {
        actionStatus = "approved"; // Will be executed immediately
      }

      const { data: actionRecord, error: actionError } = await supabase
        .from("ai_actions")
        .insert({
          run_id: runRecord.id,
          action_type: action.action_type,
          payload: action.payload,
          status: actionStatus,
        })
        .select()
        .single();

      if (!actionError && actionRecord) {
        createdActions.push(actionRecord);

        // If auto-approved, execute immediately (unless simulation)
        if (actionStatus === "approved" && !simulationMode) {
          try {
            // Call ai-execute-action function
            const executeResponse = await fetch(
              `${SUPABASE_URL}/functions/v1/ai-execute-action`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ actionId: actionRecord.id }),
              }
            );
            
            if (!executeResponse.ok) {
              console.error("Failed to execute action:", await executeResponse.text());
            }
          } catch (e) {
            console.error("Error executing action:", e);
          }
        }
      }
    }

    // Mark event as processed
    if (eventId) {
      await supabase
        .from("ai_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", eventId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        runId: runRecord.id,
        output: parsedOutput,
        actionsCreated: createdActions.length,
        tokensUsed,
        durationMs: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-run error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
