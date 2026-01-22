import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
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

    // Get Stripe secret key from settings
    const { data: stripeSettings } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    if (!stripeSettings?.value) {
      console.error("Stripe secret key not configured");
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    // Get webhook secret from settings
    const { data: webhookSettings } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "stripe_webhook_secret")
      .single();

    // For now, we'll trust the webhook (in production, verify signature)
    const event = JSON.parse(body);
    
    console.log("Stripe webhook received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout completed:", session.id);
        
        // Update order status
        if (session.metadata?.order_id) {
          await supabase
            .from("orders")
            .update({ status: "confirmed" })
            .eq("id", session.metadata.order_id);
        }

        // Update payment status
        if (session.metadata?.payment_id) {
          await supabase
            .from("payments")
            .update({ 
              status: "completed",
              stripe_payment_id: session.payment_intent,
              paid_at: new Date().toISOString()
            })
            .eq("id", session.metadata.payment_id);
        }

        // Create/update subscription if applicable
        if (session.subscription && session.metadata?.member_id) {
          await supabase
            .from("subscriptions")
            .update({ 
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: "active"
            })
            .eq("member_id", session.metadata.member_id);
        }

        // Log CRM event for order_paid (checkout completed means paid)
        if (session.metadata?.order_id && session.metadata?.member_id) {
          // Check if this member has partner attribution
          const { data: attribution } = await supabase
            .from("partner_attributions")
            .select("partner_id")
            .eq("member_id", session.metadata.member_id)
            .maybeSingle();

          await supabase.from("crm_events").insert({
            event_type: "order_paid",
            payload: {
              order_id: session.metadata.order_id,
              member_id: session.metadata.member_id,
              payment_id: session.metadata.payment_id || null,
              amount: session.amount_total ? session.amount_total / 100 : null,
              partner_id: attribution?.partner_id || null,
              has_attribution: !!attribution,
            },
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);
        
        await supabase
          .from("payments")
          .update({ 
            status: "completed",
            paid_at: new Date().toISOString()
          })
          .eq("stripe_payment_id", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log("Payment failed:", paymentIntent.id);
        
        await supabase
          .from("payments")
          .update({ 
            status: "failed",
            notes: paymentIntent.last_payment_error?.message
          })
          .eq("stripe_payment_id", paymentIntent.id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("Subscription updated:", subscription.id);
        
        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "cancelled",
          unpaid: "suspended"
        };

        await supabase
          .from("subscriptions")
          .update({ 
            status: statusMap[subscription.status] || subscription.status
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("Subscription deleted:", subscription.id);
        
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        console.log("Invoice paid:", invoice.id);
        
        // Create payment record
        if (invoice.subscription) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id, member_id")
            .eq("stripe_subscription_id", invoice.subscription)
            .single();

          if (sub) {
            await supabase.from("payments").insert({
              member_id: sub.member_id,
              subscription_id: sub.id,
              amount: invoice.amount_paid / 100,
              payment_type: "subscription",
              payment_method: "stripe",
              status: "completed",
              stripe_payment_id: invoice.payment_intent,
              invoice_number: invoice.number,
              paid_at: new Date().toISOString()
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("Invoice payment failed:", invoice.id);
        
        if (invoice.subscription) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
