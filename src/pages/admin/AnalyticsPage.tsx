import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  Users, 
  Eye, 
  MousePointerClick,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  Clock,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LiveVisitorsCard } from "@/components/analytics/LiveVisitorsCard";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d";

// Stat card component for consistent styling
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  className 
}: { 
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend && trendValue && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium",
                trend === "up" && "bg-green-500/10 text-green-600",
                trend === "down" && "bg-red-500/10 text-red-600"
              )}
            >
              {trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trendValue}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const getDaysFromRange = (range: DateRange): number => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
    }
  };

  const startDate = startOfDay(subDays(new Date(), getDaysFromRange(dateRange)));
  const endDate = endOfDay(new Date());

  // Fetch website events data
  const { data: eventsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["website-analytics", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_events")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate KPIs
  const uniqueVisitors = new Set(eventsData?.map(e => e.visitor_id).filter(Boolean)).size;
  const pageViews = eventsData?.filter(e => e.event_type === "page_view").length || 0;
  const sessions = new Set(eventsData?.map(e => e.session_id).filter(Boolean)).size;
  
  // Calculate bounce rate (sessions with only 1 page view)
  const sessionPageCounts: Record<string, number> = {};
  eventsData?.filter(e => e.event_type === "page_view").forEach(e => {
    if (e.session_id) {
      sessionPageCounts[e.session_id] = (sessionPageCounts[e.session_id] || 0) + 1;
    }
  });
  const bouncedSessions = Object.values(sessionPageCounts).filter(count => count === 1).length;
  const bounceRate = sessions > 0 ? (bouncedSessions / sessions) * 100 : 0;

  // Average pages per session
  const avgPagesPerSession = sessions > 0 ? (pageViews / sessions).toFixed(1) : "0";

  // Top pages
  const pageViewCounts: Record<string, number> = {};
  eventsData?.filter(e => e.event_type === "page_view").forEach(e => {
    if (e.page_path) {
      pageViewCounts[e.page_path] = (pageViewCounts[e.page_path] || 0) + 1;
    }
  });
  const topPages = Object.entries(pageViewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, views, percent: (views / pageViews) * 100 }));

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  eventsData?.forEach(e => {
    const device = e.device_type || "unknown";
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const totalDeviceEvents = Object.values(deviceCounts).reduce((a, b) => a + b, 0);
  const deviceData = Object.entries(deviceCounts)
    .map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value,
      percent: totalDeviceEvents > 0 ? ((value / totalDeviceEvents) * 100).toFixed(1) : "0"
    }))
    .sort((a, b) => b.value - a.value);

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  eventsData?.forEach(e => {
    const browser = e.browser || "Other";
    browserCounts[browser] = (browserCounts[browser] || 0) + 1;
  });
  const browserData = Object.entries(browserCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Country breakdown
  const countryCounts: Record<string, { count: number; name: string }> = {};
  eventsData?.forEach(e => {
    if (e.country_code) {
      if (!countryCounts[e.country_code]) {
        countryCounts[e.country_code] = { count: 0, name: e.country_name || e.country_code };
      }
      countryCounts[e.country_code].count++;
    }
  });
  const totalCountryEvents = Object.values(countryCounts).reduce((sum, c) => sum + c.count, 0);
  const countryData = Object.entries(countryCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([code, data]) => ({ 
      code, 
      name: data.name, 
      count: data.count,
      percent: totalCountryEvents > 0 ? ((data.count / totalCountryEvents) * 100).toFixed(1) : "0"
    }));

  // Traffic sources (from referrer)
  const sourceCounts: Record<string, number> = { direct: 0, organic: 0, referral: 0, social: 0 };
  eventsData?.filter(e => e.event_type === "page_view").forEach(e => {
    if (!e.referrer || e.referrer === "") {
      sourceCounts.direct++;
    } else if (e.referrer.includes("google") || e.referrer.includes("bing") || e.referrer.includes("yahoo")) {
      sourceCounts.organic++;
    } else if (e.referrer.includes("facebook") || e.referrer.includes("twitter") || e.referrer.includes("instagram") || e.referrer.includes("linkedin")) {
      sourceCounts.social++;
    } else {
      sourceCounts.referral++;
    }
  });
  const sourceData = [
    { name: "Direct", value: sourceCounts.direct, color: "hsl(var(--primary))" },
    { name: "Organic Search", value: sourceCounts.organic, color: "hsl(var(--chart-2))" },
    { name: "Referral", value: sourceCounts.referral, color: "hsl(var(--chart-3))" },
    { name: "Social", value: sourceCounts.social, color: "hsl(var(--chart-4))" },
  ].filter(s => s.value > 0);

  // Daily traffic chart data
  const dailyData: Record<string, { date: string; visitors: Set<string>; pageViews: number }> = {};
  eventsData?.forEach(e => {
    const date = format(new Date(e.created_at), "MMM dd");
    if (!dailyData[date]) {
      dailyData[date] = { date, visitors: new Set(), pageViews: 0 };
    }
    if (e.visitor_id) dailyData[date].visitors.add(e.visitor_id);
    if (e.event_type === "page_view") dailyData[date].pageViews++;
  });
  const chartData = Object.values(dailyData)
    .map(d => ({ date: d.date, visitors: d.visitors.size, pageViews: d.pageViews }))
    .reverse();

  // UTM Campaigns
  const campaignData: Record<string, { source: string; medium: string; campaign: string; visits: number }> = {};
  eventsData?.filter(e => e.utm_source).forEach(e => {
    const key = `${e.utm_source || "-"}|${e.utm_medium || "-"}|${e.utm_campaign || "-"}`;
    if (!campaignData[key]) {
      campaignData[key] = {
        source: e.utm_source || "-",
        medium: e.utm_medium || "-",
        campaign: e.utm_campaign || "-",
        visits: 0
      };
    }
    campaignData[key].visits++;
  });
  const campaigns = Object.values(campaignData).sort((a, b) => b.visits - a.visits).slice(0, 10);

  const DEVICE_COLORS: Record<string, string> = {
    Desktop: "hsl(var(--primary))",
    Mobile: "hsl(var(--chart-2))",
    Tablet: "hsl(var(--chart-3))",
    Unknown: "hsl(var(--muted-foreground))"
  };

  const DeviceIcon = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
      case "desktop": return <Monitor className="h-4 w-4" />;
      case "mobile": return <Smartphone className="h-4 w-4" />;
      case "tablet": return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const chartConfig = {
    visitors: { label: "Visitors", color: "hsl(var(--primary))" },
    pageViews: { label: "Page Views", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-6">
      {/* Page Header - Professional gradient banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Website Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Real-time insights for ICE Alarm España
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <TabsList className="bg-background/80 backdrop-blur">
                <TabsTrigger value="7d" className="text-xs">7 days</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs">30 days</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()}
              className={cn(isFetching && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -right-4 -bottom-8 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {/* Live Visitors - Prominent first position */}
        <div className="col-span-2 lg:col-span-1">
          <LiveVisitorsCard />
        </div>

        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Unique Visitors"
              value={uniqueVisitors.toLocaleString()}
              subtitle={`Last ${getDaysFromRange(dateRange)} days`}
              icon={Users}
            />
            <StatCard
              title="Page Views"
              value={pageViews.toLocaleString()}
              subtitle="Total pages viewed"
              icon={Eye}
            />
            <StatCard
              title="Sessions"
              value={sessions.toLocaleString()}
              subtitle="User sessions"
              icon={MousePointerClick}
            />
            <StatCard
              title="Bounce Rate"
              value={`${bounceRate.toFixed(1)}%`}
              subtitle="Single page visits"
              icon={bounceRate > 50 ? TrendingUp : TrendingDown}
              trend={bounceRate > 50 ? "down" : "up"}
              trendValue={bounceRate <= 50 ? "Good" : "High"}
            />
            <StatCard
              title="Pages/Session"
              value={avgPagesPerSession}
              subtitle="Avg. engagement"
              icon={Target}
            />
          </>
        )}
      </div>

      {/* Traffic Overview Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Traffic Overview</CardTitle>
              <CardDescription>Visitors and page views over time</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Visitors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-2" />
                <span className="text-muted-foreground">Page Views</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorVisitors)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#colorPageViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">No traffic data yet</p>
              <p className="text-sm">Start tracking to see analytics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Second Row: Top Pages & Traffic Sources */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Top Pages - Wider */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages on your website</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((page, index) => (
                  <div key={page.path} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground w-5">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {page.path === "/" ? "Homepage" : page.path}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold">{page.views}</span>
                        <Badge variant="secondary" className="text-xs">
                          {page.percent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={page.percent} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <p>No page data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Traffic Sources
            </CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Visits']}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--background))'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sourceData.map((source) => {
                    const total = sourceData.reduce((sum, s) => sum + s.value, 0);
                    const percent = ((source.value / total) * 100).toFixed(0);
                    return (
                      <div key={source.name} className="flex items-center gap-2 text-sm">
                        <div 
                          className="h-2.5 w-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="truncate text-muted-foreground">{source.name}</span>
                        <span className="font-medium ml-auto">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                <p>No source data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Countries, Devices & Browsers */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Visitor Countries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Countries
            </CardTitle>
            <CardDescription>Geographic distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <div className="space-y-3">
                {countryData.map((country, index) => (
                  <div key={country.code} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{country.name}</span>
                        <span className="text-xs text-muted-foreground">{country.percent}%</span>
                      </div>
                      <Progress value={parseFloat(country.percent)} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <p>No location data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Devices
            </CardTitle>
            <CardDescription>Visitor device types</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <div className="space-y-4">
                {deviceData.map((device) => (
                  <div key={device.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${DEVICE_COLORS[device.name] || DEVICE_COLORS.Unknown}20` }}
                        >
                          <DeviceIcon type={device.name} />
                        </div>
                        <span className="font-medium">{device.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{device.value.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">({device.percent}%)</span>
                      </div>
                    </div>
                    <Progress 
                      value={parseFloat(device.percent)} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <p>No device data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Browsers
            </CardTitle>
            <CardDescription>Most used browsers</CardDescription>
          </CardHeader>
          <CardContent>
            {browserData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browserData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <p>No browser data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UTM Campaign Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Campaign Performance</CardTitle>
                <CardDescription>UTM-tagged marketing campaigns</CardDescription>
              </div>
            </div>
            {campaigns.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {campaigns.length} active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Source</TableHead>
                    <TableHead className="font-semibold">Medium</TableHead>
                    <TableHead className="font-semibold">Campaign</TableHead>
                    <TableHead className="text-right font-semibold">Visits</TableHead>
                    <TableHead className="text-right font-semibold">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign, index) => {
                    const totalCampaignVisits = campaigns.reduce((sum, c) => sum + c.visits, 0);
                    const share = ((campaign.visits / totalCampaignVisits) * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {campaign.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{campaign.medium}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {campaign.campaign}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{campaign.visits}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {share}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground">No UTM-tagged traffic yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add <code className="bg-muted px-1.5 py-0.5 rounded text-xs">?utm_source=...</code> to your URLs to track campaigns
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
