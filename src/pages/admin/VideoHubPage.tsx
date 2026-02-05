import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Video, Plus, Search, HelpCircle, FolderOpen, Wand2, Layout, Download, Settings, Grid3X3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoProjectsTab } from "@/components/admin/video-hub/VideoProjectsTab";
import { VideoCreateTab } from "@/components/admin/video-hub/VideoCreateTab";
import { VideoTemplatesTab } from "@/components/admin/video-hub/VideoTemplatesTab";
import { VideoGalleryTab } from "@/components/admin/video-hub/VideoGalleryTab";
import { VideoExportsTab } from "@/components/admin/video-hub/VideoExportsTab";
import { VideoSettingsTab } from "@/components/admin/video-hub/VideoSettingsTab";
import { VideoHelpDialog } from "@/components/admin/video-hub/VideoHelpDialog";
import type { VideoProject } from "@/hooks/useVideoProjects";

export default function VideoHubPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<VideoProject | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleNewVideo = useCallback(() => {
    setEditingProject(null);
    setSelectedTemplateId(null);
    setActiveTab("create");
  }, []);

  const handleEditProject = useCallback((project: VideoProject) => {
    setEditingProject(project);
    setSelectedTemplateId(null);
    setActiveTab("create");
  }, []);

  const handleSelectTemplate = useCallback((templateId: string) => {
    setEditingProject(null);
    setSelectedTemplateId(templateId);
    setActiveTab("create");
  }, []);

  const handleCreateComplete = useCallback(() => {
    setEditingProject(null);
    setSelectedTemplateId(null);
    setActiveTab("projects");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("videoHub.title")}</h1>
            <p className="text-muted-foreground">{t("videoHub.subtitle")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("videoHub.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setHelpOpen(true)}>
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button onClick={handleNewVideo}>
            <Plus className="mr-2 h-4 w-4" />
            {t("videoHub.newVideo")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {t("videoHub.tabs.projects")}
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Wand2 className="h-4 w-4" />
            {t("videoHub.tabs.create")}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layout className="h-4 w-4" />
            {t("videoHub.tabs.templates")}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            {t("videoHub.tabs.gallery")}
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2">
            <Download className="h-4 w-4" />
            {t("videoHub.tabs.exports")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            {t("videoHub.tabs.settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <VideoProjectsTab 
            searchQuery={searchQuery} 
            onCreateNew={handleNewVideo}
            onEditProject={handleEditProject}
          />
        </TabsContent>

        <TabsContent value="create">
          <VideoCreateTab 
            onComplete={handleCreateComplete}
            editingProject={editingProject}
            initialTemplateId={selectedTemplateId}
          />
        </TabsContent>

        <TabsContent value="templates">
          <VideoTemplatesTab onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        <TabsContent value="gallery">
          <VideoGalleryTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="exports">
          <VideoExportsTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="settings">
          <VideoSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Help Dialog */}
      <VideoHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
