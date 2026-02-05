import { useTranslation } from "react-i18next";
import { FolderOpen, MoreHorizontal, Copy, CheckCircle, Archive, ExternalLink, Video } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVideoProjects } from "@/hooks/useVideoProjects";
import { useVideoTemplates } from "@/hooks/useVideoTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface VideoProjectsTabProps {
  searchQuery: string;
  onCreateNew: () => void;
}

export function VideoProjectsTab({ searchQuery, onCreateNew }: VideoProjectsTabProps) {
  const { t } = useTranslation();
  const { projects, isLoading, duplicateProject, updateProjectStatus } = useVideoProjects();
  const { templates } = useVideoTemplates();

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return "-";
    const template = templates?.find(t => t.id === templateId);
    return template?.name || "-";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">{t("videoHub.statuses.draft")}</Badge>;
      case "approved":
        return <Badge className="bg-status-active text-white">{t("videoHub.statuses.approved")}</Badge>;
      case "archived":
        return <Badge variant="outline">{t("videoHub.statuses.archived")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLanguageBadge = (language: string) => {
    switch (language) {
      case "en":
        return <Badge variant="outline">EN</Badge>;
      case "es":
        return <Badge variant="outline">ES</Badge>;
      case "both":
        return (
          <div className="flex gap-1">
            <Badge variant="outline">EN</Badge>
            <Badge variant="outline">ES</Badge>
          </div>
        );
      default:
        return <Badge variant="outline">{language}</Badge>;
    }
  };

  const getFormatBadge = (format: string) => {
    const formatLabels: Record<string, string> = {
      "9:16": "Portrait",
      "16:9": "Landscape",
      "1:1": "Square"
    };
    return <Badge variant="secondary">{formatLabels[format] || format}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredProjects.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">{t("videoHub.projects.noProjects")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("videoHub.projects.createFirst")}</p>
          <Button className="mt-6" onClick={onCreateNew}>
            {t("videoHub.newVideo")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          {t("videoHub.tabs.projects")}
        </CardTitle>
        <CardDescription>
          {filteredProjects.length} {t("videoHub.projects.name").toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("videoHub.projects.name")}</TableHead>
              <TableHead>{t("videoHub.projects.template")}</TableHead>
              <TableHead>{t("videoHub.projects.language")}</TableHead>
              <TableHead>{t("videoHub.projects.format")}</TableHead>
              <TableHead>{t("videoHub.projects.duration")}</TableHead>
              <TableHead>{t("videoHub.projects.status")}</TableHead>
              <TableHead>{t("videoHub.projects.lastEdited")}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{getTemplateName(project.template_id)}</TableCell>
                <TableCell>{getLanguageBadge(project.language)}</TableCell>
                <TableCell>{getFormatBadge(project.format)}</TableCell>
                <TableCell>{project.duration}s</TableCell>
                <TableCell>{getStatusBadge(project.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(project.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {t("videoHub.projects.open")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateProject(project.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("videoHub.projects.duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {project.status === "draft" && (
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, "approved")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t("videoHub.projects.approve")}
                        </DropdownMenuItem>
                      )}
                      {project.status !== "archived" && (
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, "archived")}>
                          <Archive className="mr-2 h-4 w-4" />
                          {t("videoHub.projects.archive")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
