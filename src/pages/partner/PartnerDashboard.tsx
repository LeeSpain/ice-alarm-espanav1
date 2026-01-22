import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/ui/logo";
import { Users, DollarSign, Send, Copy, Link, Plus, LogOut } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type InviteStatus = "draft" | "sent" | "registered" | "converted" | "expired";
type CommissionStatus = "pending_release" | "approved" | "paid" | "cancelled";

interface Partner {
  id: string;
  referral_code: string;
  contact_name: string;
  email: string;
  status: string;
}

interface Invite {
  id: string;
  created_at: string;
  invitee_name: string;
  invitee_email: string | null;
  invitee_phone: string | null;
  channel: string;
  status: InviteStatus;
  sent_at: string | null;
}

interface Commission {
  id: string;
  created_at: string;
  amount_eur: number;
  status: CommissionStatus;
  trigger_event: string;
  paid_at: string | null;
}

const inviteStatusColors: Record<InviteStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  registered: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  converted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const commissionStatusColors: Record<CommissionStatus, string> = {
  pending_release: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function PartnerDashboard() {
  const { user, signOut } = useAuth();

  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["my-partner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data as Partner;
    },
    enabled: !!user,
  });

  const { data: invites } = useQuery({
    queryKey: ["my-invites", partner?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_invites")
        .select("*")
        .eq("partner_id", partner!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invite[];
    },
    enabled: !!partner?.id,
  });

  const { data: commissions } = useQuery({
    queryKey: ["my-commissions", partner?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select("*")
        .eq("partner_id", partner!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!partner?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["my-partner-stats", partner?.id],
    queryFn: async () => {
      const [attributionsCount, pendingCommissions, paidCommissions] = await Promise.all([
        supabase
          .from("partner_attributions")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partner!.id),
        supabase
          .from("partner_commissions")
          .select("amount_eur")
          .eq("partner_id", partner!.id)
          .eq("status", "pending_release"),
        supabase
          .from("partner_commissions")
          .select("amount_eur")
          .eq("partner_id", partner!.id)
          .eq("status", "paid"),
      ]);

      return {
        totalReferrals: attributionsCount.count || 0,
        pendingAmount:
          pendingCommissions.data?.reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
        paidAmount: paidCommissions.data?.reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
      };
    },
    enabled: !!partner?.id,
  });

  const referralLink = partner
    ? `${window.location.origin}/join?ref=${partner.referral_code}`
    : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Partner Account Not Found</CardTitle>
            <CardDescription>
              Your account is not linked to a partner profile. Please contact support if you
              believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {partner.contact_name}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
          <p className="text-muted-foreground">Track your referrals and earnings</p>
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats?.pendingAmount?.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{stats?.paidAmount?.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invites" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="invites">
                <Send className="h-4 w-4 mr-2" />
                My Invites
              </TabsTrigger>
              <TabsTrigger value="commissions">
                <DollarSign className="h-4 w-4 mr-2" />
                Commissions
              </TabsTrigger>
            </TabsList>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Send Invite
            </Button>
          </div>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle>Invites Sent</CardTitle>
                <CardDescription>Track the status of your referral invitations</CardDescription>
              </CardHeader>
              <CardContent>
                {invites?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invites sent yet</p>
                    <p className="text-sm">Start inviting people to earn commissions!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invitee</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites?.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invite.invitee_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {invite.invitee_email || invite.invitee_phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {invite.channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={inviteStatusColors[invite.status]}>
                              {invite.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invite.sent_at
                              ? format(new Date(invite.sent_at), "dd MMM yyyy")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Commission History</CardTitle>
                <CardDescription>Your earnings from successful referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {commissions?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No commissions yet</p>
                    <p className="text-sm">
                      Commissions are created when your referrals become customers
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions?.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            €{Number(commission.amount_eur).toFixed(2)}
                          </TableCell>
                          <TableCell>{commission.trigger_event.replace("_", " ")}</TableCell>
                          <TableCell>
                            <Badge className={commissionStatusColors[commission.status]}>
                              {commission.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(commission.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            {commission.paid_at
                              ? format(new Date(commission.paid_at), "dd MMM yyyy")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
