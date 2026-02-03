import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

interface SendEmailRequest {
  to: string;
  subject: string;
  html_body: string;
  text_body?: string;
  module: "member" | "outreach" | "support" | "system";
  related_entity_id?: string;
  related_entity_type?: string;
  template_slug?: string;
  template_variables?: Record<string, string>;
  language?: "en" | "es";
  reply_to?: string;
  in_reply_to?: string;
  thread_id?: string;
}

// Replace template variables in a string
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get email settings
    const { data: settings, error: settingsError } = await supabase
      .from("email_settings")
      .select("*")
      .eq("id", SINGLETON_ID)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ success: false, error: "Email settings not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const payload: SendEmailRequest = await req.json();
    const { 
      to, 
      module, 
      related_entity_id, 
      related_entity_type,
      template_slug,
      template_variables = {},
      language = "es",
      reply_to,
      in_reply_to,
      thread_id,
    } = payload;

    let { subject, html_body, text_body } = payload;

    if (!to || !module) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, module" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check email toggle for module
    const toggleMap: Record<string, keyof typeof settings> = {
      member: "enable_member_emails",
      outreach: "enable_outreach_emails",
      support: "enable_system_emails",
      system: "enable_system_emails",
    };

    const toggleKey = toggleMap[module];
    if (toggleKey && !settings[toggleKey]) {
      return new Response(
        JSON.stringify({ success: false, error: `Emails for module '${module}' are disabled` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check send limits
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Hourly limit check
    if (settings.hourly_send_limit > 0) {
      const { count: hourlyCount } = await supabase
        .from("email_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("sent_at", hourAgo.toISOString());

      if ((hourlyCount || 0) >= settings.hourly_send_limit) {
        return new Response(
          JSON.stringify({ success: false, error: "Hourly send limit reached" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Daily limit check
    if (settings.daily_send_limit > 0) {
      const { count: dailyCount } = await supabase
        .from("email_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("sent_at", dayStart.toISOString());

      if ((dailyCount || 0) >= settings.daily_send_limit) {
        return new Response(
          JSON.stringify({ success: false, error: "Daily send limit reached" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If template_slug is provided, fetch and use template
    let templateId: string | null = null;
    if (template_slug) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("slug", template_slug)
        .eq("is_active", true)
        .single();

      if (templateError || !template) {
        console.warn(`Template '${template_slug}' not found, using provided content`);
      } else {
        templateId = template.id;
        // Use language-specific template content
        subject = language === "es" ? template.subject_es : template.subject_en;
        html_body = language === "es" ? template.body_html_es : template.body_html_en;
        text_body = language === "es" ? template.body_text_es : template.body_text_en;

        // Replace variables
        subject = replaceVariables(subject, template_variables);
        html_body = replaceVariables(html_body, template_variables);
        if (text_body) {
          text_body = replaceVariables(text_body, template_variables);
        }
      }
    }

    // Validate we have content
    if (!subject || !html_body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing subject or html_body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apply signature
    if (settings.signature_html) {
      html_body += `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">${settings.signature_html}</div>`;
    }

    // Build headers for routing (Stage 5)
    const customHeaders: Record<string, string> = {
      "X-ICE-Module": module,
    };

    if (related_entity_id) {
      customHeaders["X-ICE-Entity-ID"] = related_entity_id;
    }
    if (related_entity_type) {
      customHeaders["X-ICE-Entity-Type"] = related_entity_type;
    }
    if (in_reply_to) {
      customHeaders["In-Reply-To"] = in_reply_to;
    }
    if (thread_id) {
      customHeaders["References"] = thread_id;
    }

    // Send email via Resend
    const fromName = settings.from_name || "ICE Alarm España";
    const fromEmail = settings.from_email || "noreply@icealarm.es";
    const resend = new Resend(resendApiKey);

    const emailPayload: any = {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: html_body,
      headers: customHeaders,
    };

    if (text_body) {
      emailPayload.text = text_body;
    }

    if (reply_to || settings.reply_to_email) {
      emailPayload.reply_to = reply_to || settings.reply_to_email;
    }

    const { data: emailResult, error: emailError } = await resend.emails.send(emailPayload);

    // Log to email_log
    const logEntry = {
      to_email: to,
      from_email: fromEmail,
      subject,
      body_html: html_body,
      body_text: text_body,
      module,
      related_entity_id: related_entity_id || null,
      related_entity_type: related_entity_type || null,
      template_id: templateId,
      status: emailError ? "failed" : "sent",
      provider_message_id: emailResult?.id || null,
      error_message: emailError?.message || null,
      headers_json: customHeaders,
      sent_at: emailError ? null : new Date().toISOString(),
    };

    const { data: logData, error: logError } = await supabase
      .from("email_log")
      .insert(logEntry)
      .select("id")
      .single();

    if (logError) {
      console.error("Error logging email:", logError);
    }

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ success: false, error: emailError.message, log_id: logData?.id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailResult?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: emailResult?.id,
        log_id: logData?.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
