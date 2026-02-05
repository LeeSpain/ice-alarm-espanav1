import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Gmail SMTP helper function
async function sendViaGmailSMTP(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const appPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!appPassword) {
    return { success: false, error: "GMAIL_APP_PASSWORD not configured" };
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: "icealarmespana@gmail.com",
          password: appPassword,
        },
      },
    });

    await client.send({
      from: "ICE Alarm España <icealarmespana@gmail.com>",
      to: to,
      subject: subject,
      html: html,
    });

    await client.close();
    return { success: true };
  } catch (error: unknown) {
    console.error("Gmail SMTP error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Build member welcome email HTML
function buildMemberWelcomeEmail(
  firstName: string,
  orderNumber: string,
  amount: number,
  productsSummary: string,
  language: "en" | "es" | string,
  dashboardUrl: string
): string {
  if (language === "es" || language === "ES") {
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
        
        <h2 style="color: #1f2937;">¡Bienvenido a ICE Alarm!</h2>
        
        <p>Hola ${firstName},</p>
        
        <p>¡Gracias por unirte a ICE Alarm! Tu pago ha sido procesado correctamente y tu membresía ya está activa.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Detalles del Pedido:</h3>
          <p style="margin: 5px 0;"><strong>Número de Pedido:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Importe Pagado:</strong> €${amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Productos:</strong> ${productsSummary}</p>
        </div>
        
        <h3 style="color: #1f2937;">¿Qué sucede ahora?</h3>
        <ol style="padding-left: 20px;">
          <li>Si pediste un colgante GPS, lo enviaremos en 2-3 días laborables</li>
          <li>Recibirás información de seguimiento una vez enviado</li>
          <li>Nuestro equipo te contactará para completar la configuración del dispositivo</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acceder a Mi Panel</a>
        </div>
        
        <p>¿Necesitas ayuda? Contacta con nuestro equipo de soporte respondiendo a este email.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Mantente seguro,<br>
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
      
      <h2 style="color: #1f2937;">Welcome to ICE Alarm!</h2>
      
      <p>Hello ${firstName},</p>
      
      <p>Thank you for joining ICE Alarm! Your payment has been processed successfully and your membership is now active.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Order Details:</h3>
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> €${amount.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Products:</strong> ${productsSummary}</p>
      </div>
      
      <h3 style="color: #1f2937;">What happens next?</h3>
      <ol style="padding-left: 20px;">
        <li>If you ordered a GPS pendant, we'll ship it within 2-3 business days</li>
        <li>You'll receive tracking information once shipped</li>
        <li>Our team will contact you to complete device setup</li>
      </ol>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access My Dashboard</a>
      </div>
      
      <p>Need help? Contact our support team by replying to this email.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 14px;">
        Stay safe,<br>
        The ICE Alarm Team
      </p>
    </body>
    </html>
  `;
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

        // AUTO-ALLOCATE EV-07B devices from stock
        if (session.metadata?.order_id && session.metadata?.member_id) {
          try {
            // Load order items with pendant type
            const { data: pendantItems, error: itemsError } = await supabase
              .from("order_items")
              .select("id, quantity, device_id")
              .eq("order_id", session.metadata.order_id)
              .eq("item_type", "pendant");

            if (itemsError) {
              console.error("Error fetching pendant items:", itemsError);
            } else if (pendantItems && pendantItems.length > 0) {
              console.log(`Found ${pendantItems.length} pendant order items to allocate`);

              for (const item of pendantItems) {
                // Skip if already allocated (idempotency)
                if (item.device_id) {
                  console.log(`Order item ${item.id} already has device ${item.device_id} allocated`);
                  continue;
                }

                const quantityNeeded = item.quantity || 1;
                
                for (let i = 0; i < quantityNeeded; i++) {
                  // Atomically pick 1 device from stock
                  const { data: availableDevice, error: pickError } = await supabase
                    .from("devices")
                    .select("id")
                    .eq("model", "EV-07B")
                    .eq("status", "in_stock")
                    .is("member_id", null)
                    .limit(1)
                    .single();

                  if (pickError || !availableDevice) {
                    console.warn(`No EV-07B devices available in stock for allocation`);
                    // Mark order as awaiting stock
                    await supabase
                      .from("orders")
                      .update({ status: "awaiting_stock" })
                      .eq("id", session.metadata.order_id);
                    break;
                  }

                  // Update device to allocated status
                  const { error: updateDeviceError } = await supabase
                    .from("devices")
                    .update({
                      status: "allocated",
                      member_id: session.metadata.member_id,
                      assigned_at: new Date().toISOString(),
                      reserved_order_id: session.metadata.order_id,
                      reserved_at: new Date().toISOString(),
                    })
                    .eq("id", availableDevice.id)
                    .eq("status", "in_stock"); // Extra safety check

                  if (updateDeviceError) {
                    console.error(`Error allocating device ${availableDevice.id}:`, updateDeviceError);
                    continue;
                  }

                  // Update order_items with allocated device_id
                  await supabase
                    .from("order_items")
                    .update({ device_id: availableDevice.id })
                    .eq("id", item.id);

                  console.log(`Allocated device ${availableDevice.id} to order item ${item.id}`);
                }
              }
            }
          } catch (allocError) {
            console.error("Device allocation error:", allocError);
            // Don't throw - webhook must succeed
          }
        }

        // Log CRM event for order_paid (checkout completed means paid)
        if (session.metadata?.order_id && session.metadata?.member_id) {
          // Check if this member has partner attribution
          const { data: attribution } = await supabase
            .from("partner_attributions")
            .select("partner_id, partners(contact_name, company_name)")
            .eq("member_id", session.metadata.member_id)
            .maybeSingle();

          // Fetch order details for notification
          const { data: orderData } = await supabase
            .from("orders")
            .select(`
              *,
              members!inner (first_name, last_name, email, preferred_language)
            `)
            .eq("id", session.metadata.order_id)
            .single();

          // Get order items for products summary
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("description, quantity")
            .eq("order_id", session.metadata.order_id);

          const productsSummary = orderItems
            ?.map((i: any) => `${i.quantity}x ${i.description}`)
            .join(", ") || "N/A";

          const partnerData = attribution?.partners as any;
          const partnerName = partnerData?.contact_name || partnerData?.company_name || null;
          const memberData = orderData?.members as any;

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

          // Create sale.paid AI event
          await supabase.from("ai_events").insert({
            event_type: "sale.paid",
            entity_type: "order",
            entity_id: session.metadata.order_id,
            payload: {
              order_id: session.metadata.order_id,
              member_id: session.metadata.member_id,
              customer_name: memberData ? `${memberData.first_name} ${memberData.last_name}` : "Unknown",
              email: memberData?.email || null,
              language: memberData?.preferred_language || "ES",
              amount: session.amount_total ? session.amount_total / 100 : 0,
              products_summary: productsSummary,
              partner_id: attribution?.partner_id || null,
              partner_name: partnerName,
              source: attribution ? "partner" : "direct",
            },
          });

          // Call notify-admin function for WhatsApp notification
          try {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            
            await fetch(`${SUPABASE_URL}/functions/v1/notify-admin`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                event_type: "sale.paid",
                entity_type: "order",
                entity_id: session.metadata.order_id,
                payload: {
                  customer_name: memberData ? `${memberData.first_name} ${memberData.last_name}` : "Unknown",
                  language: memberData?.preferred_language || "ES",
                  amount: session.amount_total ? session.amount_total / 100 : 0,
                  products_summary: productsSummary,
                  source: attribution ? "partner" : "direct",
                  partner_name: partnerName,
                  order_id: session.metadata.order_id,
                },
              }),
            });
            console.log("notify-admin called for sale.paid");
          } catch (notifyError) {
            console.error("Failed to call notify-admin:", notifyError);
          }

          // Send member welcome email via Gmail SMTP
          if (memberData?.email) {
            try {
              const orderNum = orderData?.order_number || session.metadata.order_id;
              const amount = session.amount_total ? session.amount_total / 100 : 0;
              const lang = memberData?.preferred_language || "es";
              const dashboardUrl = "https://icealarm.es/dashboard";
              
              const emailHtml = buildMemberWelcomeEmail(
                memberData.first_name,
                orderNum,
                amount,
                productsSummary,
                lang,
                dashboardUrl
              );

              const emailSubject = lang === "es" || lang === "ES"
                ? "¡Bienvenido a ICE Alarm! Tu membresía está activa"
                : "Welcome to ICE Alarm! Your membership is active";

              const emailResult = await sendViaGmailSMTP(memberData.email, emailSubject, emailHtml);

              if (!emailResult.success) {
                console.error("Error sending member welcome email:", emailResult.error);
              } else {
                console.log("Member welcome email sent to:", memberData.email);
              }
            } catch (emailErr) {
              console.error("Failed to send member welcome email:", emailErr);
            }
          }
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
