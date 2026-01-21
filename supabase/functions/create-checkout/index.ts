import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  name: string;
  amount: number;
  quantity: number;
}

interface CheckoutRequest {
  memberId: string;
  orderId: string;
  paymentId: string;
  subscriptionId: string;
  lineItems: LineItem[];
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
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

    // Get Stripe secret key from system settings
    const { data: stripeSettings, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    if (settingsError || !stripeSettings?.value) {
      console.error("Stripe secret key not configured:", settingsError);
      return new Response(
        JSON.stringify({ 
          error: "Stripe is not configured. Please contact support.",
          code: "STRIPE_NOT_CONFIGURED"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSettings.value, {
      apiVersion: "2023-10-16",
    });

    const body: CheckoutRequest = await req.json();
    console.log("Creating checkout session for:", body.customerEmail);

    // Convert line items to Stripe format
    const stripeLineItems = body.lineItems.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.amount * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      customer_email: body.customerEmail,
      metadata: {
        member_id: body.memberId,
        order_id: body.orderId,
        payment_id: body.paymentId,
        subscription_id: body.subscriptionId,
        ...body.metadata,
      },
      billing_address_collection: "required",
      payment_intent_data: {
        metadata: {
          member_id: body.memberId,
          order_id: body.orderId,
          payment_id: body.paymentId,
        },
      },
    });

    console.log("Checkout session created:", session.id);

    // Update payment with Stripe session ID
    await supabase
      .from("payments")
      .update({ 
        stripe_payment_id: session.id,
        notes: `Stripe Checkout Session: ${session.id}`
      })
      .eq("id", body.paymentId);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
