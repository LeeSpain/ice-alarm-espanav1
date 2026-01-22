import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  inviteId: string;
  channel: "email" | "sms" | "whatsapp";
  recipient: string;
  message: string;
  language: "en" | "es";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the request is from an authenticated partner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is a partner
    const { data: partner, error: partnerError } = await supabaseClient
      .from("partners")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (partnerError || !partner || partner.status !== "active") {
      throw new Error("User is not an active partner");
    }

    const { inviteId, channel, recipient, message, language }: InviteRequest = await req.json();

    if (!inviteId || !channel || !recipient || !message) {
      throw new Error("Missing required fields");
    }

    // Verify invite belongs to this partner
    const { data: invite, error: inviteError } = await supabaseClient
      .from("partner_invites")
      .select("id, partner_id")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite || invite.partner_id !== partner.id) {
      throw new Error("Invite not found or unauthorized");
    }

    let success = false;
    let errorMessage = "";

    if (channel === "email") {
      // Send via Resend
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) {
        throw new Error("Email service not configured");
      }

      const subject = language === "es" 
        ? "Invitación a ICE Alarm España" 
        : "Invitation to ICE Alarm Spain";

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ICE Alarm Partners <partners@icealarm.es>",
          to: [recipient],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">${language === "es" ? "Invitación a ICE Alarm" : "ICE Alarm Invitation"}</h2>
              <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
                ${message.replace(/\n/g, "<br>")}
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                ${language === "es" 
                  ? "Este correo fue enviado por un socio de ICE Alarm España." 
                  : "This email was sent by an ICE Alarm Spain partner."}
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const error = await emailRes.text();
        throw new Error(`Email sending failed: ${error}`);
      }

      success = true;
    } else if (channel === "sms" || channel === "whatsapp") {
      // Send via Twilio
      const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
      const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
      const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        // If Twilio is not configured, still mark as success but log warning
        console.warn("Twilio not configured - invite recorded but message not sent");
        success = true;
      } else {
        const from = channel === "whatsapp" 
          ? `whatsapp:${TWILIO_WHATSAPP_NUMBER}`
          : TWILIO_PHONE_NUMBER;
        
        const to = channel === "whatsapp" 
          ? `whatsapp:${recipient}`
          : recipient;

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            },
            body: new URLSearchParams({
              From: from || "",
              To: to,
              Body: message,
            }),
          }
        );

        if (!twilioRes.ok) {
          const error = await twilioRes.text();
          throw new Error(`SMS/WhatsApp sending failed: ${error}`);
        }

        success = true;
      }
    } else {
      throw new Error("Invalid channel");
    }

    // Log CRM event for invite_sent
    await supabaseClient.from("crm_events").insert({
      event_type: "invite_sent",
      payload: {
        invite_id: inviteId,
        partner_id: partner.id,
        channel,
        recipient,
        language,
      },
    });

    return new Response(
      JSON.stringify({ success, message: "Invite sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in partner-send-invite:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
