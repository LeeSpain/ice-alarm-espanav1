import { useTranslation } from "react-i18next";
import { Megaphone, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export function OutreachCampaignsTab() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("outreach.campaigns.title")}</CardTitle>
              <CardDescription>{t("outreach.campaigns.subtitle")}</CardDescription>
            </div>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t("outreach.campaigns.newCampaign")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">{t("outreach.campaigns.noCampaigns")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("outreach.campaigns.subtitle")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
