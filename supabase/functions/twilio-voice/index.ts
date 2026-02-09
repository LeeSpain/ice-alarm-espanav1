// Thin wrapper: forwards all requests to voice-handler
// This exists because the twilio-voice function name is configured in Twilio Console.
// If this function has deployment issues, update Twilio webhook to use voice-handler directly.

const VERSION = "wrapper-v1.0.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // Healthcheck
  if (req.method === "GET") {
    return new Response(`OK ${VERSION}`, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  const baseUrl = Deno.env.get("SUPABASE_URL");
  if (!baseUrl) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-ES" voice="Polly.Lucia">Error de configuración.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "application/xml; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
    );
  }

  try {
    // Preserve query string and forward to voice-handler
    const incomingUrl = new URL(req.url);
    const targetUrl = `${baseUrl}/functions/v1/voice-handler${incomingUrl.search}`;

    console.log(`[twilio-voice ${VERSION}] Forwarding ${req.method} to ${targetUrl}`);

    // Clone the request body for forwarding
    const body = await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/x-www-form-urlencoded",
      },
      body: body.byteLength > 0 ? body : undefined,
    });

    const responseBody = await response.arrayBuffer();
    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/xml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error(`[twilio-voice ${VERSION}] Forward error:`, e);
    // Return valid TwiML even on error so Twilio doesn't hang
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response>` +
      `<Say language="es-ES" voice="Polly.Lucia">Gracias por llamar. Un operador le atenderá en breve.</Say>` +
      `<Say language="en-GB" voice="Polly.Amy">Thank you for calling. An operator will assist you shortly.</Say>` +
      `<Hangup/></Response>`,
      { headers: { "Content-Type": "application/xml; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
    );
  }
});
