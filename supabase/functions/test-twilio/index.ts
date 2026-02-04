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

    // Get Twilio credentials (with settings_ prefix)
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "settings_twilio_account_sid",
        "settings_twilio_auth_token",
        "settings_twilio_api_key_sid",
        "settings_twilio_api_key_secret"
      ]);

    const config: Record<string, string> = {};
    settings?.forEach((s) => {
      config[s.key] = s.value;
    });

    const accountSid = config.settings_twilio_account_sid;
    
    // Prefer API Keys, fall back to Auth Token
    const authUsername = config.settings_twilio_api_key_sid || accountSid;
    const authPassword = config.settings_twilio_api_key_secret || config.settings_twilio_auth_token;

    if (!accountSid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Account SID not configured" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No authentication configured (API Key Secret or Auth Token required)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test credentials by fetching account info
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const auth = btoa(`${authUsername}:${authPassword}`);

    const response = await fetch(twilioUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      const authMethod = config.settings_twilio_api_key_sid ? "API Key" : "Auth Token";
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `✓ Connected to Twilio account "${data.friendly_name}" using ${authMethod}`,
          account_name: data.friendly_name,
          account_status: data.status,
          auth_method: authMethod
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Parse Twilio error
      const errorMessage = data.message || data.detail || "Authentication failed";
      const errorCode = data.code || response.status;
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Twilio error ${errorCode}: ${errorMessage}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("test-twilio error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
