import { useMemberAlerts } from "@/hooks/useMemberProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2,
  Bell, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  Battery, 
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

const ALERT_CONFIG = {
  sos_button: { 
    icon: AlertTriangle, 
    label: "SOS Alert", 
    color: "bg-alert-sos text-alert-sos-foreground" 
  },
  fall_detected: { 
    icon: Activity, 
    label: "Fall Detected", 
    color: "bg-alert-fall text-alert-fall-foreground" 
  },
  geo_fence: { 
    icon: MapPin, 
    label: "Geo-Fence Alert", 
    color: "bg-alert-battery text-alert-battery-foreground" 
  },
  low_battery: { 
    icon: Battery, 
    label: "Low Battery", 
    color: "bg-alert-checkin text-alert-checkin-foreground" 
  },
  check_in: { 
    icon: CheckCircle, 
    label: "Check-in", 
    color: "bg-muted text-muted-foreground" 
  },
};

export default function AlertHistoryPage() {
  const { data: alerts, isLoading } = useMemberAlerts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alert History</h1>
          <p className="text-muted-foreground mt-1">Your past alerts and responses</p>
        </div>
      </div>

      {!alerts || alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Alert History</h3>
            <p className="text-muted-foreground">
              Your alert history will appear here when you use your pendant.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.alert_type as keyof typeof ALERT_CONFIG] 
              || ALERT_CONFIG.check_in;
            const Icon = config.icon;
            const isResolved = alert.status === "resolved";

            return (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-semibold">{config.label}</h4>
                        <Badge 
                          variant={isResolved ? "default" : "secondary"}
                          className={isResolved ? "bg-alert-resolved" : ""}
                        >
                          {isResolved ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              {alert.status}
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(alert.received_at), "EEEE, dd MMMM yyyy 'at' HH:mm")}
                      </p>
                      {alert.location_address && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{alert.location_address}</span>
                        </p>
                      )}
                      {isResolved && alert.resolved_at && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          Resolved at {format(new Date(alert.resolved_at), "HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
