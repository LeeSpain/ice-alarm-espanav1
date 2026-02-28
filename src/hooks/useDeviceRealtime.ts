import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook to subscribe to realtime device updates and invalidate React Query caches.
 * Subscribes to INSERT/UPDATE/DELETE on public.devices.
 * @param memberId - Optional member ID to filter updates (for client device page)
 */
export function useDeviceRealtime(memberId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up realtime subscription for device updates
    const channel = supabase
      .channel("devices-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "devices",
          ...(memberId ? { filter: `member_id=eq.${memberId}` } : {}),
        },
        (payload) => {
          // Invalidate all device-related queries
          queryClient.invalidateQueries({ queryKey: ["device-stock"] });
          queryClient.invalidateQueries({ queryKey: ["device-stock-stats"] });
          queryClient.invalidateQueries({ queryKey: ["member-device"] });
          queryClient.invalidateQueries({ queryKey: ["admin-member-device"] });
          queryClient.invalidateQueries({ queryKey: ["admin-device-detail"] });
          queryClient.invalidateQueries({ queryKey: ["ev07b-status-summary"] });

          // Handle low battery toast for UPDATE events
          if (payload.eventType === "UPDATE" && payload.new) {
            const device = payload.new as Record<string, unknown>;
            const batteryLevel = device.battery_level as number | null;
            
            if (batteryLevel !== null && batteryLevel <= 20) {
              toast({
                title: "Low Battery Alert",
                description: `Device battery is at ${batteryLevel}%`,
                variant: "destructive",
              });
            }

            // Notify on device going offline
            if (device.is_online === false && payload.old) {
              const oldDevice = payload.old as Record<string, unknown>;
              if (oldDevice.is_online === true) {
                toast({
                  title: "Device Offline",
                  description: "An EV-07B device has gone offline",
                  variant: "destructive",
                });
              }
            }
          }

          // Notify on new device allocation
          if (payload.eventType === "UPDATE" && payload.new && payload.old) {
            const newDevice = payload.new as Record<string, unknown>;
            const oldDevice = payload.old as Record<string, unknown>;
            if (oldDevice.status === "in_stock" && newDevice.status === "allocated") {
              toast({
                title: "Device Allocated",
                description: "An EV-07B device has been allocated from stock",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, queryClient]);
}
