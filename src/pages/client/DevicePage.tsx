import { useMemberDevice, useMemberSubscription } from "@/hooks/useMemberProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Smartphone, 
  Battery, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Phone,
  MessageCircle,
  ShoppingCart,
  Wrench,
  RefreshCw
} from "lucide-react";

export default function DevicePage() {
  const { data: device, isLoading: deviceLoading } = useMemberDevice();
  const { data: subscription, isLoading: subLoading } = useMemberSubscription();

  const isLoading = deviceLoading || subLoading;
  const hasPendant = subscription?.has_pendant && device;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Phone-Only Member View
  if (!hasPendant) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Device</h1>
          <p className="text-muted-foreground mt-1">Phone-Only Service</p>
        </div>

        {/* Phone-Only Service Info */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Your Current Service
            </CardTitle>
            <CardDescription>
              You are using our Phone-Only membership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Contact us anytime using the number below. Save this in your phone for emergencies!
            </p>

            {/* Emergency Number */}
            <div className="p-6 bg-primary/5 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">ICE Alarm Emergency Number</p>
              <a 
                href="tel:+34950473199"
                className="text-3xl md:text-4xl font-bold text-primary hover:underline block"
              >
                +34 950 473 199
              </a>
              <Button 
                className="mt-4 bg-[#25D366] hover:bg-[#128C7E] text-white"
                size="lg"
                asChild
              >
                <a 
                  href="https://wa.me/34950473199" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What You're Missing */}
        <Card className="border-alert-battery/50 bg-alert-battery/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-alert-battery">
              <AlertTriangle className="h-5 w-5" />
              What You're Missing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">GPS Location</p>
                  <p className="text-sm text-muted-foreground">
                    We cannot track your location automatically
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Fall Detection</p>
                  <p className="text-sm text-muted-foreground">
                    Falls are not automatically detected
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">SOS Button</p>
                  <p className="text-sm text-muted-foreground">
                    You must call us manually
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Geo-Fencing</p>
                  <p className="text-sm text-muted-foreground">
                    No boundary alerts available
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardHeader>
            <CardTitle>Add a Pendant for Full Protection</CardTitle>
            <CardDescription>
              Get complete peace of mind with our GPS pendant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-primary/20 rounded-lg flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">ICE Alarm GPS Pendant</p>
                <p className="text-2xl font-bold text-primary">€151.25</p>
                <p className="text-sm text-muted-foreground">+ €14.99 shipping</p>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-alert-resolved" />
                <span>GPS Location Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-alert-resolved" />
                <span>Automatic Fall Detection</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-alert-resolved" />
                <span>One-touch SOS Button</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-alert-resolved" />
                <span>Two-way Voice Communication</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-alert-resolved" />
                <span>Geo-Fencing Alerts</span>
              </div>
            </div>

            <Button size="lg" className="w-full touch-target">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Purchase Pendant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has Pendant View
  const batteryLevel = device?.battery_level || 0;
  const isConnected = device?.status === "active";
  const lastCheckin = device?.last_checkin_at 
    ? new Date(device.last_checkin_at) 
    : null;

  const getBatteryColor = () => {
    if (batteryLevel <= 20) return "text-destructive";
    if (batteryLevel <= 50) return "text-alert-battery";
    return "text-alert-resolved";
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Pendant</h1>
        <p className="text-muted-foreground mt-1">Your ICE Alarm GPS Personal Pendant</p>
      </div>

      {/* Device Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 bg-primary/10 rounded-xl flex items-center justify-center">
              <Smartphone className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">ICE Alarm GPS Pendant</h3>
                <Badge 
                  variant={isConnected ? "default" : "destructive"}
                  className={isConnected ? "bg-alert-resolved" : ""}
                >
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>

              {/* Battery */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
                    Battery
                  </span>
                  <span className={`font-medium ${getBatteryColor()}`}>
                    {batteryLevel}%
                  </span>
                </div>
                <Progress 
                  value={batteryLevel} 
                  className="h-2"
                />
              </div>

              {/* Last Check-in */}
              {lastCheckin && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last check-in: {formatRelativeTime(lastCheckin)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SIM Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Device Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">SIM Phone Number</span>
            <span className="font-medium">{device?.sim_phone_number}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Device Type</span>
            <span className="font-medium capitalize">{device?.device_type}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">IMEI</span>
            <span className="font-mono text-sm">{device?.imei}</span>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Features</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-alert-resolved/10">
            <CheckCircle className="h-5 w-5 text-alert-resolved" />
            <div>
              <p className="font-medium">GPS Location Finder</p>
              <p className="text-sm text-muted-foreground">Your location is being monitored</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-alert-resolved/10">
            <CheckCircle className="h-5 w-5 text-alert-resolved" />
            <div>
              <p className="font-medium">SOS 2-Way Communications</p>
              <p className="text-sm text-muted-foreground">Speak directly with our team</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-alert-resolved/10">
            <CheckCircle className="h-5 w-5 text-alert-resolved" />
            <div>
              <p className="font-medium">Fall Detection</p>
              <p className="text-sm text-muted-foreground">Automatic alerts if you fall</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-alert-resolved/10">
            <CheckCircle className="h-5 w-5 text-alert-resolved" />
            <div>
              <p className="font-medium">Geo-Fencing</p>
              <p className="text-sm text-muted-foreground">Boundary monitoring active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Your Pendant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Press and hold the SOS button for 3 seconds</p>
              <p className="text-sm text-muted-foreground">
                The pendant will vibrate to confirm
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Our team will respond immediately</p>
              <p className="text-sm text-muted-foreground">
                We'll speak to you through the pendant
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Speak clearly into the device</p>
              <p className="text-sm text-muted-foreground">
                Tell us what help you need
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-3 md:grid-cols-2">
        <Button variant="outline" className="touch-target">
          <Wrench className="mr-2 h-4 w-4" />
          Report Device Issue
        </Button>
        <Button variant="outline" className="touch-target">
          <RefreshCw className="mr-2 h-4 w-4" />
          Request Replacement
        </Button>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
