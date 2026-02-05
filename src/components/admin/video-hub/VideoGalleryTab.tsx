import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Grid3X3, Play, Download, Share2, Check, Video, Copy, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVideoExports } from "@/hooks/useVideoExports";
import { useVideoProjects } from "@/hooks/useVideoProjects";
import { useVideoRenders } from "@/hooks/useVideoRenders";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LanguageBadge, FormatBadge } from "./VideoBadges";

interface VideoGalleryTabProps {
  searchQuery: string;
}

type FilterStatus = "all" | "published" | "ready" | "pending";

export function VideoGalleryTab({ searchQuery }: VideoGalleryTabProps) {
  const { t } = useTranslation();
  const { exports, isLoading } = useVideoExports();
  const { projects } = useVideoProjects();
  const { latestRenderByProject } = useVideoRenders();
  
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [previewExport, setPreviewExport] = useState<string | null>(null);

  // Memoized project lookup map
  const projectMap = useMemo(() => {
    if (!projects) return new Map();
    return new Map(projects.map(p => [p.id, p]));
  }, [projects]);

  // Combine exports with project and render data
  const galleryItems = useMemo(() => {
    if (!exports) return [];

    return exports
      .map(exp => {
        const project = projectMap.get(exp.project_id);
        const render = latestRenderByProject.get(exp.project_id);
        
        let status: "published" | "ready" | "pending" = "ready";
        if (exp.published_at) {
          status = "published";
        } else if (render?.status !== "done") {
          status = "pending";
        }

        return {
          ...exp,
          project,
          render,
          status,
        };
      })
      .filter(item => {
        // Search filter
        if (searchQuery && item.project) {
          if (!item.project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
        }
        // Status filter
        if (filter !== "all" && item.status !== filter) {
          return false;
        }
        return true;
      });
  }, [exports, projectMap, latestRenderByProject, searchQuery, filter]);

  const handleCopyLink = useCallback(async (mp4Url: string | null) => {
    if (!mp4Url) {
      toast.error(t("videoHub.exports.notAvailable"));
      return;
    }
    await navigator.clipboard.writeText(mp4Url);
    toast.success(t("videoHub.gallery.linkCopied"));
  }, [t]);

  const handleDownload = useCallback((url: string | null) => {
    if (!url) {
      toast.error(t("videoHub.exports.notAvailable"));
      return;
    }
    window.open(url, "_blank");
  }, [t]);

  const handlePublish = useCallback(async (exportId: string, currentlyPublished: boolean) => {
    const { error } = await supabase
      .from("video_exports")
      .update({ published_at: currentlyPublished ? null : new Date().toISOString() })
      .eq("id", exportId);

    if (error) {
      toast.error(t("common.error"));
      return;
    }

    toast.success(currentlyPublished 
      ? t("videoHub.gallery.unpublished") 
      : t("videoHub.gallery.published")
    );
  }, [t]);

  const selectedPreview = useMemo(() => {
    if (!previewExport) return null;
    return galleryItems.find(item => item.id === previewExport);
  }, [previewExport, galleryItems]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
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
            <Grid3X3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">{t("videoHub.gallery.noVideos")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("videoHub.gallery.noVideosDesc")}</p>
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
                <Grid3X3 className="h-5 w-5" />
                {t("videoHub.gallery.title")}
              </CardTitle>
              <CardDescription>{t("videoHub.gallery.subtitle")}</CardDescription>
            </div>
            
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("videoHub.gallery.filter.all")}</SelectItem>
                <SelectItem value="published">{t("videoHub.gallery.filter.published")}</SelectItem>
                <SelectItem value="ready">{t("videoHub.gallery.filter.ready")}</SelectItem>
                <SelectItem value="pending">{t("videoHub.gallery.filter.pending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg"
              >
                {/* Thumbnail */}
                <div className="relative bg-muted">
                  <AspectRatio ratio={16 / 9}>
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.project?.name || "Video"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </AspectRatio>
                  
                  {/* Play overlay */}
                  {item.mp4_url && (
                    <button
                      onClick={() => setPreviewExport(item.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                        <Play className="h-6 w-6 text-foreground" fill="currentColor" />
                      </div>
                    </button>
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute right-2 top-2">
                    {item.status === "published" && (
                      <Badge className="bg-status-active text-white">
                        <Check className="mr-1 h-3 w-3" />
                        {t("videoHub.gallery.filter.published")}
                      </Badge>
                    )}
                    {item.status === "ready" && (
                      <Badge variant="secondary">
                        {t("videoHub.gallery.filter.ready")}
                      </Badge>
                    )}
                    {item.status === "pending" && (
                      <Badge variant="outline" className="bg-background/80">
                        {t("videoHub.gallery.filter.pending")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="truncate font-medium">{item.project?.name || "-"}</h4>
                  
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.project && <FormatBadge format={item.project.format} />}
                    {item.project && <LanguageBadge language={item.project.language} />}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>

                  {/* Actions */}
                  <div className="mt-3 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewExport(item.id)}
                      disabled={!item.mp4_url}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      {t("videoHub.gallery.preview")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(item.mp4_url)}
                      disabled={!item.mp4_url}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(item.mp4_url)}
                      disabled={!item.mp4_url}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePublish(item.id, item.status === "published")}
                    >
                      {item.status === "published" ? (
                        <Check className="h-4 w-4 text-status-active" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewExport} onOpenChange={() => setPreviewExport(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedPreview?.project?.name || t("videoHub.gallery.preview")}</DialogTitle>
            <DialogDescription>
              {selectedPreview?.project && (
                <div className="flex gap-2 mt-2">
                  <FormatBadge format={selectedPreview.project.format} />
                  <LanguageBadge language={selectedPreview.project.language} />
                  {selectedPreview.status === "published" && (
                    <Badge className="bg-status-active text-white">
                      <Check className="mr-1 h-3 w-3" />
                      {t("videoHub.gallery.filter.published")}
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPreview?.mp4_url ? (
            <div className="mt-4">
              <video
                controls
                autoPlay
                className="w-full rounded-lg"
                src={selectedPreview.mp4_url}
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("videoHub.exports.notAvailable")}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopyLink(selectedPreview?.mp4_url || null)}
              disabled={!selectedPreview?.mp4_url}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("videoHub.gallery.copyLink")}
            </Button>
            <Button
              onClick={() => handleDownload(selectedPreview?.mp4_url || null)}
              disabled={!selectedPreview?.mp4_url}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("videoHub.exports.downloadMp4")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
