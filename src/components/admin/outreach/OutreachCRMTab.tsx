import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutreachCRMLeads } from "@/hooks/useOutreachCRMLeads";
import { OutreachLeadDetailDialog } from "./OutreachLeadDetailDialog";

const PIPELINE_STAGES = [
  { id: "discovered", label: "Discovered", color: "bg-slate-500" },
  { id: "enriched", label: "Enriched", color: "bg-blue-500" },
  { id: "rated", label: "Rated", color: "bg-indigo-500" },
  { id: "drafted", label: "Drafted", color: "bg-purple-500" },
  { id: "approved", label: "Approved", color: "bg-pink-500" },
  { id: "sent", label: "Sent", color: "bg-yellow-500" },
  { id: "replied", label: "Replied", color: "bg-orange-500" },
  { id: "interested", label: "Interested", color: "bg-green-500" },
  { id: "meeting_booked", label: "Meeting Booked", color: "bg-emerald-500" },
  { id: "converted", label: "Converted", color: "bg-teal-500" },
  { id: "not_interested", label: "Not Interested", color: "bg-red-500" },
  { id: "dnc_bounced", label: "DNC/Bounced", color: "bg-gray-500" },
];

export function OutreachCRMTab() {
  const { t } = useTranslation();
  const { leads, isLoading } = useOutreachCRMLeads();
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

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

      {/* 12-Stage Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-min">
          {PIPELINE_STAGES.map(({ id, label, color }) => (
            <div key={id} className="flex-shrink-0 w-72">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${color}`} />
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getLeadsByStatus(id).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : getLeadsByStatus(id).length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-xs text-muted-foreground text-center">
                      {t("outreach.leads.noLeads")}
                    </div>
                  ) : (
                    getLeadsByStatus(id).map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer p-3 hover:bg-muted/50 hover:shadow-md transition-all"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm truncate">{lead.company_name}</p>
                          {lead.contact_name && (
                            <p className="text-xs text-muted-foreground truncate">{lead.contact_name}</p>
                          )}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            {lead.ai_score && (
                              <Badge variant="outline" className="text-xs">
                                ★ {Number(lead.ai_score).toFixed(0)}
                              </Badge>
                            )}
                            {lead.do_not_contact && (
                              <Badge variant="destructive" className="text-xs">
                                DNC
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Detail Dialog */}
      <OutreachLeadDetailDialog lead={selectedLead} open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)} />
    </div>
  );
}
