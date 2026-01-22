import { Outlet } from "react-router-dom";
import { PartnerSidebar } from "./PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";

export function PartnerLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <PartnerSidebar />
      <div className="flex-1 flex flex-col">
        <PartnerHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
