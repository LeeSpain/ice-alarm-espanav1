import { useQuery } from "@tanstack/react-query";
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
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function AdminDashboard() {
  // Fetch active members count
  const { data: membersData } = useQuery({
    queryKey: ["admin-stats-members"],
    queryFn: async () => {
      const { count: activeCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      
      const lastMonth = subDays(new Date(), 30);
      const { count: newCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonth.toISOString());
      
      return { activeCount: activeCount || 0, newCount: newCount || 0 };
    },
  });

  // Fetch active alerts
  const { data: alertsData } = useQuery({
    queryKey: ["admin-stats-alerts"],
    queryFn: async () => {
      const { data: alerts, count } = await supabase
        .from("alerts")
        .select("*", { count: "exact" })
        .in("status", ["incoming", "in_progress"])
        .order("received_at", { ascending: false })
        .limit(5);
      
      return { alerts: alerts || [], count: count || 0 };
    },
    refetchInterval: 30000,
  });

  // Fetch devices stats
  const { data: devicesData } = useQuery({
    queryKey: ["admin-stats-devices"],
    queryFn: async () => {
      const { count: inStock } = await supabase
        .from("devices")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_stock");
      
      const { count: assigned } = await supabase
        .from("devices")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      
      return { inStock: inStock || 0, assigned: assigned || 0 };
    },
  });

  // Fetch pending orders
  const { data: ordersData } = useQuery({
    queryKey: ["admin-stats-orders"],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "processing"]);
      
      return count || 0;
    },
  });

  // Fetch this month's revenue
  const { data: revenueData } = useQuery({
    queryKey: ["admin-stats-revenue"],
    queryFn: async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("paid_at", start.toISOString())
        .lte("paid_at", end.toISOString());
      
      const total = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return total;
    },
  });

  // Fetch expiring subscriptions
  const { data: expiringData } = useQuery({
    queryKey: ["admin-stats-expiring"],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .lte("renewal_date", thirtyDaysFromNow.toISOString().split("T")[0]);
      
      return count || 0;
    },
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
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of ICE Alarm España.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/members/new">Add Member</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersData?.activeCount || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {membersData?.newCount ? (
                <>
                  <TrendingUp className="h-3 w-3 text-alert-resolved" />
                  <span className="text-alert-resolved">+{membersData.newCount}</span> this month
                </>
              ) : (
                "No new members this month"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={alertsData?.count ? "border-alert-sos/50 bg-alert-sos/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className={`h-4 w-4 ${alertsData?.count ? "text-alert-sos" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${alertsData?.count ? "text-alert-sos" : ""}`}>
              {alertsData?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {alertsData?.count ? "Require attention" : "No active alerts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devicesData?.inStock || 0} / {devicesData?.assigned || 0}
            </div>
            <p className="text-xs text-muted-foreground">In Stock / Assigned</p>
          </CardContent>
        </Card>

        <Card className={ordersData ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className={`h-4 w-4 ${ordersData ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ordersData ? "text-amber-500" : ""}`}>
              {ordersData || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(revenueData || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className={expiringData ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className={`h-4 w-4 ${expiringData ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${expiringData ? "text-amber-500" : ""}`}>
              {expiringData || 0}
            </div>
            <p className="text-xs text-muted-foreground">In next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Alerts requiring attention</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/alerts">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {alertsData?.alerts && alertsData.alerts.length > 0 ? (
              <div className="space-y-3">
                {alertsData.alerts.map((alert: any) => (
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
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active alerts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions by staff members</CardDescription>
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
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
