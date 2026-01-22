import { useState, useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { PartnerSidebar } from "./PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function PartnerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isStaff, staffRole } = useAuth();

  const isAdminRole = isStaff && (staffRole === "admin" || staffRole === "super_admin");
  const partnerIdParam = searchParams.get("partnerId");
  const isAdminViewMode = isAdminRole && !!partnerIdParam;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background w-full">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden">
        <div className="flex items-center h-14 px-4 border-b bg-card">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <PartnerSidebar 
                isMobile 
                isAdminViewMode={isAdminViewMode} 
                partnerIdParam={partnerIdParam}
              />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Partner Portal</span>
        </div>
        {isAdminViewMode && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2">
            <span className="text-xs text-amber-800 dark:text-amber-200">
              Admin View Mode
            </span>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <PartnerSidebar 
          isAdminViewMode={isAdminViewMode} 
          partnerIdParam={partnerIdParam}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden md:block">
          <PartnerHeader 
            isAdminViewMode={isAdminViewMode}
            partnerIdParam={partnerIdParam}
          />
        </div>
        <main className="flex-1 p-4 md:p-6 mt-14 md:mt-0">
          {isAdminViewMode && (
            <div className="hidden md:block mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-2">
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  🔍 Admin View Mode — Viewing partner data as administrator
                </span>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
