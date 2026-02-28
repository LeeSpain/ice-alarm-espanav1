import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Bell,
  Battery,
  MapPin,
  Phone,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 20;

const alertTypeIcons: Record<string, React.ElementType> = {
  sos_button: AlertTriangle,
  fall_detected: Activity,
  low_battery: Battery,
  geo_fence: MapPin,
  check_in: Bell,
  manual: Phone,
};

export default function AlertsPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-alerts", statusFilter, typeFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select(`
          *,
          member:member_id (id, first_name, last_name, email, phone),
          claimed_staff:claimed_by (first_name, last_name)
        `, { count: "exact" })
        .order("received_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "incoming" | "in_progress" | "resolved" | "escalated");
      }

      if (typeFilter !== "all") {
        query = query.eq("alert_type", typeFilter as "sos_button" | "fall_detected" | "low_battery" | "geo_fence" | "check_in" | "manual");
      }

      const { data: alerts, count, error } = await query;
      if (error) throw error;

      return { alerts: alerts || [], totalCount: count || 0 };
    },
    refetchInterval: 30000,
  });

  const totalPages = Math.ceil((data?.totalCount || 0) / ITEMS_PER_PAGE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "incoming":
        return <Badge variant="destructive" className="animate-pulse">{t("adminAlerts.incoming", "Incoming")}</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">{t("adminAlerts.inProgress", "In Progress")}</Badge>;
      case "resolved":
        return <Badge className="bg-alert-resolved text-alert-resolved-foreground">{t("adminAlerts.resolved", "Resolved")}</Badge>;
      case "escalated":
        return <Badge variant="destructive">{t("adminAlerts.escalated", "Escalated")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const Icon = alertTypeIcons[type] || Bell;
    const isCritical = type === "sos_button" || type === "fall_detected";
    
    return (
      <div className={`flex items-center gap-2 ${isCritical ? "text-alert-sos" : "text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
        <span className="capitalize">{type.replace("_", " ")}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminAlerts.title", "Alerts History")}</h1>
          <p className="text-muted-foreground">
            {t("adminAlerts.subtitle", "View and manage all alert records.")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("adminAlerts.allStatus", "All Status")}</SelectItem>
                <SelectItem value="incoming">{t("adminAlerts.incoming", "Incoming")}</SelectItem>
                <SelectItem value="in_progress">{t("adminAlerts.inProgress", "In Progress")}</SelectItem>
                <SelectItem value="resolved">{t("adminAlerts.resolved", "Resolved")}</SelectItem>
                <SelectItem value="escalated">{t("adminAlerts.escalated", "Escalated")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("adminAlerts.allTypes", "All Types")}</SelectItem>
                <SelectItem value="sos_button">{t("adminAlerts.sosButton", "SOS Button")}</SelectItem>
                <SelectItem value="fall_detected">{t("adminAlerts.fallDetected", "Fall Detected")}</SelectItem>
                <SelectItem value="low_battery">{t("adminAlerts.lowBattery", "Low Battery")}</SelectItem>
                <SelectItem value="geo_fence">{t("adminAlerts.geoFence", "Geo-fence")}</SelectItem>
                <SelectItem value="check_in">{t("adminAlerts.checkIn", "Check-in")}</SelectItem>
                <SelectItem value="manual">{t("adminAlerts.manual", "Manual")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adminAlerts.member", "Member")}</TableHead>
                <TableHead>{t("adminAlerts.type", "Type")}</TableHead>
                <TableHead>{t("common.status", "Status")}</TableHead>
                <TableHead>{t("adminAlerts.received", "Received")}</TableHead>
                <TableHead>{t("adminAlerts.resolvedAt", "Resolved")}</TableHead>
                <TableHead>{t("adminAlerts.handledBy", "Handled By")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {t("adminAlerts.loading", "Loading alerts...")}
                  </TableCell>
                </TableRow>
              ) : data?.alerts && data.alerts.length > 0 ? (
                data.alerts.map((alert: any) => (
                  <TableRow 
                    key={alert.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${
                      alert.status === "incoming" ? "bg-alert-sos/5" : ""
                    }`}
                    onClick={() => navigate(`/admin/members/${alert.member_id}`)}
                  >
                    <TableCell>
                      {alert.member ? (
                        <div>
                          <p className="font-medium">{alert.member.first_name} {alert.member.last_name}</p>
                          <p className="text-sm text-muted-foreground">{alert.member.phone}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t("adminAlerts.unknown", "Unknown")}</span>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(alert.alert_type)}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>
                      {format(new Date(alert.received_at), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      {alert.resolved_at 
                        ? format(new Date(alert.resolved_at), "dd MMM yyyy, HH:mm")
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      {alert.claimed_staff ? (
                        `${alert.claimed_staff.first_name} ${alert.claimed_staff.last_name}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("adminAlerts.noAlerts", "No alerts found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, data?.totalCount || 0)} of {data?.totalCount || 0} alerts
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
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
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
