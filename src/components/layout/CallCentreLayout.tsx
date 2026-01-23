import { Outlet } from "react-router-dom";
import { CallCentreSidebar } from "./CallCentreSidebar";
import { CallCentreHeader } from "./CallCentreHeader";

export function CallCentreLayout() {
  return (
    <div className="min-h-screen bg-background">
      <CallCentreSidebar />
      {/* Desktop: sidebar margin, Mobile: top padding for fixed header */}
      <div className="md:ml-64 pt-16 md:pt-0 transition-all duration-300">
        <CallCentreHeader />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
