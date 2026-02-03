import { useTranslation } from "react-i18next";
import { BarChart3, Users, CheckCircle, Mail, MessageSquare, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OutreachAnalyticsTab() {
  const { t } = useTranslation();

  const metrics = [
    { key: "leadsDiscovered", icon: Users, value: 0, color: "text-blue-500" },
    { key: "leadsQualified", icon: CheckCircle, value: 0, color: "text-green-500" },
    { key: "emailsSent", icon: Mail, value: 0, color: "text-yellow-500" },
    { key: "repliesReceived", icon: MessageSquare, value: 0, color: "text-orange-500" },
    { key: "conversions", icon: UserCheck, value: 0, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("outreach.analytics.title")}</CardTitle>
              <CardDescription>{t("outreach.analytics.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metrics.map(({ key, icon: Icon, value, color }) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`${color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`outreach.analytics.metrics.${key}`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for charts */}
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-4">{t("outreach.analytics.subtitle")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
