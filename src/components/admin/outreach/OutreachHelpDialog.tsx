import { useTranslation } from "react-i18next";
import { HelpCircle, Users, Target, Megaphone, Mail, BarChart3, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface OutreachHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OutreachHelpDialog = ({ open, onOpenChange }: OutreachHelpDialogProps) => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: HelpCircle,
      title: t("outreach.help.overview.title"),
      content: t("outreach.help.overview.content"),
      type: "paragraph" as const,
    },
    {
      icon: Users,
      title: t("outreach.help.leads.title"),
      intro: t("outreach.help.leads.intro"),
      steps: t("outreach.help.leads.steps", { returnObjects: true }) as string[],
      type: "steps" as const,
    },
    {
      icon: Target,
      title: t("outreach.help.crm.title"),
      intro: t("outreach.help.crm.intro"),
      steps: t("outreach.help.crm.steps", { returnObjects: true }) as string[],
      type: "steps" as const,
    },
    {
      icon: Megaphone,
      title: t("outreach.help.campaigns.title"),
      intro: t("outreach.help.campaigns.intro"),
      steps: t("outreach.help.campaigns.steps", { returnObjects: true }) as string[],
      type: "steps" as const,
    },
    {
      icon: Mail,
      title: t("outreach.help.inbox.title"),
      intro: t("outreach.help.inbox.intro"),
      steps: t("outreach.help.inbox.steps", { returnObjects: true }) as string[],
      type: "steps" as const,
    },
    {
      icon: BarChart3,
      title: t("outreach.help.analytics.title"),
      intro: t("outreach.help.analytics.intro"),
      metrics: t("outreach.help.analytics.metrics", { returnObjects: true }) as string[],
      type: "metrics" as const,
    },
    {
      icon: Lightbulb,
      title: t("outreach.help.bestPractices.title"),
      tips: t("outreach.help.bestPractices.tips", { returnObjects: true }) as string[],
      type: "tips" as const,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            {t("outreach.help.title")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 max-h-[60vh]">
          <div className="space-y-6 pb-4">
            {sections.map((section, index) => (
              <div key={index}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base">{section.title}</h3>
                </div>

                {section.type === "paragraph" && (
                  <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                    {section.content}
                  </p>
                )}

                {section.type === "steps" && (
                  <div className="pl-10 space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">{section.intro}</p>
                    <ol className="list-decimal list-inside space-y-1.5">
                      {section.steps?.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm text-muted-foreground">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {section.type === "metrics" && (
                  <div className="pl-10 space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">{section.intro}</p>
                    <ul className="list-disc list-inside space-y-1.5">
                      {section.metrics?.map((metric, metricIndex) => (
                        <li key={metricIndex} className="text-sm text-muted-foreground">
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.type === "tips" && (
                  <ul className="pl-10 list-disc list-inside space-y-1.5">
                    {section.tips?.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm text-muted-foreground">
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}

                {index < sections.length - 1 && <Separator className="mt-5" />}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            {t("outreach.help.gotIt")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
