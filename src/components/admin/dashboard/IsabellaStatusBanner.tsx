import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Bot, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsabellaSettings, useIsabellaStats } from "@/hooks/useIsabellaSettings";

const FUNCTION_LABELS: Record<string, string> = {
  device_offline_response: "isabella.functions.deviceOfflineResponse",
  low_battery_alerts: "isabella.functions.lowBatteryAlerts",
  sos_button_triage: "isabella.functions.sosButtonTriage",
  fall_detection_triage: "isabella.functions.fallDetectionTriage",
  inbound_phone_calls: "isabella.functions.inboundPhoneCalls",
  inbound_sms: "isabella.functions.inboundSms",
  inbound_whatsapp: "isabella.functions.inboundWhatsapp",
  inbound_email: "isabella.functions.inboundEmail",
  chat_widget: "isabella.functions.chatWidget",
  courtesy_calls: "isabella.functions.courtesyCalls",
  welcome_calls: "isabella.functions.welcomeCalls",
  onboarding_checkins: "isabella.functions.onboardingCheckins",
  payment_reminders: "isabella.functions.paymentReminders",
  followup_calls: "isabella.functions.followupCalls",
  birthday_calls: "isabella.functions.birthdayCalls",
  lead_followup_calls: "isabella.functions.leadFollowupCalls",
  abandoned_signup_recovery: "isabella.functions.abandonedSignupRecovery",
  partner_enquiry_handling: "isabella.functions.partnerEnquiryHandling",
  b2b_outreach_campaigns: "isabella.functions.b2bOutreachCampaigns",
};

export function IsabellaStatusBanner() {
  const { t } = useTranslation();
  const { data: settings } = useIsabellaSettings();
  const { data: stats } = useIsabellaStats();

  const enabledFunctions = (settings || []).filter((s) => s.enabled);
  const isActive = enabledFunctions.length > 0;

  if (!settings) return null;

  return (
    <Alert className={isActive ? "border-green-500/50 bg-green-500/5" : ""}>
      {isActive ? <Bot className="h-4 w-4 text-green-600" /> : <User className="h-4 w-4" />}
      <AlertTitle className="flex items-center justify-between">
        <span>
          {isActive
            ? `🤖 ${t("isabella.banner.isabellaActive", "ISABELLA ACTIVE")}`
            : `👤 ${t("isabella.banner.humanMode", "HUMAN MODE: All alerts and communications routed to staff")}`}
        </span>
        <Link to="/admin/ai/operations" className="text-sm font-normal text-primary hover:underline">
          {t("common.manage", "Manage")}
        </Link>
      </AlertTitle>
      {isActive && (
        <AlertDescription className="mt-1">
          <span className="text-xs">
            {enabledFunctions.map((f) => t(FUNCTION_LABELS[f.function_key] || f.function_key)).join(", ")}
          </span>
          <span className="block text-xs text-muted-foreground mt-1">
            {t("isabella.banner.managing", {
              interactions: stats?.interactionsToday ?? 0,
              escalated: stats?.escalationsToday ?? 0,
            })}
          </span>
        </AlertDescription>
      )}
    </Alert>
  );
}
