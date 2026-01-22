import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePartnerData(overridePartnerId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-partner-data", overridePartnerId || user?.id],
    queryFn: async () => {
      if (overridePartnerId) {
        // Admin viewing specific partner by ID
        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("id", overridePartnerId)
          .maybeSingle();

        if (error) throw error;
        return data;
      }

      // Regular partner viewing their own data
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!(overridePartnerId || user?.id),
  });
}
