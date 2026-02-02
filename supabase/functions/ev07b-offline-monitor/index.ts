import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * EV-07B Offline Monitor
 * 
 * This function checks all active EV-07B devices and updates their online/offline status
 * based on their last check-in time. If a device hasn't checked in within 15 minutes,
 * it's marked as offline.
 * 
 * Should be run every 5 minutes via cron job or external scheduler.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Fetch all EV-07B devices that are in active statuses
    const { data: devices, error: fetchError } = await supabase
      .from("devices")
      .select("id, imei, member_id, last_checkin_at, is_online, offline_since")
      .eq("model", "EV-07B")
      .in("status", ["allocated", "with_staff", "live"]);

    if (fetchError) {
      throw new Error(`Failed to fetch devices: ${fetchError.message}`);
    }

    let onlineCount = 0;
    let offlineCount = 0;
    let newlyOfflineCount = 0;
    const newlyOfflineDevices: { id: string; imei: string; member_id: string | null }[] = [];

    for (const device of devices || []) {
      const lastCheckin = device.last_checkin_at ? new Date(device.last_checkin_at) : null;
      const isCurrentlyOnline = lastCheckin && lastCheckin >= fifteenMinutesAgo;

      // Device is online
      if (isCurrentlyOnline) {
        // Only update if status has changed
        if (device.is_online !== true || device.offline_since !== null) {
          await supabase
            .from("devices")
            .update({
              is_online: true,
              offline_since: null,
            })
            .eq("id", device.id);
        }
        onlineCount++;
      } else {
        // Device is offline
        const wasOnline = device.is_online === true;
        const offlineSinceNotSet = device.offline_since === null;

        if (wasOnline || offlineSinceNotSet) {
          const offlineSince = device.offline_since || now.toISOString();
          await supabase
            .from("devices")
            .update({
              is_online: false,
              offline_since: offlineSince,
            })
            .eq("id", device.id);

          // Track newly offline devices for alert creation
          if (wasOnline) {
            newlyOfflineCount++;
            newlyOfflineDevices.push({
              id: device.id,
              imei: device.imei,
              member_id: device.member_id,
            });
          }
        }
        offlineCount++;
      }
    }

    // Create alerts for newly offline devices
    for (const device of newlyOfflineDevices) {
      // Check if there's already an open alert for this device
      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("device_id", device.id)
        .eq("alert_type", "device_offline")
        .eq("status", "incoming")
        .maybeSingle();

      if (!existingAlert) {
        // Create new alert
        await supabase.from("alerts").insert({
          device_id: device.id,
          member_id: device.member_id,
          alert_type: "device_offline",
          status: "incoming",
          message: `EV-07B device (IMEI: ${device.imei}) has gone offline`,
          received_at: now.toISOString(),
        });
        console.log(`Created offline alert for device ${device.imei}`);
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      stats: {
        total: devices?.length || 0,
        online: onlineCount,
        offline: offlineCount,
        newlyOffline: newlyOfflineCount,
        alertsCreated: newlyOfflineDevices.length,
      },
    };

    console.log("EV-07B offline monitor completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Offline monitor error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
