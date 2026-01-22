import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Send, 
  DollarSign, 
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/partner-dashboard" },
  { label: "Invites", icon: Send, href: "/partner-dashboard/invites" },
  { label: "Commissions", icon: DollarSign, href: "/partner-dashboard/commissions" },
  { label: "Settings", icon: Settings, href: "/partner-dashboard/settings" },
];

export function PartnerSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <Logo />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/partner-dashboard" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
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
    </aside>
  );
}
