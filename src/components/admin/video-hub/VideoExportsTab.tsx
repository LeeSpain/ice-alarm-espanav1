import { useTranslation } from "react-i18next";
import { Download, FileVideo, FileText, Send, Video } from "lucide-react";
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
import { useVideoExports } from "@/hooks/useVideoExports";
import { useVideoProjects } from "@/hooks/useVideoProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

interface VideoExportsTabProps {
  searchQuery: string;
}

export function VideoExportsTab({ searchQuery }: VideoExportsTabProps) {
  const { t } = useTranslation();
  const { exports, isLoading, sendToOutreach } = useVideoExports();
  const { projects } = useVideoProjects();

  const getProjectDetails = (projectId: string) => {
    return projects?.find(p => p.id === projectId);
  };

  const handleDownload = (url: string | null, _type: string) => {
    if (!url) {
      toast.error(t("videoHub.exports.notAvailable"));
      return;
    }
    window.open(url, "_blank");
  };

  const handleSendToOutreach = async (exportId: string) => {
    await sendToOutreach(exportId);
    toast.success(t("videoHub.exports.sentToOutreach"));
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
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exports?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Download className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">{t("videoHub.exports.noExports")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("videoHub.exports.noExportsDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  const filteredExports = exports.filter(exp => {
    const project = getProjectDetails(exp.project_id);
    return project?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t("videoHub.tabs.exports")}
        </CardTitle>
        <CardDescription>
          {filteredExports.length} {t("videoHub.exports.available")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t("videoHub.exports.thumbnail")}</TableHead>
              <TableHead>{t("videoHub.projects.name")}</TableHead>
              <TableHead>{t("videoHub.exports.dateCreated")}</TableHead>
              <TableHead>{t("videoHub.projects.format")}</TableHead>
              <TableHead>{t("videoHub.projects.language")}</TableHead>
              <TableHead className="text-right">{t("videoHub.projects.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExports.map((exp) => {
              const project = getProjectDetails(exp.project_id);
              return (
                <TableRow key={exp.id}>
                  <TableCell>
                    {exp.thumbnail_url ? (
                      <img
                        src={exp.thumbnail_url}
                        alt="Thumbnail"
                        className="h-12 w-20 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-20 items-center justify-center rounded bg-muted">
                        <Video className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{project?.name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(exp.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project?.format || "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {project?.language || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(exp.mp4_url, "MP4")}
                        disabled={!exp.mp4_url}
                      >
                        <FileVideo className="mr-1 h-4 w-4" />
                        {t("videoHub.exports.downloadMp4")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(exp.srt_url, "SRT")}
                        disabled={!exp.srt_url}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        SRT
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(exp.vtt_url, "VTT")}
                        disabled={!exp.vtt_url}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        VTT
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendToOutreach(exp.id)}
                      >
                        <Send className="mr-1 h-4 w-4" />
                        {t("videoHub.exports.sendToOutreach")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
