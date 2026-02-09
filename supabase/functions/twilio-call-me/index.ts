import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FN = "twilio-call-me";

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// ── Rate limit settings for call-me ──
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_CALLS_PER_IP = 3;
const MAX_CALLS_PER_PHONE = 2;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxCalls: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxCalls - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= maxCalls) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true, remaining: maxCalls - entry.count, resetIn: entry.resetAt - now };
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "Website", lastName: "Caller" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "Caller" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const xh = { ...corsHeaders, "Content-Type": "application/xml" };
  const jh = { ...corsHeaders, "Content-Type": "application/json" };

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ═══════════════════════════════════════════════════════════
  // VOICE WEBHOOK HANDLER (Twilio inbound calls)
  // Activated when ?action= parameter is present
  // ═══════════════════════════════════════════════════════════
  if (action) {
    try {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const baseUrl = Deno.env.get("SUPABASE_URL")!;

      const { data: settings } = await sb
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "settings_twilio_account_sid",
          "settings_twilio_auth_token",
          "settings_twilio_phone_number",
          "voice_greeting_es",
          "voice_greeting_en",
          "voice_hold_es",
          "voice_hold_en",
          "voice_recording_notice_es",
          "voice_recording_notice_en",
        ]);

      const cfg: Record<string, string> = {};
      settings?.forEach((s) => { cfg[s.key] = s.value; });

      const getSetting = (key: string, fallback: string): string => {
        const v = cfg[key];
        return v?.trim() ? v : fallback;
      };

      // ─── WAIT ──────────────────────────────────────────
      if (action === "wait") {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><Response>` +
          `<Say language="es-ES" voice="Polly.Lucia">${esc(getSetting("voice_hold_es", "Por favor espere."))}</Say>` +
          `<Say language="en-GB" voice="Polly.Amy">${esc(getSetting("voice_hold_en", "Please hold."))}</Say>` +
          `<Pause length="10"/></Response>`,
          { headers: xh }
        );
      }

      // ─── INCOMING ──────────────────────────────────────
      if (action === "incoming") {
        try {
          const fd = await req.formData();
          const from = fd.get("From") as string;
          const to = fd.get("To") as string;
          const callSid = fd.get("CallSid") as string;
          const direction = fd.get("Direction") as string;
          const callerNameParam = url.searchParams.get("caller_name");
          const callerName = callerNameParam ? decodeURIComponent(callerNameParam).replace(/[<>&"']/g, "").trim() : "";
          const conversationParam = url.searchParams.get("conversation_id");
          const leadParam = url.searchParams.get("lead_id");

          console.log("Incoming call:", from, callSid, callerName || "anonymous");

          let member: any = null;
          const { data: m1 } = await sb.from("members").select("id, first_name, last_name, preferred_language").eq("phone", from).maybeSingle();
          if (m1) {
            member = m1;
          } else {
            const { data: m2 } = await sb.from("members").select("id, first_name, last_name, preferred_language").eq("phone", from.replace("+", "")).maybeSingle();
            member = m2;
          }

          const lang = url.searchParams.get("lang") || member?.preferred_language || "es";
          const twimlLang = lang === "es" ? "es-ES" : "en-GB";

          let convId = conversationParam || null;
          if (convId) {
            const { data: existing } = await sb.from("conversations").select("id").eq("id", convId).maybeSingle();
            if (existing) {
              const upd: any = { source: "mixed", last_channel: "voice", last_message_at: new Date().toISOString() };
              if (leadParam) upd.lead_id = leadParam;
              await sb.from("conversations").update(upd).eq("id", convId);
            } else {
              convId = null;
            }
          }
          if (!convId) {
            const ins: any = {
              member_id: member?.id || null,
              language: lang === "es" ? "es" : "en",
              source: conversationParam ? "mixed" : "voice",
              last_channel: "voice",
              status: "open",
              last_message_at: new Date().toISOString(),
            };
            if (leadParam) ins.lead_id = leadParam;
            const { data: newConv } = await sb.from("conversations").insert(ins).select("id").single();
            convId = newConv?.id || null;
          }

          try {
            await sb.from("voice_call_sessions").insert({
              call_sid: callSid, caller_phone: from, member_id: member?.id || null,
              language: twimlLang, status: "active", messages: [], conversation_id: convId,
            });
          } catch {
            await sb.from("voice_call_sessions").insert({
              call_sid: callSid, caller_phone: from, member_id: member?.id || null,
              language: twimlLang, status: "active", messages: [],
            });
          }

          if (convId) {
            try {
              await sb.from("conversation_calls").insert({
                conversation_id: convId, call_sid: callSid,
                direction: direction?.includes("outbound") ? "outbound" : "inbound",
                from_number: from, to_number: to,
                started_at: new Date().toISOString(), status: "initiated",
              });
            } catch {}
          }

          if (convId && member?.id) {
            await sb.from("conversations").update({ member_id: member.id }).eq("id", convId).is("member_id", null);
          }

          const recEs = getSetting("voice_recording_notice_es", "Esta llamada puede ser grabada.");
          const recEn = getSetting("voice_recording_notice_en", "This call may be recorded.");
          const name = member?.first_name || callerName || "";

          const greetEs = name
            ? `Hola ${name}, bienvenido a ICE Alarm. Soy Isabel. ${recEs} ¿En qué puedo ayudarle?`
            : `${getSetting("voice_greeting_es", "Gracias por llamar a ICE Alarm. Soy Isabel.")} ${recEs} ¿En qué puedo ayudarle?`;

          const greetEn = name
            ? `Hello ${name}, welcome to ICE Alarm. I'm Isabel. ${recEn} How can I help?`
            : `${getSetting("voice_greeting_en", "Thank you for calling ICE Alarm. I'm Isabel.")} ${recEn} How can I help?`;

          if (convId) {
            try {
              await sb.from("conversation_messages").insert({
                conversation_id: convId, channel: "voice", role: "assistant",
                content: lang === "es" ? greetEs : greetEn,
                meta: { callSid, type: "greeting" },
              });
            } catch {}
          }

          const txUrl = convId
            ? `${baseUrl}/functions/v1/${FN}?action=transcription&conversation_id=${encodeURIComponent(convId)}`
            : `${baseUrl}/functions/v1/${FN}?action=transcription`;

          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response>` +
            `<Say language="es-ES" voice="Polly.Lucia">${esc(greetEs)}</Say>` +
            `<Pause length="1"/>` +
            `<Say language="en-GB" voice="Polly.Amy">${esc(greetEn)}</Say>` +
            `<Gather input="speech" action="${txUrl}" language="${twimlLang}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather>` +
            `</Response>`,
            { headers: xh }
          );
        } catch (e) {
          console.error("Incoming error:", e);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response>` +
            `<Say language="es-ES" voice="Polly.Lucia">Gracias por llamar. Un operador le atenderá.</Say>` +
            `<Enqueue waitUrl="${baseUrl}/functions/v1/${FN}?action=wait">ice-alarm-queue</Enqueue>` +
            `</Response>`,
            { headers: xh }
          );
        }
      }

      // ─── TRANSCRIPTION ─────────────────────────────────
      if (action === "transcription") {
        const fd = await req.formData();
        const speech = (fd.get("SpeechResult") as string) || "";
        const callSid = fd.get("CallSid") as string;
        const confidence = fd.get("Confidence") as string;
        const convParam = url.searchParams.get("conversation_id");

        console.log("Speech:", speech, "Confidence:", confidence);

        if (!speech.trim()) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response>` +
            `<Redirect method="POST">${baseUrl}/functions/v1/${FN}?action=timeout&amp;callSid=${encodeURIComponent(callSid)}</Redirect>` +
            `</Response>`,
            { headers: xh }
          );
        }

        const { data: session } = await sb.from("voice_call_sessions").select("*").eq("call_sid", callSid).single();
        if (!session) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-ES" voice="Polly.Lucia">Error técnico.</Say><Hangup/></Response>`,
            { headers: xh }
          );
        }

        const messages = (session.messages as Array<{ role: string; content: string }>) || [];
        messages.push({ role: "user", content: speech });
        const convId = convParam || session.conversation_id;

        if (convId) {
          try {
            await sb.from("conversation_messages").insert({
              conversation_id: convId, channel: "voice", role: "user",
              content: speech,
              meta: { callSid, confidence: confidence ? parseFloat(confidence) : null },
            });
          } catch {}
        }

        let lang = session.language;
        if (messages.length === 1) {
          lang = /\b(hola|gracias|buenos|buenas|sí|quiero|necesito|por favor|ayuda)\b/i.test(speech) ? "es-ES" : "en-GB";
          await sb.from("voice_call_sessions").update({ language: lang }).eq("call_sid", callSid);
        }

        await sb.from("voice_call_sessions").update({
          messages, timeout_count: 0, updated_at: new Date().toISOString(),
        }).eq("call_sid", callSid);

        const aiRes = await fetch(`${baseUrl}/functions/v1/ai-run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            agentKey: "customer_service_expert",
            context: {
              source: "voice_call", isVoiceCall: true, callDirection: "inbound",
              callerPhone: session.caller_phone, memberId: session.member_id,
              conversationHistory: messages.slice(0, -1), currentMessage: speech,
              userLanguage: lang.startsWith("es") ? "es" : "en",
            },
          }),
        });

        const ln = lang.startsWith("es") ? "es-ES" : "en-GB";
        const voice = lang.startsWith("es") ? "Polly.Lucia" : "Polly.Amy";

        if (!aiRes.ok) {
          console.error("AI error:", await aiRes.text());
          const gatherUrl = `${baseUrl}/functions/v1/${FN}?action=transcription${convId ? "&conversation_id=" + encodeURIComponent(convId) : ""}`;
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response>` +
            `<Say language="${ln}" voice="${voice}">${lang.startsWith("es") ? "Dificultades técnicas. ¿Puede repetir?" : "Technical issue. Could you repeat?"}</Say>` +
            `<Gather input="speech" action="${gatherUrl}" language="${lang}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather>` +
            `</Response>`,
            { headers: xh }
          );
        }

        const aiData = await aiRes.json();
        let reply = aiData.output?.response || "";
        console.log("AI reply:", reply);

        const escMatch = reply.match(/\[ESCALATE:\s*(.+?)\]/i);
        if (escMatch) {
          reply = reply.replace(/\[ESCALATE:\s*.+?\]/i, "").trim();
          await sb.from("voice_call_sessions").update({
            status: "escalated", escalated_at: new Date().toISOString(), escalation_reason: escMatch[1],
          }).eq("call_sid", callSid);
          messages.push({ role: "assistant", content: reply });
          await sb.from("voice_call_sessions").update({ messages }).eq("call_sid", callSid);

          const { data: phoneCfg } = await sb.from("system_settings").select("key, value").in("key", ["settings_call_centre_phone", "settings_emergency_phone"]);
          const phones: Record<string, string> = {};
          phoneCfg?.forEach((s) => { phones[s.key] = s.value; });
          const escPhone = phones.settings_call_centre_phone || phones.settings_emergency_phone || cfg.settings_twilio_phone_number;

          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response>` +
            (reply ? `<Say language="${ln}" voice="${voice}">${esc(reply)}</Say>` : "") +
            `<Say language="${ln}" voice="${voice}">${lang.startsWith("es") ? "Conectándole con un especialista." : "Connecting you to a specialist."}</Say>` +
            `<Dial timeout="30" callerId="${cfg.settings_twilio_phone_number}">${escPhone}</Dial>` +
            `<Say language="${ln}" voice="${voice}">${lang.startsWith("es") ? "Operadores ocupados. Intente luego." : "Operators busy. Try later."}</Say>` +
            `<Hangup/></Response>`,
            { headers: xh }
          );
        }

        messages.push({ role: "assistant", content: reply });
        await sb.from("voice_call_sessions").update({ messages }).eq("call_sid", callSid);

        if (convId) {
          try {
            await sb.from("conversation_messages").insert({
              conversation_id: convId, channel: "voice", role: "assistant",
              content: reply, meta: { callSid },
            });
          } catch {}
        }

        const nextUrl = `${baseUrl}/functions/v1/${FN}?action=transcription${convId ? "&conversation_id=" + encodeURIComponent(convId) : ""}`;
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><Response>` +
          `<Say language="${ln}" voice="${voice}">${esc(reply)}</Say>` +
          `<Gather input="speech" action="${nextUrl}" language="${lang}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather>` +
          `</Response>`,
          { headers: xh }
        );
      }

      // ─── TIMEOUT ───────────────────────────────────────
      if (action === "timeout") {
        let callSid = url.searchParams.get("callSid") || "";
        try { const fd = await req.formData(); callSid = (fd.get("CallSid") as string) || callSid; } catch {}

        const { data: session } = await sb.from("voice_call_sessions").select("*").eq("call_sid", callSid).single();
        const tc = (session?.timeout_count || 0) + 1;
        const lang = session?.language || "es-ES";
        const ln = lang.startsWith("es") ? "es-ES" : "en-GB";
        const voice = lang.startsWith("es") ? "Polly.Lucia" : "Polly.Amy";

        if (session) await sb.from("voice_call_sessions").update({ timeout_count: tc, updated_at: new Date().toISOString() }).eq("call_sid", callSid);

        if (tc >= 3) {
          if (session) await sb.from("voice_call_sessions").update({ status: "timeout_ended" }).eq("call_sid", callSid);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response>` +
            `<Say language="${ln}" voice="${voice}">${lang.startsWith("es") ? "No le escucho. Llame de nuevo. Adiós." : "Can't hear you. Please call back. Goodbye."}</Say>` +
            `<Hangup/></Response>`,
            { headers: xh }
          );
        }

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><Response>` +
          `<Say language="${ln}" voice="${voice}">${lang.startsWith("es") ? "No le escuché. ¿Puede repetir?" : "Didn't catch that. Could you repeat?"}</Say>` +
          `<Gather input="speech" action="${baseUrl}/functions/v1/${FN}?action=transcription" language="${lang}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather>` +
          `</Response>`,
          { headers: xh }
        );
      }

      // ─── STATUS ────────────────────────────────────────
      if (action === "status") {
        const fd = await req.formData();
        const callSid = fd.get("CallSid") as string;
        const callStatus = fd.get("CallStatus") as string;
        const duration = fd.get("CallDuration") as string;
        const recordingUrl = fd.get("RecordingUrl") as string;
        const from = fd.get("From") as string | null;
        const convParam = url.searchParams.get("conversation_id");
        const leadParam = url.searchParams.get("lead_id");

        console.log("Status:", callSid, callStatus, duration);

        if (["completed", "busy", "failed", "no-answer"].includes(callStatus)) {
          await sb.from("voice_call_sessions").update({ status: callStatus, updated_at: new Date().toISOString() }).eq("call_sid", callSid);
        }

        await sb.from("conversation_calls").update({ ended_at: new Date().toISOString(), recording_url: recordingUrl || null, status: callStatus }).eq("call_sid", callSid);
        await sb.from("alert_communications").update({ duration_seconds: duration ? parseInt(duration) : null, recording_url: recordingUrl || null, notes: `Call ${callStatus}` }).eq("twilio_sid", callSid);

        if (callStatus === "completed") {
          try {
            let convId = convParam;
            if (!convId) {
              const { data: cc } = await sb.from("conversation_calls").select("conversation_id").eq("call_sid", callSid).maybeSingle();
              convId = cc?.conversation_id;
            }

            let memberId: string | null = null;
            if (from) {
              const nf = from.replace("+", "");
              const { data: mb } = await sb.from("members").select("id").or(`phone.eq.${from},phone.eq.${nf}`).maybeSingle();
              if (mb) memberId = mb.id;
            }

            const dur = duration ? parseInt(duration) : 0;
            let note = `📞 Voice Call\n📅 ${new Date().toLocaleString()}\n📱 ${from || "?"}\n⏱️ ${dur}s`;
            if (recordingUrl) note += `\n🎙️ ${recordingUrl}`;

            if (memberId) {
              await sb.from("member_notes").insert({ member_id: memberId, content: note, note_type: "support", is_pinned: false });
            }

            if (convId) {
              await sb.from("conversations").update({ status: "closed", last_message_at: new Date().toISOString() }).eq("id", convId);
            }

            const leadId = leadParam || (convId ? (await sb.from("conversations").select("lead_id").eq("id", convId).maybeSingle()).data?.lead_id : null);
            if (!memberId && leadId) {
              await sb.from("leads").update({ status: "contacted", notes: `Call completed - ${dur}s` }).eq("id", leadId);
            }
          } catch (e) {
            console.error("Note error:", e);
          }
        }

        return new Response(JSON.stringify({ received: true }), { headers: jh });
      }

      // ─── RECORDING ─────────────────────────────────────
      if (action === "recording") {
        const fd = await req.formData();
        await sb.from("alert_communications").update({ recording_url: fd.get("RecordingUrl") as string }).eq("twilio_sid", fd.get("CallSid") as string);
        return new Response(JSON.stringify({ received: true }), { headers: jh });
      }

      return new Response(JSON.stringify({ error: "Unknown action", action }), { status: 400, headers: jh });

    } catch (e) {
      console.error("Voice handler error:", e);
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
        { status: 500, headers: jh }
      );
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CALL-ME HANDLER (website callback requests)
  // Activated when no ?action= parameter
  // ═══════════════════════════════════════════════════════════
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     "unknown";

    const { phoneNumber, callerName, language, conversationId } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: jh }
      );
    }

    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^\+[0-9]{8,15}$/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Please use international format starting with +" }),
        { status: 400, headers: jh }
      );
    }

    const lang = language === "en" ? "en" : "es";

    const ipRateLimit = checkRateLimit(`ip:${clientIp}`, MAX_CALLS_PER_IP);
    if (!ipRateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many call requests. Please try again later.", retryAfterMs: ipRateLimit.resetIn }),
        { status: 429, headers: jh }
      );
    }

    const phoneRateLimit = checkRateLimit(`phone:${cleanPhone}`, MAX_CALLS_PER_PHONE);
    if (!phoneRateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "This phone number has received too many calls recently. Please try again later.", retryAfterMs: phoneRateLimit.resetIn }),
        { status: 429, headers: jh }
      );
    }

    const sanitizedName = callerName
      ? String(callerName).replace(/[<>&"']/g, "").trim().slice(0, 50)
      : "";

    console.log(`Call request: IP=${clientIp}, Phone=${cleanPhone}, Name=${sanitizedName || "(none)"}, Language=${lang}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedPhone = cleanPhone.replace("+", "");
    let existingMember = null;

    const { data: memberByExact } = await supabase
      .from("members").select("id, first_name").eq("phone", cleanPhone).maybeSingle();

    if (memberByExact) {
      existingMember = memberByExact;
    } else {
      const { data: memberByNormalized } = await supabase
        .from("members").select("id, first_name").eq("phone", normalizedPhone).maybeSingle();
      existingMember = memberByNormalized;
    }

    let leadId: string | null = null;

    if (!existingMember) {
      const { firstName, lastName } = parseName(sanitizedName);
      const timestamp = Date.now();
      const placeholderEmail = `call-${timestamp}@pending.icealarm.es`;

      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          first_name: firstName, last_name: lastName,
          email: placeholderEmail, phone: cleanPhone,
          preferred_language: lang, enquiry_type: "callback",
          source: "website_call_me",
          message: "Requested callback via Call and Speak feature",
          status: "new"
        })
        .select("id").single();

      if (leadError) {
        console.error("Failed to create lead:", leadError);
      } else {
        leadId = newLead.id;
        console.log(`Created lead ${leadId} for website caller: ${firstName} ${lastName}`);
      }
    } else {
      console.log(`Caller is existing member: ${existingMember.id} (${existingMember.first_name})`);
    }

    const { data: twilioSettings } = await supabase
      .from("system_settings").select("key, value")
      .in("key", ["settings_twilio_account_sid", "settings_twilio_auth_token", "settings_twilio_phone_number"]);

    const twilioConfig = twilioSettings?.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {} as Record<string, string>) || {};

    if (!twilioConfig.settings_twilio_account_sid || !twilioConfig.settings_twilio_auth_token) {
      return new Response(
        JSON.stringify({ error: "Voice calling is not available at the moment" }),
        { status: 503, headers: jh }
      );
    }

    if (!twilioConfig.settings_twilio_phone_number) {
      return new Response(
        JSON.stringify({ error: "Voice calling is not configured" }),
        { status: 503, headers: jh }
      );
    }

    const baseUrl = Deno.env.get("SUPABASE_URL");

    // Use THIS function for voice webhook (since twilio-voice deployment is broken)
    let voiceUrl = `${baseUrl}/functions/v1/${FN}?action=incoming&lang=${lang}&source=website`;
    if (conversationId) voiceUrl += `&conversation_id=${encodeURIComponent(conversationId)}`;
    if (sanitizedName) voiceUrl += `&caller_name=${encodeURIComponent(sanitizedName)}`;
    if (leadId) voiceUrl += `&lead_id=${encodeURIComponent(leadId)}`;

    let statusUrl = `${baseUrl}/functions/v1/${FN}?action=status`;
    if (conversationId) statusUrl += `&conversation_id=${encodeURIComponent(conversationId)}`;
    if (leadId) statusUrl += `&lead_id=${encodeURIComponent(leadId)}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.settings_twilio_account_sid}/Calls.json`;
    const auth = btoa(`${twilioConfig.settings_twilio_account_sid}:${twilioConfig.settings_twilio_auth_token}`);

    const callResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: cleanPhone,
        From: twilioConfig.settings_twilio_phone_number,
        Url: voiceUrl,
        Method: "POST",
        StatusCallback: statusUrl,
        StatusCallbackMethod: "POST",
        StatusCallbackEvent: "initiated ringing answered completed",
      }),
    });

    if (!callResponse.ok) {
      const errorText = await callResponse.text();
      console.error("Twilio API error:", callResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to initiate call. Please check your phone number and try again." }),
        { status: 500, headers: jh }
      );
    }

    const callData = await callResponse.json();
    console.log(`Call initiated successfully: CallSid=${callData.sid}, To=${cleanPhone}, LeadId=${leadId || "(member)"}`);

    return new Response(
      JSON.stringify({
        success: true, callSid: callData.sid, leadId,
        message: "Call is being initiated. Please answer your phone."
      }),
      { headers: jh }
    );

  } catch (error) {
    console.error("twilio-call-me error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: jh }
    );
  }
});
