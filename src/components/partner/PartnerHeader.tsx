import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { User, LogOut, Settings, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PartnerHeaderProps {
  isAdminViewMode?: boolean;
  partnerIdParam?: string | null;
}

export function PartnerHeader({ isAdminViewMode = false, partnerIdParam }: PartnerHeaderProps) {
  const { user, signOut, staffRole } = useAuth();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState<string | null>(null);

  // Fetch partner data (for display) - use same queryKey as usePartnerData for cache sharing
  const { data: partner } = useQuery({
    queryKey: ["my-partner-data", isAdminViewMode ? partnerIdParam : user?.id],
    queryFn: async () => {
      if (isAdminViewMode && partnerIdParam) {
        // Admin viewing specific partner
        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("id", partnerIdParam)
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
    enabled: isAdminViewMode ? !!partnerIdParam : !!user?.id,
  });

  // Fetch admin info when in admin view mode (also used for NotificationBell)
  const { data: adminInfo } = useQuery({
    queryKey: ["admin-info-header", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, email")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isAdminViewMode && !!user?.id,
  });

  // Set staffId for NotificationBell when admin info is loaded
  useEffect(() => {
    if (adminInfo?.id) {
      setStaffId(adminInfo.id);
    }
  }, [adminInfo?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/partner/login");
  };

  const displayName = isAdminViewMode 
    ? `${adminInfo?.first_name || ''} ${adminInfo?.last_name || ''}`.trim() || 'Admin'
    : partner?.contact_name || user?.email || 'Partner';

  const displayEmail = isAdminViewMode
    ? adminInfo?.email || ''
    : user?.email || '';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Left side - Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search referrals, commissions..."
            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
        {isAdminViewMode && (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
            <Eye className="h-3 w-3 mr-1" />
            Admin View
          </Badge>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Partner status badge when not in admin mode */}
        {!isAdminViewMode && partner && (
          <Badge 
            variant={partner.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {partner.status}
          </Badge>
        )}

        {/* Partner being viewed (admin mode) */}
        {isAdminViewMode && partner && (
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
            <span className="text-xs text-muted-foreground">Viewing:</span>
            <span className="text-sm font-medium">
              {partner.company_name || partner.contact_name}
            </span>
          </div>
        )}

        <LanguageSelector variant="icon-only" />

        {/* Notification Bell - only show when admin is viewing */}
        {isAdminViewMode && <NotificationBell staffId={staffId} />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{displayEmail}</span>
                <Badge variant="secondary" className="w-fit mt-1 text-xs">
                  {isAdminViewMode ? `${staffRole} account` : 'Partner'}
                </Badge>
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
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
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
