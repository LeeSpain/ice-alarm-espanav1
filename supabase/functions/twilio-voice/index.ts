// This function has been merged into twilio-call-me.
// Use: /functions/v1/twilio-call-me?action=incoming
// The twilio-voice function name is stuck in a broken deployment state.
// All voice webhook logic now lives in twilio-call-me with ?action= routing.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" },
    });
  }
  const baseUrl = Deno.env.get("SUPABASE_URL");
  return new Response(
    JSON.stringify({ 
      error: "This function has moved",
      redirect: `${baseUrl}/functions/v1/twilio-call-me?action=incoming`,
      message: "Update your Twilio webhook URL to use twilio-call-me?action=incoming"
    }),
    { status: 301, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
});
