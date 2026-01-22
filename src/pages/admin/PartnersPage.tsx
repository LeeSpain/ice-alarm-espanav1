import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, DollarSign, Send, TrendingUp, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, subDays, isAfter } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type PartnerStatus = Database["public"]["Enums"]["partner_status"];

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
}

interface PartnerStats {
  partnerId: string;
  invitesSent: number;
  registrations: number;
  delivered: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
}

const ITEMS_PER_PAGE = 20;

const statusColors: Record<PartnerStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function PartnersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Fetch partners with pagination
  const { data, isLoading } = useQuery({
    queryKey: ["admin-partners", statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("partners")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: partners, count, error } = await query;
      if (error) throw error;

      return { partners: partners as Partner[], totalCount: count || 0 };
    },
  });

  // Fetch per-partner stats
  const { data: partnerStatsMap } = useQuery({
    queryKey: ["partner-individual-stats", data?.partners?.map(p => p.id)],
    queryFn: async () => {
      if (!data?.partners?.length) return {};

      const partnerIds = data.partners.map(p => p.id);
      
      // Fetch all invites for these partners
      const { data: invites } = await supabase
        .from("partner_invites")
        .select("partner_id, status")
        .in("partner_id", partnerIds)
        .neq("status", "draft");

      // Fetch all commissions for these partners
      const { data: commissions } = await supabase
        .from("partner_commissions")
        .select("partner_id, status, amount_eur, trigger_event");

      // Build stats map
      const statsMap: Record<string, PartnerStats> = {};
      
      partnerIds.forEach(partnerId => {
        const partnerInvites = invites?.filter(i => i.partner_id === partnerId) || [];
        const partnerCommissions = commissions?.filter(c => c.partner_id === partnerId) || [];
        
        statsMap[partnerId] = {
          partnerId,
          invitesSent: partnerInvites.length,
          registrations: partnerInvites.filter(i => i.status === "registered" || i.status === "converted").length,
          delivered: partnerCommissions.filter(c => c.trigger_event === "device_delivered").length,
          pendingCommission: partnerCommissions
            .filter(c => c.status === "pending_release")
            .reduce((sum, c) => sum + Number(c.amount_eur), 0),
          approvedCommission: partnerCommissions
            .filter(c => c.status === "approved")
            .reduce((sum, c) => sum + Number(c.amount_eur), 0),
          paidCommission: partnerCommissions
            .filter(c => c.status === "paid")
            .reduce((sum, c) => sum + Number(c.amount_eur), 0),
        };
      });
      
      return statsMap;
    },
    enabled: !!data?.partners?.length,
  });

  // Global stats
  const { data: globalStats } = useQuery({
    queryKey: ["partner-global-stats"],
    queryFn: async () => {
      const [partnersResult, activeResult, invitesResult, commissionsResult] = await Promise.all([
        supabase.from("partners").select("id", { count: "exact", head: true }),
        supabase.from("partners").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("partner_invites").select("id", { count: "exact", head: true }).neq("status", "draft"),
        supabase.from("partner_commissions").select("status, amount_eur"),
      ]);

      const paidTotal = commissionsResult.data
        ?.filter(c => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0;

      return {
        totalPartners: partnersResult.count || 0,
        activePartners: activeResult.count || 0,
        totalInvites: invitesResult.count || 0,
        totalPaid: paidTotal,
      };
    },
  });

  // Filter by search and date
  const filteredPartners = data?.partners?.filter((partner) => {
    // Search filter
    const matchesSearch =
      partner.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const createdDate = new Date(partner.created_at);
      const daysAgo = parseInt(dateFilter);
      matchesDate = isAfter(createdDate, subDays(new Date(), daysAgo));
    }

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil((data?.totalCount || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partners / Affiliates</h1>
          <p className="text-muted-foreground">
            Manage your partner network and track referral commissions
          </p>
        </div>
        <Button onClick={() => navigate("/admin/partners/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalPartners || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.activePartners || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats?.totalInvites || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid (EUR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{globalStats?.totalPaid?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as PartnerStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Partners</CardTitle>
          <CardDescription>
            View and manage all partner accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredPartners?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No partners found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Invites</TableHead>
                  <TableHead className="text-center">Registered</TableHead>
                  <TableHead className="text-center">Delivered</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners?.map((partner) => {
                  const stats = partnerStatsMap?.[partner.id];
                  return (
                    <TableRow
                      key={partner.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/partners/${partner.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{partner.contact_name}</div>
                          <div className="text-sm text-muted-foreground">{partner.email}</div>
                          {partner.company_name && (
                            <div className="text-xs text-muted-foreground">{partner.company_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {partner.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[partner.status]}>
                          {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stats?.invitesSent || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stats?.registrations || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{stats?.delivered || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-yellow-600 font-medium">
                          €{stats?.pendingCommission?.toFixed(0) || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-blue-600 font-medium">
                          €{stats?.approvedCommission?.toFixed(0) || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          €{stats?.paidCommission?.toFixed(0) || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(partner.created_at), "dd MMM yy")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, data?.totalCount || 0)} of {data?.totalCount || 0}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
