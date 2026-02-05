import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_TIMEOUT_RETRIES = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Twilio credentials from settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "settings_twilio_account_sid",
        "settings_twilio_auth_token",
        "settings_twilio_phone_number",
        "settings_emergency_phone",
        // Voice script settings (editable via Admin Settings)
        "voice_greeting_es",
        "voice_greeting_en",
        "voice_hold_es",
        "voice_hold_en",
        "voice_error_es",
        "voice_error_en",
        "voice_recording_notice_es",
        "voice_recording_notice_en"
      ]);

    const twilioConfig = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>) || {};

    // Safe helper to get settings with fallback for missing/empty values
    const getSetting = (key: string, fallback: string): string => {
      const v = twilioConfig[key];
      return (v && String(v).trim().length > 0) ? String(v) : fallback;
    };

    if (!twilioConfig.settings_twilio_account_sid || !twilioConfig.settings_twilio_auth_token) {
      return new Response(
        JSON.stringify({ error: "Twilio not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const conversationIdParam = url.searchParams.get("conversation_id");
    const leadIdParam = url.searchParams.get("lead_id");
    const baseUrl = Deno.env.get("SUPABASE_URL");

    // Helper function to get or create conversation
    async function getOrCreateConversation(
      existingId: string | null, 
      memberId: string | null, 
      language: string,
      source: string = "voice",
      leadId: string | null = null
    ): Promise<string | null> {
      // If we have an existing conversation_id, verify it exists and update it
      if (existingId) {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", existingId)
          .maybeSingle();
        
        if (existing) {
          // Update to mixed source if it was from chat, and link lead if provided
          const updateData: Record<string, unknown> = { 
            source: "mixed", 
            last_channel: "voice",
            last_message_at: new Date().toISOString()
          };
          if (leadId) {
            updateData.lead_id = leadId;
          }
          await supabase
            .from("conversations")
            .update(updateData)
            .eq("id", existingId);
          return existingId;
        }
      }
      
      // Create new conversation
      const insertData: Record<string, unknown> = {
        member_id: memberId,
        language: language.startsWith("es") ? "es" : "en",
        source,
        last_channel: "voice",
        status: "open",
        last_message_at: new Date().toISOString()
      };
      if (leadId) {
        insertData.lead_id = leadId;
      }
      
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert(insertData)
        .select("id")
        .single();
      
      if (error) {
        console.error("Failed to create conversation:", error);
        return null;
      }
      
      return newConv.id;
    }

    // Helper to save voice message to conversation
    async function saveVoiceMessage(
      conversationId: string | null,
      role: "user" | "assistant",
      content: string,
      meta?: Record<string, unknown>
    ) {
      if (!conversationId) return;
      
      try {
        await supabase.from("conversation_messages").insert({
          conversation_id: conversationId,
          channel: "voice",
          role,
          content,
          meta: meta || null
        });
      } catch (err) {
        console.error("Failed to save voice message:", err);
      }
    }

    // Helper to track call in conversation_calls
    async function trackCall(
      conversationId: string | null,
      callSid: string,
      direction: "inbound" | "outbound",
      fromNumber: string,
      toNumber: string
    ) {
      if (!conversationId) return;
      
      try {
        await supabase.from("conversation_calls").insert({
          conversation_id: conversationId,
          call_sid: callSid,
          direction,
          from_number: fromNumber,
          to_number: toNumber,
          started_at: new Date().toISOString(),
          status: "initiated"
        });
      } catch (err) {
        console.error("Failed to track call:", err);
      }
    }

    // ============================================================
    // ACTION: WAIT - Hold message for queue
    // ============================================================
    if (action === "wait") {
      const holdEs = getSetting("voice_hold_es", 
        "Por favor, permanezca en la línea. Le conectamos en breve.");
      const holdEn = getSetting("voice_hold_en", 
        "Please stay on the line. We are connecting you now.");
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES" voice="Polly.Lucia">${escapeXml(holdEs)}</Say>
  <Say language="en-GB" voice="Polly.Amy">${escapeXml(holdEn)}</Say>
  <Pause length="10"/>
</Response>`;
      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // ============================================================
    // ACTION: INCOMING - Initial greeting with speech recognition
    // ============================================================
    if (action === "incoming") {
      try {
        const formData = await req.formData();
        const from = formData.get("From") as string;
        const to = formData.get("To") as string;
        const callSid = formData.get("CallSid") as string;
        const callDirection = formData.get("Direction") as string;

        // Get caller_name from query param (passed from Call Me feature)
        const callerNameParam = url.searchParams.get("caller_name");
        const callerName = callerNameParam ? decodeURIComponent(callerNameParam).replace(/[<>&"']/g, "").trim() : "";
        
        console.log("Incoming call from:", from, "CallSid:", callSid, "ConversationId:", conversationIdParam, "CallerName:", callerName || "(none)");

        // Try to find existing member by phone
        const { data: member } = await supabase
          .from("members")
          .select("id, first_name, last_name, preferred_language")
          .or(`phone.eq.${from},phone.eq.${from.replace("+", "")}`)
          .maybeSingle();

        // Determine language from param or member preference (default Spanish for Spain)
        const langParam = url.searchParams.get("lang");
        const language = langParam || member?.preferred_language || "es";
        const twimlLang = language === "es" ? "es-ES" : "en-GB";

        // Get or create conversation for threading (with lead_id if available)
        const conversationId = await getOrCreateConversation(
          conversationIdParam,
          member?.id || null,
          language,
          conversationIdParam ? "mixed" : "voice",
          leadIdParam || null
        );

        // Create voice session with conversation link
        try {
          await supabase.from("voice_call_sessions").insert({
            call_sid: callSid,
            caller_phone: from,
            member_id: member?.id || null,
            language: twimlLang,
            status: "active",
            messages: [],
            conversation_id: conversationId
          });
        } catch {
          // If column doesn't exist, insert without it
          await supabase.from("voice_call_sessions").insert({
            call_sid: callSid,
            caller_phone: from,
            member_id: member?.id || null,
            language: twimlLang,
            status: "active",
            messages: []
          });
        }

        // Track call in conversation_calls
        const direction = callDirection?.includes("outbound") ? "outbound" : "inbound";
        await trackCall(conversationId, callSid, direction, from, to);

        // Update conversation with member_id if found and not already set
        if (conversationId && member?.id) {
          await supabase
            .from("conversations")
            .update({ member_id: member.id })
            .eq("id", conversationId)
            .is("member_id", null);
        }

        // Create an alert for tracking (if member found)
        if (member) {
          const { data: newAlert } = await supabase.from("alerts").insert({
            member_id: member.id,
            alert_type: "sos_button",
            status: "incoming",
            message: `Voice call from ${from}`
          }).select("id").single();

          // Notify partner if subscribed
          if (newAlert?.id) {
            try {
              await fetch(`${baseUrl}/functions/v1/partner-alert-notify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
                },
                body: JSON.stringify({
                  alert_id: newAlert.id,
                  member_id: member.id
                })
              });
            } catch (notifyErr) {
              console.error("Partner notification error:", notifyErr);
            }
          }
        }

        // Get configurable greetings with fallbacks
        const baseGreetingEs = getSetting("voice_greeting_es", 
          "Gracias por llamar a ICE Alarm España. Soy Isabel, su asistente virtual.");
        const baseGreetingEn = getSetting("voice_greeting_en", 
          "Thank you for calling ICE Alarm Spain. I'm Isabel, your virtual assistant.");
        const recordingEs = getSetting("voice_recording_notice_es", 
          "Esta llamada puede ser grabada para mejorar el servicio.");
        const recordingEn = getSetting("voice_recording_notice_en", 
          "This call may be recorded to improve our service.");

        // Build personalized greeting - priority: member.first_name > callerName > generic
        const personName = member?.first_name || callerName || "";
        
        const greetingEs = personName 
          ? `Hola ${personName}, bienvenido a ICE Alarm. Soy Isabel. ${recordingEs} ¿En qué puedo ayudarle hoy?`
          : `${baseGreetingEs} ${recordingEs} ¿En qué puedo ayudarle hoy?`;
        
        const greetingEn = personName
          ? `Hello ${personName}, welcome to ICE Alarm. I'm Isabel. ${recordingEn} How can I help you today?`
          : `${baseGreetingEn} ${recordingEn} How can I help you today?`;

        // Save AI greeting to conversation
        const greeting = language === "es" ? greetingEs : greetingEn;
        await saveVoiceMessage(conversationId, "assistant", greeting, { callSid, type: "greeting" });

        // Build transcription URL with conversation_id
        const transcriptionUrl = conversationId 
          ? `${baseUrl}/functions/v1/twilio-voice?action=transcription&conversation_id=${encodeURIComponent(conversationId)}`
          : `${baseUrl}/functions/v1/twilio-voice?action=transcription`;

        // Return TwiML with speech recognition
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES" voice="Polly.Lucia">${escapeXml(greetingEs)}</Say>
  <Pause length="1"/>
  <Say language="en-GB" voice="Polly.Amy">${escapeXml(greetingEn)}</Say>
  <Gather input="speech" 
          action="${transcriptionUrl}" 
          language="${twimlLang}" 
          speechTimeout="auto"
          timeout="10"
          actionOnEmptyResult="true">
  </Gather>
