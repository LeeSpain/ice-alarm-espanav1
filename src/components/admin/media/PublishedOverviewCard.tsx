import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, Heart, Eye, Share2, MessageCircle, Loader2 } from "lucide-react";
import { AggregatedMetrics } from "@/hooks/usePublishedPosts";

interface PublishedOverviewCardProps {
  metrics: AggregatedMetrics;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export function PublishedOverviewCard({
  metrics,
  onRefreshAll,
  isRefreshing,
}: PublishedOverviewCardProps) {
  const { t } = useTranslation();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statCards = [
    {
      label: t("mediaManager.published.overview.totalPosts"),
      value: metrics.totalPosts,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t("mediaManager.published.overview.totalReactions"),
      value: formatNumber(metrics.totalReactions),
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      label: t("mediaManager.published.overview.totalComments"),
      value: formatNumber(metrics.totalComments),
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: t("mediaManager.published.overview.totalShares"),
      value: formatNumber(metrics.totalShares),
      icon: Share2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: t("mediaManager.published.overview.totalReach"),
      value: formatNumber(metrics.totalReach),
      icon: Eye,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t("mediaManager.published.overview.title")}</CardTitle>
            <CardDescription>{t("mediaManager.published.overview.subtitle")}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t("mediaManager.published.refreshAll")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-3 rounded-lg border bg-card"
            >
              <div className={`p-2 rounded-full ${stat.bgColor} mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
