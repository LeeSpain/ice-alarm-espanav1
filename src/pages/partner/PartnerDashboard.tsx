import { usePartnerData } from "@/hooks/usePartnerData";
import { usePartnerStats } from "@/hooks/usePartnerStats";
import { StatsCards } from "@/components/partner/StatsCards";
import { ReferralPipeline } from "@/components/partner/ReferralPipeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Copy, Link, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { generateReferralLink } from "@/lib/crmEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";

// Mock data for template preview
const MOCK_PARTNER = {
  id: "template-preview",
  contact_name: "Demo Partner",
  referral_code: "DEMO2024",
  company_name: "Demo Company Ltd",
  email: "demo@partner.com",
};

const MOCK_STATS = {
  totalInvitesSent: 24,
  totalRegistrations: 12,
  totalDelivered: 8,
  pendingCommission: 240,
  approvedCommission: 480,
  paidCommission: 960,
};

export default function PartnerDashboard() {
  const { isStaff, staffRole } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isAdminRole = isStaff && (staffRole === "admin" || staffRole === "super_admin");
  const partnerIdParam = searchParams.get("partnerId");
  const isTemplatePreview = isAdminRole && !partnerIdParam;

  const { data: partner, isLoading: partnerLoading } = usePartnerData(
    isAdminRole ? partnerIdParam : undefined
  );
  const { data: stats, isLoading: statsLoading } = usePartnerStats(
    isTemplatePreview ? undefined : partner?.id
  );

  // Use mock data for template preview
  const displayPartner = isTemplatePreview ? MOCK_PARTNER : partner;
  const displayStats = isTemplatePreview ? MOCK_STATS : stats;

  const referralLink = displayPartner
    ? generateReferralLink(displayPartner.referral_code)
    : "";

  const copyReferralLink = () => {
    if (isTemplatePreview) {
      toast.info("This is a template preview - referral link is for demo only");
      return;
    }
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  if (!isTemplatePreview && partnerLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>
        
        {/* Referral link card skeleton */}
        <Skeleton className="h-36" />
        
        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        {/* Pipeline skeleton */}
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isTemplatePreview && !partner) {
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
      {/* Template Preview Banner */}
      {isTemplatePreview && (
        <div className="flex items-center gap-4 p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Template Preview Mode
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              This shows the dashboard layout with demo data. Changes made here will apply to all partner dashboards.
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
            Demo Data
          </Badge>
        </div>
      )}

      {/* Admin viewing specific partner banner */}
      {isAdminRole && partnerIdParam && partner && (
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
          Welcome back, {displayPartner?.contact_name}
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
            Referral Code: <strong>{displayPartner?.referral_code}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <StatsCards stats={displayStats} isLoading={!isTemplatePreview && statsLoading} />

      {/* Referral Pipeline - show empty state for template preview */}
      {isTemplatePreview ? (
        <Card>
          <CardHeader>
            <CardTitle>Referral Pipeline</CardTitle>
            <CardDescription>Track your referrals through each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Pipeline data will appear here for actual partners</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReferralPipeline partnerId={partner!.id} />
      )}
    </div>
  );
}