</Response>`;

        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      } catch (error) {
        console.error("Incoming call error, falling back to queue:", error);
        // FALLBACK: Return simple queue TwiML if any error occurs
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES" voice="Polly.Lucia">Gracias por llamar a ICE Alarm. Un operador le atenderá en breve.</Say>
  <Say language="en-GB" voice="Polly.Amy">Thank you for calling ICE Alarm. An operator will be with you shortly.</Say>
  <Enqueue waitUrl="${baseUrl}/functions/v1/twilio-voice?action=wait">ice-alarm-queue</Enqueue>
</Response>`;
        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }
    }

    // ============================================================
    // ACTION: TRANSCRIPTION - Process speech and get AI response
    // ============================================================
    if (action === "transcription") {
      const formData = await req.formData();
      const speechResult = formData.get("SpeechResult") as string || "";
      const callSid = formData.get("CallSid") as string;
      const confidence = formData.get("Confidence") as string;

      console.log("Transcription received:", speechResult, "Confidence:", confidence, "CallSid:", callSid);

      // Handle empty speech (timeout)
      if (!speechResult || speechResult.trim() === "") {
        // Redirect to timeout handler
        const redirectUrl = `${baseUrl}/functions/v1/twilio-voice?action=timeout&callSid=${encodeURIComponent(callSid)}`;
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${redirectUrl}</Redirect>
</Response>`;
        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      // Load session
      const { data: session, error: sessionError } = await supabase
        .from("voice_call_sessions")
        .select("*")
        .eq("call_sid", callSid)
        .single();

      if (sessionError || !session) {
        console.error("Session not found:", callSid);
        // Create emergency response if session missing
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES" voice="Polly.Lucia">Lo siento, ha ocurrido un error técnico. Por favor, vuelva a llamar.</Say>
  <Say language="en-GB" voice="Polly.Amy">Sorry, a technical error occurred. Please call back.</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      // Reset timeout counter on successful speech
      const currentMessages = (session.messages as Array<{ role: string; content: string }>) || [];
      currentMessages.push({ role: "user", content: speechResult });

      // Get conversation_id from session or query param
      const sessionConvId = session.conversation_id;
      const activeConversationId = conversationIdParam || sessionConvId;

      // Save user message to conversation_messages
      await saveVoiceMessage(activeConversationId, "user", speechResult, { 
        callSid, 
        confidence: confidence ? parseFloat(confidence) : null 
      });

      // Detect language from first message if not set by member
      let detectedLanguage = session.language;
      if (currentMessages.length === 1) {
        // Simple language detection - Spanish keywords
        const spanishIndicators = /\b(hola|gracias|buenos|buenas|sí|si|no|quiero|necesito|tengo|puedo|por favor|ayuda|cómo|qué|cuánto)\b/i;
        if (spanishIndicators.test(speechResult)) {
          detectedLanguage = "es-ES";
        } else {
          detectedLanguage = "en-GB";
        }
        
        // Update session with detected language
        await supabase
          .from("voice_call_sessions")
          .update({ language: detectedLanguage })
          .eq("call_sid", callSid);
      }

      // Update session with new message
      await supabase
        .from("voice_call_sessions")
        .update({ 
          messages: currentMessages,
          timeout_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq("call_sid", callSid);

      // Call ai-run for response
      const aiResponse = await fetch(`${baseUrl}/functions/v1/ai-run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({
          agentKey: "customer_service_expert",
          context: {
            source: "voice_call",
            isVoiceCall: true,
            callDirection: "inbound",
            callerPhone: session.caller_phone,
            memberId: session.member_id,
            conversationHistory: currentMessages.slice(0, -1), // All but current message
            currentMessage: speechResult,
            userLanguage: detectedLanguage.startsWith("es") ? "es" : "en"
          }
        })
      });

      if (!aiResponse.ok) {
        console.error("AI-run error:", await aiResponse.text());
        const errorLang = detectedLanguage.startsWith("es") ? "es-ES" : "en-GB";
        const errorVoice = detectedLanguage.startsWith("es") ? "Polly.Lucia" : "Polly.Amy";
        const errorMsg = detectedLanguage.startsWith("es") 
          ? "Lo siento, tengo dificultades técnicas. ¿Puede repetir su pregunta?"
          : "Sorry, I'm having technical difficulties. Could you repeat your question?";
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${errorLang}" voice="${errorVoice}">${errorMsg}</Say>
  <Gather input="speech" 
          action="${baseUrl}/functions/v1/twilio-voice?action=transcription" 
          language="${detectedLanguage}" 
          speechTimeout="auto"
          timeout="10"
          actionOnEmptyResult="true">
  </Gather>
</Response>`;
        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      const aiResult = await aiResponse.json();
      let responseText = aiResult.output?.response || "";

      console.log("AI Response:", responseText);

      // Check for escalation trigger
      const escalationMatch = responseText.match(/\[ESCALATE:\s*(.+?)\]/i);
      if (escalationMatch) {
        const escalationReason = escalationMatch[1];
        responseText = responseText.replace(/\[ESCALATE:\s*.+?\]/i, "").trim();

        // Update session with escalation
        await supabase
          .from("voice_call_sessions")
          .update({ 
            status: "escalated",
            escalated_at: new Date().toISOString(),
            escalation_reason: escalationReason
          })
          .eq("call_sid", callSid);

        // Add the final response to messages
        currentMessages.push({ role: "assistant", content: responseText });
        await supabase
          .from("voice_call_sessions")
          .update({ messages: currentMessages })
          .eq("call_sid", callSid);

        // Get staff number for escalation (fallback to emergency phone)
        const { data: staffSettings } = await supabase
          .from("system_settings")
          .select("key, value")
          .in("key", ["settings_call_centre_phone", "settings_emergency_phone"]);
        
        const staffConfig = staffSettings?.reduce((acc, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {} as Record<string, string>) || {};

        const escalatePhone = staffConfig.settings_call_centre_phone || 
                             staffConfig.settings_emergency_phone || 
                             twilioConfig.settings_twilio_phone_number;

        const lang = detectedLanguage.startsWith("es") ? "es-ES" : "en-GB";
        const voice = detectedLanguage.startsWith("es") ? "Polly.Lucia" : "Polly.Amy";
        const connectMsg = detectedLanguage.startsWith("es")
          ? "Entiendo. Voy a conectarle con uno de nuestros especialistas. Por favor, espere un momento."
          : "I understand. I'm connecting you with one of our specialists. Please hold for a moment.";
        const failMsg = detectedLanguage.startsWith("es")
          ? "Lo sentimos, nuestros operadores están ocupados. Por favor, inténtelo de nuevo más tarde."
          : "Sorry, our operators are busy. Please try again later.";

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${responseText ? `<Say language="${lang}" voice="${voice}">${escapeXml(responseText)}</Say>` : ""}
  <Say language="${lang}" voice="${voice}">${connectMsg}</Say>
  <Dial timeout="30" callerId="${twilioConfig.settings_twilio_phone_number}">
    ${escalatePhone}
  </Dial>
  <Say language="${lang}" voice="${voice}">${failMsg}</Say>
  <Hangup/>
</Response>`;

        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      // Normal response - add to messages and continue conversation
      currentMessages.push({ role: "assistant", content: responseText });
      await supabase
        .from("voice_call_sessions")
        .update({ messages: currentMessages })
        .eq("call_sid", callSid);

      // Save assistant response to conversation_messages
      await saveVoiceMessage(activeConversationId, "assistant", responseText, { callSid });

      const lang = detectedLanguage.startsWith("es") ? "es-ES" : "en-GB";
      const voice = detectedLanguage.startsWith("es") ? "Polly.Lucia" : "Polly.Amy";

      // Build transcription URL with conversation_id for continuity
      const nextTranscriptionUrl = activeConversationId 
        ? `${baseUrl}/functions/v1/twilio-voice?action=transcription&conversation_id=${encodeURIComponent(activeConversationId)}`
        : `${baseUrl}/functions/v1/twilio-voice?action=transcription`;

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}" voice="${voice}">${escapeXml(responseText)}</Say>
  <Gather input="speech" 
          action="${nextTranscriptionUrl}" 
          language="${detectedLanguage}" 
          speechTimeout="auto"
          timeout="10"
          actionOnEmptyResult="true">
  </Gather>
