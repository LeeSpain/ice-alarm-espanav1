import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  switch (status) {
    case "draft":
      return <Badge variant="secondary">{t("videoHub.statuses.draft")}</Badge>;
    case "approved":
      return <Badge className="bg-status-active text-status-active-foreground">{t("videoHub.statuses.approved")}</Badge>;
    case "archived":
      return <Badge variant="outline">{t("videoHub.statuses.archived")}</Badge>;
    case "queued":
      return <Badge variant="secondary">{t("videoHub.statuses.queued")}</Badge>;
    case "running":
      return <Badge className="bg-amber-500 text-white">{t("videoHub.statuses.running")}</Badge>;
    case "failed":
      return <Badge variant="destructive">{t("videoHub.statuses.failed")}</Badge>;
    case "done":
      return <Badge className="bg-status-active text-white">{t("videoHub.statuses.done")}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

interface LanguageBadgeProps {
  language: string;
}

export function LanguageBadge({ language }: LanguageBadgeProps) {
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
}

interface FormatBadgeProps {
  format: string;
}

export function FormatBadge({ format }: FormatBadgeProps) {
  const formatLabels: Record<string, string> = {
    "9:16": "Portrait",
    "16:9": "Landscape",
    "1:1": "Square"
  };
  return <Badge variant="secondary">{formatLabels[format] || format}</Badge>;
}
