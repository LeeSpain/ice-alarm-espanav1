import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit settings
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CALLS_PER_IP = 3;
const MAX_CALLS_PER_PHONE = 2;

// In-memory rate limit store (resets on function cold start, but good enough for abuse prevention)
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    const { phoneNumber, language, conversationId } = await req.json();
    
    // Validate phone number (must start with + and contain digits)
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const cleanPhone = phoneNumber.replace(/\s/g, "");
    if (!/^\+[0-9]{8,15}$/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Please use international format starting with +" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate language
    const lang = language === "en" ? "en" : "es"; // Default to Spanish
    
    // Rate limit by IP
    const ipRateLimit = checkRateLimit(`ip:${clientIp}`, MAX_CALLS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.log(`Rate limited IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many call requests. Please try again later.",
          retryAfterMs: ipRateLimit.resetIn
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Rate limit by phone number
    const phoneRateLimit = checkRateLimit(`phone:${cleanPhone}`, MAX_CALLS_PER_PHONE);
    if (!phoneRateLimit.allowed) {
      console.log(`Rate limited phone: ${cleanPhone}`);
      return new Response(
        JSON.stringify({ 
          error: "This phone number has received too many calls recently. Please try again later.",
          retryAfterMs: phoneRateLimit.resetIn
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Call request: IP=${clientIp}, Phone=${cleanPhone}, Language=${lang}`);
    
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
      console.error("Twilio not configured");
      return new Response(
        JSON.stringify({ error: "Voice calling is not available at the moment" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!twilioConfig.settings_twilio_phone_number) {
      console.error("Twilio phone number not configured");
      return new Response(
        JSON.stringify({ error: "Voice calling is not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const baseUrl = Deno.env.get("SUPABASE_URL");
    
    // Build voice webhook URL with conversation context
    let voiceUrl = `${baseUrl}/functions/v1/twilio-voice?action=incoming&lang=${lang}&source=website`;
    if (conversationId) {
      voiceUrl += `&conversation_id=${encodeURIComponent(conversationId)}`;
    }
    
    // Make outbound call using Twilio API
    // The URL points to the existing twilio-voice function with action=incoming_ai
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
        // Point to existing AI voice handler with language and conversation context
        Url: voiceUrl,
        Method: "POST",
        StatusCallback: `${baseUrl}/functions/v1/twilio-voice?action=status${conversationId ? `&conversation_id=${encodeURIComponent(conversationId)}` : ""}`,
        StatusCallbackMethod: "POST",
        StatusCallbackEvent: "initiated ringing answered completed",
      }),
    });
    
    if (!callResponse.ok) {
      const errorText = await callResponse.text();
      console.error("Twilio API error:", callResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to initiate call. Please check your phone number and try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const callData = await callResponse.json();
    
    console.log(`Call initiated successfully: CallSid=${callData.sid}, To=${cleanPhone}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: callData.sid,
        message: "Call is being initiated. Please answer your phone."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("twilio-call-me error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
