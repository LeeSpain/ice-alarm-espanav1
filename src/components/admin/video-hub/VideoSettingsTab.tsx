import { useTranslation } from "react-i18next";
import { Settings, Type, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useVideoBrandSettings } from "@/hooks/useVideoBrandSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoUploadSection } from "./LogoUploadSection";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function VideoSettingsTab() {
  const { t } = useTranslation();
  const { settings, isLoading, updateSettings, isUpdating } = useVideoBrandSettings();
  
  const [formData, setFormData] = useState({
    logo_url: null as string | null,
    watermark_enabled: true,
    disclaimers_en: "",
    disclaimers_es: "",
    default_cta_en: "",
    default_cta_es: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        logo_url: settings.logo_url,
        watermark_enabled: settings.watermark_enabled ?? true,
        disclaimers_en: settings.disclaimers_en || "",
        disclaimers_es: settings.disclaimers_es || "",
        default_cta_en: settings.default_cta_en || "",
        default_cta_es: settings.default_cta_es || "",
      });
    }
  }, [settings]);

  const handleLogoChange = async (url: string | null) => {
    setFormData(prev => ({ ...prev, logo_url: url }));
    // Save logo change immediately
    await updateSettings({ logo_url: url });
    toast.success(url ? "Logo updated" : "Logo removed");
  };

  const handleSave = async () => {
    await updateSettings(formData);
    toast.success(t("videoHub.settings.saved"));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("videoHub.settings.brandRules")}
          </CardTitle>
          <CardDescription>{t("videoHub.settings.brandRulesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Logo - Editable */}
            <LogoUploadSection
              currentLogoUrl={formData.logo_url}
              onLogoChange={handleLogoChange}
              isUpdating={isUpdating}
            />

            {/* Colors */}
            <div>
              <Label className="text-muted-foreground">{t("videoHub.settings.colors")}</Label>
              <div className="mt-2 flex gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-md border"
                    style={{ backgroundColor: settings?.primary_color || "#B91C1C" }}
                  />
                  <span className="text-sm">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-md border"
                    style={{ backgroundColor: settings?.secondary_color || "#1E3A8A" }}
                  />
                  <span className="text-sm">Secondary</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">{t("videoHub.settings.fontFamily")}</Label>
            <div className="mt-2 flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{settings?.font_family || "Inter"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("videoHub.settings.videoDefaults")}
          </CardTitle>
          <CardDescription>{t("videoHub.settings.videoDefaultsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Watermark */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("videoHub.settings.watermark")}</Label>
              <p className="text-sm text-muted-foreground">{t("videoHub.settings.watermarkEnabled")}</p>
            </div>
            <Switch
              checked={formData.watermark_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, watermark_enabled: checked })}
            />
          </div>

          <Separator />

          {/* Disclaimers */}
          <div>
            <Label className="text-base font-medium">{t("videoHub.settings.disclaimers")}</Label>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("videoHub.settings.disclaimersEn")}</Label>
                <Textarea
                  value={formData.disclaimers_en}
                  onChange={(e) => setFormData({ ...formData, disclaimers_en: e.target.value })}
                  className="mt-1 min-h-[100px]"
                  placeholder="Enter English disclaimer..."
                />
              </div>
              <div>
                <Label>{t("videoHub.settings.disclaimersEs")}</Label>
                <Textarea
                  value={formData.disclaimers_es}
                  onChange={(e) => setFormData({ ...formData, disclaimers_es: e.target.value })}
                  className="mt-1 min-h-[100px]"
                  placeholder="Introduzca la exención de responsabilidad en español..."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Default CTAs */}
          <div>
            <Label className="text-base font-medium">{t("videoHub.settings.defaultCtas")}</Label>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t("videoHub.settings.ctaEn")}</Label>
                <Input
                  value={formData.default_cta_en}
                  onChange={(e) => setFormData({ ...formData, default_cta_en: e.target.value })}
                  className="mt-1"
                  placeholder="Call Now"
                />
              </div>
              <div>
                <Label>{t("videoHub.settings.ctaEs")}</Label>
                <Input
                  value={formData.default_cta_es}
                  onChange={(e) => setFormData({ ...formData, default_cta_es: e.target.value })}
                  className="mt-1"
                  placeholder="Llama Ahora"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
