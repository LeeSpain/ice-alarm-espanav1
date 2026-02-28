import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";



interface NotifyPayload {
  event_type: "sale.paid" | "partner.joined" | "hot.sales" | "test";
  entity_type?: string;
  entity_id?: string;
  payload: {
    customer_name?: string;
    language?: string;
    amount?: number;
    products_summary?: string;
    source?: string;
    partner_name?: string;
    order_id?: string;
    partner_id?: string;
    contact_name?: string;
    company_name?: string;
  };
}

function formatSalePaidMessage(payload: NotifyPayload["payload"], timestamp: string): string {
  const customerName = payload.customer_name || "Unknown";
  const language = payload.language?.toUpperCase() || "ES";
  const amount = payload.amount?.toFixed(2) || "0.00";
  const products = payload.products_summary || "N/A";
  const source = payload.partner_name 
    ? `Partner: ${payload.partner_name}` 
    : "Direct";

  return `🟢 PAID SALE
👤 ${customerName} (${language})
💶 €${amount}
📦 ${products}
🔗 Source: ${source}
🕒 ${timestamp}
➡️ Admin: /admin/orders/${payload.order_id || ""}
✅ Suggested: Create follow-up task / Welcome message`;
}

function formatPartnerJoinedMessage(payload: NotifyPayload["payload"], timestamp: string): string {
  const name = payload.contact_name || payload.company_name || "Unknown Partner";
  return `🤝 NEW PARTNER JOINED
👤 ${name}
🕒 ${timestamp}
➡️ Admin: /admin/partners
✅ Suggested: Welcome call / Setup assistance`;
}

function formatHotSalesMessage(payload: NotifyPayload["payload"], timestamp: string): string {
  return `🔥 HOT SALES ESCALATION
📋 Action required for sales opportunity
🕒 ${timestamp}
➡️ Admin: /admin/dashboard
✅ Suggested: Review and take action`;
}

function formatTestMessage(): string {
  return `✅ TEST NOTIFICATION
WhatsApp notifications are working correctly!
🕒 ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: NotifyPayload = await req.json();
    const { event_type, entity_type, entity_id, payload } = body;

    console.log("notify-admin called:", event_type, entity_type, entity_id);

    // Get Twilio credentials (with settings_ prefix)
    const { data: twilioSettings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "settings_twilio_account_sid", 
        "settings_twilio_auth_token",
        "settings_twilio_api_key_sid",
        "settings_twilio_api_key_secret", 
        "settings_twilio_whatsapp_number"
      ]);

    const twilioConfig: Record<string, string> = {};
    twilioSettings?.forEach((s) => {
      twilioConfig[s.key] = s.value;
    });

    // Prefer API Keys, fall back to Auth Token
    const authUsername = twilioConfig.settings_twilio_api_key_sid || twilioConfig.settings_twilio_account_sid;
    const authPassword = twilioConfig.settings_twilio_api_key_secret || twilioConfig.settings_twilio_auth_token;

    if (!twilioConfig.settings_twilio_account_sid || !authPassword || !twilioConfig.settings_twilio_whatsapp_number) {
      console.error("Twilio not fully configured");
      return new Response(
        JSON.stringify({ error: "Twilio not configured", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all admin notification settings
    const { data: allSettings } = await supabase
      .from("notification_settings")
      .select("*");

    if (!allSettings || allSettings.length === 0) {
      console.log("No notification settings configured");
      return new Response(
        JSON.stringify({ message: "No notification settings configured", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    const results = [];

    for (const settings of allSettings) {
      // Check if this event type is enabled for this admin
      let shouldSend = false;
      let message = "";

      switch (event_type) {
        case "sale.paid":
          shouldSend = settings.whatsapp_paid_sales === true;
          message = formatSalePaidMessage(payload, timestamp);
          break;
        case "partner.joined":
          shouldSend = settings.whatsapp_partner_signup === true;
          message = formatPartnerJoinedMessage(payload, timestamp);
          break;
        case "hot.sales":
          shouldSend = settings.whatsapp_hot_sales === true;
          message = formatHotSalesMessage(payload, timestamp);
          break;
        case "test":
          shouldSend = true;
          message = formatTestMessage();
          break;
        default:
          console.log("Unknown event type:", event_type);
          continue;
      }

      if (!shouldSend) {
        console.log(`Notifications disabled for ${event_type} for admin ${settings.admin_user_id}`);
        continue;
      }

      if (!settings.whatsapp_number) {
        console.log(`No WhatsApp number configured for admin ${settings.admin_user_id}`);
        continue;
      }

      // Send WhatsApp via Twilio (using API Keys or Auth Token)
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.settings_twilio_account_sid}/Messages.json`;
      const authHeader = btoa(`${authUsername}:${authPassword}`);

      const formData = new URLSearchParams();
      formData.append("From", `whatsapp:${twilioConfig.settings_twilio_whatsapp_number}`);
      formData.append("To", `whatsapp:${settings.whatsapp_number}`);
      formData.append("Body", message);

      let status = "pending";
      let providerMessageId = null;
      let error = null;

      try {
        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const twilioResult = await twilioResponse.json();

        if (twilioResponse.ok) {
          status = "sent";
          providerMessageId = twilioResult.sid;
          console.log("WhatsApp sent successfully:", twilioResult.sid);
        } else {
          status = "failed";
          error = twilioResult.message || "Twilio error";
          console.error("Twilio error:", twilioResult);
        }
      } catch (e) {
        status = "failed";
        error = e instanceof Error ? e.message : "Unknown error";
        console.error("WhatsApp send error:", e);
      }

      // Log to notification_log
      await supabase.from("notification_log").insert({
        admin_user_id: settings.admin_user_id,
        event_type,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        message,
        status,
        provider_message_id: providerMessageId,
        error,
      });

      results.push({
        admin_user_id: settings.admin_user_id,
        status,
        provider_message_id: providerMessageId,
        error,
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("notify-admin error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
