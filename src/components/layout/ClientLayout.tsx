import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { 
  Home, 
  User, 
  Heart, 
  Phone, 
  Smartphone, 
  CreditCard, 
  Bell, 
  Headphones,
  Menu,
  MessageSquare,
  LogOut,
  ChevronLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function ClientLayout() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { icon: Home, label: t("navigation.home"), path: "/dashboard" },
    { icon: User, label: t("navigation.profile"), path: "/dashboard/profile" },
    { icon: Heart, label: t("navigation.medicalInfo"), path: "/dashboard/medical" },
    { icon: Phone, label: t("navigation.emergencyContacts"), path: "/dashboard/contacts" },
    { icon: Smartphone, label: t("navigation.myDevice"), path: "/dashboard/device" },
    { icon: MessageSquare, label: t("navigation.messages") || "Messages", path: "/dashboard/messages" },
    { icon: CreditCard, label: t("navigation.subscription"), path: "/dashboard/subscription" },
    { icon: Bell, label: t("navigation.alertHistory"), path: "/dashboard/alerts" },
    { icon: Headphones, label: t("navigation.contactSupport"), path: "/dashboard/support" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const renderMenuItem = (item: typeof menuItems[0], isMobile: boolean) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    
    const linkContent = (
      <NavLink
        to={item.path}
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-4 text-lg font-medium transition-all touch-target",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "min-h-[56px]", // Large touch target for elderly users
          active 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground",
          !isMobile && collapsed && "justify-center px-3"
        )}
      >
        <Icon className="h-6 w-6 shrink-0" />
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
            <TooltipContent side="right" className="font-medium text-base">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </li>
      );
    }

    return <li key={item.path}>{linkContent}</li>;
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
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item, isMobile))}
        </ul>
      </nav>

      {/* Emergency Button - Large touch target */}
      <div className="p-4 border-t border-sidebar-border">
        <Button 
          size="lg" 
          className={cn(
            "w-full h-16 font-bold bg-alert-sos hover:bg-alert-sos/90 text-alert-sos-foreground shadow-lg",
            collapsed && !isMobile ? "text-lg" : "text-xl"
          )}
        >
          <Phone className={cn("shrink-0", collapsed && !isMobile ? "h-6 w-6" : "mr-3 h-7 w-7")} />
          {(isMobile || !collapsed) && t("dashboard.contactIceAlarm")}
        </Button>
      </div>

      {/* Sign out */}
      <div className="border-t border-sidebar-border p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-[48px]",
                !isMobile && collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5" />
              {(isMobile || !collapsed) && <span>{t("auth.signOut")}</span>}
            </Button>
          </TooltipTrigger>
          {!isMobile && collapsed && (
            <TooltipContent side="right" className="font-medium">
              {t("auth.signOut")}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Logo variant="white" size="sm" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
        collapsed ? "w-20" : "w-64"
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

      {/* Main Content */}
      <div className={cn(
        "pt-16 md:pt-0 transition-all duration-300",
        collapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-end border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector variant="icon-only" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span>María García</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">María García</span>
                    <span className="text-xs text-muted-foreground">maria.garcia@email.com</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{t("auth.accountSettings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("auth.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