</Response>`;

      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // ============================================================
    // ACTION: TIMEOUT - Handle no speech detected
    // ============================================================
    if (action === "timeout") {
      const callSid = url.searchParams.get("callSid") || "";
      
      // Also try to get from form data if available
      let actualCallSid = callSid;
      try {
        const formData = await req.formData();
        actualCallSid = (formData.get("CallSid") as string) || callSid;
      } catch {
        // Form data might not be available
      }

      console.log("Timeout handler for CallSid:", actualCallSid);

      // Load session
      const { data: session } = await supabase
        .from("voice_call_sessions")
        .select("*")
        .eq("call_sid", actualCallSid)
        .single();

      const timeoutCount = (session?.timeout_count || 0) + 1;
      const language = session?.language || "es-ES";
      const lang = language.startsWith("es") ? "es-ES" : "en-GB";
      const voice = language.startsWith("es") ? "Polly.Lucia" : "Polly.Amy";

      // Update timeout count
      if (session) {
        await supabase
          .from("voice_call_sessions")
          .update({ timeout_count: timeoutCount, updated_at: new Date().toISOString() })
          .eq("call_sid", actualCallSid);
      }

      // Check if max retries exceeded
      if (timeoutCount >= MAX_TIMEOUT_RETRIES) {
        const endMsg = language.startsWith("es")
          ? "No he podido escucharle. Si necesita asistencia urgente, por favor llame de nuevo. Adiós."
          : "I couldn't hear you. If you need urgent assistance, please call back. Goodbye.";

        // Mark session as ended
        if (session) {
          await supabase
            .from("voice_call_sessions")
            .update({ status: "timeout_ended" })
            .eq("call_sid", actualCallSid);
        }

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}" voice="${voice}">${endMsg}</Say>
  <Hangup/>
</Response>`;
        return new Response(twiml, {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      // Prompt user to speak again
      const retryMsg = language.startsWith("es")
        ? "Disculpe, no le he escuchado bien. ¿Podría repetir, por favor?"
        : "Sorry, I didn't catch that. Could you please repeat?";

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}" voice="${voice}">${retryMsg}</Say>
  <Gather input="speech" 
          action="${baseUrl}/functions/v1/twilio-voice?action=transcription" 
          language="${language}" 
          speechTimeout="auto"
          timeout="10"
          actionOnEmptyResult="true">
  </Gather>
</Response>`;

      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // ============================================================
    // ACTION: STATUS - Call status callback
    // ============================================================
    if (action === "status") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") as string;
      const callStatus = formData.get("CallStatus") as string;
      const duration = formData.get("CallDuration") as string;
      const recordingUrl = formData.get("RecordingUrl") as string;
      const from = formData.get("From") as string | null;
      const to = formData.get("To") as string | null;

      console.log("Call status update:", callSid, callStatus, duration, "ConversationId:", conversationIdParam, "LeadId:", leadIdParam);

      // Update voice session status
      if (callStatus === "completed" || callStatus === "busy" || callStatus === "failed" || callStatus === "no-answer") {
        await supabase
          .from("voice_call_sessions")
          .update({ 
            status: callStatus === "completed" ? "completed" : callStatus,
            updated_at: new Date().toISOString()
          })
          .eq("call_sid", callSid);
      }

      // Update conversation_calls with end time
      await supabase
        .from("conversation_calls")
        .update({
          ended_at: new Date().toISOString(),
          recording_url: recordingUrl || null,
          status: callStatus
        })
        .eq("call_sid", callSid);

      // Update alert_communications if exists
      await supabase
        .from("alert_communications")
        .update({
          duration_seconds: duration ? parseInt(duration) : null,
          recording_url: recordingUrl || null,
          notes: `Call ${callStatus}`
        })
        .eq("twilio_sid", callSid);

      // If call completed, generate CRM-ready summary note
      if (callStatus === "completed") {
        try {
          // Get conversation ID from param or look up from conversation_calls
          let convId = conversationIdParam;
          if (!convId) {
            const { data: callRecord } = await supabase
              .from("conversation_calls")
              .select("conversation_id")
              .eq("call_sid", callSid)
              .maybeSingle();
            convId = callRecord?.conversation_id;
          }

          // Get member info
          let memberId: string | null = null;
          let memberName = "";
          
          if (from) {
            const normalizedFrom = from.replace("+", "");
            const { data: member } = await supabase
              .from("members")
              .select("id, first_name, last_name")
              .or(`phone.eq.${from},phone.eq.${normalizedFrom}`)
              .maybeSingle();
            
            if (member) {
              memberId = member.id;
              memberName = `${member.first_name || ""} ${member.last_name || ""}`.trim();
            }
          }

          // If we have a conversation, get full transcript and generate summary
          let transcript = "";
          let aiSummary = "";
          
          if (convId) {
            // Fetch all messages from conversation_messages
            const { data: messages } = await supabase
              .from("conversation_messages")
              .select("channel, role, content, created_at")
              .eq("conversation_id", convId)
              .order("created_at", { ascending: true });

            if (messages && messages.length > 0) {
              // Build transcript
              transcript = messages.map(m => {
                const channelLabel = m.channel === "chat" ? "[CHAT]" : "[VOICE]";
                const roleLabel = m.role === "user" ? "User" : "Assistant";
                return `${channelLabel} ${roleLabel}: ${m.content}`;
              }).join("\n");

              // Generate AI summary
              try {
                const summaryResponse = await fetch(`${baseUrl}/functions/v1/ai-run`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
                  },
                  body: JSON.stringify({
                    agentKey: "customer_service_expert",
                    context: {
                      source: "crm_summary",
                      task: "summarize_conversation",
                      transcript,
                      memberName: memberName || "Unknown",
                      callDuration: duration ? parseInt(duration) : 0,
                      userLanguage: "en"
                    }
                  })
                });

                if (summaryResponse.ok) {
                  const summaryResult = await summaryResponse.json();
                  aiSummary = summaryResult.output?.response || summaryResult.output?.summary || "";
                }
              } catch (summaryErr) {
                console.error("Failed to generate AI summary:", summaryErr);
              }
            }

            // Update conversation as closed
            await supabase
              .from("conversations")
              .update({ 
                status: "closed",
                last_message_at: new Date().toISOString(),
                member_id: memberId || undefined
              })
              .eq("id", convId);

            // Update member_id on conversation if found
            if (memberId) {
              await supabase
                .from("conversations")
                .update({ member_id: memberId })
                .eq("id", convId)
                .is("member_id", null);
            }
          }

          // Build comprehensive CRM note
          const dur = duration ? parseInt(duration) : 0;
          const timestamp = new Date().toISOString();
          
          let noteContent = `📞 Voice + Chat Summary\n`;
          noteContent += `═══════════════════════════════════════\n\n`;
          noteContent += `📅 Date/Time: ${new Date(timestamp).toLocaleString()}\n`;
          noteContent += `👤 Member: ${memberName || "Unknown"}\n`;
          noteContent += `📱 From: ${from || "Unknown"}\n`;
          noteContent += `📞 To: ${to || "Unknown"}\n`;
          noteContent += `⏱️ Duration: ${dur} seconds\n`;
          noteContent += `🎫 CallSid: ${callSid}\n`;
          if (recordingUrl) {
            noteContent += `🎙️ Recording: ${recordingUrl}\n`;
          }
          noteContent += `\n`;

          if (aiSummary) {
            noteContent += `📋 AI SUMMARY\n`;
            noteContent += `───────────────────────────────────────\n`;
            noteContent += `${aiSummary}\n\n`;
          }

          if (transcript) {
            noteContent += `📝 FULL TRANSCRIPT\n`;
            noteContent += `───────────────────────────────────────\n`;
            noteContent += `${transcript}\n`;
          } else {
            noteContent += `Summary: Call handled by AI voice assistant.\n`;
          }

          // Save to member_notes if we have a member
          if (memberId) {
            await supabase.from("member_notes").insert({
              member_id: memberId,
              content: noteContent,
              note_type: "support",
              is_pinned: false
            });
          }
          
          // If no member but we have a lead_id (from Call and Speak), update the lead
          const activeLeadId = leadIdParam || (convId ? (await supabase
            .from("conversations")
            .select("lead_id")
            .eq("id", convId)
            .maybeSingle()
          ).data?.lead_id : null);
          
          if (!memberId && activeLeadId) {
            // Update lead with notes and mark as contacted
            await supabase
              .from("leads")
              .update({
                status: "contacted",
                notes: aiSummary || `Call completed - Duration: ${dur} seconds`
              })
              .eq("id", activeLeadId);
            
            console.log(`Updated lead ${activeLeadId} with call summary, marked as contacted`);
          }
        } catch (noteErr) {
          console.error("Failed to create CRM note:", noteErr);
        }
      }

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ACTION: RECORDING - Recording completed callback
    // ============================================================
    if (action === "recording") {
      const formData = await req.formData();
      const callSid = formData.get("CallSid") as string;
      const recordingUrl = formData.get("RecordingUrl") as string;

      console.log("Recording completed:", callSid, recordingUrl);

      await supabase
        .from("alert_communications")
        .update({ recording_url: recordingUrl })
        .eq("twilio_sid", callSid);

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // OUTBOUND CALL - Requires authentication
    // ============================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, alertId } = await req.json();

    // Make outbound call using Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.settings_twilio_account_sid}/Calls.json`;
    const auth = btoa(`${twilioConfig.settings_twilio_account_sid}:${twilioConfig.settings_twilio_auth_token}`);

    const callResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: twilioConfig.settings_twilio_phone_number || "+34900000000",
        Record: "true",
        StatusCallback: `${baseUrl}/functions/v1/twilio-voice?action=status`,
        RecordingStatusCallback: `${baseUrl}/functions/v1/twilio-voice?action=recording`,
        Url: `${baseUrl}/functions/v1/twilio-voice?action=outbound_connect`,
      }),
    });

    const callData = await callResponse.json();

    // Log communication
    if (alertId) {
      await supabase.from("alert_communications").insert({
        alert_id: alertId,
        communication_type: "voice",
        direction: "outbound",
        recipient_type: "member",
        recipient_phone: to,
        twilio_sid: callData.sid,
        staff_id: user.id
      });
    }

    return new Response(
      JSON.stringify(callData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Twilio voice error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
