import { Phone, MessageCircle, ArrowRight, Calendar, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ClientDashboard() {
  const { memberId } = useAuth();
  const { t } = useTranslation();

  // Fetch member data
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ["member-dashboard", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase
        .from("members")
        .select("first_name, last_name")
        .eq("id", memberId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch device data
  const { data: device, isLoading: deviceLoading } = useQuery({
    queryKey: ["member-device", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("member_id", memberId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch subscription data
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["member-subscription", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("member_id", memberId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch emergency contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["member-emergency-contacts", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("member_id", memberId)
        .order("priority_order", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!memberId,
  });

  // Fetch recent alerts count
  const { data: alertsCount } = useQuery({
    queryKey: ["member-alerts-count", memberId],
    queryFn: async () => {
      if (!memberId) return 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .gte("received_at", thirtyDaysAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!memberId,
  });

  const currentDate = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const memberName = member?.first_name || t("common.member") || "Member";

  const formatPlanType = (type: string) => {
    return type === "single" ? "Single Person" : type === "couple" ? "Couple" : type;
  };

  const formatBillingFrequency = (freq: string) => {
    switch (freq) {
      case "monthly": return "/month";
      case "quarterly": return "/quarter";
      case "annual": return "/year";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        {memberLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("dashboard.welcomeBack")}, {memberName}
          </h1>
        )}
        <p className="text-muted-foreground text-sm">{currentDate}</p>
      </div>

      {/* Device Status */}
      {deviceLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : device ? (
        <DeviceStatusCard
          batteryLevel={device.battery_level || 0}
          isConnected={device.status === "active"}
          lastCheckIn={device.last_checkin_at ? new Date(device.last_checkin_at) : undefined}
          location={device.last_location_address || undefined}
        />
      ) : (
        <Card className="border-alert-battery/30 bg-alert-battery/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-alert-battery" />
            <div>
              <p className="font-medium">{t("dashboard.noDeviceAssigned") || "No device assigned"}</p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.contactSupportDevice") || "Please contact support to get your device set up."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact Card */}
      <Card className="bg-primary text-primary-foreground overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-lg font-semibold mb-1">{t("dashboard.needHelp") || "Need Help?"}</h2>
              <p className="text-primary-foreground/80 text-sm">
                {t("dashboard.emergencyTeamReady") || "Our 24/7 emergency response team is always ready to help"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="default" 
                variant="secondary"
                className="font-medium"
              >
                <Phone className="mr-2 h-4 w-4" />
                {t("dashboard.callIceAlarm") || "Call ICE Alarm"}
              </Button>
              <Button 
                size="default" 
                className="font-medium bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("navigation.subscription") || "Subscription"}</CardTitle>
              {subLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : subscription ? (
                <Badge variant="outline" className="bg-alert-resolved/10 text-alert-resolved border-alert-resolved/30 text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("common.active") || "Active"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {t("common.inactive") || "Inactive"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {subLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : subscription ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("common.plan") || "Plan"}</span>
                  <span className="font-medium">{formatPlanType(subscription.plan_type)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.nextPayment") || "Next Payment"}</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(subscription.renewal_date), "dd MMM yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("common.amount") || "Amount"}</span>
                  <span className="font-medium">€{subscription.amount}{formatBillingFrequency(subscription.billing_frequency)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dashboard.noActiveSubscription") || "No active subscription"}</p>
            )}
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link to="/dashboard/subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                {t("dashboard.manageSubscription") || "Manage Subscription"}
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("navigation.emergencyContacts") || "Emergency Contacts"}</CardTitle>
              {!contactsLoading && contacts && contacts.length > 0 && (
                <Badge variant="secondary" className="text-xs">{contacts.length} {t("common.contacts") || "contacts"}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactsLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.slice(0, 2).map((contact, index) => (
                  <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <span className="font-medium text-sm block">{contact.contact_name}</span>
                      <span className="text-xs text-muted-foreground">{contact.relationship}</span>
                    </div>
                    {index === 0 ? (
                      <Badge variant="secondary" className="text-xs">{t("common.primary") || "Primary"}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">{index + 1}{t("common.ordinalSuffix") || "nd"}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-alert-battery mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noEmergencyContacts") || "No emergency contacts added"}</p>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/dashboard/contacts">
                {t("dashboard.updateContacts") || "Update Contacts"}
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{alertsCount || 0}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.alertsLast30Days") || "Alerts (30 days)"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-alert-resolved">{contacts?.length || 0}</p>
            <p className="text-xs text-muted-foreground">{t("common.contacts") || "Contacts"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{device?.battery_level || 0}%</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.batteryLevel") || "Battery"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <div className={`h-2 w-2 rounded-full ${device?.status === "active" ? "bg-alert-resolved" : "bg-muted-foreground"}`} />
              <p className="text-sm font-medium">{device?.status === "active" ? t("common.online") || "Online" : t("common.offline") || "Offline"}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("dashboard.deviceStatus") || "Device"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card className="border-alert-checkin/30 bg-alert-checkin/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-alert-checkin/20 flex items-center justify-center shrink-0">
              <span className="text-base">📢</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{t("dashboard.serviceAnnouncement") || "Service Announcement"}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("dashboard.announcementText") || "We've upgraded our response system! Your alerts now reach our team 30% faster. Thank you for trusting ICE Alarm España with your safety."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}