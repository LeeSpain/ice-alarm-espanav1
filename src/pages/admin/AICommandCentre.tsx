import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Headphones, Megaphone, Palette, ArrowRight, Zap, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsabellaStats } from "@/hooks/useIsabellaSettings";

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  badgeActive?: boolean;
  stat?: string;
  buttonLabel: string;
  onClick: () => void;
}

function SectionCard({ icon: Icon, title, description, badge, badgeActive, stat, buttonLabel, onClick }: SectionCardProps) {
  return (
    <Card className="relative overflow-hidden flex flex-col">
      <div className={`absolute top-0 left-0 right-0 h-1 ${badgeActive ? "bg-green-500" : "bg-muted"}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg ${badgeActive ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`h-6 w-6 ${badgeActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          {badge && (
            <Badge variant="outline" className={badgeActive ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        {stat && <p className="text-sm text-muted-foreground mb-4">{stat}</p>}
        <Button onClick={onClick} className="w-full" variant="outline">
          {buttonLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AICommandCentre() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useIsabellaStats();

  const hasActive = (stats?.enabledCount ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("aiCommandCentre.title", "AI Command Centre")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("aiCommandCentre.subtitle", "Manage Isabella and AI-powered automation")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[260px]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <SectionCard
            icon={Headphones}
            title={t("aiCommandCentre.isabellaOperations.title", "Isabella Operations")}
            description={t("aiCommandCentre.isabellaOperations.description", "Customer, member, and alert handling")}
            badge={hasActive ? `🟢 ${t("isabella.status.active", "Active")}` : `⚪ ${t("isabella.status.inactive", "Inactive")}`}
            badgeActive={hasActive}
            stat={t("isabella.status.functionsActive", { count: stats?.enabledCount ?? 0 })}
            buttonLabel={t("aiCommandCentre.isabellaOperations.button", "Manage Functions")}
            onClick={() => navigate("/admin/ai/operations")}
          />
          <SectionCard
            icon={Megaphone}
            title={t("aiCommandCentre.outreachPipeline.title", "AI Outreach Pipeline")}
            description={t("aiCommandCentre.outreachPipeline.description", "B2B lead discovery, research, and sales automation")}
            badge={`🟢 ${t("isabella.status.active", "Active")}`}
            badgeActive
            buttonLabel={t("aiCommandCentre.outreachPipeline.button", "Open Pipeline")}
            onClick={() => navigate("/admin/ai-outreach")}
          />
          <SectionCard
            icon={Palette}
            title={t("aiCommandCentre.isabellaContent.title", "Isabella Content")}
            description={t("aiCommandCentre.isabellaContent.description", "Social media, blog posts, and video generation")}
            badge={`🟢 ${t("isabella.status.active", "Active")}`}
            badgeActive
            buttonLabel={t("aiCommandCentre.isabellaContent.button", "Content Manager")}
            onClick={() => navigate("/admin/media-manager")}
          />
        </div>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("ai.systemOverview", "System Overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats?.enabledCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">{t("isabella.status.functionsActive", { count: stats?.enabledCount ?? 0 })}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats?.interactionsToday ?? 0}</p>
              <p className="text-sm text-muted-foreground">{t("isabella.status.interactionsToday", { count: stats?.interactionsToday ?? 0 })}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{stats?.escalationsToday ?? 0}</p>
              <p className="text-sm text-muted-foreground">{t("isabella.status.escalatedToHumans", { count: stats?.escalationsToday ?? 0 })}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
