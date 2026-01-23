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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Tooltip
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type DateRange = "7d" | "30d" | "90d";

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
  const { data: eventsData, isLoading, refetch } = useQuery({
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

  // Top pages
  const pageViewCounts: Record<string, number> = {};
  eventsData?.filter(e => e.event_type === "page_view").forEach(e => {
    if (e.page_path) {
      pageViewCounts[e.page_path] = (pageViewCounts[e.page_path] || 0) + 1;
    }
  });
  const topPages = Object.entries(pageViewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  eventsData?.forEach(e => {
    const device = e.device_type || "unknown";
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

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
  const countryData = Object.entries(countryCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([code, data]) => ({ code, name: data.name, count: data.count }));

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
    { name: "Organic", value: sourceCounts.organic, color: "hsl(var(--chart-2))" },
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

  const DEVICE_COLORS = {
    desktop: "hsl(var(--primary))",
    mobile: "hsl(var(--chart-2))",
    tablet: "hsl(var(--chart-3))",
    unknown: "hsl(var(--muted-foreground))"
  };

  const DeviceIcon = ({ type }: { type: string }) => {
    switch (type) {
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Analytics</h1>
          <p className="text-muted-foreground">
            Visitor insights and traffic data for ICE Alarm España
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 days</TabsTrigger>
              <TabsTrigger value="30d">30 days</TabsTrigger>
              <TabsTrigger value="90d">90 days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In the last {getDaysFromRange(dateRange)} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total pages viewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total user sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            {bounceRate > 50 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-alert-resolved" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Single page sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>Visitors and page views over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stackId="2"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              {isLoading ? "Loading..." : "No data available yet. Start tracking to see analytics."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Second Row: Top Pages & Traffic Sources */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages on your website</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.map((page) => (
                    <TableRow key={page.path}>
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {page.path}
                      </TableCell>
                      <TableCell className="text-right">{page.views}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No page data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No source data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Countries & Devices */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Visitor Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Visitor Countries
            </CardTitle>
            <CardDescription>Geographic distribution of visitors</CardDescription>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Visitors</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countryData.map((country) => {
                    const total = countryData.reduce((sum, c) => sum + c.count, 0);
                    const percent = ((country.count / total) * 100).toFixed(1);
                    return (
                      <TableRow key={country.code}>
                        <TableCell className="font-medium">{country.name}</TableCell>
                        <TableCell className="text-right">{country.count}</TableCell>
                        <TableCell className="text-right">{percent}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No location data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Types of devices visitors use</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <div className="space-y-4">
                {deviceData.map((device) => {
                  const total = deviceData.reduce((sum, d) => sum + d.value, 0);
                  const percent = (device.value / total) * 100;
                  return (
                    <div key={device.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DeviceIcon type={device.name} />
                          <span className="capitalize font-medium">{device.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {device.value} ({percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all rounded-full"
                          style={{ 
                            width: `${percent}%`,
                            backgroundColor: DEVICE_COLORS[device.name as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.unknown
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No device data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UTM Campaign Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>UTM-tagged campaign traffic breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsData && eventsData.some(e => e.utm_source) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const campaigns: Record<string, number> = {};
                  eventsData.filter(e => e.utm_source).forEach(e => {
                    const key = `${e.utm_source || "-"}|${e.utm_medium || "-"}|${e.utm_campaign || "-"}`;
                    campaigns[key] = (campaigns[key] || 0) + 1;
                  });
                  return Object.entries(campaigns)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([key, count]) => {
                      const [source, medium, campaign] = key.split("|");
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{source}</TableCell>
                          <TableCell>{medium}</TableCell>
                          <TableCell>{campaign}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      );
                    });
                })()}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground">
              No UTM-tagged traffic yet. Add ?utm_source=... to your URLs to track campaigns.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
