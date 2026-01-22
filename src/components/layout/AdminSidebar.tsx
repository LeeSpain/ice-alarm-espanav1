import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  ShoppingCart,
  CreditCard, 
  DollarSign, 
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
  Wallet,
  Handshake,
  ClipboardCheck
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

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  superAdminOnly?: boolean;
}

interface MenuGroup {
  icon: React.ElementType;
  label: string;
  items: MenuItem[];
  superAdminOnly?: boolean;
}

const mainMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Contact, label: "Leads", path: "/admin/leads" },
  { icon: Users, label: "Members", path: "/admin/members" },
  { icon: Smartphone, label: "Devices", path: "/admin/devices" },
];

const financeGroup: MenuGroup = {
  icon: Wallet,
  label: "Finance",
  items: [
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
    { icon: DollarSign, label: "Payments", path: "/admin/payments" },
    { icon: DollarSign, label: "Commissions", path: "/admin/commissions" },
  ],
};

const secondaryMenuItems: MenuItem[] = [
  { icon: Handshake, label: "Partners", path: "/admin/partners" },
  { icon: ClipboardCheck, label: "Partners QA", path: "/admin/partners-qa", superAdminOnly: true },
  { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
  { icon: Bell, label: "Alerts", path: "/admin/alerts" },
  { icon: CheckSquare, label: "Tasks", path: "/admin/tasks" },
  { icon: Ticket, label: "Staff Tickets", path: "/admin/tickets" },
  { icon: UserCog, label: "Staff", path: "/admin/staff", superAdminOnly: true },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { icon: Settings, label: "Settings", path: "/admin/settings", superAdminOnly: true },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, staffRole } = useAuth();

  // Check if any finance route is active
  const isFinanceActive = financeGroup.items.some(
    item => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
  );

  // Auto-expand finance when a child route is active
  useEffect(() => {
    if (isFinanceActive) {
      setFinanceOpen(true);
    }
  }, [isFinanceActive]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/staff/login");
  };

  const filterByRole = (items: MenuItem[]) => 
    items.filter(item => {
      if (item.superAdminOnly && staffRole !== "super_admin") {
        return false;
      }
      return true;
    });

  const renderMenuItem = (item: MenuItem, isMobile: boolean) => {
    const isActive = location.pathname === item.path || 
      (item.path !== "/admin" && location.pathname.startsWith(item.path + "/"));
    const Icon = item.icon;
    
    const linkContent = (
      <NavLink
        to={item.path}
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground",
          !isMobile && collapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {(isMobile || !collapsed) && <span>{item.label}</span>}
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

  const renderFinanceGroup = (isMobile: boolean) => {
    const Icon = financeGroup.icon;
    
    // Collapsed desktop: show single icon with tooltip
    if (!isMobile && collapsed) {
      return (
        <li>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFinanceOpen(!financeOpen)}
                className={cn(
                  "flex items-center justify-center w-full rounded-lg px-2 py-2.5 text-sm font-medium transition-all",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isFinanceActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {financeGroup.label}
            </TooltipContent>
          </Tooltip>
        </li>
      );
    }

    // Expanded: show collapsible group
    return (
      <li>
        <Collapsible open={financeOpen} onOpenChange={setFinanceOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isFinanceActive 
                  ? "text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{financeGroup.label}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                financeOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {financeGroup.items.map((item) => {
              const isActive = location.pathname === item.path || 
                location.pathname.startsWith(item.path + "/");
              const ItemIcon = item.icon;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground"
                  )}
                >
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </li>
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
        <ul className="space-y-1">
          {/* Main menu items */}
          {filterByRole(mainMenuItems).map((item) => renderMenuItem(item, isMobile))}
          
          {/* Finance group */}
          {renderFinanceGroup(isMobile)}
          
          {/* Secondary menu items */}
          {filterByRole(secondaryMenuItems).map((item) => renderMenuItem(item, isMobile))}
        </ul>
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
    </>
  );
}
