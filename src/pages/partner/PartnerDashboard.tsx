import { usePartnerData } from "@/hooks/usePartnerData";
import { usePartnerStats } from "@/hooks/usePartnerStats";
import { StatsCards } from "@/components/partner/StatsCards";
import { ReferralPipeline } from "@/components/partner/ReferralPipeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Link, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { generateReferralLink } from "@/lib/crmEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function PartnerDashboard() {
  const { isStaff, staffRole } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isAdminRole = isStaff && (staffRole === "admin" || staffRole === "super_admin");
  const partnerIdParam = searchParams.get("partnerId");

  // Admin without partnerId param - show selection prompt
  if (isAdminRole && !partnerIdParam) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Admin View Mode</CardTitle>
            <CardDescription>
              Select a partner from the Partners page to view their dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/admin/partners")}>
              Go to Partners List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: partner, isLoading: partnerLoading } = usePartnerData(
    isAdminRole ? partnerIdParam : undefined
  );
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
      {/* Admin viewing mode banner */}
      {isAdminRole && partnerIdParam && (
        <div className="flex items-center gap-4 p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/partners")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Button>
          <span className="text-sm text-amber-800 dark:text-amber-200">
            Viewing as Admin: <strong>{partner.contact_name}</strong>'s dashboard
          </span>
        </div>
      )}

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
