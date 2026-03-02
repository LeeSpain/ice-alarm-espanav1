import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CallCentreSidebar } from "./CallCentreSidebar";
import { CallCentreHeader } from "./CallCentreHeader";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { cn } from "@/lib/utils";
import { SOSAlertBar } from "@/components/call-centre/sos/SOSAlertBar";
import { SOSTakeoverScreen } from "@/components/call-centre/sos/SOSTakeoverScreen";
import { useSOSTakeover } from "@/hooks/useSOSTakeover";
import { useTwilioDevice } from "@/hooks/useTwilioDevice";

export function CallCentreLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { isTakeoverActive } = useSOSTakeover();

  // Initialize Twilio device at layout level so it's always registered
  useTwilioDevice();

  return (
    <div className="min-h-screen bg-background">
      {/* Full-screen SOS takeover overlay */}
      {isTakeoverActive && <SOSTakeoverScreen />}

      <CallCentreSidebar onCollapsedChange={setCollapsed} />
      {/* Desktop: sidebar margin, Mobile: top padding for fixed header */}
      <div className={cn(
        "pt-16 md:pt-0 transition-all duration-300",
        collapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <CallCentreHeader />
        {/* SOS Alert Bar — visible on ALL call centre pages */}
        <SOSAlertBar />
        <main className="p-4 md:p-6">
          <SectionErrorBoundary section="call-centre" homePath="/call-centre">
            <Outlet />
          </SectionErrorBoundary>
        </main>
      </div>
    </div>
  );
}
