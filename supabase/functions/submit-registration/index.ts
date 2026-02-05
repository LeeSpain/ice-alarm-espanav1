import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Build registration confirmation email HTML
function buildRegistrationConfirmationEmail(
  firstName: string,
  membershipType: string,
  total: number,
  hasPendant: boolean,
  pendantCount: number,
  language: "en" | "es"
): string {
  const pendantInfo = hasPendant 
    ? (language === "es" 
        ? `✓ Colgante GPS (×${pendantCount})` 
        : `✓ GPS Pendant (×${pendantCount})`)
    : "";

  if (language === "es") {
    return `
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
        
        <h2 style="color: #1f2937;">¡Tu registro está casi completo!</h2>
        
        <p>Hola ${firstName},</p>
        
        <p>¡Gracias por comenzar tu registro en ICE Alarm! Tu inscripción está casi lista.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Importante:</strong> Por favor completa el pago para activar tu membresía.
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Resumen del Pedido:</h3>
          <p style="margin: 5px 0;">✓ Membresía ${membershipType === "couple" ? "Pareja" : "Individual"}</p>
          ${pendantInfo ? `<p style="margin: 5px 0;">${pendantInfo}</p>` : ""}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <p style="margin: 5px 0; font-size: 18px;"><strong>Total: €${total.toFixed(2)}</strong></p>
        </div>
        
        <p>Si no completaste el pago, puedes volver en cualquier momento para finalizarlo.</p>
        
        <p>¿Tienes preguntas? Responde a este email o llámanos.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Saludos cordiales,<br>
          El Equipo de ICE Alarm
        </p>
      </body>
      </html>
    `;
  }

  // English version
  return `
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
      
      <h2 style="color: #1f2937;">Your registration is almost complete!</h2>
      
      <p>Hello ${firstName},</p>
      
      <p>Thank you for starting your ICE Alarm registration! Your enrollment is almost ready.</p>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>⚠️ Important:</strong> Please complete your payment to activate your membership.
        </p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Order Summary:</h3>
        <p style="margin: 5px 0;">✓ ${membershipType === "couple" ? "Couple" : "Individual"} Membership</p>
        ${pendantInfo ? `<p style="margin: 5px 0;">${pendantInfo}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <p style="margin: 5px 0; font-size: 18px;"><strong>Total: €${total.toFixed(2)}</strong></p>
      </div>
      
      <p>If you didn't complete the payment, you can return anytime to finalize it.</p>
      
      <p>Have questions? Reply to this email or give us a call.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The ICE Alarm Team
      </p>
    </body>
    </html>
  `;
}

interface MemberDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nieDni: string;
  preferredLanguage: "en" | "es";
  preferredContactMethod?: "whatsapp" | "phone" | "email";
  preferredContactTime?: "morning" | "afternoon" | "evening" | "anytime";
  specialInstructions?: string;
}

interface AddressDetails {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface MedicalDetails {
  bloodType: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  doctorName: string;
  doctorPhone: string;
  hospitalPreference: string;
  additionalNotes: string;
}

interface EmergencyContact {
  contactName: string;
  relationship: string;
  phone: string;
  email: string;
  speaksSpanish: boolean;
  notes: string;
}

interface RegistrationRequest {
  membershipType: "single" | "couple";
  primaryMember: MemberDetails;
  partnerMember?: MemberDetails;
  address: AddressDetails;
  medicalInfo: MedicalDetails;
  partnerMedicalInfo?: MedicalDetails;
  emergencyContacts: EmergencyContact[];
  includePendant: boolean;
  pendantCount: number;
  billingFrequency: "monthly" | "annual";
  partnerRef?: string; // Partner referral code for attribution
  refPostId?: string; // Post ID from partner share link for attribution
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  testMode?: boolean; // If true, skip Stripe and mark everything as completed
}

// Pricing constants (NET prices)
const PRICING = {
  single: { monthlyNet: 24.99 },  // 10% IVA
  couple: { monthlyNet: 34.99 },  // 10% IVA
  annualMonths: 10,               // Pay for 10 months (2 free)
  pendantNet: 125.00,             // 21% IVA
  pendantTaxRate: 0.21,
  subscriptionTaxRate: 0.10,
  registrationFee: 59.99,         // No IVA
  shipping: 14.99,                // IVA included
};

// Helper function to create CRM profile for a member
// deno-lint-ignore no-explicit-any
async function createCrmProfile(
  supabase: any,
  memberId: string,
  membershipType: "single" | "couple",
  language: "en" | "es",
  includePendant: boolean,
  pendantCount: number,
  hasPartnerAttribution: boolean
) {
  // Build tags array
  const tags: string[] = [];
  tags.push(membershipType === "couple" ? "membership_couple" : "membership_single");
  tags.push(language === "en" ? "language_en" : "language_es");
  tags.push(includePendant ? "pendant_yes" : "pendant_no");
  if (includePendant && pendantCount > 0) {
    tags.push(`pendant_qty_${pendantCount}`);
  }
  if (hasPartnerAttribution) {
    tags.push("partner_referred");
  }

  // Determine referral source
  const referralSource = hasPartnerAttribution ? "Partner" : "icealarm.es";

  try {
    // First check if profile exists
    const { data: existing } = await supabase
      .from("crm_profiles")
      .select("member_id")
      .eq("member_id", memberId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("crm_profiles")
        .update({
          stage: "New Member",
          status: "Website Signup",
          referral_source: referralSource,
          tags: tags,
          groups: [],
          updated_at: new Date().toISOString(),
        })
        .eq("member_id", memberId);

      if (error) {
        console.error("Error updating CRM profile:", error);
      } else {
        console.log("CRM profile updated for member:", memberId, "with tags:", tags);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("crm_profiles")
        .insert({
          member_id: memberId,
          stage: "New Member",
          status: "Website Signup",
          referral_source: referralSource,
          tags: tags,
          groups: [],
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating CRM profile:", error);
      } else {
        console.log("CRM profile created for member:", memberId, "with tags:", tags);
      }
    }
  } catch (err) {
    console.error("Exception creating CRM profile:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RegistrationRequest = await req.json();
    console.log("Processing registration for:", body.primaryMember.email);

    // Fetch registration fee settings from database
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["registration_fee_enabled", "registration_fee_discount"]);

    const settingsMap = (settingsData || []).reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const registrationFeeEnabled = settingsMap.registration_fee_enabled !== "false";
    const registrationFeeDiscount = parseFloat(settingsMap.registration_fee_discount || "0");

    // Calculate pricing with correct IVA rates
    const monthlyNetPrice = body.membershipType === "single" 
      ? PRICING.single.monthlyNet 
      : PRICING.couple.monthlyNet;
    
    // Subscription: net price × months (10 for annual, 1 for monthly) + 10% IVA
    const subscriptionNet = body.billingFrequency === "monthly" 
      ? monthlyNetPrice 
      : monthlyNetPrice * PRICING.annualMonths;
    const subscriptionTax = subscriptionNet * PRICING.subscriptionTaxRate;
    const subscriptionFinal = subscriptionNet + subscriptionTax;
    
    // FIXED: Respect user's pendantCount (1-4), with validation
    // Only apply defaults if pendantCount is not provided or invalid
    let pendantCount = 0;
    if (body.includePendant) {
      const requestedCount = body.pendantCount;
      
      // Validate: pendantCount must be between 1 and 4
      if (typeof requestedCount === 'number' && requestedCount >= 1 && requestedCount <= 4) {
        pendantCount = Math.floor(requestedCount); // Ensure integer
      } else {
        // Apply defaults only if invalid or missing
        pendantCount = body.membershipType === "couple" ? 2 : 1;
      }
      
      console.log(`Pendant count: requested=${requestedCount}, validated=${pendantCount}`);
    }
    
    const pendantNet = pendantCount * PRICING.pendantNet;
    const pendantTax = pendantNet * PRICING.pendantTaxRate;
    const pendantFinal = pendantNet + pendantTax;
    
    // Registration: apply enabled/discount settings
    let registrationFee = 0;
    const registrationFeeOriginal = PRICING.registrationFee;
    if (registrationFeeEnabled) {
      registrationFee = registrationFeeOriginal * (1 - registrationFeeDiscount / 100);
    }
    
    // Shipping: IVA included (only if pendant ordered)
    const shipping = pendantCount > 0 ? PRICING.shipping : 0;
    
    // Totals
    const total = subscriptionFinal + pendantFinal + registrationFee + shipping;

    // 1. Create primary member (with new contact preference fields)
    const { data: primaryMemberData, error: memberError } = await supabase
      .from("members")
      .insert({
        first_name: body.primaryMember.firstName,
        last_name: body.primaryMember.lastName,
        email: body.primaryMember.email,
        phone: body.primaryMember.phone,
        date_of_birth: body.primaryMember.dateOfBirth,
        nie_dni: body.primaryMember.nieDni || null,
        preferred_language: body.primaryMember.preferredLanguage,
        preferred_contact_method: body.primaryMember.preferredContactMethod || null,
        preferred_contact_time: body.primaryMember.preferredContactTime || null,
        special_instructions: body.primaryMember.specialInstructions || null,
        address_line_1: body.address.addressLine1,
        address_line_2: body.address.addressLine2 || null,
        city: body.address.city,
        province: body.address.province,
        postal_code: body.address.postalCode,
        country: body.address.country,
        status: "inactive", // Will be activated after payment
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error creating member:", memberError);
      throw new Error(`Failed to create member: ${memberError.message}`);
    }

    console.log("Primary member created:", primaryMemberData.id);

    // 2. Create partner member if couple
    let partnerMemberData = null;
    if (body.membershipType === "couple" && body.partnerMember) {
      const { data: partner, error: partnerError } = await supabase
        .from("members")
        .insert({
          first_name: body.partnerMember.firstName,
          last_name: body.partnerMember.lastName,
          email: body.partnerMember.email,
          phone: body.partnerMember.phone,
          date_of_birth: body.partnerMember.dateOfBirth,
          nie_dni: body.partnerMember.nieDni || null,
          preferred_language: body.partnerMember.preferredLanguage,
          preferred_contact_method: body.partnerMember.preferredContactMethod || null,
          preferred_contact_time: body.partnerMember.preferredContactTime || null,
          special_instructions: body.partnerMember.specialInstructions || null,
          address_line_1: body.address.addressLine1,
          address_line_2: body.address.addressLine2 || null,
          city: body.address.city,
          province: body.address.province,
          postal_code: body.address.postalCode,
          country: body.address.country,
          status: "inactive",
        })
        .select()
        .single();

      if (partnerError) {
        console.error("Error creating partner:", partnerError);
        // Continue anyway, log the issue
      } else {
        partnerMemberData = partner;
        console.log("Partner member created:", partner.id);
      }
    }

    // 3. Create medical information for primary member
    if (body.medicalInfo.bloodType || body.medicalInfo.allergies.length > 0 || 
        body.medicalInfo.medications.length > 0 || body.medicalInfo.medicalConditions.length > 0) {
      const { error: medError } = await supabase.from("medical_information").insert({
        member_id: primaryMemberData.id,
        blood_type: body.medicalInfo.bloodType || null,
        allergies: body.medicalInfo.allergies,
        medications: body.medicalInfo.medications,
        medical_conditions: body.medicalInfo.medicalConditions,
        doctor_name: body.medicalInfo.doctorName || null,
        doctor_phone: body.medicalInfo.doctorPhone || null,
        hospital_preference: body.medicalInfo.hospitalPreference || null,
        additional_notes: body.medicalInfo.additionalNotes || null,
      });
      if (medError) console.error("Error creating medical info:", medError);
    }

    // 4. Create medical information for partner if applicable
    if (partnerMemberData && body.partnerMedicalInfo) {
      const { error: partnerMedError } = await supabase.from("medical_information").insert({
        member_id: partnerMemberData.id,
        blood_type: body.partnerMedicalInfo.bloodType || null,
        allergies: body.partnerMedicalInfo.allergies,
        medications: body.partnerMedicalInfo.medications,
        medical_conditions: body.partnerMedicalInfo.medicalConditions,
        doctor_name: body.partnerMedicalInfo.doctorName || null,
        doctor_phone: body.partnerMedicalInfo.doctorPhone || null,
        hospital_preference: body.partnerMedicalInfo.hospitalPreference || null,
        additional_notes: body.partnerMedicalInfo.additionalNotes || null,
      });
      if (partnerMedError) console.error("Error creating partner medical info:", partnerMedError);
    }

    // 5. Create emergency contacts
    for (let i = 0; i < body.emergencyContacts.length; i++) {
      const contact = body.emergencyContacts[i];
      const { error: contactError } = await supabase.from("emergency_contacts").insert({
        member_id: primaryMemberData.id,
        contact_name: contact.contactName,
        relationship: contact.relationship,
        phone: contact.phone,
        email: contact.email || null,
        speaks_spanish: contact.speaksSpanish,
        notes: contact.notes || null,
        priority_order: i + 1,
        is_primary: i === 0,
      });
      if (contactError) console.error("Error creating contact:", contactError);

      // Also add to partner if couple
      if (partnerMemberData) {
        await supabase.from("emergency_contacts").insert({
          member_id: partnerMemberData.id,
          contact_name: contact.contactName,
          relationship: contact.relationship,
          phone: contact.phone,
          email: contact.email || null,
          speaks_spanish: contact.speaksSpanish,
          notes: contact.notes || null,
          priority_order: i + 1,
          is_primary: i === 0,
        });
      }
    }

    // 6. Create subscription
    const renewalDate = new Date();
    if (body.billingFrequency === "monthly") {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    const { data: subscriptionData, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        member_id: primaryMemberData.id,
        plan_type: body.membershipType,
        billing_frequency: body.billingFrequency,
        amount: subscriptionNet,
        start_date: new Date().toISOString().split("T")[0],
        renewal_date: renewalDate.toISOString().split("T")[0],
        has_pendant: body.includePendant,
        registration_fee_paid: false, // Will be true after payment
        status: "pending",
        payment_method: "stripe",
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creating subscription:", subError);
      throw new Error(`Failed to create subscription: ${subError.message}`);
    }

    console.log("Subscription created:", subscriptionData.id);

    // 7. Generate order number
    const orderNumber = `ICE-${Date.now().toString(36).toUpperCase()}`;

    // 8. Create order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        member_id: primaryMemberData.id,
        order_number: orderNumber,
        status: "pending",
        subtotal: subscriptionNet + pendantNet + registrationFee,
        tax_amount: subscriptionTax + pendantTax,
        total_amount: total,
        shipping_amount: shipping,
        shipping_address_line_1: body.address.addressLine1,
        shipping_address_line_2: body.address.addressLine2 || null,
        shipping_city: body.address.city,
        shipping_province: body.address.province,
        shipping_postal_code: body.address.postalCode,
        shipping_country: body.address.country,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log("Order created:", orderData.id);

    // 9. Create order items
    const orderItems = [];

    // Subscription item
    orderItems.push({
      order_id: orderData.id,
      item_type: "subscription",
      description: `${body.membershipType === "couple" ? "Couple" : "Individual"} Membership - ${body.billingFrequency === "annual" ? "Annual" : "Monthly"}`,
      quantity: 1,
      unit_price: subscriptionNet,
      tax_rate: PRICING.subscriptionTaxRate,
      tax_amount: subscriptionTax,
      total_price: subscriptionFinal,
    });

    // Pendant items - with correct quantity from user selection
    if (pendantCount > 0) {
      orderItems.push({
        order_id: orderData.id,
        item_type: "pendant",
        description: "GPS Safety Pendant",
        quantity: pendantCount,
        unit_price: PRICING.pendantNet,
        tax_rate: PRICING.pendantTaxRate,
        tax_amount: pendantTax,
        total_price: pendantFinal,
      });
    }

    // Registration fee (only if enabled and amount > 0)
    if (registrationFeeEnabled && registrationFee > 0) {
      orderItems.push({
        order_id: orderData.id,
        item_type: "registration_fee",
        description: registrationFeeDiscount > 0 
          ? `One-time Registration Fee (${registrationFeeDiscount}% discount applied)`
          : "One-time Registration Fee",
        quantity: 1,
        unit_price: registrationFee,
        tax_rate: 0,
        tax_amount: 0,
        total_price: registrationFee,
      });
    }

    for (const item of orderItems) {
      const { error: itemError } = await supabase.from("order_items").insert(item);
      if (itemError) console.error("Error creating order item:", itemError);
    }

    // 10. Create payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        member_id: primaryMemberData.id,
        subscription_id: subscriptionData.id,
        order_id: orderData.id,
        amount: total,
        payment_type: "order",
        payment_method: "stripe",
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }

    console.log("Payment created:", paymentData.id);

    // 11. Handle partner attribution if referral code provided
    let attributionId = null;
    let hasPartnerAttribution = false;
    let attributedPartnerId: string | undefined = undefined;
    
    if (body.partnerRef) {
      console.log("Processing partner attribution for ref:", body.partnerRef);
      
      // Find partner by referral code
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .select("id, status")
        .eq("referral_code", body.partnerRef)
        .eq("status", "active")
        .single();

      if (partner && !partnerError) {
        attributedPartnerId = partner.id;
        
        // Check if attribution already exists (first-touch wins)
        const { data: existingAttribution } = await supabase
          .from("partner_attributions")
          .select("id")
          .eq("member_id", primaryMemberData.id)
          .maybeSingle();

        if (!existingAttribution) {
          // Create attribution with UTM metadata
          const now = new Date().toISOString();
          const metadata: Record<string, unknown> = {};
          if (body.utmParams) {
            if (body.utmParams.utm_source) metadata.utm_source = body.utmParams.utm_source;
            if (body.utmParams.utm_medium) metadata.utm_medium = body.utmParams.utm_medium;
            if (body.utmParams.utm_campaign) metadata.utm_campaign = body.utmParams.utm_campaign;
            if (body.utmParams.utm_term) metadata.utm_term = body.utmParams.utm_term;
            if (body.utmParams.utm_content) metadata.utm_content = body.utmParams.utm_content;
          }
          
          const { data: attribution, error: attrError } = await supabase
            .from("partner_attributions")
            .insert({
              partner_id: partner.id,
              member_id: primaryMemberData.id,
              source: "ref_link",
              ref_param: body.partnerRef,
              first_touch_at: now,
              last_touch_at: now,
              metadata: Object.keys(metadata).length > 0 ? metadata : null,
            })
            .select()
            .single();

          if (attrError) {
            console.error("Error creating attribution:", attrError);
          } else {
            attributionId = attribution.id;
            hasPartnerAttribution = true;
            console.log("Partner attribution created:", attributionId);

            // Update any matching partner invite (by email or phone)
            const { error: inviteError } = await supabase
              .from("partner_invites")
              .update({
                status: "registered",
                converted_member_id: primaryMemberData.id,
              })
              .eq("partner_id", partner.id)
              .or(`invitee_email.eq.${body.primaryMember.email},invitee_phone.eq.${body.primaryMember.phone}`)
              .in("status", ["sent", "draft"]);

            if (inviteError) {
              console.error("Error updating invite:", inviteError);
            }

            // Log audit event
            await supabase.from("activity_logs").insert({
              action: "attribution_created",
              entity_type: "partner_attribution",
              entity_id: attributionId,
              new_values: {
                partner_id: partner.id,
                member_id: primaryMemberData.id,
                referral_code: body.partnerRef,
              },
            });

            // Log CRM event for attribution created
            await supabase.from("crm_events").insert({
              event_type: "member_registered",
              payload: {
                member_id: primaryMemberData.id,
                partner_id: partner.id,
                referral_code: body.partnerRef,
                email: body.primaryMember.email,
                membership_type: body.membershipType,
                has_pendant: body.includePendant,
                pendant_count: pendantCount,
                utm_params: body.utmParams || null,
              },
            });

            // Track post-specific referral if ref_post_id is provided
            if (body.refPostId) {
              console.log("Processing post-specific attribution for post:", body.refPostId);
              
              // Update member with ref_partner_id and ref_post_id
              await supabase
                .from("members")
                .update({
                  ref_partner_id: partner.id,
                  ref_post_id: body.refPostId,
                })
                .eq("id", primaryMemberData.id);

              // Increment signups counter on partner_post_links
              const { data: linkData } = await supabase
                .from("partner_post_links")
                .select("id, signups")
                .eq("post_id", body.refPostId)
                .eq("partner_id", partner.id)
                .maybeSingle();

              if (linkData) {
                await supabase
                  .from("partner_post_links")
                  .update({ signups: (linkData.signups || 0) + 1 })
                  .eq("id", linkData.id);
                console.log("Updated partner_post_links signups for link:", linkData.id);
              }
            }
          }
        } else {
          console.log("Attribution already exists for member, skipping (first-touch wins)");
          hasPartnerAttribution = true; // Still mark as partner-referred for CRM
        }
      } else {
        console.log("Partner not found or inactive for ref:", body.partnerRef);
      }
    }

    // 12. CREATE CRM PROFILES for all created members
    // Primary member CRM profile
    await createCrmProfile(
      supabase,
      primaryMemberData.id,
      body.membershipType,
      body.primaryMember.preferredLanguage,
      body.includePendant,
      pendantCount,
      hasPartnerAttribution
    );

    // Partner member CRM profile (if couple)
    if (partnerMemberData) {
      await createCrmProfile(
        supabase,
        partnerMemberData.id,
        body.membershipType,
        body.partnerMember?.preferredLanguage || "es",
        body.includePendant,
        pendantCount,
        hasPartnerAttribution
      );
    }

    // 13. HANDLE TEST MODE - Mark everything as completed without payment
    if (body.testMode) {
      console.log("TEST MODE: Auto-completing registration without payment");
      
      // Update payment to completed
      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({ 
          status: "completed", 
          paid_at: new Date().toISOString(),
          notes: "TEST MODE - No payment collected"
        })
        .eq("id", paymentData.id);
      if (paymentUpdateError) console.error("Test mode: Error updating payment:", paymentUpdateError);
      
      // Update order to completed
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderData.id);
      if (orderUpdateError) console.error("Test mode: Error updating order:", orderUpdateError);
      
      // Update subscription to active
      const { error: subUpdateError } = await supabase
        .from("subscriptions")
        .update({ 
          status: "active",
          registration_fee_paid: true
        })
        .eq("id", subscriptionData.id);
      if (subUpdateError) console.error("Test mode: Error updating subscription:", subUpdateError);
      
      // Update primary member to active
      const { error: memberUpdateError } = await supabase
        .from("members")
        .update({ status: "active" })
        .eq("id", primaryMemberData.id);
      if (memberUpdateError) console.error("Test mode: Error updating primary member:", memberUpdateError);
      
      // Update partner member to active if exists
      if (partnerMemberData) {
        const { error: partnerUpdateError } = await supabase
          .from("members")
          .update({ status: "active" })
          .eq("id", partnerMemberData.id);
        if (partnerUpdateError) console.error("Test mode: Error updating partner member:", partnerUpdateError);
      }
      
      // Log audit entry for test mode usage
      await supabase.from("activity_logs").insert({
        action: "create",
        entity_type: "order",
        entity_id: orderData.id,
        new_values: {
          test_mode: true,
          order_number: orderNumber,
          member_id: primaryMemberData.id,
          total: total,
        },
      });
      
      console.log("TEST MODE: All records marked as completed");
    }

    // 14. SEND REGISTRATION CONFIRMATION EMAIL
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY && body.primaryMember.email) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        
        const emailHtml = buildRegistrationConfirmationEmail(
          body.primaryMember.firstName,
          body.membershipType,
          total,
          body.includePendant,
          pendantCount,
          body.primaryMember.preferredLanguage
        );

        const { error: emailError } = await resend.emails.send({
          from: "ICE Alarm <onboarding@resend.dev>",
          to: [body.primaryMember.email],
          subject: body.primaryMember.preferredLanguage === "es"
            ? "Completa tu registro en ICE Alarm"
            : "Complete Your ICE Alarm Registration",
          html: emailHtml,
        });

        if (emailError) {
          console.error("Error sending registration confirmation email:", emailError);
        } else {
          console.log("Registration confirmation email sent to:", body.primaryMember.email);
        }
      } catch (emailErr) {
        console.error("Failed to send registration confirmation email:", emailErr);
        // Don't fail registration, email is non-critical
      }
    }

    // Return all IDs needed for checkout
    return new Response(
      JSON.stringify({
        success: true,
        memberId: primaryMemberData.id,
        partnerMemberId: partnerMemberData?.id || null,
        subscriptionId: subscriptionData.id,
        orderId: orderData.id,
        orderNumber: orderNumber,
        paymentId: paymentData.id,
        total: total,
        testMode: body.testMode || false,
        lineItems: [
          {
            name: `${body.membershipType === "couple" ? "Couple" : "Individual"} Membership - ${body.billingFrequency === "annual" ? "Annual" : "Monthly"}`,
            amount: subscriptionFinal,
            quantity: 1,
          },
          ...(pendantCount > 0 ? [{
            name: `GPS Safety Pendant${pendantCount > 1 ? ` (×${pendantCount})` : ""}`,
            amount: pendantFinal / pendantCount,
            quantity: pendantCount,
          }] : []),
          ...(registrationFeeEnabled && registrationFee > 0 ? [{
            name: registrationFeeDiscount > 0 
              ? `Registration Fee (${registrationFeeDiscount}% off)` 
              : "Registration Fee",
            amount: registrationFee,
            quantity: 1,
          }] : []),
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
