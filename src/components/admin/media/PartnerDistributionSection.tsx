import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Users, Link2, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Partner {
  id: string;
  contact_name: string;
  company_name: string | null;
  referral_code: string;
}

interface PartnerDistributionSectionProps {
  enabled: boolean;
  audience: "none" | "all" | "selected";
  selectedPartnerIds: string[];
  onEnabledChange: (enabled: boolean) => void;
  onAudienceChange: (audience: "none" | "all" | "selected") => void;
  onSelectedPartnersChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PartnerDistributionSection({
  enabled,
  audience,
  selectedPartnerIds,
  onEnabledChange,
  onAudienceChange,
  onSelectedPartnersChange,
  disabled = false,
}: PartnerDistributionSectionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch active partners
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["active-partners-for-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, contact_name, company_name, referral_code")
        .eq("status", "active")
        .order("contact_name");

      if (error) throw error;
      return data as Partner[];
    },
  });

  // Auto-expand when enabled
  useEffect(() => {
    if (enabled) setIsExpanded(true);
  }, [enabled]);

  const handlePartnerToggle = (partnerId: string) => {
    if (selectedPartnerIds.includes(partnerId)) {
      onSelectedPartnersChange(selectedPartnerIds.filter((id) => id !== partnerId));
    } else {
      onSelectedPartnersChange([...selectedPartnerIds, partnerId]);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">{t("mediaManager.partnerDistribution.title")}</Label>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>

      {enabled && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-sm text-muted-foreground">
                {t("mediaManager.partnerDistribution.configure")}
              </span>
              <Badge variant="secondary">
                {audience === "all"
                  ? t("mediaManager.partnerDistribution.allPartners")
                  : audience === "selected"
                  ? `${selectedPartnerIds.length} ${t("mediaManager.partnerDistribution.selected")}`
                  : t("mediaManager.partnerDistribution.none")}
              </Badge>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-4">
            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t("mediaManager.partnerDistribution.infoText")}
              </p>
            </div>

            {/* Audience Selection */}
            <div className="space-y-3">
              <Label className="text-sm">{t("mediaManager.partnerDistribution.audienceLabel")}</Label>
              <RadioGroup
                value={audience}
                onValueChange={(v) => onAudienceChange(v as "none" | "all" | "selected")}
                className="space-y-2"
                disabled={disabled}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="audience-all" />
                  <Label htmlFor="audience-all" className="font-normal cursor-pointer">
                    {t("mediaManager.partnerDistribution.allActivePartners")}
                    <span className="text-muted-foreground ml-1">
                      ({partners.length} {t("mediaManager.partnerDistribution.partners")})
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="audience-selected" />
                  <Label htmlFor="audience-selected" className="font-normal cursor-pointer">
                    {t("mediaManager.partnerDistribution.selectedPartners")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Partner Selection (only show when "selected" is chosen) */}
            {audience === "selected" && (
              <div className="space-y-2">
                <Label className="text-sm">{t("mediaManager.partnerDistribution.selectPartners")}</Label>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : partners.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {t("mediaManager.partnerDistribution.noActivePartners")}
                  </p>
                ) : (
                  <ScrollArea className="h-[150px] rounded-md border p-2">
                    <div className="space-y-2">
                      {partners.map((partner) => (
                        <div
                          key={partner.id}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                        >
                          <Checkbox
                            id={`partner-${partner.id}`}
                            checked={selectedPartnerIds.includes(partner.id)}
                            onCheckedChange={() => handlePartnerToggle(partner.id)}
                            disabled={disabled}
                          />
                          <label
                            htmlFor={`partner-${partner.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <span className="font-medium">{partner.contact_name}</span>
                            {partner.company_name && (
                              <span className="text-muted-foreground ml-1">
                                ({partner.company_name})
                              </span>
                            )}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {partner.referral_code}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Tracking note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>{t("mediaManager.partnerDistribution.trackingNote")}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
