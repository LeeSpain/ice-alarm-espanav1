import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerData } from "@/hooks/usePartnerData";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Filter } from "lucide-react";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type CommissionStatus = Database["public"]["Enums"]["commission_status"];

const statusColors: Record<CommissionStatus, string> = {
  pending_release: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function PartnerCommissionsPage() {
  const { isStaff, staffRole } = useAuth();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "all">("all");

  // Admin view mode detection
  const isAdminRole = isStaff && (staffRole === "admin" || staffRole === "super_admin");
  const partnerIdParam = searchParams.get("partnerId");
  const isAdminViewMode = isAdminRole && !!partnerIdParam;

  const { data: partner, isLoading: partnerLoading } = usePartnerData(
    isAdminViewMode ? partnerIdParam : undefined
  );

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ["partner-commissions", partner?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("partner_commissions")
        .select("*")
        .eq("partner_id", partner!.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!partner?.id,
  });

  const totals = {
    pending: commissions
      ?.filter((c) => c.status === "pending_release")
      .reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
    approved: commissions
      ?.filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
    paid: commissions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount_eur), 0) || 0,
  };

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commissions</h1>
        <p className="text-muted-foreground">
          {isAdminViewMode 
            ? `Viewing ${partner?.contact_name}'s commissions`
            : "Track your earnings from successful referrals"
          }
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Release</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              €{totals.pending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              7-day hold after device delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              €{totals.approved.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{totals.paid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>All referral commissions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as CommissionStatus | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_release">Pending Release</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {commissionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : commissions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No commissions yet</p>
              <p className="text-sm">
                Commissions are created when referrals receive their pendant
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Trigger Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions?.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-bold">
                      €{Number(commission.amount_eur).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {commission.trigger_event.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[commission.status]}>
                        {commission.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {commission.trigger_at
                        ? format(new Date(commission.trigger_at), "dd MMM yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {commission.release_at
                        ? format(new Date(commission.release_at), "dd MMM yyyy")
                        : "-"}
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
    </div>
  );
}
