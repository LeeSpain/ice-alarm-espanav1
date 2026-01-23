import { useSearchParams } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { PartnerSidebar } from "./PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import { useAuth } from "@/contexts/AuthContext";

export function PartnerLayout() {
  const [searchParams] = useSearchParams();
  const { isStaff, staffRole } = useAuth();

  const isAdminRole = isStaff && (staffRole === "admin" || staffRole === "super_admin");
  const partnerIdParam = searchParams.get("partnerId");
  const isAdminViewMode = isAdminRole && !!partnerIdParam;

  return (
    <div className="min-h-screen bg-background">
      <PartnerSidebar 
        isAdminViewMode={isAdminViewMode} 
        partnerIdParam={partnerIdParam}
      />
      {/* Desktop: sidebar margin, Mobile: top padding for fixed header */}
      <div className="md:ml-64 pt-16 md:pt-0 transition-all duration-300">
        <PartnerHeader 
          isAdminViewMode={isAdminViewMode}
          partnerIdParam={partnerIdParam}
        />
        <main className="p-4 md:p-6">
          {isAdminViewMode && (
            <div className="mb-4">
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
