import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

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
        JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is staff
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: staffData } = await supabase
      .from("staff")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .single();

    if (!staffData) {
      return new Response(
        JSON.stringify({ error: "Staff access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email settings
    const { data: settings, error: settingsError } = await supabase
      .from("email_settings")
      .select("*")
      .eq("id", SINGLETON_ID)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "Email settings not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recipient from request body
    const body = await req.json();
    const toEmail = body.to;

    if (!toEmail) {
      return new Response(
        JSON.stringify({ error: "Recipient email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email
    const fromName = settings.from_name || "ICE Alarm España";
    const fromEmail = settings.from_email || "noreply@icealarm.es";
    const signature = settings.signature_html || "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626;">ICE Alarm España</h1>
        </div>
        
        <h2 style="color: #1f2937;">Test Email</h2>
        
        <p>This is a test email from your ICE Alarm email system.</p>
        
        <p>If you received this email, your email configuration is working correctly!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Configuration Details:</h3>
          <p style="margin: 5px 0;"><strong>From Name:</strong> ${fromName}</p>
          <p style="margin: 5px 0;"><strong>From Email:</strong> ${fromEmail}</p>
          <p style="margin: 5px 0;"><strong>Provider:</strong> Resend</p>
          <p style="margin: 5px 0;"><strong>Sent At:</strong> ${new Date().toISOString()}</p>
        </div>
        
        ${signature ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">${signature}</div>` : ""}
      </body>
      </html>
    `;

    // Send email via Resend
    const resend = new Resend(resendApiKey);

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject: "Test Email - ICE Alarm Email System",
      html: htmlContent,
      headers: {
        "X-ICE-Module": "system",
        "X-ICE-Type": "test",
      },
    });

    if (emailError) {
      console.error("Error sending test email:", emailError);
      
      // Log failed attempt
      await supabase.from("email_log").insert({
        to_email: toEmail,
        from_email: fromEmail,
        subject: "Test Email - ICE Alarm Email System",
        body_html: htmlContent,
        module: "system",
        status: "failed",
        error_message: emailError.message,
      });

      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful send
    await supabase.from("email_log").insert({
      to_email: toEmail,
      from_email: fromEmail,
      subject: "Test Email - ICE Alarm Email System",
      body_html: htmlContent,
      module: "system",
      status: "sent",
      provider_message_id: emailResult?.id,
      sent_at: new Date().toISOString(),
      headers_json: { "X-ICE-Module": "system", "X-ICE-Type": "test" },
    });

    console.log("Test email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message_id: emailResult?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-test-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
