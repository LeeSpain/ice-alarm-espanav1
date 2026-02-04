import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Brain, Headphones, TrendingUp, UserCircle, ImageIcon, Activity, Clock, AlertTriangle, ArrowRight, Zap, Headset } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAIAgents, useAIAgentStats } from "@/hooks/useAIAgents";
import { formatDistanceToNow } from "date-fns";
function AgentCard({ 
  agent, 
  icon: Icon,
  onOpen 
}: { 
  agent: any; 
  icon: React.ElementType;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useAIAgentStats(agent?.id);

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "auto_act": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft_only": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "advise_only": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "auto_act": return t("ai.modes.autoAct", "Auto Act");
      case "draft_only": return t("ai.modes.draftOnly", "Draft Only");
      case "advise_only": return t("ai.modes.adviseOnly", "Advise Only");
      default: return mode;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${agent?.enabled ? "bg-green-500" : "bg-muted"}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {agent?.avatar_url ? (
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={agent.avatar_url} alt={agent.name} />
                <AvatarFallback className={agent?.enabled ? "bg-primary/10" : "bg-muted"}>
                  <Icon className={`h-6 w-6 ${agent?.enabled ? "text-primary" : "text-muted-foreground"}`} />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`p-2 rounded-lg ${agent?.enabled ? "bg-primary/10" : "bg-muted"}`}>
                <Icon className={`h-6 w-6 ${agent?.enabled ? "text-primary" : "text-muted-foreground"}`} />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{agent?.name}</CardTitle>
              <CardDescription className="text-sm mt-0.5">
                {agent?.description?.slice(0, 80)}...
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={agent?.enabled ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
          >
            {agent?.enabled ? t("ai.enabled", "Enabled") : t("ai.paused", "Paused")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getModeColor(agent?.mode)}>
            <Zap className="h-3 w-3 mr-1" />
            {getModeLabel(agent?.mode)}
          </Badge>
          {agent?.instance_count > 1 && (
            <Badge variant="secondary">
              {agent.instance_count} {t("ai.instances", "instances")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          {statsLoading ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Clock className="h-3 w-3" />
                  {t("ai.lastRun", "Last Run")}
                </div>
                <p className="text-sm font-medium">
                  {stats?.lastRunAt 
                    ? formatDistanceToNow(new Date(stats.lastRunAt), { addSuffix: true })
                    : t("ai.never", "Never")}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Activity className="h-3 w-3" />
                  {t("ai.actionsCreated", "Actions (24h)")}
                </div>
                <p className="text-sm font-medium">{stats?.actionsLast24h || 0}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Zap className="h-3 w-3" />
                  {t("ai.runsToday", "Runs (24h)")}
                </div>
                <p className="text-sm font-medium">{stats?.runsLast24h || 0}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  {t("ai.escalations", "Escalations")}
                </div>
                <p className="text-sm font-medium">{stats?.escalationsReceived || 0}</p>
              </div>
            </>
          )}
        </div>

        <Button onClick={onOpen} className="w-full mt-4" variant="outline">
          {t("ai.openAgent", "Open Agent")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Map agent_key to appropriate icon
const getAgentIcon = (agentKey: string): React.ElementType => {
  switch (agentKey) {
    case "main_brain":
      return Brain;
    case "customer_service_expert":
      return Headphones;
    case "sales_expert":
      return TrendingUp;
    case "member_specialist":
      return UserCircle;
    case "media_manager":
      return ImageIcon;
    case "staff_support_specialist":
      return Headset;
    default:
      return Brain;
  }
};

export default function AICommandCentre() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: agents, isLoading } = useAIAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("ai.commandCentre", "AI Command Centre")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("ai.commandCentreDescription", "Monitor and manage your AI agents from a single dashboard.")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[320px]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {agents?.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              icon={getAgentIcon(agent.agent_key)}
              onOpen={() => navigate(`/admin/ai/agents/${agent.agent_key}`)}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("ai.systemOverview", "System Overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{agents?.length || 0}</p>
              <p className="text-sm text-muted-foreground">{t("ai.totalAgents", "Total Agents")}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-status-active">
                {agents?.filter(a => a.enabled).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">{t("ai.activeAgents", "Active Agents")}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-alert-battery">
                {agents?.reduce((sum, a) => sum + a.instance_count, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">{t("ai.totalInstances", "Total Instances")}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">2</p>
              <p className="text-sm text-muted-foreground">{t("ai.phase", "Phase")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
