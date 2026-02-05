import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Wand2, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useVideoTemplates } from "@/hooks/useVideoTemplates";
import { useVideoProjects } from "@/hooks/useVideoProjects";
import { useVideoBrandSettings } from "@/hooks/useVideoBrandSettings";
import { toast } from "sonner";

interface VideoCreateTabProps {
  onComplete: () => void;
}

const STEPS = ["template", "format", "content", "assets", "preview"];

export function VideoCreateTab({ onComplete }: VideoCreateTabProps) {
  const { t } = useTranslation();
  const { templates, isLoading: templatesLoading } = useVideoTemplates();
  const { createProject, isCreating } = useVideoProjects();
  const { settings } = useVideoBrandSettings();

  const [currentStep, setCurrentStep] = useState(0);
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
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (!projectData.name) {
      toast.error(t("videoHub.create.nameRequired"));
      return;
    }

    await createProject({
      name: projectData.name,
      template_id: projectData.template_id || null,
      format: projectData.format,
      duration: projectData.duration,
      language: projectData.language,
      status: "draft",
      data_json: {
        headline: projectData.headline,
        bullets: projectData.bullets.filter(b => b.trim()),
        ctaText: projectData.ctaText,
        contactLine: projectData.contactLine,
        includeDisclaimer: projectData.includeDisclaimer,
        backgroundUrl: projectData.backgroundUrl,
        productIcons: projectData.productIcons,
      },
    });
    toast.success(t("videoHub.create.draftSaved"));
    onComplete();
  };

  const handleRender = async () => {
    if (!projectData.name) {
      toast.error(t("videoHub.create.nameRequired"));
      return;
    }

    await createProject({
      name: projectData.name,
      template_id: projectData.template_id || null,
      format: projectData.format,
      duration: projectData.duration,
      language: projectData.language,
      status: "draft",
      data_json: {
        headline: projectData.headline,
        bullets: projectData.bullets.filter(b => b.trim()),
        ctaText: projectData.ctaText,
        contactLine: projectData.contactLine,
        includeDisclaimer: projectData.includeDisclaimer,
        backgroundUrl: projectData.backgroundUrl,
        productIcons: projectData.productIcons,
      },
    });
    toast.success(t("videoHub.create.renderQueued"));
    onComplete();
  };

  const addBullet = () => {
    if (projectData.bullets.length < 6) {
      setProjectData({ ...projectData, bullets: [...projectData.bullets, ""] });
    }
  };

  const removeBullet = (index: number) => {
    if (projectData.bullets.length > 3) {
      const newBullets = projectData.bullets.filter((_, i) => i !== index);
      setProjectData({ ...projectData, bullets: newBullets });
    }
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...projectData.bullets];
    newBullets[index] = value;
    setProjectData({ ...projectData, bullets: newBullets });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Template Selection
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
                templates?.map((template) => (
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

      case 1: // Format & Duration
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
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
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
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
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

      case 2: // Content
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBullet}
                  disabled={projectData.bullets.length >= 6}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t("videoHub.create.addBullet")}
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {projectData.bullets.map((bullet, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={bullet}
                      onChange={(e) => updateBullet(index, e.target.value)}
                      placeholder={`${t("videoHub.create.bullet")} ${index + 1}`}
                    />
                    {projectData.bullets.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBullet(index)}
                      >
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
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en">English</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="es" id="lang-es" />
                  <Label htmlFor="lang-es">Español</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="both" id="lang-both" />
                  <Label htmlFor="lang-both">Both</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3: // Assets
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
                            productIcons: projectData.productIcons.filter(p => p !== product),
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

      case 4: // Preview
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
                    {projectData.bullets.filter(b => b).length > 0 && (
                      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                        {projectData.bullets.filter(b => b).map((bullet, i) => (
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
                    <dt className="text-muted-foreground">{t("videoHub.projects.template")}:</dt>
                    <dd>{templates?.find(t => t.id === projectData.template_id)?.name || "-"}</dd>
                  </div>
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
                    <dd className="uppercase">{projectData.language}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              {t(`videoHub.create.step${currentStep + 1}`)}
            </CardTitle>
            <CardDescription>
              {t("videoHub.create.stepOf", { current: currentStep + 1, total: STEPS.length })}
            </CardDescription>
          </div>
          {/* Step indicators */}
          <div className="flex gap-1">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStep()}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("videoHub.create.saveDraft")}
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                {t("common.next")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleRender} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {t("videoHub.create.render")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
