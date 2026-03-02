import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Activity, Navigation, Battery, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SOSVitalsStripProps {
  alertId: string;
  alertType: string;
  memberId: string;
  receivedAt: string;
  isUnresponsive?: boolean;
}

interface MemberData {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  preferred_language: string;
  photo_url: string | null;
}

const alertTypeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sos_button: { label: "SOS", color: "bg-red-600", icon: AlertTriangle },
  fall_detected: { label: "FALL", color: "bg-orange-600", icon: Activity },
  geo_fence: { label: "GEO-FENCE", color: "bg-yellow-600", icon: Navigation },
  low_battery: { label: "LOW BATTERY", color: "bg-blue-600", icon: Battery },
};

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function ElapsedTimer({ since }: { since: string }) {
  const [display, setDisplay] = useState("0:00");

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Date.now() - new Date(since).getTime());
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setDisplay(`${min}:${sec.toString().padStart(2, "0")}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [since]);

  return (
    <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-lg">
      <Clock className="h-4 w-4 text-red-400" />
      <span className="text-lg font-mono font-bold text-red-400">{display}</span>
    </div>
  );
}

export function SOSVitalsStrip({ alertId, alertType, memberId, receivedAt, isUnresponsive }: SOSVitalsStripProps) {
  const { t } = useTranslation();
  const [member, setMember] = useState<MemberData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("members")
        .select("first_name, last_name, date_of_birth, preferred_language, photo_url")
        .eq("id", memberId)
        .maybeSingle();
      if (data) setMember(data);
    };
    fetch();
  }, [memberId]);

  const config = alertTypeConfig[alertType] || alertTypeConfig.sos_button;
  const Icon = config.icon;
  const langFlag = member?.preferred_language === "en" ? "🇬🇧" : "🇪🇸";
  const age = member?.date_of_birth ? calculateAge(member.date_of_birth) : null;
  const initials = member ? `${member.first_name[0]}${member.last_name[0]}` : "?";

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700">
      <div className="flex items-center gap-4">
        {/* Photo */}
        <Avatar className="h-10 w-10 border-2 border-zinc-600">
          <AvatarImage src={member?.photo_url || undefined} />
          <AvatarFallback className="bg-zinc-700 text-zinc-300 font-bold">{initials}</AvatarFallback>
        </Avatar>

        {/* Name + age */}
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {member ? `${member.first_name} ${member.last_name}` : "Loading..."}
          </h2>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {age !== null && <span>{age} {t("sos.vitals.years", "yrs")}</span>}
            <span>{langFlag}</span>
          </div>
        </div>

        {/* Alert type badge */}
        <Badge className={cn(config.color, "text-white font-bold text-xs px-3 py-1")}>
          <Icon className="h-3.5 w-3.5 mr-1" />
          {config.label}
        </Badge>

        {/* Unresponsive indicator */}
        {isUnresponsive && (
          <div className="flex items-center gap-1.5 bg-red-900/60 border border-red-500 px-3 py-1 rounded animate-pulse">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-bold text-red-300">
              {t("sos.vitals.memberUnresponsive", "MEMBER UNRESPONSIVE")}
            </span>
          </div>
        )}
      </div>

      {/* Elapsed timer */}
      <ElapsedTimer since={receivedAt} />
    </div>
  );
}
