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

// Customer Service Chat System Prompt with actual pricing
const CUSTOMER_SERVICE_CHAT_PROMPT = `You are a friendly and professional customer service assistant for ICE Alarm España, a 24/7 emergency response service for seniors and expats living in Spain.

## Your Role
- Answer questions about ICE Alarm services, pricing, and features
- Help potential customers understand our offerings
- Be warm, helpful, and professional
- Respond in the same language the customer uses (English or Spanish)
- Keep responses concise but complete

## About ICE Alarm España
ICE Alarm provides 24/7 emergency response services with:
- SOS pendant with one-button emergency calling
- Automatic fall detection
- GPS location tracking
- Two-way voice communication through the pendant
- Bilingual call center (English & Spanish)
- Coverage throughout Spain

## Pricing Information (All prices include IVA/VAT)

### Monthly Subscriptions:
- **Individual Plan**: €27.49/month (€24.99 + 10% IVA)
- **Couple Plan**: €38.49/month (€34.99 + 10% IVA) - for two people at the same address

### Annual Plans (Pay for 10 months, get 12 - 2 months FREE):
- **Individual Annual**: €274.89/year (saves ~€55)
- **Couple Annual**: €384.89/year (saves ~€77)

### One-Time Costs:
- **GPS Pendant**: €151.25 (€125 + 21% IVA) - optional but recommended
- **Registration Fee**: €59.99 (one-time setup fee)
- **Shipping**: €14.99 (if ordering a pendant)

## Key Benefits to Highlight:
- No long-term contracts - cancel anytime
- 24/7 bilingual emergency response center
- Battery lasts up to 5 days
- Works anywhere in Spain with mobile coverage
- Peace of mind for families and loved ones

## Response Guidelines:
1. Be conversational and helpful, not robotic
2. If asked about pricing, provide clear, specific numbers
3. Encourage visitors to join or contact us for more information
4. For complex questions, suggest they call our support line or use WhatsApp
5. Never make up information - if unsure, say you'll have a team member follow up

Remember: You are the first point of contact for potential customers. Be welcoming and make them feel confident about choosing ICE Alarm.`;

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

    // Check if this is a chat widget request
    const isChatWidget = context?.source === "chat_widget";

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

    // Handle CHAT WIDGET requests differently
    if (isChatWidget && agentKey === "customer_service_expert") {
      const userLanguage = context?.userLanguage || "en";
      const conversationHistory = context?.conversationHistory || [];
      const currentMessage = context?.currentMessage || "";

      // Build messages array for chat
      const messages = [
        { 
          role: "system", 
          content: CUSTOMER_SERVICE_CHAT_PROMPT + `\n\nIMPORTANT: The user is communicating in ${userLanguage === "es" ? "Spanish" : "English"}. Respond in the same language.`
        },
        ...conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // If currentMessage is separate from history, add it
      if (currentMessage && !conversationHistory.some((m: { content: string }) => m.content === currentMessage)) {
        messages.push({ role: "user", content: currentMessage });
      }

      // Call Lovable AI for chat response
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI Gateway error:", aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${aiResponse.status}`);
      }

      const aiResult = await aiResponse.json();
      const responseContent = aiResult.choices?.[0]?.message?.content || "";

      return new Response(
        JSON.stringify({
          success: true,
          output: {
            response: responseContent,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ ORIGINAL AGENT LOGIC FOR NON-CHAT REQUESTS ============

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
