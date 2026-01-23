import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Bell, 
  Smartphone, 
  ShoppingCart, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { LeadsWidget } from "@/components/dashboard/LeadsWidget";

interface DashboardStats {
  active_members: number;
  new_members_30d: number;
  active_alerts: number;
  devices_in_stock: number;
  devices_assigned: number;
  pending_orders: number;
  monthly_revenue: number;
  expiring_subscriptions: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();

  // Single RPC call replaces 7 separate queries
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 30000, // Refresh every 30s for alerts
  });

  // Fetch active alerts list (separate query for the detail cards)
  const { data: alertsData } = useQuery({
    queryKey: ["admin-alerts-list"],
    queryFn: async () => {
      const { data: alerts } = await supabase
        .from("alerts")
        .select("*")
        .in("status", ["incoming", "in_progress"])
        .order("received_at", { ascending: false })
        .limit(5);
      
      return alerts || [];
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 30000,
  });

  // Fetch recent activity
  const { data: activityData } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select(`
          *,
          staff:staff_id (first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('adminDashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('adminDashboard.welcome')}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/members/new">{t('adminDashboard.addMember')}</Link>
        </Button>
      </div>

      {/* Stats Grid - Now using single RPC data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.activeMembers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_members || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.new_members_30d ? (
                <>
                  <TrendingUp className="h-3 w-3 text-alert-resolved" />
                  <span className="text-alert-resolved">+{stats.new_members_30d}</span> {t('common.thisMonth')}
                </>
              ) : (
                t('common.noNewMembersThisMonth')
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.active_alerts ? "border-alert-sos/50 bg-alert-sos/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.activeAlerts')}</CardTitle>
            <Bell className={`h-4 w-4 ${stats?.active_alerts ? "text-alert-sos" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.active_alerts ? "text-alert-sos" : ""}`}>
              {stats?.active_alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_alerts ? t('common.requireAttention') : t('common.noActiveAlerts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.devices')}</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.devices_in_stock || 0} / {stats?.devices_assigned || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t('common.inStockAssigned')}</p>
          </CardContent>
        </Card>

        <Card className={stats?.pending_orders ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.pendingOrders')}</CardTitle>
            <ShoppingCart className={`h-4 w-4 ${stats?.pending_orders ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.pending_orders ? "text-amber-500" : ""}`}>
              {stats?.pending_orders || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t('common.needProcessing')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.revenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(stats?.monthly_revenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t('common.thisMonth')}</p>
          </CardContent>
        </Card>

        <Card className={stats?.expiring_subscriptions ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.expiringSoon')}</CardTitle>
            <Calendar className={`h-4 w-4 ${stats?.expiring_subscriptions ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.expiring_subscriptions ? "text-amber-500" : ""}`}>
              {stats?.expiring_subscriptions || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t('common.inNext30Days')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leads Widget */}
        <LeadsWidget variant="admin" />

        {/* Active Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('adminDashboard.activeAlerts')}</CardTitle>
              <CardDescription>{t('adminDashboard.alertsRequiringAttention')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/alerts">{t('common.viewAll')}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {alertsData && alertsData.length > 0 ? (
              <div className="space-y-3">
                {alertsData.slice(0, 4).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        alert.alert_type === "sos_button" || alert.alert_type === "fall_detected"
                          ? "bg-alert-sos/20 text-alert-sos"
                          : "bg-amber-500/20 text-amber-500"
                      }`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {alert.alert_type.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alert.received_at), "HH:mm - dd MMM")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.status === "incoming" ? "destructive" : "secondary"}>
                      {alert.status === "incoming" ? t('common.incoming') : t('common.inProgress')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>{t('common.noActiveAlerts')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminDashboard.recentActivity')}</CardTitle>
            <CardDescription>{t('adminDashboard.latestActions')}</CardDescription>
          </CardHeader>
          <CardContent>
            {activityData && activityData.length > 0 ? (
              <div className="space-y-3">
                {activityData.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.staff?.first_name} {activity.staff?.last_name}
                        </span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "HH:mm - dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>{t('common.noRecentActivity')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
