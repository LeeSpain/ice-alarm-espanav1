import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Megaphone, Plus, MoreHorizontal, Pencil, Trash2, Pause, Play, Users, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutreachCampaigns } from "@/hooks/useOutreachCampaigns";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { format } from "date-fns";

export function OutreachCampaignsTab() {
  const { t } = useTranslation();
  const { campaigns, isLoading, updateCampaign, deleteCampaign } = useOutreachCampaigns();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      paused: "secondary",
      draft: "outline",
      completed: "default",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {t(`outreach.campaigns.status.${status}`)}
      </Badge>
    );
  };

  const getPipelineBadge = (type: string) => {
    return (
      <Badge variant={type === "sales" ? "default" : "secondary"}>
        {t(`outreach.leads.pipeline.${type}`)}
      </Badge>
    );
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await updateCampaign({ id, status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("outreach.campaigns.deleteConfirm"))) {
      await deleteCampaign(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t("outreach.campaigns.title")}</CardTitle>
                <CardDescription>{t("outreach.campaigns.subtitle")}</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("outreach.campaigns.newCampaign")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t("outreach.campaigns.noCampaigns")}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("outreach.campaigns.subtitle")}
              </p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("outreach.campaigns.newCampaign")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("outreach.campaigns.fields.name")}</TableHead>
                  <TableHead>{t("outreach.campaigns.fields.pipelineType")}</TableHead>
                  <TableHead>{t("outreach.campaigns.fields.status")}</TableHead>
                  <TableHead className="text-center">
                    <Users className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Mail className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <MessageSquare className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <CheckCircle className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead>{t("common.created")}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPipelineBadge(campaign.pipeline_type)}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-center">{campaign.leads_count}</TableCell>
                    <TableCell className="text-center">{campaign.emails_sent}</TableCell>
                    <TableCell className="text-center">{campaign.replies_count}</TableCell>
                    <TableCell className="text-center">{campaign.conversions_count}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(campaign.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(campaign.id, campaign.status)}>
                            {campaign.status === "active" ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                {t("outreach.campaigns.pause")}
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                {t("outreach.campaigns.activate")}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateCampaignModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </>
  );
}
