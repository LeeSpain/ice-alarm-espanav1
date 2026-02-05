import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderOpen, MoreHorizontal, Copy, CheckCircle, Archive, ExternalLink, Video, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVideoProjects, VideoProject } from "@/hooks/useVideoProjects";
import { useVideoTemplates } from "@/hooks/useVideoTemplates";
import { useVideoRenders } from "@/hooks/useVideoRenders";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatusBadge, LanguageBadge, FormatBadge, RenderProgressBadge } from "./VideoBadges";

interface VideoProjectsTabProps {
  searchQuery: string;
  onCreateNew: () => void;
  onEditProject: (project: VideoProject) => void;
}

export function VideoProjectsTab({ searchQuery, onCreateNew, onEditProject }: VideoProjectsTabProps) {
  const { t } = useTranslation();
  const { projects, isLoading, duplicateProject, updateProjectStatus, deleteProject, isDeleting } = useVideoProjects();
  const { templates } = useVideoTemplates();
  const { latestRenderByProject } = useVideoRenders();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Memoized template lookup map
  const templateMap = useMemo(() => {
    if (!templates) return new Map<string, string>();
    return new Map(templates.map(t => [t.id, t.name]));
  }, [templates]);

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return "-";
    return templateMap.get(templateId) || "-";
  };

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      // Search filter
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }
      // Format filter
      if (formatFilter !== "all" && project.format !== formatFilter) {
        return false;
      }
      // Language filter
      if (languageFilter !== "all" && project.language !== languageFilter) {
        return false;
      }
      return true;
    });
  }, [projects, searchQuery, statusFilter, formatFilter, languageFilter]);

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete);
      toast.success(t("videoHub.projects.deleted"));
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
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

  if (!projects?.length) {
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
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {t("videoHub.tabs.projects")}
              </CardTitle>
              <CardDescription>
                {filteredProjects.length} {t("videoHub.projects.name").toLowerCase()}
              </CardDescription>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("videoHub.projects.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="draft">{t("videoHub.statuses.draft")}</SelectItem>
                  <SelectItem value="approved">{t("videoHub.statuses.approved")}</SelectItem>
                  <SelectItem value="archived">{t("videoHub.statuses.archived")}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("videoHub.projects.format")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="9:16">{t("videoHub.formats.portrait")}</SelectItem>
                  <SelectItem value="16:9">{t("videoHub.formats.landscape")}</SelectItem>
                  <SelectItem value="1:1">{t("videoHub.formats.square")}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t("videoHub.projects.language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                <TableHead>{t("videoHub.projects.render")}</TableHead>
                <TableHead>{t("videoHub.projects.lastEdited")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{getTemplateName(project.template_id)}</TableCell>
                  <TableCell><LanguageBadge language={project.language} /></TableCell>
                  <TableCell><FormatBadge format={project.format} /></TableCell>
                  <TableCell>{project.duration}s</TableCell>
                  <TableCell><StatusBadge status={project.status} /></TableCell>
                  <TableCell>
                    <RenderProgressBadge render={latestRenderByProject.get(project.id)} />
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => onEditProject(project)}>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(project.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("videoHub.projects.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("videoHub.projects.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("videoHub.projects.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("videoHub.projects.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
