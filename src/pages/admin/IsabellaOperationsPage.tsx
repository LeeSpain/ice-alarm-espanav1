import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Activity, AlertTriangle, Zap, Settings, ExternalLink } from "lucide-react";
import { useIsabellaSettings, useUpdateIsabellaSetting, useIsabellaStats, IsabellaSetting } from "@/hooks/useIsabellaSettings";
import { useAuth } from "@/contexts/AuthContext";

const FUNCTION_KEY_MAP: Record<string, { nameKey: string; descKey: string }> = {
  device_offline_response: { nameKey: "isabella.functions.deviceOfflineResponse", descKey: "isabella.functions.deviceOfflineResponseDesc" },
  low_battery_alerts: { nameKey: "isabella.functions.lowBatteryAlerts", descKey: "isabella.functions.lowBatteryAlertsDesc" },
  sos_button_triage: { nameKey: "isabella.functions.sosButtonTriage", descKey: "isabella.functions.sosButtonTriageDesc" },
  fall_detection_triage: { nameKey: "isabella.functions.fallDetectionTriage", descKey: "isabella.functions.fallDetectionTriageDesc" },
  inbound_phone_calls: { nameKey: "isabella.functions.inboundPhoneCalls", descKey: "isabella.functions.inboundPhoneCallsDesc" },
  inbound_sms: { nameKey: "isabella.functions.inboundSms", descKey: "isabella.functions.inboundSmsDesc" },
  inbound_whatsapp: { nameKey: "isabella.functions.inboundWhatsapp", descKey: "isabella.functions.inboundWhatsappDesc" },
  inbound_email: { nameKey: "isabella.functions.inboundEmail", descKey: "isabella.functions.inboundEmailDesc" },
  chat_widget: { nameKey: "isabella.functions.chatWidget", descKey: "isabella.functions.chatWidgetDesc" },
  courtesy_calls: { nameKey: "isabella.functions.courtesyCalls", descKey: "isabella.functions.courtesyCallsDesc" },
  welcome_calls: { nameKey: "isabella.functions.welcomeCalls", descKey: "isabella.functions.welcomeCallsDesc" },
  onboarding_checkins: { nameKey: "isabella.functions.onboardingCheckins", descKey: "isabella.functions.onboardingCheckinsDesc" },
  payment_reminders: { nameKey: "isabella.functions.paymentReminders", descKey: "isabella.functions.paymentRemindersDesc" },
  followup_calls: { nameKey: "isabella.functions.followupCalls", descKey: "isabella.functions.followupCallsDesc" },
  birthday_calls: { nameKey: "isabella.functions.birthdayCalls", descKey: "isabella.functions.birthdayCallsDesc" },
  lead_followup_calls: { nameKey: "isabella.functions.leadFollowupCalls", descKey: "isabella.functions.leadFollowupCallsDesc" },
  abandoned_signup_recovery: { nameKey: "isabella.functions.abandonedSignupRecovery", descKey: "isabella.functions.abandonedSignupRecoveryDesc" },
  partner_enquiry_handling: { nameKey: "isabella.functions.partnerEnquiryHandling", descKey: "isabella.functions.partnerEnquiryHandlingDesc" },
  b2b_outreach_campaigns: { nameKey: "isabella.functions.b2bOutreachCampaigns", descKey: "isabella.functions.b2bOutreachCampaignsDesc" },
};

const SECTIONS = [
  {
    titleKey: "isabella.sections.alertHandling",
    keys: ["device_offline_response", "low_battery_alerts", "sos_button_triage", "fall_detection_triage"],
  },
  {
    titleKey: "isabella.sections.inboundCommunications",
    keys: ["inbound_phone_calls", "inbound_sms", "inbound_whatsapp", "inbound_email", "chat_widget"],
  },
  {
    titleKey: "isabella.sections.outboundCommunications",
    keys: ["courtesy_calls", "welcome_calls", "onboarding_checkins", "payment_reminders", "followup_calls", "birthday_calls"],
  },
  {
    titleKey: "isabella.sections.salesAndLeads",
    keys: ["lead_followup_calls", "abandoned_signup_recovery", "partner_enquiry_handling", "b2b_outreach_campaigns"],
  },
];

const ALWAYS_HUMAN = [
  "isabella.alwaysHumanItems.emergencyDispatch",
  "isabella.alwaysHumanItems.physicalHandling",
  "isabella.alwaysHumanItems.bankTransfers",
  "isabella.alwaysHumanItems.largeRefunds",
];

export default function IsabellaOperationsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useIsabellaSettings();
  const { data: stats } = useIsabellaStats();
  const updateMutation = useUpdateIsabellaSetting();
  const { user } = useAuth();

  const settingsMap = (settings || []).reduce<Record<string, IsabellaSetting>>((acc, s) => {
    acc[s.function_key] = s;
    return acc;
  }, {});

  const handleToggle = (functionKey: string, newEnabled: boolean) => {
    const setting = settingsMap[functionKey];
    if (!setting) return;
    updateMutation.mutate({ id: setting.id, enabled: newEnabled, staffId: user?.id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("isabella.title", "Isabella Operations")}</h1>
        <p className="text-muted-foreground mt-1">{t("isabella.subtitle", "Control which functions Isabella handles automatically")}</p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <Zap className="h-3.5 w-3.5" />
          {t("isabella.status.functionsActive", { count: stats?.enabledCount ?? 0 })}
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <Activity className="h-3.5 w-3.5" />
          {t("isabella.status.interactionsToday", { count: stats?.interactionsToday ?? 0 })}
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("isabella.status.escalatedToHumans", { count: stats?.escalationsToday ?? 0 })}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          {SECTIONS.map((section) => (
            <Card key={section.titleKey}>
              <CardHeader>
                <CardTitle className="text-lg">{t(section.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.keys.map((key) => {
                  const meta = FUNCTION_KEY_MAP[key];
                  const setting = settingsMap[key];
                  if (!meta) return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{t(meta.nameKey)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(meta.descKey)}</p>
                      </div>
                      <Switch
                        checked={setting?.enabled ?? false}
                        onCheckedChange={(checked) => handleToggle(key, checked)}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {/* Always Human */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("isabella.sections.alwaysHuman", "Always Human")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ALWAYS_HUMAN.map((key) => (
                <div key={key} className="flex items-center gap-3 py-2 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{t(key)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Advanced Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{t("isabella.advancedConfig.title", "Advanced Configuration")}</CardTitle>
                  <CardDescription>{t("isabella.advancedConfig.description", "Configure the AI agents that power Isabella's functions")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t("isabella.advancedConfig.customerServiceAgent", "Customer Service & Sales Agent"), path: "/admin/ai/agents/customer_service_expert" },
                { label: t("isabella.advancedConfig.mainBrain", "Main Brain"), path: "/admin/ai/agents/main_brain" },
                { label: t("isabella.advancedConfig.memberSpecialist", "Member Specialist"), path: "/admin/ai/agents/member_specialist" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center justify-between py-2.5 px-3 rounded-md border hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-sm font-medium">{link.label}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                {t("isabella.advancedConfig.hint", "These links let you customise AI prompts, memory, and permissions.")}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
