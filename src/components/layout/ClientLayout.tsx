import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Home, 
  User, 
  Heart, 
  Phone, 
  Smartphone, 
  CreditCard, 
  Bell, 
  Headphones,
  Menu,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: User, label: "My Profile", path: "/dashboard/profile" },
  { icon: Heart, label: "Medical Info", path: "/dashboard/medical" },
  { icon: Phone, label: "Emergency Contacts", path: "/dashboard/contacts" },
  { icon: Smartphone, label: "My Device", path: "/dashboard/device" },
  { icon: CreditCard, label: "Subscription", path: "/dashboard/subscription" },
  { icon: Bell, label: "Alert History", path: "/dashboard/alerts" },
  { icon: Headphones, label: "Contact Support", path: "/dashboard/support" },
];

export function ClientLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-card border-r">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b">
          <Logo size="sm" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all touch-target",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Emergency Button */}
        <div className="p-4 border-t">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-semibold bg-alert-sos hover:bg-alert-sos/90 text-alert-sos-foreground"
          >
            <Phone className="mr-2 h-5 w-5" />
            Contact ICE Alarm
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-card border-b shadow-lg animate-fade-in">
            <nav className="py-2 px-2">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all",
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-4 border-t">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-semibold bg-alert-sos hover:bg-alert-sos/90 text-alert-sos-foreground"
              >
                <Phone className="mr-2 h-5 w-5" />
                Contact ICE Alarm
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-end border-b bg-background/95 backdrop-blur px-6">
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <span className="mr-2">🇬🇧</span> English
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="mr-2">🇪🇸</span> Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-6 pt-20 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
