import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  ChevronLeft, ChevronRight, Wand2, Save, Loader2, Plus, Trash2, 
  Layout, Sparkles, Zap, FileVideo, Image, Palette
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVideoTemplates } from "@/hooks/useVideoTemplates";
import { useVideoProjects, VideoProject } from "@/hooks/useVideoProjects";
import { useVideoBrandSettings } from "@/hooks/useVideoBrandSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoCreateTabProps {
  onComplete: () => void;
  editingProject?: VideoProject | null;
  initialTemplateId?: string | null;
}

interface ProjectDataJson {
  headline?: string;
  bullets?: string[];
  ctaText?: string;
  contactLine?: string;
  includeDisclaimer?: boolean;
  backgroundUrl?: string;
  productIcons?: string[];
  script?: string;
  voiceStyle?: string;
  musicStyle?: string;
  transitionStyle?: string;
  overlayStyle?: string;
  textPosition?: string;
  colorScheme?: string;
}

type CreationMode = "template" | "scratch" | "ai" | "quick";

// Different step flows per mode
const STEPS_BY_MODE: Record<CreationMode, string[]> = {
  template: ["template", "format", "content", "assets", "preview"],
  scratch: ["basics", "style", "content", "media", "effects", "preview"],
  ai: ["prompt", "review", "refine", "preview"],
  quick: ["quick-setup", "preview"],
};

