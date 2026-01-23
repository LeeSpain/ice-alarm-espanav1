import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Bell, 
  UserCog, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  MessageSquare,
  CheckSquare,
  Ticket,
  Contact,
  Handshake,
  ClipboardCheck,
  Briefcase,
  ShoppingCart,
  CreditCard,
  DollarSign
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  superAdminOnly?: boolean;
}

interface MenuGroup {
  id: string;
  icon: React.ElementType;
  label: string;
  items: MenuItem[];
  superAdminOnly?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" }
    ]
  },
  {
    id: "people",
    icon: Users,
    label: "People",
    items: [
      { icon: Users, label: "Members", path: "/admin/members" },
      { icon: Contact, label: "Leads", path: "/admin/leads" },
      { icon: Smartphone, label: "Devices", path: "/admin/devices" },
      { icon: Bell, label: "Alerts", path: "/admin/alerts" }
    ]
  },
  {
    id: "partners",
    icon: Handshake,
    label: "Partners",
    items: [
      { icon: Handshake, label: "Partners", path: "/admin/partners" },
      { icon: ClipboardCheck, label: "Partners QA", path: "/admin/partners-qa", superAdminOnly: true }
    ]
  },
  {
    id: "staff-ops",
    icon: UserCog,
    label: "Staff Operations",
    items: [
      { icon: UserCog, label: "Staff", path: "/admin/staff", superAdminOnly: true },
      { icon: Ticket, label: "Staff Tickets", path: "/admin/tickets" },
      { icon: CheckSquare, label: "Tasks", path: "/admin/tasks" }
    ]
  },
  {
    id: "communications",
    icon: MessageSquare,
    label: "Communications",
    items: [
      { icon: MessageSquare, label: "Messages", path: "/admin/messages" }
    ]
  },
  {
    id: "business",
    icon: Briefcase,
    label: "Business",
    items: [
      { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
      { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
      { icon: DollarSign, label: "Payments", path: "/admin/payments" },
      { icon: DollarSign, label: "Commissions", path: "/admin/commissions" },
      { icon: BarChart3, label: "Reports", path: "/admin/reports" }
    ]
  },
  {
    id: "system",
    icon: Settings,
    label: "System",
    superAdminOnly: true,
    items: [
      { icon: Settings, label: "Settings", path: "/admin/settings", superAdminOnly: true }
    ]
  }
];

interface AdminSidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({ onCollapsedChange }: AdminSidebarProps = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, staffRole } = useAuth();

  // Notify parent of collapse state changes
  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    onCollapsedChange?.(value);
  };

  // Find group containing active route and auto-expand it
  useEffect(() => {
    const activeGroup = menuGroups.find(group =>
      group.items.some(item =>
        location.pathname === item.path ||
        (item.path !== "/admin" && location.pathname.startsWith(item.path + "/"))
      )
    );
    if (activeGroup) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/staff/login");
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const filterByRole = (items: MenuItem[]) => 
    items.filter(item => {
      if (item.superAdminOnly && staffRole !== "super_admin") {
        return false;
      }
      return true;
    });

  const shouldShowGroup = (group: MenuGroup) => {
    if (group.superAdminOnly && staffRole !== "super_admin") {
      return false;
    }
    const visibleItems = filterByRole(group.items);
    return visibleItems.length > 0;
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item =>
      location.pathname === item.path ||
      (item.path !== "/admin" && location.pathname.startsWith(item.path + "/"))
    );
  };

  const renderMenuItem = (item: MenuItem, isMobile: boolean, isNested: boolean = false) => {
    const isActive = location.pathname === item.path || 
      (item.path !== "/admin" && location.pathname.startsWith(item.path + "/"));
    const Icon = item.icon;
    
    const linkContent = (
      <NavLink
        to={item.path}
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground",
          !isMobile && collapsed && "justify-center px-2",
          isNested && !collapsed && "pl-9"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
      </NavLink>
    );

    if (!isMobile && collapsed) {
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
  };

  const renderMenuGroup = (group: MenuGroup, isMobile: boolean, showDivider: boolean = false) => {
    if (!shouldShowGroup(group)) return null;

    const Icon = group.icon;
    const isOpen = openGroups[group.id] || false;
    const isActive = isGroupActive(group);
    const visibleItems = filterByRole(group.items);

    // For single-item groups like Dashboard, render as a direct link
    if (visibleItems.length === 1 && group.id === "dashboard") {
      return (
        <div key={group.id}>
          {showDivider && <Separator className="my-2 bg-sidebar-border/50" />}
          <ul className="space-y-1">
            {renderMenuItem(visibleItems[0], isMobile)}
          </ul>
        </div>
      );
    }

    // Collapsed desktop: show single icon with tooltip
    if (!isMobile && collapsed) {
      return (
        <div key={group.id}>
          {showDivider && <Separator className="my-2 bg-sidebar-border/50" />}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  handleCollapse(false);
                  setOpenGroups(prev => ({ ...prev, [group.id]: true }));
                }}
                className={cn(
                  "flex items-center justify-center w-full rounded-lg px-2 py-2.5 text-sm font-medium transition-all",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive 
                    ? "bg-sidebar-primary/20 text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {group.label}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }

    // Expanded: show collapsible group
    return (
      <div key={group.id}>
        {showDivider && <Separator className="my-2 bg-sidebar-border/50" />}
        <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary/20 text-sidebar-primary" 
                  : "text-sidebar-foreground/70"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
              <span className="flex-1 text-left truncate">{group.label}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200 shrink-0",
                isOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            <ul className="space-y-1">
              {visibleItems.map((item) => renderMenuItem(item, isMobile, true))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border h-16 px-4",
        !isMobile && collapsed && "justify-center px-2"
      )}>
        <Logo variant="white" size="sm" showText={isMobile || !collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {/* Dashboard - standalone */}
          {renderMenuGroup(menuGroups[0], isMobile)}
          
          {/* People */}
          {renderMenuGroup(menuGroups[1], isMobile, true)}
          
          {/* Partners */}
          {renderMenuGroup(menuGroups[2], isMobile, true)}
          
          {/* Staff Operations */}
          {renderMenuGroup(menuGroups[3], isMobile, true)}
          
          {/* Communications */}
          {renderMenuGroup(menuGroups[4], isMobile, true)}
          
          {/* Business */}
          {renderMenuGroup(menuGroups[5], isMobile, true)}
          
          {/* System */}
          {renderMenuGroup(menuGroups[6], isMobile, true)}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !isMobile && collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {(isMobile || !collapsed) && <span>Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {!isMobile && collapsed && (
            <TooltipContent side="right" className="font-medium">
              Sign Out
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Logo variant="white" size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <SidebarContent isMobile />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex-col",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCollapse(!collapsed)}
          className={cn(
            "absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent",
            "transition-transform duration-300",
            collapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      </aside>
    </>
  );
}
