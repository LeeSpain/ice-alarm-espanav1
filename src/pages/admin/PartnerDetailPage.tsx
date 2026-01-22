import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Mail, Phone, Building, Globe, CreditCard, Users, Send,
  DollarSign, Check, XCircle, Pause, Play, Save, Package, FileText
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logPartnerActivity, logCommissionActivity } from "@/lib/auditLog";
import { logCrmEvent } from "@/lib/crmEvents";
import { Database } from "@/integrations/supabase/types";

type PartnerStatus = Database["public"]["Enums"]["partner_status"];
type InviteStatus = Database["public"]["Enums"]["invite_status"];
type CommissionStatus = Database["public"]["Enums"]["commission_status"];

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
  converted_member_id: string | null;
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
  cancel_reason: string | null;
  member_id: string;
}

interface Attribution {
  id: string;
  created_at: string;
  member_id: string;
  source: string;
  first_touch_at: string;
}

interface AuditLogEntry {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
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
  const queryClient = useQueryClient();
  const [internalNotes, setInternalNotes] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);

  // Fetch partner
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setInternalNotes(data.notes_internal || "");
      return data as Partner;
    },
    enabled: !!id,
  });

  // Fetch invites
  const { data: invites } = useQuery({
    queryKey: ["partner-invites-admin", id],
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

  // Fetch commissions
  const { data: commissions } = useQuery({
    queryKey: ["partner-commissions-admin", id],
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

  // Fetch attributions
  const { data: attributions } = useQuery({
    queryKey: ["partner-attributions-admin", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_attributions")
        .select("*")
        .eq("partner_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Attribution[];
    },
    enabled: !!id,
  });

  // Fetch audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ["partner-audit-logs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_type", "partner")
        .eq("entity_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!id,
  });

  // Funnel stats
  const funnelStats = {
    invitesSent: invites?.filter(i => i.status !== "draft").length || 0,
    registrations: invites?.filter(i => i.status === "registered" || i.status === "converted").length || 0,
    delivered: commissions?.filter(c => c.trigger_event === "device_delivered").length || 0,
    commissions: commissions?.length || 0,
    pendingAmount: commissions?.filter(c => c.status === "pending_release").reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
    approvedAmount: commissions?.filter(c => c.status === "approved").reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
    paidAmount: commissions?.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
  };

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: PartnerStatus) => {
      const oldStatus = partner?.status;
      const { error } = await supabase
        .from("partners")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      await logPartnerActivity("partner_status_changed", id!, { status: oldStatus }, { status: newStatus });
    },
    onSuccess: () => {
      toast.success("Partner status updated");
      queryClient.invalidateQueries({ queryKey: ["partner", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast.error("Failed to update partner status");
    },
  });

  // Save notes mutation
  const saveNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("partners")
        .update({ notes_internal: internalNotes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notes saved");
      setNotesChanged(false);
      queryClient.invalidateQueries({ queryKey: ["partner", id] });
    },
    onError: (error) => {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes");
    },
  });

  // Mark commission as paid mutation
  const markCommissionPaid = useMutation({
    mutationFn: async (commissionId: string) => {
      const now = new Date().toISOString();
      
      // Get commission details for CRM event
      const { data: commission, error: fetchError } = await supabase
        .from("partner_commissions")
        .select("partner_id, member_id, amount_eur")
        .eq("id", commissionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from("partner_commissions")
        .update({ status: "paid", paid_at: now })
        .eq("id", commissionId);

      if (error) throw error;
      
      await logCommissionActivity("commission_paid", commissionId, undefined, { paid_at: now });
      
      // Log CRM event
      await logCrmEvent("commission_paid", {
        commission_id: commissionId,
        partner_id: commission.partner_id,
        member_id: commission.member_id,
        amount_eur: commission.amount_eur,
        paid_at: now,
      });
    },
    onSuccess: () => {
      toast.success("Commission marked as paid");
      queryClient.invalidateQueries({ queryKey: ["partner-commissions-admin", id] });
    },
    onError: (error) => {
      console.error("Failed to mark as paid:", error);
      toast.error("Failed to mark commission as paid");
    },
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

  const maxFunnelValue = Math.max(funnelStats.invitesSent, 1);

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
        <div className="flex gap-2">
          {partner.status === "pending" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Approve Partner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Partner</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will activate the partner account and allow them to send referrals.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => updateStatus.mutate("active")}>
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {partner.status === "active" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Pause className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend Partner</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will prevent the partner from logging in and sending new referrals. Existing commissions will still be processed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => updateStatus.mutate("suspended")} className="bg-destructive text-destructive-foreground">
                    Suspend
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {partner.status === "suspended" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Reactivate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reactivate Partner</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will restore the partner's account access and allow them to continue sending referrals.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => updateStatus.mutate("active")}>
                    Reactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Referral Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Referral Funnel
          </CardTitle>
          <CardDescription>Track conversion from invites to commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Invites Sent</span>
                <span className="font-medium">{funnelStats.invitesSent}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Registrations</span>
                <span className="font-medium">{funnelStats.registrations}</span>
              </div>
              <Progress value={(funnelStats.registrations / maxFunnelValue) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pendants Delivered</span>
                <span className="font-medium">{funnelStats.delivered}</span>
              </div>
              <Progress value={(funnelStats.delivered / maxFunnelValue) * 100} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">€{funnelStats.pendingAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold text-blue-600">€{funnelStats.approvedAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-600">€{funnelStats.paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="invites">Invites ({invites?.length || 0})</TabsTrigger>
          <TabsTrigger value="attributions">Referrals ({attributions?.length || 0})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions ({commissions?.length || 0})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
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
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <code className="text-lg font-mono font-bold">{partner.referral_code}</code>
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
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p>{format(new Date(partner.created_at), "dd MMMM yyyy")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Private notes visible only to admins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={internalNotes}
                onChange={(e) => {
                  setInternalNotes(e.target.value);
                  setNotesChanged(true);
                }}
                placeholder="Add internal notes about this partner..."
                rows={4}
              />
              {notesChanged && (
                <Button onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notes
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Invites Sent</CardTitle>
              <CardDescription>All invitations sent by this partner</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invites?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invites sent yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invitee</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites?.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.invitee_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {invite.invitee_email || invite.invitee_phone || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{invite.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={inviteStatusColors[invite.status]}>
                            {invite.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.sent_at ? format(new Date(invite.sent_at), "dd MMM yyyy HH:mm") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributions">
          <Card>
            <CardHeader>
              <CardTitle>Attributed Referrals</CardTitle>
              <CardDescription>Members who signed up via this partner (anonymised)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {attributions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attributions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>First Touch</TableHead>
                      <TableHead>Commission Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributions?.map((attr) => {
                      const commission = commissions?.find(c => c.member_id === attr.member_id);
                      return (
                        <TableRow key={attr.id}>
                          <TableCell>
                            <code className="text-xs">{attr.member_id.substring(0, 8)}...</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{attr.source.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(attr.first_touch_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            {commission ? (
                              <Badge className={commissionStatusColors[commission.status]}>
                                {commission.status.replace("_", " ")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Pending delivery</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
            <CardContent className="p-0">
              {commissions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No commissions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Triggered</TableHead>
                      <TableHead>Release Date</TableHead>
                      <TableHead>Paid At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions?.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="font-bold">€{Number(commission.amount_eur).toFixed(2)}</TableCell>
                        <TableCell>{commission.trigger_event.replace("_", " ")}</TableCell>
                        <TableCell>
                          <Badge className={commissionStatusColors[commission.status]}>
                            {commission.status.replace("_", " ")}
                          </Badge>
                          {commission.cancel_reason && (
                            <p className="text-xs text-muted-foreground mt-1">{commission.cancel_reason}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {commission.trigger_at ? format(new Date(commission.trigger_at), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {commission.release_at ? format(new Date(commission.release_at), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {commission.paid_at ? format(new Date(commission.paid_at), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {commission.status === "approved" && (
                            <Button
                              size="sm"
                              onClick={() => markCommissionPaid.mutate(commission.id)}
                              disabled={markCommissionPaid.isPending}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Log
              </CardTitle>
              <CardDescription>Recent activity related to this partner</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {auditLogs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit entries yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Old Values</TableHead>
                      <TableHead>New Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">
                            {log.old_values ? JSON.stringify(log.old_values) : "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">
                            {log.new_values ? JSON.stringify(log.new_values) : "-"}
                          </code>
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
