import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MemberDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nieDni: string;
  preferredLanguage: "en" | "es";
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
    
    // Pendant: net price + 21% IVA
    const pendantCount = body.includePendant 
      ? (body.membershipType === "couple" ? 2 : 1) 
      : 0;
    const pendantNet = pendantCount * PRICING.pendantNet;
    const pendantTax = pendantNet * PRICING.pendantTaxRate;
    const pendantFinal = pendantNet + pendantTax;
    
    // Registration: no IVA
    const registrationFee = PRICING.registrationFee;
    
    // Shipping: IVA included (only if pendant ordered)
    const shipping = pendantCount > 0 ? PRICING.shipping : 0;
    
    // Totals
    const total = subscriptionFinal + pendantFinal + registrationFee + shipping;

    // 1. Create primary member
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

    // Pendant items
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

    // Registration fee (no IVA)
    orderItems.push({
      order_id: orderData.id,
      item_type: "registration_fee",
      description: "One-time Registration Fee",
      quantity: 1,
      unit_price: registrationFee,
      tax_rate: 0,
      tax_amount: 0,
      total_price: registrationFee,
    });

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
          {
            name: "Registration Fee",
            amount: registrationFee,
            quantity: 1,
          },
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
