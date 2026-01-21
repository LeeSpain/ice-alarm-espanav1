import { Users, Smartphone, Bell, DollarSign, CreditCard, AlertTriangle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockActivities = [
  {
    id: "1",
    type: "member_added" as const,
    description: "New member María García registered",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: "Admin",
  },
  {
    id: "2",
    type: "alert_resolved" as const,
    description: "SOS alert for Juan López resolved",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: "Maria Lopez",
  },
  {
    id: "3",
    type: "device_assigned" as const,
    description: "Device #ICE-2048 assigned to Pedro Sanchez",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    user: "Admin",
  },
  {
    id: "4",
    type: "payment_received" as const,
    description: "Payment of €29.99 received from Ana Ruiz",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
  },
  {
    id: "5",
    type: "member_updated" as const,
    description: "Medical info updated for Carlos Fernández",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    user: "Carlos Fernández",
  },
];

const mockAlerts = [
  {
    id: "1",
    type: "sos_button" as const,
    status: "incoming" as const,
    memberName: "Antonio Ruiz",
    location: "Calle Mayor 42, Albox, Almería",
    medicalConditions: ["Diabetes", "Heart condition"],
    receivedAt: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: "2",
    type: "fall_detected" as const,
    status: "in_progress" as const,
    memberName: "Carmen Vega",
    location: "Avenida del Sol 15, Mojácar",
    medicalConditions: ["Arthritis"],
    receivedAt: new Date(Date.now() - 1000 * 60 * 15),
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of ICE Alarm España operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Active Members"
          value="1,284"
          change={{ value: 12, trend: "up" }}
          icon={Users}
        />
        <StatsCard
          title="Active Alerts"
          value="2"
          icon={Bell}
          variant="alert"
        />
        <StatsCard
          title="Devices In Stock"
          value="48"
          icon={Smartphone}
        />
        <StatsCard
          title="Revenue This Month"
          value="€38,420"
          change={{ value: 8, trend: "up" }}
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Subscriptions Expiring (30 days)"
          value="23"
          icon={CreditCard}
          variant="warning"
        />
        <StatsCard
          title="Devices Assigned"
          value="1,236"
          icon={Smartphone}
        />
        <StatsCard
          title="Alerts Today"
          value="7"
          icon={AlertTriangle}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Active Alerts</CardTitle>
              <Button variant="outline" size="sm">
                View All Alerts
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  {...alert}
                  onClaim={() => console.log("Claim alert:", alert.id)}
                />
              ))}
              {mockAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={mockActivities} />
        </div>
      </div>
    </div>
  );
}
