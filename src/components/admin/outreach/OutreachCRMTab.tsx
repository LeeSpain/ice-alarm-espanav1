import { useTranslation } from "react-i18next";
import { Target, Users, MessageSquare, ThumbsUp, UserCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutreachCRMLeads } from "@/hooks/useOutreachCRMLeads";

const statusColumns = [
  { key: "new", icon: Users, color: "bg-blue-500" },
  { key: "contacted", icon: MessageSquare, color: "bg-yellow-500" },
  { key: "replied", icon: MessageSquare, color: "bg-orange-500" },
  { key: "interested", icon: ThumbsUp, color: "bg-green-500" },
  { key: "converted", icon: UserCheck, color: "bg-emerald-500" },
  { key: "closed", icon: XCircle, color: "bg-gray-500" },
];

export function OutreachCRMTab() {
  const { t } = useTranslation();
  const { leads, isLoading } = useOutreachCRMLeads();

  const getLeadsByStatus = (status: string) => {
    return leads?.filter(l => l.status === status) || [];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("outreach.crm.title")}</CardTitle>
              <CardDescription>{t("outreach.crm.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statusColumns.map(({ key, color }) => (
          <Card key={key} className="min-h-[400px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${color}`} />
                  <CardTitle className="text-sm font-medium">
                    {t(`outreach.crm.columns.${key}`)}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getLeadsByStatus(key).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : getLeadsByStatus(key).length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  {t("outreach.leads.noLeads")}
                </div>
              ) : (
                getLeadsByStatus(key).map((lead) => (
                  <Card key={lead.id} className="cursor-pointer p-3 hover:bg-muted/50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{lead.company_name}</p>
                      {lead.contact_name && (
                        <p className="text-xs text-muted-foreground">{lead.contact_name}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {t(`outreach.leads.pipeline.${lead.pipeline_type}`)}
                        </Badge>
                        {lead.ai_score && (
                          <span className="text-xs text-muted-foreground">
                            ★ {Number(lead.ai_score).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
