import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LayoutDashboard, 
  Building2, 
  Users,
  FileText,
  Download,
  Plus,
  Upload,
  Heart,
  Send,
  UserCheck,
  Package,
  DollarSign,
  Trash2
} from "lucide-react";
import { ReferralPipeline } from "./ReferralPipeline";
import { ShareContentSection } from "./ShareContentSection";
import { StatsCards } from "./StatsCards";
import { usePartnerStats } from "@/hooks/usePartnerStats";

interface CareDashboardProps {
  partnerId: string;
  partner: {
    contact_name: string;
    company_name?: string | null;
    organization_type?: string | null;
    organization_registration?: string | null;
    organization_website?: string | null;
    estimated_monthly_referrals?: string | null;
    referral_code: string;
  };
}

interface BulkReferral {
  name: string;
  email: string;
  phone: string;
}

export function CareDashboard({ partnerId, partner }: CareDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [bulkReferrals, setBulkReferrals] = useState<BulkReferral[]>([
    { name: "", email: "", phone: "" }
  ]);

  const { data: stats, isLoading: statsLoading } = usePartnerStats(partnerId);

  const addBulkRow = () => {
    setBulkReferrals([...bulkReferrals, { name: "", email: "", phone: "" }]);
  };

  const removeBulkRow = (index: number) => {
    if (bulkReferrals.length > 1) {
      setBulkReferrals(bulkReferrals.filter((_, i) => i !== index));
    }
  };

  const updateBulkRow = (index: number, field: keyof BulkReferral, value: string) => {
    const updated = [...bulkReferrals];
    updated[index][field] = value;
    setBulkReferrals(updated);
  };

  // Calculate impact stats
  const totalProtected = stats?.totalDelivered || 0;
  const totalReferrals = stats?.totalRegistrations || 0;
  const totalCommissions = (stats?.pendingCommission || 0) + (stats?.approvedCommission || 0) + (stats?.paidCommission || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {partner.company_name || "Partner Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {partner.contact_name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Referrals</span>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Refer</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Organization Summary Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{partner.company_name || "Your Organization"}</h2>
                  <p className="text-muted-foreground">
                    {partner.organization_type?.replace("_", " ") || "Care Partner"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{totalProtected}</p>
                  <p className="text-sm text-muted-foreground">People Protected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Pipeline */}
          <ReferralPipeline partnerId={partnerId} />

          {/* Share Content */}
          <ShareContentSection partnerId={partnerId} />
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Details about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                  <p className="text-lg font-medium">{partner.company_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization Type</label>
                  <p className="text-lg font-medium capitalize">
                    {partner.organization_type?.replace("_", " ") || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                  <p className="text-lg font-medium">{partner.organization_registration || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <p className="text-lg font-medium">
                    {partner.organization_website ? (
                      <a 
                        href={partner.organization_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {partner.organization_website}
                      </a>
                    ) : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Monthly Referrals</label>
                  <p className="text-lg font-medium">{partner.estimated_monthly_referrals || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referral Code</label>
                  <p className="text-lg font-medium font-mono">{partner.referral_code}</p>
                </div>
              </div>

              <Button variant="outline">Edit Organization Details</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6 mt-6">
          <ReferralPipeline partnerId={partnerId} />
        </TabsContent>

        {/* Bulk Refer Tab */}
        <TabsContent value="bulk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Referral Form</CardTitle>
              <CardDescription>Add multiple referrals at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name *</TableHead>
                    <TableHead>Email *</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkReferrals.map((referral, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          placeholder="Full name"
                          value={referral.name}
                          onChange={(e) => updateBulkRow(index, "name", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={referral.email}
                          onChange={(e) => updateBulkRow(index, "email", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="tel"
                          placeholder="+34 600 000 000"
                          value={referral.phone}
                          onChange={(e) => updateBulkRow(index, "phone", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBulkRow(index)}
                          disabled={bulkReferrals.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex gap-3">
                <Button variant="outline" onClick={addBulkRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline">Save as Drafts</Button>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send All Invites
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          {/* Impact Statement */}
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/50">
                  <Heart className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                    Your Impact
                  </h2>
                  <p className="text-green-700 dark:text-green-300">
                    You've helped protect <strong>{totalProtected}</strong> people through ICE Alarm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalInvitesSent || 0}</div>
                <p className="text-xs text-muted-foreground">Referrals sent</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Quarter</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground">Registrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Year</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProtected}</div>
                <p className="text-xs text-muted-foreground">Active members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">€{totalCommissions.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Download Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Download Reports</CardTitle>
              <CardDescription>Generate PDF reports for board meetings or records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Monthly Summary Report</p>
                      <p className="text-xs text-muted-foreground">Referrals, conversions, commissions</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Impact Report</p>
                      <p className="text-xs text-muted-foreground">For stakeholders & board meetings</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Commission Statement</p>
                      <p className="text-xs text-muted-foreground">Detailed breakdown by referral</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium">Referral List (CSV)</p>
                      <p className="text-xs text-muted-foreground">Export all referral data</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