export function VideoCreateTab({ onComplete, editingProject, initialTemplateId }: VideoCreateTabProps) {
  const { t } = useTranslation();
  const { templates, isLoading: templatesLoading } = useVideoTemplates();
  const { createProject, updateProject, isCreating, isUpdating } = useVideoProjects();
  const { settings } = useVideoBrandSettings();

  const isEditMode = !!editingProject;

  // Mode selection (only shown if not editing)
  const [creationMode, setCreationMode] = useState<CreationMode | null>(
    initialTemplateId ? "template" : null
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  // Extended project data with more options
  const [projectData, setProjectData] = useState({
    name: "",
    template_id: "",
    format: "16:9",
    duration: 15,
    language: "en",
    headline: "",
    bullets: ["", "", ""],
    ctaText: "",
    contactLine: "",
    includeDisclaimer: true,
    backgroundUrl: "",
    productIcons: [] as string[],
    // New fields for custom creation
    script: "",
    voiceStyle: "professional",
    musicStyle: "upbeat",
    transitionStyle: "fade",
    overlayStyle: "minimal",
    textPosition: "center",
    colorScheme: "brand",
    aiPrompt: "",
  });

  // Initialize form when editing
  useEffect(() => {
    if (editingProject) {
      const dataJson = editingProject.data_json as ProjectDataJson;
      setProjectData({
        name: editingProject.name,
        template_id: editingProject.template_id || "",
        format: editingProject.format,
        duration: editingProject.duration,
        language: editingProject.language,
        headline: dataJson?.headline || "",
        bullets: dataJson?.bullets?.length ? dataJson.bullets : ["", "", ""],
        ctaText: dataJson?.ctaText || "",
        contactLine: dataJson?.contactLine || "",
        includeDisclaimer: dataJson?.includeDisclaimer ?? true,
        backgroundUrl: dataJson?.backgroundUrl || "",
        productIcons: dataJson?.productIcons || [],
        script: dataJson?.script || "",
        voiceStyle: dataJson?.voiceStyle || "professional",
        musicStyle: dataJson?.musicStyle || "upbeat",
        transitionStyle: dataJson?.transitionStyle || "fade",
        overlayStyle: dataJson?.overlayStyle || "minimal",
        textPosition: dataJson?.textPosition || "center",
        colorScheme: dataJson?.colorScheme || "brand",
        aiPrompt: "",
      });
      // Determine mode from existing project
      setCreationMode(editingProject.template_id ? "template" : "scratch");
      setCurrentStep(0);
    } else if (initialTemplateId) {
      setProjectData(prev => ({ ...prev, template_id: initialTemplateId }));
      setCreationMode("template");
    }
  }, [editingProject, initialTemplateId]);

  const currentSteps = creationMode ? STEPS_BY_MODE[creationMode] : [];

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (!isEditMode) {
      // Go back to mode selection
      setCreationMode(null);
    }
  };

  const prepareProjectPayload = useCallback(() => {
    return {
      name: projectData.name,
      template_id: creationMode === "template" ? projectData.template_id || null : null,
      format: projectData.format,
      duration: projectData.duration,
      language: projectData.language,
      data_json: {
        headline: projectData.headline,
        bullets: projectData.bullets.filter(b => b.trim()),
        ctaText: projectData.ctaText,
        contactLine: projectData.contactLine,
        includeDisclaimer: projectData.includeDisclaimer,
        backgroundUrl: projectData.backgroundUrl,
        productIcons: projectData.productIcons,
        script: projectData.script,
        voiceStyle: projectData.voiceStyle,
        musicStyle: projectData.musicStyle,
        transitionStyle: projectData.transitionStyle,
        overlayStyle: projectData.overlayStyle,
        textPosition: projectData.textPosition,
        colorScheme: projectData.colorScheme,
      },
    };
  }, [projectData, creationMode]);

  const handleSaveDraft = async () => {
    if (!projectData.name) {
      toast.error(t("videoHub.create.nameRequired"));
      return;
    }

    try {
      const payload = prepareProjectPayload();

      if (isEditMode && editingProject) {
        await updateProject({
          id: editingProject.id,
          ...payload,
          status: editingProject.status,
        });
        toast.success(t("videoHub.create.projectUpdated"));
      } else {
        await createProject({
          ...payload,
          status: "draft",
        });
        toast.success(t("videoHub.create.draftSaved"));
      }
      onComplete();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(t("common.error"));
    }
  };

  const handleRender = async () => {
    if (!projectData.name) {
      toast.error(t("videoHub.create.nameRequired"));
      return;
    }

    setIsRendering(true);

    try {
      const payload = prepareProjectPayload();
      let projectId: string;

      if (isEditMode && editingProject) {
        // Set status to "rendering" optimistically
        await updateProject({
          id: editingProject.id,
          ...payload,
          status: "rendering",
        });
        projectId = editingProject.id;
      } else {
        // Create with "rendering" status
        const newProject = await createProject({
          ...payload,
          status: "rendering",
        });
        projectId = newProject.id;
      }

      const { data, error } = await supabase.functions.invoke("video-render-queue", {
        body: { project_id: projectId },
      });

      if (error) {
        console.error("Render queue error:", error);
        throw new Error(error.message || t("videoHub.create.renderFailed"));
      }

      console.log("Render queued:", data);
      toast.success(t("videoHub.create.renderQueued"));
      onComplete();
    } catch (error) {
      console.error("Render error:", error);
      toast.error(t("common.error"));
    } finally {
      setIsRendering(false);
    }
  };

  const addBullet = () => {
    if (projectData.bullets.length < 6) {
      setProjectData({ ...projectData, bullets: [...projectData.bullets, ""] });
    }
  };

  const removeBullet = (index: number) => {
    if (projectData.bullets.length > 1) {
      const newBullets = projectData.bullets.filter((_, i) => i !== index);
      setProjectData({ ...projectData, bullets: newBullets });
    }
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...projectData.bullets];
    newBullets[index] = value;
    setProjectData({ ...projectData, bullets: newBullets });
  };

  const isSaving = isCreating || isUpdating;
  const isProcessing = isSaving || isRendering;

  // MODE SELECTION SCREEN
  if (!creationMode && !isEditMode) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">{t("videoHub.create.chooseMode")}</h2>
          <p className="text-muted-foreground mt-2">{t("videoHub.create.chooseModeDesc")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Template Mode */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg group"
            onClick={() => setCreationMode("template")}
          >
            <CardHeader>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                <Layout className="h-7 w-7" />
              </div>
              <CardTitle>{t("videoHub.create.modes.template.title")}</CardTitle>
              <CardDescription>{t("videoHub.create.modes.template.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("videoHub.create.modes.template.badge1")}</Badge>
                <Badge variant="secondary">{t("videoHub.create.modes.template.badge2")}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Scratch Mode */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg group"
            onClick={() => setCreationMode("scratch")}
          >
            <CardHeader>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground mb-2 group-hover:scale-110 transition-transform">
                <Palette className="h-7 w-7" />
              </div>
              <CardTitle>{t("videoHub.create.modes.scratch.title")}</CardTitle>
              <CardDescription>{t("videoHub.create.modes.scratch.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("videoHub.create.modes.scratch.badge1")}</Badge>
                <Badge variant="secondary">{t("videoHub.create.modes.scratch.badge2")}</Badge>
                <Badge variant="secondary">{t("videoHub.create.modes.scratch.badge3")}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Mode */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg group"
            onClick={() => setCreationMode("ai")}
          >
            <CardHeader>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7" />
              </div>
              <CardTitle>{t("videoHub.create.modes.ai.title")}</CardTitle>
              <CardDescription>{t("videoHub.create.modes.ai.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("videoHub.create.modes.ai.badge1")}</Badge>
                <Badge variant="secondary">{t("videoHub.create.modes.ai.badge2")}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Mode */}
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:shadow-lg group"
            onClick={() => setCreationMode("quick")}
          >
            <CardHeader>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-2 group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7" />
              </div>
              <CardTitle>{t("videoHub.create.modes.quick.title")}</CardTitle>
              <CardDescription>{t("videoHub.create.modes.quick.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("videoHub.create.modes.quick.badge1")}</Badge>
                <Badge variant="secondary">{t("videoHub.create.modes.quick.badge2")}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // STEP CONTENT BY MODE
  const renderStepContent = () => {
    const stepName = currentSteps[currentStep];

    // TEMPLATE MODE STEPS
    if (creationMode === "template") {
      switch (stepName) {
        case "template":
          return <TemplateSelectionStep 
            templates={templates} 
            templatesLoading={templatesLoading}
            projectData={projectData}
            setProjectData={setProjectData}
            t={t}
          />;
        case "format":
          return <FormatDurationStep projectData={projectData} setProjectData={setProjectData} t={t} />;
        case "content":
          return <ContentStep 
            projectData={projectData} 
            setProjectData={setProjectData} 
            settings={settings}
            addBullet={addBullet}
            removeBullet={removeBullet}
            updateBullet={updateBullet}
            t={t}
          />;
        case "assets":
          return <AssetsStep projectData={projectData} setProjectData={setProjectData} settings={settings} t={t} />;
        case "preview":
          return <PreviewStep projectData={projectData} settings={settings} t={t} />;
      }
    }

    // SCRATCH MODE STEPS
    if (creationMode === "scratch") {
      switch (stepName) {
        case "basics":
          return <ScratchBasicsStep projectData={projectData} setProjectData={setProjectData} t={t} />;
        case "style":
          return <ScratchStyleStep projectData={projectData} setProjectData={setProjectData} t={t} />;
        case "content":
          return <ScratchContentStep 
            projectData={projectData} 
            setProjectData={setProjectData}
            addBullet={addBullet}
            removeBullet={removeBullet}
            updateBullet={updateBullet}
            t={t}
          />;
        case "media":
          return <ScratchMediaStep projectData={projectData} setProjectData={setProjectData} settings={settings} t={t} />;
        case "effects":
          return <ScratchEffectsStep projectData={projectData} setProjectData={setProjectData} t={t} />;
        case "preview":
          return <PreviewStep projectData={projectData} settings={settings} t={t} />;
      }
    }

    // AI MODE STEPS
    if (creationMode === "ai") {
      switch (stepName) {
        case "prompt":
          return <AIPromptStep projectData={projectData} setProjectData={setProjectData} t={t} />;
        case "review":
          return <AIReviewStep projectData={projectData} setProjectData={setProjectData} t={t} />;
        case "refine":
          return <AIRefineStep 
            projectData={projectData} 
            setProjectData={setProjectData}
            addBullet={addBullet}
            removeBullet={removeBullet}
            updateBullet={updateBullet}
            t={t}
          />;
        case "preview":
          return <PreviewStep projectData={projectData} settings={settings} t={t} />;
      }
    }

    // QUICK MODE STEPS
    if (creationMode === "quick") {
      switch (stepName) {
        case "quick-setup":
          return <QuickSetupStep 
            projectData={projectData} 
            setProjectData={setProjectData} 
            settings={settings}
            t={t}
          />;
        case "preview":
          return <PreviewStep projectData={projectData} settings={settings} t={t} />;
      }
    }

    return null;
  };

  const getModeIcon = () => {
    switch (creationMode) {
      case "template": return <Layout className="h-5 w-5" />;
      case "scratch": return <Palette className="h-5 w-5" />;
      case "ai": return <Sparkles className="h-5 w-5" />;
      case "quick": return <Zap className="h-5 w-5" />;
      default: return <Wand2 className="h-5 w-5" />;
    }
  };

  const getModeTitle = () => {
    if (isEditMode) return t("videoHub.create.editProject");
    switch (creationMode) {
      case "template": return t("videoHub.create.modes.template.title");
      case "scratch": return t("videoHub.create.modes.scratch.title");
      case "ai": return t("videoHub.create.modes.ai.title");
      case "quick": return t("videoHub.create.modes.quick.title");
      default: return t("videoHub.tabs.create");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {getModeIcon()}
            {getModeTitle()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("videoHub.create.step")} {currentStep + 1} {t("videoHub.create.of")} {currentSteps.length}
          </p>
        </div>
        {!isEditMode && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setCreationMode(null); setCurrentStep(0); }}
          >
            {t("videoHub.create.changeMode")}
          </Button>
        )}
      </div>

      {/* Step Progress */}
      <div className="flex gap-2">
        {currentSteps.map((step, index) => (
          <div
            key={step}
            className={`h-2 flex-1 rounded-full transition-colors ${
              index <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {currentStep === 0 && !isEditMode ? t("videoHub.create.changeMode") : t("common.back")}
        </Button>

        <div className="flex gap-2">
          {currentStep === currentSteps.length - 1 ? (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={isProcessing}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEditMode ? t("videoHub.create.updateProject") : t("videoHub.create.saveDraft")}
              </Button>
              <Button onClick={handleRender} disabled={isProcessing}>
                {isRendering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {t("videoHub.create.render")}
              </Button>
            </>
          ) : (
            <Button onClick={handleNext}>
              {t("common.next")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== STEP COMPONENTS ==========

// Template Selection Step (Template Mode)
function TemplateSelectionStep({ templates, templatesLoading, projectData, setProjectData, t }: any) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Label>{t("videoHub.create.projectName")}</Label>
        <Input
          value={projectData.name}
          onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
          placeholder={t("videoHub.create.projectNamePlaceholder")}
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templatesLoading ? (
          <p>{t("common.loading")}</p>
        ) : (
          templates?.map((template: any) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                projectData.template_id === template.id ? "border-2 border-primary" : ""
              }`}
              onClick={() => setProjectData({ ...projectData, template_id: template.id })}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.allowed_durations?.map((d: number) => (
                    <Badge key={d} variant="secondary" className="text-xs">
                      {d}s
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Format & Duration Step
function FormatDurationStep({ projectData, setProjectData, t }: any) {
  return (
    <div className="space-y-8">
      <div>
        <Label className="text-base font-medium">{t("videoHub.projects.format")}</Label>
        <RadioGroup
          value={projectData.format}
          onValueChange={(value) => setProjectData({ ...projectData, format: value })}
          className="mt-3 grid gap-4 md:grid-cols-3"
        >
          {["9:16", "16:9", "1:1"].map((format) => (
            <div key={format}>
              <RadioGroupItem value={format} id={`format-${format}`} className="peer sr-only" />
              <Label
                htmlFor={`format-${format}`}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
              >
                <span className="text-lg font-medium">
                  {t(`videoHub.formats.${format === "9:16" ? "portrait" : format === "16:9" ? "landscape" : "square"}`)}
                </span>
                <span className="text-sm text-muted-foreground">{format}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium">{t("videoHub.projects.duration")}</Label>
        <RadioGroup
          value={projectData.duration.toString()}
          onValueChange={(value) => setProjectData({ ...projectData, duration: parseInt(value) })}
          className="mt-3 grid gap-4 md:grid-cols-4"
        >
          {[10, 15, 30, 60].map((duration) => (
            <div key={duration}>
              <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} className="peer sr-only" />
              <Label
                htmlFor={`duration-${duration}`}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
              >
                <span className="text-lg font-medium">{duration}s</span>
                <span className="text-sm text-muted-foreground">{t(`videoHub.durations.${duration}s`)}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

// Content Step (Template Mode)
function ContentStep({ projectData, setProjectData, settings, addBullet, removeBullet, updateBullet, t }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label>{t("videoHub.create.headline")}</Label>
        <Input
          value={projectData.headline}
          onChange={(e) => setProjectData({ ...projectData, headline: e.target.value })}
          placeholder={t("videoHub.create.headlinePlaceholder")}
          className="mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>{t("videoHub.create.bulletPoints")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBullet} disabled={projectData.bullets.length >= 6}>
            <Plus className="mr-1 h-3 w-3" />
            {t("videoHub.create.addBullet")}
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {projectData.bullets.map((bullet: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                placeholder={`${t("videoHub.create.bullet")} ${index + 1}`}
              />
              {projectData.bullets.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBullet(index)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t("videoHub.create.ctaText")}</Label>
          <Input
            value={projectData.ctaText}
            onChange={(e) => setProjectData({ ...projectData, ctaText: e.target.value })}
            placeholder={settings?.default_cta_en || "Call Now"}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{t("videoHub.create.contactLine")}</Label>
          <Input
            value={projectData.contactLine}
            onChange={(e) => setProjectData({ ...projectData, contactLine: e.target.value })}
            placeholder="+34 900 123 456"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={projectData.includeDisclaimer}
          onCheckedChange={(checked) => setProjectData({ ...projectData, includeDisclaimer: checked })}
        />
        <Label>{t("videoHub.create.disclaimer")}</Label>
      </div>

      <div>
        <Label>{t("videoHub.create.selectLanguage")}</Label>
        <RadioGroup
          value={projectData.language}
          onValueChange={(value) => setProjectData({ ...projectData, language: value })}
          className="mt-2 flex gap-4"
        >
          {["en", "es", "both"].map((lang) => (
            <div key={lang} className="flex items-center gap-2">
              <RadioGroupItem value={lang} id={`lang-${lang}`} />
              <Label htmlFor={`lang-${lang}`}>{lang === "both" ? "Both" : lang.toUpperCase()}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

// Assets Step
function AssetsStep({ projectData, setProjectData, settings, t }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("videoHub.settings.logo")}</CardTitle>
          <CardDescription>{t("videoHub.assets.logoLocked")}</CardDescription>
        </CardHeader>
        <CardContent>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="flex h-16 items-center justify-center rounded bg-muted">
              <span className="text-sm text-muted-foreground">{t("videoHub.assets.defaultLogo")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Label>{t("videoHub.assets.backgroundUrl")}</Label>
        <Input
          value={projectData.backgroundUrl}
          onChange={(e) => setProjectData({ ...projectData, backgroundUrl: e.target.value })}
          placeholder="https://..."
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("videoHub.assets.backgroundHint")}</p>
      </div>

      <div>
        <Label className="text-base">{t("videoHub.assets.productIcons")}</Label>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {["SOS Pendant", "Dosell", "Vivago", "Fall Detector"].map((product) => {
            const isSelected = projectData.productIcons.includes(product);
            return (
              <Card
                key={product}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? "border-2 border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (isSelected) {
                    setProjectData({
                      ...projectData,
                      productIcons: projectData.productIcons.filter((p: string) => p !== product),
                    });
                  } else {
                    setProjectData({
                      ...projectData,
                      productIcons: [...projectData.productIcons, product],
                    });
                  }
                }}
              >
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <span className="mt-2 text-sm font-medium">{product}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Preview Step (shared)
function PreviewStep({ projectData, settings, t }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("videoHub.create.previewTitle")}</CardTitle>
          <CardDescription>{t("videoHub.create.previewDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="mx-auto flex items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/50"
            style={{
              aspectRatio: projectData.format === "9:16" ? "9/16" : projectData.format === "1:1" ? "1/1" : "16/9",
              maxHeight: "400px",
            }}
          >
            <div className="text-center p-8">
              <Wand2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{projectData.headline || t("videoHub.create.headlinePlaceholder")}</p>
              {projectData.bullets.filter((b: string) => b).length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {projectData.bullets.filter((b: string) => b).map((bullet: string, i: number) => (
                    <li key={i}>• {bullet}</li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-primary font-medium">
                {projectData.ctaText || settings?.default_cta_en || "Call Now"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">{t("videoHub.create.summary")}</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("videoHub.projects.format")}:</dt>
              <dd>{projectData.format}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("videoHub.projects.duration")}:</dt>
              <dd>{projectData.duration}s</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("videoHub.projects.language")}:</dt>
              <dd>{projectData.language.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("videoHub.create.disclaimer")}:</dt>
              <dd>{projectData.includeDisclaimer ? t("common.yes") : t("common.no")}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-2">{t("videoHub.assets.productIcons")}</h4>
          {projectData.productIcons.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {projectData.productIcons.map((icon: string) => (
                <Badge key={icon} variant="secondary">{icon}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("videoHub.assets.noIcons")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== SCRATCH MODE STEPS ==========

function ScratchBasicsStep({ projectData, setProjectData, t }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label>{t("videoHub.create.projectName")}</Label>
        <Input
          value={projectData.name}
          onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
          placeholder={t("videoHub.create.projectNamePlaceholder")}
          className="mt-1"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label className="text-base font-medium">{t("videoHub.projects.format")}</Label>
          <RadioGroup
            value={projectData.format}
            onValueChange={(value) => setProjectData({ ...projectData, format: value })}
            className="mt-3 space-y-2"
          >
            {[
              { value: "9:16", label: "Portrait (9:16)", desc: "TikTok, Reels, Stories" },
              { value: "16:9", label: "Landscape (16:9)", desc: "YouTube, Website" },
              { value: "1:1", label: "Square (1:1)", desc: "Instagram, Facebook" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3">
                <RadioGroupItem value={opt.value} id={`scratch-format-${opt.value}`} />
                <Label htmlFor={`scratch-format-${opt.value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label className="text-base font-medium">{t("videoHub.projects.duration")}</Label>
          <RadioGroup
            value={projectData.duration.toString()}
            onValueChange={(value) => setProjectData({ ...projectData, duration: parseInt(value) })}
            className="mt-3 space-y-2"
          >
            {[
              { value: "10", label: "10 seconds", desc: "Quick teaser" },
              { value: "15", label: "15 seconds", desc: "Social ads" },
              { value: "30", label: "30 seconds", desc: "Standard ad" },
              { value: "60", label: "60 seconds", desc: "Detailed promo" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3">
                <RadioGroupItem value={opt.value} id={`scratch-duration-${opt.value}`} />
                <Label htmlFor={`scratch-duration-${opt.value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div>
        <Label>{t("videoHub.create.selectLanguage")}</Label>
        <Select
          value={projectData.language}
          onValueChange={(value) => setProjectData({ ...projectData, language: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="both">Both Languages</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ScratchStyleStep({ projectData, setProjectData, t }: any) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label className="text-base font-medium">{t("videoHub.scratch.colorScheme")}</Label>
          <RadioGroup
            value={projectData.colorScheme}
            onValueChange={(value) => setProjectData({ ...projectData, colorScheme: value })}
            className="mt-3 grid grid-cols-2 gap-2"
          >
            {[
              { value: "brand", label: "Brand Colors" },
              { value: "warm", label: "Warm Tones" },
              { value: "cool", label: "Cool Tones" },
              { value: "monochrome", label: "Monochrome" },
            ].map((opt) => (
              <div key={opt.value}>
                <RadioGroupItem value={opt.value} id={`color-${opt.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`color-${opt.value}`}
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label className="text-base font-medium">{t("videoHub.scratch.textPosition")}</Label>
          <RadioGroup
            value={projectData.textPosition}
            onValueChange={(value) => setProjectData({ ...projectData, textPosition: value })}
            className="mt-3 grid grid-cols-2 gap-2"
          >
            {[
              { value: "top", label: "Top" },
              { value: "center", label: "Center" },
              { value: "bottom", label: "Bottom" },
              { value: "split", label: "Split" },
            ].map((opt) => (
              <div key={opt.value}>
                <RadioGroupItem value={opt.value} id={`pos-${opt.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`pos-${opt.value}`}
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">{t("videoHub.scratch.overlayStyle")}</Label>
        <RadioGroup
          value={projectData.overlayStyle}
          onValueChange={(value) => setProjectData({ ...projectData, overlayStyle: value })}
          className="mt-3 grid gap-3 md:grid-cols-4"
        >
          {[
            { value: "minimal", label: "Minimal", desc: "Clean, simple text" },
            { value: "bold", label: "Bold", desc: "Strong typography" },
            { value: "gradient", label: "Gradient", desc: "Colorful overlays" },
            { value: "cinematic", label: "Cinematic", desc: "Film-style bars" },
          ].map((opt) => (
            <div key={opt.value}>
              <RadioGroupItem value={opt.value} id={`overlay-${opt.value}`} className="peer sr-only" />
              <Label
                htmlFor={`overlay-${opt.value}`}
                className="flex flex-col items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer text-center"
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

function ScratchContentStep({ projectData, setProjectData, addBullet, removeBullet, updateBullet, t }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label>{t("videoHub.create.headline")}</Label>
        <Input
          value={projectData.headline}
          onChange={(e) => setProjectData({ ...projectData, headline: e.target.value })}
          placeholder={t("videoHub.create.headlinePlaceholder")}
          className="mt-1"
        />
      </div>

      <div>
        <Label>{t("videoHub.scratch.script")}</Label>
        <Textarea
          value={projectData.script}
          onChange={(e) => setProjectData({ ...projectData, script: e.target.value })}
          placeholder={t("videoHub.scratch.scriptPlaceholder")}
          className="mt-1 min-h-[120px]"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("videoHub.scratch.scriptHint")}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>{t("videoHub.create.bulletPoints")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBullet} disabled={projectData.bullets.length >= 6}>
            <Plus className="mr-1 h-3 w-3" />
            {t("videoHub.create.addBullet")}
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {projectData.bullets.map((bullet: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                placeholder={`${t("videoHub.create.bullet")} ${index + 1}`}
              />
              {projectData.bullets.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBullet(index)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t("videoHub.create.ctaText")}</Label>
          <Input
            value={projectData.ctaText}
            onChange={(e) => setProjectData({ ...projectData, ctaText: e.target.value })}
            placeholder="Call Now"
            className="mt-1"
          />
        </div>
        <div>
          <Label>{t("videoHub.create.contactLine")}</Label>
          <Input
            value={projectData.contactLine}
            onChange={(e) => setProjectData({ ...projectData, contactLine: e.target.value })}
            placeholder="+34 900 123 456"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

function ScratchMediaStep({ projectData, setProjectData, settings, t }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            {t("videoHub.settings.logo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="flex h-16 items-center justify-center rounded bg-muted">
              <span className="text-sm text-muted-foreground">{t("videoHub.assets.defaultLogo")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Label>{t("videoHub.assets.backgroundUrl")}</Label>
        <Input
          value={projectData.backgroundUrl}
          onChange={(e) => setProjectData({ ...projectData, backgroundUrl: e.target.value })}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-base">{t("videoHub.assets.productIcons")}</Label>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {["SOS Pendant", "Dosell", "Vivago", "Fall Detector"].map((product) => {
            const isSelected = projectData.productIcons.includes(product);
            return (
              <Card
                key={product}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? "border-2 border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (isSelected) {
                    setProjectData({
                      ...projectData,
                      productIcons: projectData.productIcons.filter((p: string) => p !== product),
                    });
                  } else {
                    setProjectData({
                      ...projectData,
                      productIcons: [...projectData.productIcons, product],
                    });
                  }
                }}
              >
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <FileVideo className="h-5 w-5" />
                  </div>
                  <span className="mt-2 text-sm font-medium">{product}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScratchEffectsStep({ projectData, setProjectData, t }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">{t("videoHub.scratch.transitionStyle")}</Label>
        <RadioGroup
          value={projectData.transitionStyle}
          onValueChange={(value) => setProjectData({ ...projectData, transitionStyle: value })}
          className="mt-3 grid gap-3 md:grid-cols-4"
        >
          {[
            { value: "fade", label: "Fade" },
            { value: "slide", label: "Slide" },
            { value: "zoom", label: "Zoom" },
            { value: "wipe", label: "Wipe" },
          ].map((opt) => (
            <div key={opt.value}>
              <RadioGroupItem value={opt.value} id={`trans-${opt.value}`} className="peer sr-only" />
              <Label
                htmlFor={`trans-${opt.value}`}
                className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium">{t("videoHub.scratch.musicStyle")}</Label>
        <Select
          value={projectData.musicStyle}
          onValueChange={(value) => setProjectData({ ...projectData, musicStyle: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upbeat">Upbeat & Energetic</SelectItem>
            <SelectItem value="calm">Calm & Reassuring</SelectItem>
            <SelectItem value="corporate">Corporate & Professional</SelectItem>
            <SelectItem value="emotional">Emotional & Inspiring</SelectItem>
            <SelectItem value="none">No Music</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-medium">{t("videoHub.scratch.voiceStyle")}</Label>
        <Select
          value={projectData.voiceStyle}
          onValueChange={(value) => setProjectData({ ...projectData, voiceStyle: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional Male</SelectItem>
            <SelectItem value="professional-female">Professional Female</SelectItem>
            <SelectItem value="warm">Warm & Friendly</SelectItem>
            <SelectItem value="energetic">Energetic</SelectItem>
            <SelectItem value="none">No Voiceover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={projectData.includeDisclaimer}
          onCheckedChange={(checked) => setProjectData({ ...projectData, includeDisclaimer: checked })}
        />
        <Label>{t("videoHub.create.disclaimer")}</Label>
      </div>
    </div>
  );
}

// ========== AI MODE STEPS ==========

function AIPromptStep({ projectData, setProjectData, t }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mx-auto mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold">{t("videoHub.ai.promptTitle")}</h3>
        <p className="text-muted-foreground mt-1">{t("videoHub.ai.promptDesc")}</p>
      </div>

      <div>
        <Label>{t("videoHub.create.projectName")}</Label>
        <Input
          value={projectData.name}
          onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
          placeholder={t("videoHub.create.projectNamePlaceholder")}
          className="mt-1"
        />
      </div>

      <div>
        <Label>{t("videoHub.ai.describe")}</Label>
        <Textarea
          value={projectData.aiPrompt}
          onChange={(e) => setProjectData({ ...projectData, aiPrompt: e.target.value })}
          placeholder={t("videoHub.ai.describePlaceholder")}
          className="mt-1 min-h-[150px]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t("videoHub.projects.format")}</Label>
          <Select
            value={projectData.format}
            onValueChange={(value) => setProjectData({ ...projectData, format: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">Landscape (16:9)</SelectItem>
              <SelectItem value="9:16">Portrait (9:16)</SelectItem>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("videoHub.projects.duration")}</Label>
          <Select
            value={projectData.duration.toString()}
            onValueChange={(value) => setProjectData({ ...projectData, duration: parseInt(value) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 seconds</SelectItem>
              <SelectItem value="15">15 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function AIReviewStep({ projectData, setProjectData, t }: any) {
  // In a real implementation, this would call an AI API to generate content
  // For now, we'll show a placeholder
  return (
    <div className="space-y-6">
      <Card className="border-accent bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
            {t("videoHub.ai.generated")}
          </CardTitle>
          <CardDescription>{t("videoHub.ai.generatedDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">{t("videoHub.create.headline")}</Label>
            <p className="font-medium">{projectData.headline || "Your safety is our priority"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("videoHub.create.bulletPoints")}</Label>
            <ul className="list-disc list-inside text-sm">
              <li>24/7 Emergency Response</li>
              <li>GPS Location Tracking</li>
              <li>Fall Detection Technology</li>
            </ul>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("videoHub.create.ctaText")}</Label>
            <p className="text-primary font-medium">Call Now for Peace of Mind</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1">
          <Sparkles className="mr-2 h-4 w-4" />
          {t("videoHub.ai.regenerate")}
        </Button>
        <Button 
          className="flex-1"
          onClick={() => {
            setProjectData({
              ...projectData,
              headline: "Your safety is our priority",
              bullets: ["24/7 Emergency Response", "GPS Location Tracking", "Fall Detection Technology"],
              ctaText: "Call Now for Peace of Mind",
            });
          }}
        >
          {t("videoHub.ai.useThis")}
        </Button>
      </div>
    </div>
  );
}

function AIRefineStep({ projectData, setProjectData, addBullet, removeBullet, updateBullet, t }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("videoHub.ai.refineDesc")}</p>

      <div>
        <Label>{t("videoHub.create.headline")}</Label>
        <Input
          value={projectData.headline}
          onChange={(e) => setProjectData({ ...projectData, headline: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>{t("videoHub.create.bulletPoints")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBullet} disabled={projectData.bullets.length >= 6}>
            <Plus className="mr-1 h-3 w-3" />
            {t("videoHub.create.addBullet")}
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {projectData.bullets.map((bullet: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                placeholder={`${t("videoHub.create.bullet")} ${index + 1}`}
              />
              {projectData.bullets.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBullet(index)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>{t("videoHub.create.ctaText")}</Label>
        <Input
          value={projectData.ctaText}
          onChange={(e) => setProjectData({ ...projectData, ctaText: e.target.value })}
          className="mt-1"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={projectData.includeDisclaimer}
          onCheckedChange={(checked) => setProjectData({ ...projectData, includeDisclaimer: checked })}
        />
        <Label>{t("videoHub.create.disclaimer")}</Label>
      </div>
    </div>
  );
}

// ========== QUICK MODE STEP ==========

function QuickSetupStep({ projectData, setProjectData, settings, t }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
          <Zap className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold">{t("videoHub.quick.title")}</h3>
        <p className="text-muted-foreground mt-1">{t("videoHub.quick.desc")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t("videoHub.create.projectName")}</Label>
          <Input
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            placeholder={t("videoHub.create.projectNamePlaceholder")}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{t("videoHub.create.headline")}</Label>
          <Input
            value={projectData.headline}
            onChange={(e) => setProjectData({ ...projectData, headline: e.target.value })}
            placeholder={t("videoHub.create.headlinePlaceholder")}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>{t("videoHub.projects.format")}</Label>
          <Select
            value={projectData.format}
            onValueChange={(value) => setProjectData({ ...projectData, format: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">Landscape</SelectItem>
              <SelectItem value="9:16">Portrait</SelectItem>
              <SelectItem value="1:1">Square</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("videoHub.projects.duration")}</Label>
          <Select
            value={projectData.duration.toString()}
            onValueChange={(value) => setProjectData({ ...projectData, duration: parseInt(value) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="15">15s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("videoHub.projects.language")}</Label>
          <Select
            value={projectData.language}
            onValueChange={(value) => setProjectData({ ...projectData, language: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>{t("videoHub.create.ctaText")}</Label>
        <Input
          value={projectData.ctaText}
          onChange={(e) => setProjectData({ ...projectData, ctaText: e.target.value })}
          placeholder={settings?.default_cta_en || "Call Now"}
          className="mt-1"
        />
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            {t("videoHub.quick.defaults")}
          </p>
          <ul className="mt-2 text-sm space-y-1">
            <li>✓ {t("videoHub.quick.brandLogo")}</li>
            <li>✓ {t("videoHub.quick.brandColors")}</li>
            <li>✓ {t("videoHub.quick.autoMusic")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
