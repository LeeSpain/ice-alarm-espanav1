import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Send, 
  DollarSign, 
  Settings,
  LogOut,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PartnerSidebarProps {
  isMobile?: boolean;
  isAdminViewMode?: boolean;
  partnerIdParam?: string | null;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/partner-dashboard" },
  { label: "Invites", icon: Send, href: "/partner-dashboard/invites" },
  { label: "Commissions", icon: DollarSign, href: "/partner-dashboard/commissions" },
  { label: "Settings", icon: Settings, href: "/partner-dashboard/settings" },
];

export function PartnerSidebar({ isMobile = false, isAdminViewMode = false, partnerIdParam }: PartnerSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // When in admin view mode, append partnerId to all links
  const getHref = (baseHref: string) => {
    if (isAdminViewMode && partnerIdParam) {
      return `${baseHref}?partnerId=${partnerIdParam}`;
    }
    return baseHref;
  };

  const isActive = (href: string) => {
    const basePath = href.split("?")[0];
    if (basePath === "/partner-dashboard") {
      return location.pathname === "/partner-dashboard";
    }
    return location.pathname.startsWith(basePath);
  };

  return (
    <aside className={cn(
      "w-64 min-h-screen bg-card border-r flex flex-col",
      isMobile && "min-h-full"
    )}>
      <div className="p-4 border-b">
        <Logo />
      </div>

      {/* Admin View Mode - Back to Admin */}
      {isAdminViewMode && (
        <div className="p-4 border-b bg-amber-50 dark:bg-amber-950/20">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
            onClick={() => navigate("/admin/partners")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partners
          </Button>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const href = getHref(item.href);
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out - only show for actual partners, not admin viewing */}
      {!isAdminViewMode && (
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}
    </aside>
  );
}
