import { usePartnerData } from "@/hooks/usePartnerData";
import { usePartnerStats } from "@/hooks/usePartnerStats";
import { StatsCards } from "@/components/partner/StatsCards";
import { ReferralPipeline } from "@/components/partner/ReferralPipeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Link } from "lucide-react";
import { toast } from "sonner";
import { generateReferralLink } from "@/lib/crmEvents";

export default function PartnerDashboard() {
  const { data: partner, isLoading: partnerLoading } = usePartnerData();
  const { data: stats, isLoading: statsLoading } = usePartnerStats(partner?.id);

  const referralLink = partner
    ? generateReferralLink(partner.referral_code)
    : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Partner Not Found</CardTitle>
            <CardDescription>
              Your account is not linked to a partner profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {partner.contact_name}
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>Share this link to earn commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-background px-3 py-2 text-sm border truncate">
              {referralLink}
            </code>
            <Button onClick={copyReferralLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Referral Code: <strong>{partner.referral_code}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Referral Pipeline */}
      <ReferralPipeline partnerId={partner.id} />
    </div>
  );
}
