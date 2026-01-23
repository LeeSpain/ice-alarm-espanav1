import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CallCentreSidebar } from "./CallCentreSidebar";
import { CallCentreHeader } from "./CallCentreHeader";
import { cn } from "@/lib/utils";

export function CallCentreLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <CallCentreSidebar onCollapsedChange={setCollapsed} />
      {/* Desktop: sidebar margin, Mobile: top padding for fixed header */}
      <div className={cn(
        "pt-16 md:pt-0 transition-all duration-300",
        collapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <CallCentreHeader />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
