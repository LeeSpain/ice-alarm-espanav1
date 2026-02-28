import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { staffRegisterSchema, validateRequest } from "../_shared/validation.ts";



interface StaffRegistrationRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "call_centre_supervisor" | "call_centre";
  phone?: string;
  preferred_language: "en" | "es";
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getRoleDisplayName(role: string): string {
  switch (role) {
    case "admin": return "Admin";
    case "call_centre_supervisor": return "Call Centre Supervisor";
    case "call_centre": return "Call Centre Agent";
    default: return role;
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token for authorization check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the caller's JWT and get their role
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin or super_admin
    const { data: staffData, error: staffError } = await userClient
      .from("staff")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (staffError || !staffData) {
      return new Response(
        JSON.stringify({ error: "Not authorized - staff record not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["admin", "super_admin"].includes(staffData.role)) {
      return new Response(
        JSON.stringify({ error: "Only admins can create staff accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const validated = validateRequest(staffRegisterSchema, rawBody, corsHeaders);
    if (validated.error) return validated.error;
    const body = validated.data as StaffRegistrationRequest;
    const { email, first_name, last_name, role, phone, preferred_language } = body;

    // Create admin client for user creation
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists in staff table
    const { data: existingStaff } = await adminClient
      .from("staff")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingStaff) {
      return new Response(
        JSON.stringify({ error: "A staff member with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: "staff",
      },
    });

    if (authError || !authUser.user) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert staff record
    const { data: newStaff, error: staffInsertError } = await adminClient
      .from("staff")
      .insert({
        user_id: authUser.user.id,
        email: email.toLowerCase(),
        first_name,
        last_name,
        role,
        phone: phone || null,
        preferred_language: preferred_language || "en",
        is_active: true,
      })
      .select("id")
      .single();

    if (staffInsertError || !newStaff) {
      console.error("Error inserting staff record:", staffInsertError);
      // Rollback: delete the auth user we just created
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create staff record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity
    await adminClient.from("activity_logs").insert({
      action: "staff_created",
      entity_type: "staff",
      entity_id: newStaff.id,
      staff_id: null, // Will be set by RLS context if available
      new_values: {
        email: email.toLowerCase(),
        role,
        created_by_user_id: userId,
      },
    });

    // Send welcome email with credentials via Gmail SMTP
    try {
      const staffLoginUrl = `${req.headers.get("origin") || "https://shelter-span.lovable.app"}/staff/login`;
      
      const emailContent = preferred_language === "es" 
        ? `
          <h1>Bienvenido al Portal de Personal de ICE Alarm</h1>
          <p>Hola ${first_name},</p>
          <p>Tu cuenta de personal ha sido creada con el rol: <strong>${getRoleDisplayName(role)}</strong></p>
          <p>Tus credenciales de acceso temporales:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
          </ul>
          <p>Por favor, inicia sesión y cambia tu contraseña inmediatamente.</p>
          <p><a href="${staffLoginUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Iniciar Sesión</a></p>
          <p>Si tienes alguna pregunta, contacta con tu supervisor.</p>
        `
        : `
          <h1>Welcome to ICE Alarm Staff Portal</h1>
          <p>Hello ${first_name},</p>
          <p>Your staff account has been created with the role: <strong>${getRoleDisplayName(role)}</strong></p>
          <p>Your temporary login credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          </ul>
          <p>Please log in and change your password immediately.</p>
          <p><a href="${staffLoginUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Staff Portal</a></p>
          <p>If you have any questions, please contact your supervisor.</p>
        `;

      const emailSubject = preferred_language === "es" 
        ? "Tu cuenta de personal de ICE Alarm ha sido creada" 
        : "Your ICE Alarm Staff Account Has Been Created";

      const emailResult = await sendEmail(email, emailSubject, emailContent);

      if (emailResult.success) {
        console.log("Welcome email sent successfully to:", email);
      } else {
        console.error("Failed to send welcome email:", emailResult.error);
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request if email fails - staff account was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        staff_id: newStaff.id,
        message: "Staff member created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in staff-register function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
