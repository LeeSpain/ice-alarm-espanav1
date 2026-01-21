import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Tables } from "@/integrations/supabase/types";

type Device = Tables<"devices">;

export interface DeviceUpdate {
  id: string;
  batteryLevel: number | null;
  lastCheckinAt: Date | null;
  locationLat: number | null;
  locationLng: number | null;
  locationAddress: string | null;
  status: string;
}

export function useDeviceRealtime(memberId?: string) {
  const [deviceUpdates, setDeviceUpdates] = useState<Map<string, DeviceUpdate>>(new Map());

  useEffect(() => {
    // Set up realtime subscription for device updates
    const channel = supabase
      .channel("devices-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "devices",
          ...(memberId ? { filter: `member_id=eq.${memberId}` } : {}),
        },
        (payload: RealtimePostgresChangesPayload<Device>) => {
          const device = payload.new as Device | null;
          
          if (device && 'id' in device) {
            const update: DeviceUpdate = {
              id: device.id,
              batteryLevel: device.battery_level,
              lastCheckinAt: device.last_checkin_at ? new Date(device.last_checkin_at) : null,
              locationLat: device.last_location_lat ? Number(device.last_location_lat) : null,
              locationLng: device.last_location_lng ? Number(device.last_location_lng) : null,
              locationAddress: device.last_location_address,
              status: device.status || "unknown",
            };

            setDeviceUpdates(prev => {
              const newMap = new Map(prev);
              newMap.set(device.id, update);
              return newMap;
            });

            // Notify on low battery
            if (device.battery_level !== null && device.battery_level <= 20) {
              toast({
                title: "Low Battery Alert",
                description: `Device battery is at ${device.battery_level}%`,
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  const getDeviceUpdate = useCallback((deviceId: string): DeviceUpdate | undefined => {
    return deviceUpdates.get(deviceId);
  }, [deviceUpdates]);

  return {
    deviceUpdates,
    getDeviceUpdate,
  };
}
