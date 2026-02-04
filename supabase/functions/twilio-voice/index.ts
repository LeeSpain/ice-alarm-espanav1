import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        "settings_twilio_phone_number"
      ]);

    const twilioConfig = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>) || {};

    if (!twilioConfig.settings_twilio_account_sid || !twilioConfig.settings_twilio_auth_token) {
      return new Response(
        JSON.stringify({ error: "Twilio not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "incoming") {
      // Handle incoming call - return TwiML
      const formData = await req.formData();
      const from = formData.get("From") as string;
      const to = formData.get("To") as string;
      const callSid = formData.get("CallSid") as string;

      console.log("Incoming call from:", from, "to:", to, "SID:", callSid);

      // Find member by phone
      const { data: member } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .or(`phone.eq.${from},phone.eq.${from.replace("+", "")}`)
        .single();

      // Create or update alert for incoming call
      if (member) {
        await supabase.from("alerts").insert({
          member_id: member.id,
          alert_type: "sos_button",
          status: "incoming"
        });
      }

      // TwiML response - put caller in queue
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES">Gracias por llamar a ICE Alarm. Un operador le atenderá en breve.</Say>
  <Say language="en-GB">Thank you for calling ICE Alarm. An operator will be with you shortly.</Say>
  <Enqueue waitUrl="/api/twilio-voice?action=wait">emergency-queue</Enqueue>
</Response>`;

      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    if (action === "wait") {
      // Hold music/message while waiting
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES">Por favor, permanezca en línea.</Say>
  <Play>http://com.twilio.music.classical.s3.amazonaws.com/BusssessAnt498_1702.mp3</Play>
</Response>`;

      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    if (action === "status") {
      // Call status callback
      const formData = await req.formData();
      const callSid = formData.get("CallSid") as string;
      const callStatus = formData.get("CallStatus") as string;
      const duration = formData.get("CallDuration") as string;
      const recordingUrl = formData.get("RecordingUrl") as string;

      console.log("Call status update:", callSid, callStatus, duration);

      // Update alert_communications if exists
      await supabase
        .from("alert_communications")
        .update({
          duration_seconds: duration ? parseInt(duration) : null,
          recording_url: recordingUrl || null,
          notes: `Call ${callStatus}`
        })
        .eq("twilio_sid", callSid);

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "recording") {
      // Recording completed callback
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

    // Outbound call initiation (requires auth)
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
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
        StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice?action=status`,
        RecordingStatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice?action=recording`,
        Url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice?action=connect`,
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
        staff_id: claimsData.claims.sub
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
