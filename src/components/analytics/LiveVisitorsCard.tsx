import { useLiveVisitors } from "@/hooks/useLiveVisitors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Radio, Monitor, Smartphone, Tablet, Globe, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveVisitorsCard() {
  const { activeNow, last5min, last15min, activeSessions, isLoading } = useLiveVisitors(10000);

  const DeviceIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "desktop": return <Monitor className="h-3 w-3" />;
      case "mobile": return <Smartphone className="h-3 w-3" />;
      case "tablet": return <Tablet className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  };

  return (
    <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Now
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Radio className="h-4 w-4 text-green-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Real-time visitor tracking</p>
                <p className="text-xs text-muted-foreground">Updates every 10 seconds</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Visitors currently on your site</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main live count */}
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-4xl font-bold transition-all",
              activeNow > 0 ? "text-green-500" : "text-muted-foreground"
            )}>
              {isLoading ? "..." : activeNow}
            </span>
            <span className="text-sm text-muted-foreground">
              {activeNow === 1 ? "visitor" : "visitors"} right now
            </span>
          </div>

          {/* Time breakdown */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Last 5min:</span>
              <span className="font-medium">{last5min}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Last 15min:</span>
              <span className="font-medium">{last15min}</span>
            </div>
          </div>

          {/* Active sessions preview */}
          {activeSessions.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Pages
              </p>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                {activeSessions.slice(0, 5).map((session, i) => (
                  <div 
                    key={session.visitor_id} 
                    className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50"
                  >
                    <DeviceIcon type={session.device_type} />
                    <span className="flex-1 truncate font-medium">
                      {session.page_path}
                    </span>
                    {session.country_name && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {session.country_name}
                      </Badge>
                    )}
                  </div>
                ))}
                {activeSessions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{activeSessions.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && activeNow === 0 && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No active visitors right now
              </p>
              <p className="text-xs text-muted-foreground">
                Check back soon!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
