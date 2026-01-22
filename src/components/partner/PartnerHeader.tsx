import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/LanguageSelector";
import { User, LogOut, Settings, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PartnerHeaderProps {
  isAdminViewMode?: boolean;
  partnerIdParam?: string | null;
}

export function PartnerHeader({ isAdminViewMode = false, partnerIdParam }: PartnerHeaderProps) {
  const { user, signOut, staffRole } = useAuth();
  const navigate = useNavigate();

  // Fetch partner data (for display)
  const { data: partner } = useQuery({
    queryKey: ["partner-header", isAdminViewMode ? partnerIdParam : user?.id],
    queryFn: async () => {
      if (isAdminViewMode && partnerIdParam) {
        // Admin viewing specific partner
        const { data, error } = await supabase
          .from("partners")
          .select("contact_name, company_name, status")
          .eq("id", partnerIdParam)
          .single();
        if (error) throw error;
        return data;
      }

      // Regular partner viewing their own data
      const { data, error } = await supabase
        .from("partners")
        .select("contact_name, company_name, status")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isAdminViewMode ? !!partnerIdParam : !!user?.id,
  });

  // Fetch admin info when in admin view mode
  const { data: adminInfo } = useQuery({
    queryKey: ["admin-info-header", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("first_name, last_name, email")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isAdminViewMode && !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/partner/login");
  };

  const displayName = isAdminViewMode 
    ? `${adminInfo?.first_name || ''} ${adminInfo?.last_name || ''}`.trim() || 'Admin'
    : partner?.contact_name || user?.email || 'Partner';

  return (
    <header className="h-14 border-b bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold">Partner Portal</h1>
        {isAdminViewMode && (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
            <Eye className="h-3 w-3 mr-1" />
            Admin View
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Partner info when not in admin mode */}
        {!isAdminViewMode && partner && (
          <div className="flex items-center gap-3 mr-2">
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

        {/* Partner being viewed (admin mode) */}
        {isAdminViewMode && partner && (
          <div className="flex items-center gap-2 mr-2 px-2 py-1 rounded bg-muted/50">
            <span className="text-xs text-muted-foreground">Viewing:</span>
            <span className="text-sm font-medium">
              {partner.company_name || partner.contact_name}
            </span>
          </div>
        )}

        <LanguageSelector variant="icon-only" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {isAdminViewMode ? `${staffRole} account` : 'Partner account'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {isAdminViewMode ? (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Settings className="mr-2 h-4 w-4" />
                Back to Admin
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => navigate("/partner-dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
