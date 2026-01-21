import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  CreditCard, 
  DollarSign, 
  Bell, 
  UserCog, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Members", path: "/admin/members" },
  { icon: Smartphone, label: "Devices", path: "/admin/devices" },
  { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
  { icon: DollarSign, label: "Payments", path: "/admin/payments" },
  { icon: Bell, label: "Alerts", path: "/admin/alerts" },
  { icon: UserCog, label: "Staff", path: "/admin/staff", adminOnly: true },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { icon: Settings, label: "Settings", path: "/admin/settings", adminOnly: true },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border h-16 px-4",
        collapsed && "justify-center px-2"
      )}>
        <Logo variant="white" size="sm" showText={!collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            const linkContent = (
              <NavLink
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <li key={item.path}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={item.path}>{linkContent}</li>;
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              Sign Out
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent",
          "transition-transform duration-300",
          collapsed && "rotate-180"
        )}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
    </aside>
  );
}
