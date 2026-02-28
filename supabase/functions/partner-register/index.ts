import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { partnerRegisterSchema, validateRequest } from "../_shared/validation.ts";



interface PartnerRegistrationRequest {
  contact_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  preferred_language: "en" | "es";
  payout_beneficiary_name: string;
  payout_iban: string;
  password: string;
  // B2B fields
  partner_type?: "referral" | "care" | "residential";
  organization_type?: string;
  organization_registration?: string;
  organization_website?: string;
  estimated_monthly_referrals?: string;
  facility_address?: string;
  facility_resident_count?: number;
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ICE-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateVerificationToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const rawBody = await req.json();
    const validated = validateRequest(partnerRegisterSchema, rawBody, corsHeaders);
    if (validated.error) return validated.error;
    const data = validated.data as PartnerRegistrationRequest;

    // Check if email already exists in partners table
    const { data: existingPartner } = await supabase
      .from("partners")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (existingPartner) {
      return new Response(
        JSON.stringify({ error: "A partner with this email already exists" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // We'll verify via our custom flow
      user_metadata: {
        role: "partner",
        contact_name: data.contact_name
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from("partners")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      
      if (!existing) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    // Create partner record with B2B fields
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .insert({
        user_id: authData.user.id,
        contact_name: data.contact_name,
        company_name: data.company_name || null,
        email: data.email,
        phone: data.phone || null,
        preferred_language: data.preferred_language,
        payout_beneficiary_name: data.payout_beneficiary_name,
        payout_iban: data.payout_iban,
        referral_code: referralCode,
        status: "pending",
        // B2B fields
        partner_type: data.partner_type || "referral",
        organization_type: data.organization_type || "individual",
        organization_registration: data.organization_registration || null,
        organization_website: data.organization_website || null,
        estimated_monthly_referrals: data.estimated_monthly_referrals || null,
        facility_address: data.facility_address || null,
        facility_resident_count: data.facility_resident_count || null,
      })
      .select()
      .single();

    if (partnerError) {
      console.error("Partner creation error:", partnerError);
      // Clean up auth user if partner creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create partner record" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create verification token
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const { error: tokenError } = await supabase
      .from("partner_verification_tokens")
      .insert({
        partner_id: partner.id,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("Token creation error:", tokenError);
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      action: "partner_created",
      entity_type: "partner",
      entity_id: partner.id,
      new_values: { email: data.email, contact_name: data.contact_name }
    });

    // Log CRM event for partner_created
    await supabase.from("crm_events").insert({
      event_type: "partner_created",
      payload: {
        partner_id: partner.id,
        email: data.email,
        contact_name: data.contact_name,
        company_name: data.company_name || null,
        referral_code: referralCode,
      },
    });

    // Get base URL from request origin or use fallback
    const origin = req.headers.get("origin") || "https://shelter-span.lovable.app";
    const verificationUrl = `${origin}/partner/verify?token=${token}`;

    // Send verification email
    const emailContent = data.preferred_language === "es" 
      ? {
          subject: "Verifica tu cuenta de socio - ICE Alarm",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a365d;">¡Bienvenido a ICE Alarm!</h1>
              <p>Hola ${data.contact_name},</p>
              <p>Gracias por registrarte como socio. Por favor verifica tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Verificar Mi Cuenta
                </a>
              </div>
              <p>Este enlace expirará en 24 horas.</p>
              <p>Tu código de referido es: <strong>${referralCode}</strong></p>
              <p>Saludos,<br>El equipo de ICE Alarm</p>
            </div>
          `
        }
      : {
          subject: "Verify your partner account - ICE Alarm",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a365d;">Welcome to ICE Alarm!</h1>
              <p>Hello ${data.contact_name},</p>
              <p>Thank you for registering as a partner. Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Verify My Account
                </a>
              </div>
              <p>This link will expire in 24 hours.</p>
              <p>Your referral code is: <strong>${referralCode}</strong></p>
              <p>Best regards,<br>The ICE Alarm Team</p>
            </div>
          `
        };

    try {
      const emailResult = await sendEmail(
        data.email,
        emailContent.subject,
        emailContent.html
      );
      
      if (!emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
      } else {
        console.log("Verification email sent to:", data.email);
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the registration if email fails - they can request resend
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Registration successful. Please check your email to verify your account.",
        partner_id: partner.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
