import { useState } from "react";
import { Search, Filter, Clock, AlertTriangle, Battery, CheckCircle, PhoneCall } from "lucide-react";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Mock alerts data
const mockAlerts = [
  {
    id: "1",
    type: "sos_button" as const,
    status: "incoming" as const,
    memberName: "María García",
    location: "Calle Mayor 42, Albox, Almería",
    medicalConditions: ["Diabetes", "Heart condition", "High blood pressure"],
    receivedAt: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: "2",
    type: "fall_detected" as const,
    status: "incoming" as const,
    memberName: "Antonio Ruiz",
    location: "Avenida del Sol 15, Mojácar, Almería",
    medicalConditions: ["Arthritis"],
    receivedAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "3",
    type: "sos_button" as const,
    status: "in_progress" as const,
    memberName: "Carmen Vega",
    location: "Plaza España 8, Vera, Almería",
    medicalConditions: ["Asthma"],
    receivedAt: new Date(Date.now() - 1000 * 60 * 12),
  },
  {
    id: "4",
    type: "low_battery" as const,
    status: "incoming" as const,
    memberName: "Pedro Fernández",
    location: "Calle Luna 22, Garrucha, Almería",
    receivedAt: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    id: "5",
    type: "check_in" as const,
    status: "resolved" as const,
    memberName: "Isabel Martínez",
    location: "Calle del Mar 5, Carboneras, Almería",
    receivedAt: new Date(Date.now() - 1000 * 60 * 45),
  },
];

type TabValue = "all" | "incoming" | "in_progress" | "resolved";

export default function CallCentreDashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesTab = activeTab === "all" || alert.status === activeTab;
    const matchesSearch = alert.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const alertCounts = {
    all: mockAlerts.length,
    incoming: mockAlerts.filter(a => a.status === "incoming").length,
    in_progress: mockAlerts.filter(a => a.status === "in_progress").length,
    resolved: mockAlerts.filter(a => a.status === "resolved").length,
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Status Bar */}
      <div className="bg-accent/50 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-alert-sos/10 text-alert-sos border-alert-sos/30 animate-pulse-soft">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {alertCounts.incoming} Incoming
          </Badge>
          <Badge variant="outline" className="bg-alert-battery/10 text-alert-battery border-alert-battery/30">
            <Clock className="w-3 h-3 mr-1" />
            {alertCounts.in_progress} In Progress
          </Badge>
          <Badge variant="outline" className="bg-alert-resolved/10 text-alert-resolved border-alert-resolved/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            {alertCounts.resolved} Resolved Today
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Alert Queue */}
        <div className="flex-1 border-r flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b bg-background/50 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="gap-1">
                  All
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{alertCounts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="incoming" className="gap-1">
                  Incoming
                  <Badge className="ml-1 h-5 px-1.5 bg-alert-sos">{alertCounts.incoming}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="gap-1">
                  In Progress
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{alertCounts.in_progress}</Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved" className="gap-1">
                  Resolved
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{alertCounts.resolved}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  {...alert}
                  onClaim={() => console.log("Claim alert:", alert.id)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm">Alerts will appear here in real-time</p>
              </div>
            )}
          </div>
        </div>

        {/* Member Quick Search Panel */}
        <div className="w-80 bg-muted/30 p-4 hidden lg:block">
          <h3 className="font-semibold mb-4">Quick Member Search</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members..."
              className="pl-10 bg-background"
            />
          </div>
          
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>Search for a member to view their details</p>
          </div>

          <div className="mt-auto pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <PhoneCall className="h-4 w-4" />
                Call Emergency Services (112)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
