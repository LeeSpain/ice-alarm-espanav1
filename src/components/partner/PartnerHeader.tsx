import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export function PartnerHeader() {
  const { user } = useAuth();

  const { data: partner } = useQuery({
    queryKey: ["partner-header", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("contact_name, company_name, status")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <header className="h-14 border-b bg-card px-6 flex items-center justify-between">
      <h1 className="font-semibold">Partner Portal</h1>
      {partner && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {partner.company_name || partner.contact_name}
          </span>
          <Badge 
            variant={partner.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {partner.status}
          </Badge>
        </div>
      )}
    </header>
  );
}
