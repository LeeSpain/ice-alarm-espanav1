import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface CheckinPayload {
  imei: string;
  battery_level?: number;
  lat?: number;
  lng?: number;
  address?: string;
}

/**
 * EV-07B Check-in Edge Function
 * 
 * Accepts telemetry data from EV-07B devices (ping every 30 seconds) and updates their status.
 * Requires x-api-key header matching EV07B_CHECKIN_KEY environment variable.
 * 
 * On successful check-in:
 * - Always sets last_checkin_at = now()
 * - Always sets is_online = true
 * - Always clears offline_since = null
 * - Validates battery_level 0-100 if provided
 * - Does NOT create devices for unknown IMEI (returns error)
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("EV07B_CHECKIN_KEY");

    if (!expectedKey) {
      console.error("EV07B_CHECKIN_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CheckinPayload = await req.json();

    if (!body.imei) {
      return new Response(
        JSON.stringify({ success: false, error: "IMEI is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the device by IMEI and verify it's an EV-07B
    const { data: device, error: fetchError } = await supabase
      .from("devices")
      .select("id, model, status, member_id")
      .eq("imei", body.imei)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching device:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Do NOT create devices for unknown IMEI - return error
    if (!device) {
      return new Response(
        JSON.stringify({ success: false, error: "Device not found. Unknown IMEI." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (device.model !== "EV-07B") {
      return new Response(
        JSON.stringify({ success: false, error: "Device is not an EV-07B model" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update object - always set these on check-in
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      last_checkin_at: now,
      is_online: true,
      offline_since: null, // Clear offline status on check-in
    };

    // Add optional fields if provided with validation
    if (typeof body.battery_level === "number") {
      // Validate battery level is 0-100
      const validatedBattery = Math.max(0, Math.min(100, Math.round(body.battery_level)));
      updateData.battery_level = validatedBattery;
    }

    if (typeof body.lat === "number" && typeof body.lng === "number") {
      // Validate latitude and longitude ranges
      if (body.lat >= -90 && body.lat <= 90 && body.lng >= -180 && body.lng <= 180) {
        updateData.last_location_lat = body.lat;
        updateData.last_location_lng = body.lng;
      }
    }

    if (body.address && typeof body.address === "string") {
      updateData.last_location_address = body.address.substring(0, 500); // Limit address length
    }

    // Update the device
    const { error: updateError } = await supabase
      .from("devices")
      .update(updateData)
      .eq("id", device.id);

    if (updateError) {
      console.error("Error updating device:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update device" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`EV-07B check-in successful for IMEI: ${body.imei}`, {
      device_id: device.id,
      battery_level: updateData.battery_level,
      has_location: !!(body.lat && body.lng),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        device_id: device.id,
        checked_in_at: now,
        is_online: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check-in error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
