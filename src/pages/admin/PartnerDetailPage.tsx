import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Building, Globe, CreditCard, Users, Send, DollarSign } from "lucide-react";
import { format } from "date-fns";

type PartnerStatus = "pending" | "active" | "suspended";
type InviteStatus = "draft" | "sent" | "registered" | "converted" | "expired";
type CommissionStatus = "pending_release" | "approved" | "paid" | "cancelled";

interface Partner {
  id: string;
  created_at: string;
  status: PartnerStatus;
  referral_code: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  preferred_language: string;
  payout_method: string;
  payout_iban: string | null;
  payout_beneficiary_name: string | null;
  notes_internal: string | null;
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
  trigger_at: string | null;
  release_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
}

const statusColors: Record<PartnerStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

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

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });

  const { data: invites } = useQuery({
    queryKey: ["partner-invites", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_invites")
        .select("*")
        .eq("partner_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invite[];
    },
    enabled: !!id,
  });

  const { data: commissions } = useQuery({
    queryKey: ["partner-commissions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select("*")
        .eq("partner_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["partner-detail-stats", id],
    queryFn: async () => {
      const [attributionsCount, pendingCommissions, paidCommissions] = await Promise.all([
        supabase.from("partner_attributions").select("id", { count: "exact", head: true }).eq("partner_id", id),
        supabase.from("partner_commissions").select("amount_eur").eq("partner_id", id).eq("status", "pending_release"),
        supabase.from("partner_commissions").select("amount_eur").eq("partner_id", id).eq("status", "paid"),
      ]);

      return {
        totalReferrals: attributionsCount.count || 0,
        pendingAmount: pendingCommissions.data?.reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
        paidAmount: paidCommissions.data?.reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
      };
    },
    enabled: !!id,
  });

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Partner not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/partners")}>
          Back to Partners
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/partners")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{partner.contact_name}</h1>
            <Badge className={statusColors[partner.status]}>
              {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
            </Badge>
          </div>
          {partner.company_name && (
            <p className="text-muted-foreground">{partner.company_name}</p>
          )}
        </div>
        <Button variant="outline">Edit Partner</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xl font-bold rounded bg-muted px-2 py-1">
              {partner.referral_code}
            </code>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.pendingAmount?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.paidAmount?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="invites">Invites ({invites?.length || 0})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions ({commissions?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.email}</span>
                </div>
                {partner.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{partner.phone}</span>
                  </div>
                )}
                {partner.company_name && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{partner.company_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.preferred_language === "es" ? "Spanish" : "English"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{partner.payout_method}</span>
                </div>
                {partner.payout_iban && (
                  <div>
                    <p className="text-sm text-muted-foreground">IBAN</p>
                    <p className="font-mono">{partner.payout_iban}</p>
                  </div>
                )}
                {partner.payout_beneficiary_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Beneficiary</p>
                    <p>{partner.payout_beneficiary_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {partner.notes_internal && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{partner.notes_internal}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Invites Sent</CardTitle>
              <CardDescription>Track all invitations sent by this partner</CardDescription>
            </CardHeader>
            <CardContent>
              {invites?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invites sent yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invitee</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
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
                            ? format(new Date(invite.sent_at), "dd MMM yyyy HH:mm")
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
              <CardDescription>All commissions earned by this partner</CardDescription>
            </CardHeader>
            <CardContent>
              {commissions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No commissions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Paid At</TableHead>
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
    </div>
  );
}
