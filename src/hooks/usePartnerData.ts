import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePartnerData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-partner-data", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
