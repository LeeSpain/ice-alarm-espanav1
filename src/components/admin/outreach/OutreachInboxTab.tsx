import { useTranslation } from "react-i18next";
import { Mail, Inbox } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OutreachInboxTab() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>{t("outreach.inbox.title")}</CardTitle>
            <CardDescription>{t("outreach.inbox.subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">{t("outreach.inbox.noThreads")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("outreach.inbox.subtitle")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
