import { createClient } from "npm:@supabase/supabase-js@2";

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  const ch = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };
  if (req.method === "OPTIONS") return new Response(null, { headers: ch });
  const xh = { ...ch, "Content-Type": "application/xml" };
  const jh = { ...ch, "Content-Type": "application/json" };
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: st } = await sb.from("system_settings").select("key, value").in("key", ["settings_twilio_account_sid","settings_twilio_auth_token","settings_twilio_phone_number","settings_emergency_phone","voice_greeting_es","voice_greeting_en","voice_hold_es","voice_hold_en","voice_recording_notice_es","voice_recording_notice_en"]);
    const c: Record<string,string> = {}; st?.forEach(s => { c[s.key] = s.value; });
    const g = (k: string, f: string) => { const v = c[k]; return v?.trim() ? v : f; };
    if (!c.settings_twilio_account_sid || !c.settings_twilio_auth_token) return new Response(JSON.stringify({error:"Twilio not configured"}),{status:500,headers:jh});
    const u = new URL(req.url), a = u.searchParams.get("action"), cp = u.searchParams.get("conversation_id"), lp = u.searchParams.get("lead_id"), b = Deno.env.get("SUPABASE_URL");

    if (a === "wait") return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-ES" voice="Polly.Lucia">${esc(g("voice_hold_es","Por favor espere."))}</Say><Say language="en-GB" voice="Polly.Amy">${esc(g("voice_hold_en","Please hold."))}</Say><Pause length="10"/></Response>`,{headers:xh});

    if (a === "incoming") {
      try {
        const fd = await req.formData(), fr = fd.get("From") as string, to = fd.get("To") as string, sid = fd.get("CallSid") as string, di = fd.get("Direction") as string;
        const cnp = u.searchParams.get("caller_name"), cn = cnp ? decodeURIComponent(cnp).replace(/[<>&"']/g,"").trim() : "";
        console.log("IN:",fr,sid,cn||"anon");
        let mb: any = null;
        const {data:m1} = await sb.from("members").select("id,first_name,last_name,preferred_language").eq("phone",fr).maybeSingle();
        if (m1) mb = m1; else { const {data:m2} = await sb.from("members").select("id,first_name,last_name,preferred_language").eq("phone",fr.replace("+","")).maybeSingle(); mb = m2; }
        const lg = u.searchParams.get("lang") || mb?.preferred_language || "es", tl = lg==="es"?"es-ES":"en-GB";
        let cv = cp;
        if (cp) { const {data:ex} = await sb.from("conversations").select("id").eq("id",cp).maybeSingle(); if (ex) { const up: any = {source:"mixed",last_channel:"voice",last_message_at:new Date().toISOString()}; if (lp) up.lead_id=lp; await sb.from("conversations").update(up).eq("id",cp); } else cv=null; }
        if (!cv) { const ins: any = {member_id:mb?.id||null,language:lg==="es"?"es":"en",source:cp?"mixed":"voice",last_channel:"voice",status:"open",last_message_at:new Date().toISOString()}; if (lp) ins.lead_id=lp; const {data:nc} = await sb.from("conversations").insert(ins).select("id").single(); cv = nc?.id||null; }
        try { await sb.from("voice_call_sessions").insert({call_sid:sid,caller_phone:fr,member_id:mb?.id||null,language:tl,status:"active",messages:[],conversation_id:cv}); } catch { await sb.from("voice_call_sessions").insert({call_sid:sid,caller_phone:fr,member_id:mb?.id||null,language:tl,status:"active",messages:[]}); }
        if (cv) { try { await sb.from("conversation_calls").insert({conversation_id:cv,call_sid:sid,direction:di?.includes("outbound")?"outbound":"inbound",from_number:fr,to_number:to,started_at:new Date().toISOString(),status:"initiated"}); } catch {} }
        if (cv && mb?.id) await sb.from("conversations").update({member_id:mb.id}).eq("id",cv).is("member_id",null);
        if (mb) { const {data:al} = await sb.from("alerts").insert({member_id:mb.id,alert_type:"sos_button",status:"incoming",message:`Voice call from ${fr}`}).select("id").single(); if (al?.id) { try { await fetch(`${b}/functions/v1/partner-alert-notify`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`},body:JSON.stringify({alert_id:al.id,member_id:mb.id})}); } catch {} } }
        const re = g("voice_recording_notice_es","Esta llamada puede ser grabada."), ren = g("voice_recording_notice_en","This call may be recorded.");
        const pn = mb?.first_name || cn || "";
        const ge = pn ? `Hola ${pn}, bienvenido a ICE Alarm. Soy Isabel. ${re} ¿En qué puedo ayudarle?` : `${g("voice_greeting_es","Gracias por llamar a ICE Alarm. Soy Isabel.")} ${re} ¿En qué puedo ayudarle?`;
        const gn = pn ? `Hello ${pn}, welcome to ICE Alarm. I'm Isabel. ${ren} How can I help?` : `${g("voice_greeting_en","Thank you for calling ICE Alarm. I'm Isabel.")} ${ren} How can I help?`;
        if (cv) { try { await sb.from("conversation_messages").insert({conversation_id:cv,channel:"voice",role:"assistant",content:lg==="es"?ge:gn,meta:{callSid:sid,type:"greeting"}}); } catch {} }
        const tu = cv ? `${b}/functions/v1/twilio-voice?action=transcription&conversation_id=${encodeURIComponent(cv)}` : `${b}/functions/v1/twilio-voice?action=transcription`;
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-ES" voice="Polly.Lucia">${esc(ge)}</Say><Pause length="1"/><Say language="en-GB" voice="Polly.Amy">${esc(gn)}</Say><Gather input="speech" action="${tu}" language="${tl}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather></Response>`,{headers:xh});
      } catch (e) { console.error("IN err:",e); return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-ES" voice="Polly.Lucia">Gracias por llamar. Un operador le atenderá.</Say><Enqueue waitUrl="${b}/functions/v1/twilio-voice?action=wait">ice-alarm-queue</Enqueue></Response>`,{headers:xh}); }
    }

    if (a === "transcription") {
      const fd = await req.formData(), sp = (fd.get("SpeechResult") as string)||"", sid = fd.get("CallSid") as string, co = fd.get("Confidence") as string;
      console.log("SP:",sp,"C:",co,"S:",sid);
      if (!sp.trim()) return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${b}/functions/v1/twilio-voice?action=timeout&amp;callSid=${encodeURIComponent(sid)}</Redirect></Response>`,{headers:xh});
      const {data:se} = await sb.from("voice_call_sessions").select("*").eq("call_sid",sid).single();
      if (!se) return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-ES" voice="Polly.Lucia">Error técnico.</Say><Hangup/></Response>`,{headers:xh});
      const ms = (se.messages as Array<{role:string;content:string}>)||[]; ms.push({role:"user",content:sp});
      const ci = cp || se.conversation_id;
      if (ci) { try { await sb.from("conversation_messages").insert({conversation_id:ci,channel:"voice",role:"user",content:sp,meta:{callSid:sid,confidence:co?parseFloat(co):null}}); } catch {} }
      let dl = se.language;
      if (ms.length===1) { dl = /\b(hola|gracias|buenos|buenas|sí|quiero|necesito|por favor|ayuda)\b/i.test(sp)?"es-ES":"en-GB"; await sb.from("voice_call_sessions").update({language:dl}).eq("call_sid",sid); }
      await sb.from("voice_call_sessions").update({messages:ms,timeout_count:0,updated_at:new Date().toISOString()}).eq("call_sid",sid);
      const ar = await fetch(`${b}/functions/v1/ai-run`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`},body:JSON.stringify({agentKey:"customer_service_expert",context:{source:"voice_call",isVoiceCall:true,callDirection:"inbound",callerPhone:se.caller_phone,memberId:se.member_id,conversationHistory:ms.slice(0,-1),currentMessage:sp,userLanguage:dl.startsWith("es")?"es":"en"}})});
      const ln = dl.startsWith("es")?"es-ES":"en-GB", vc = dl.startsWith("es")?"Polly.Lucia":"Polly.Amy";
      if (!ar.ok) { console.error("AI err:",await ar.text()); return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="${ln}" voice="${vc}">${dl.startsWith("es")?"Dificultades técnicas. ¿Puede repetir?":"Technical issue. Repeat?"}</Say><Gather input="speech" action="${b}/functions/v1/twilio-voice?action=transcription" language="${dl}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather></Response>`,{headers:xh}); }
      const ai = await ar.json(); let rp = ai.output?.response||""; console.log("AI:",rp);
      const em = rp.match(/\[ESCALATE:\s*(.+?)\]/i);
      if (em) { rp = rp.replace(/\[ESCALATE:\s*.+?\]/i,"").trim(); await sb.from("voice_call_sessions").update({status:"escalated",escalated_at:new Date().toISOString(),escalation_reason:em[1]}).eq("call_sid",sid); ms.push({role:"assistant",content:rp}); await sb.from("voice_call_sessions").update({messages:ms}).eq("call_sid",sid); const {data:sc} = await sb.from("system_settings").select("key,value").in("key",["settings_call_centre_phone","settings_emergency_phone"]); const sf: Record<string,string>={}; sc?.forEach(s=>{sf[s.key]=s.value;}); const ep = sf.settings_call_centre_phone||sf.settings_emergency_phone||c.settings_twilio_phone_number; return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${rp?`<Say language="${ln}" voice="${vc}">${esc(rp)}</Say>`:""}<Say language="${ln}" voice="${vc}">${dl.startsWith("es")?"Conectándole con un especialista.":"Connecting you to a specialist."}</Say><Dial timeout="30" callerId="${c.settings_twilio_phone_number}">${ep}</Dial><Say language="${ln}" voice="${vc}">${dl.startsWith("es")?"Operadores ocupados. Intente luego.":"Operators busy. Try later."}</Say><Hangup/></Response>`,{headers:xh}); }
      ms.push({role:"assistant",content:rp}); await sb.from("voice_call_sessions").update({messages:ms}).eq("call_sid",sid);
      if (ci) { try { await sb.from("conversation_messages").insert({conversation_id:ci,channel:"voice",role:"assistant",content:rp,meta:{callSid:sid}}); } catch {} }
      const nu = ci ? `${b}/functions/v1/twilio-voice?action=transcription&conversation_id=${encodeURIComponent(ci)}` : `${b}/functions/v1/twilio-voice?action=transcription`;
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="${ln}" voice="${vc}">${esc(rp)}</Say><Gather input="speech" action="${nu}" language="${dl}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather></Response>`,{headers:xh});
    }

    if (a === "timeout") {
      let sid = u.searchParams.get("callSid")||""; try { const fd = await req.formData(); sid = (fd.get("CallSid") as string)||sid; } catch {}
      const {data:se} = await sb.from("voice_call_sessions").select("*").eq("call_sid",sid).single();
      const tc = (se?.timeout_count||0)+1, la = se?.language||"es-ES", ln = la.startsWith("es")?"es-ES":"en-GB", vc = la.startsWith("es")?"Polly.Lucia":"Polly.Amy";
      if (se) await sb.from("voice_call_sessions").update({timeout_count:tc,updated_at:new Date().toISOString()}).eq("call_sid",sid);
      if (tc>=3) { if (se) await sb.from("voice_call_sessions").update({status:"timeout_ended"}).eq("call_sid",sid); return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="${ln}" voice="${vc}">${la.startsWith("es")?"No le escucho. Llame de nuevo. Adiós.":"Can't hear you. Call back. Goodbye."}</Say><Hangup/></Response>`,{headers:xh}); }
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say language="${ln}" voice="${vc}">${la.startsWith("es")?"No le escuché. ¿Puede repetir?":"Didn't catch that. Repeat?"}</Say><Gather input="speech" action="${b}/functions/v1/twilio-voice?action=transcription" language="${la}" speechTimeout="auto" timeout="10" actionOnEmptyResult="true"></Gather></Response>`,{headers:xh});
    }

    if (a === "status") {
      const fd = await req.formData(), sid = fd.get("CallSid") as string, ss = fd.get("CallStatus") as string, du = fd.get("CallDuration") as string, rc = fd.get("RecordingUrl") as string, fr = fd.get("From") as string|null;
      console.log("ST:",sid,ss,du);
      if (["completed","busy","failed","no-answer"].includes(ss)) await sb.from("voice_call_sessions").update({status:ss==="completed"?"completed":ss,updated_at:new Date().toISOString()}).eq("call_sid",sid);
      await sb.from("conversation_calls").update({ended_at:new Date().toISOString(),recording_url:rc||null,status:ss}).eq("call_sid",sid);
      await sb.from("alert_communications").update({duration_seconds:du?parseInt(du):null,recording_url:rc||null,notes:`Call ${ss}`}).eq("twilio_sid",sid);
      if (ss==="completed") { try { let ci=cp; if (!ci) { const {data:cr} = await sb.from("conversation_calls").select("conversation_id").eq("call_sid",sid).maybeSingle(); ci=cr?.conversation_id; } let mi:string|null=null; if (fr) { const nf=fr.replace("+",""); const {data:mb} = await sb.from("members").select("id").or(`phone.eq.${fr},phone.eq.${nf}`).maybeSingle(); if (mb) mi=mb.id; } const d=du?parseInt(du):0; let n=`📞 Voice Call\n📅 ${new Date().toLocaleString()}\n📱 ${fr||"?"}\n⏱️ ${d}s`; if (rc) n+=`\n🎙️ ${rc}`; if (mi) await sb.from("member_notes").insert({member_id:mi,content:n,note_type:"support",is_pinned:false}); if (ci) await sb.from("conversations").update({status:"closed",last_message_at:new Date().toISOString()}).eq("id",ci); const li=lp||(ci?(await sb.from("conversations").select("lead_id").eq("id",ci).maybeSingle()).data?.lead_id:null); if (!mi&&li) await sb.from("leads").update({status:"contacted",notes:`Call done - ${d}s`}).eq("id",li); } catch(e) { console.error("Note err:",e); } }
      return new Response(JSON.stringify({received:true}),{headers:jh});
    }

    if (a === "recording") { const fd = await req.formData(); await sb.from("alert_communications").update({recording_url:fd.get("RecordingUrl") as string}).eq("twilio_sid",fd.get("CallSid") as string); return new Response(JSON.stringify({received:true}),{headers:jh}); }

    return new Response(JSON.stringify({error:"Unknown action",action:a}),{status:400,headers:jh});
  } catch (e) { console.error("ERR:",e); return new Response(JSON.stringify({error:e instanceof Error?e.message:"Unknown"}),{status:500,headers:{"Content-Type":"application/json"}}); }
});
