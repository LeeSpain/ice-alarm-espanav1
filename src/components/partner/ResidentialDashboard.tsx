import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  UserPlus, 
  FileText, 
  CreditCard,
  Download,
  Search,
  Plus,
  Upload,
  Activity,
  CheckCircle,
  Clock,
  Signal
} from "lucide-react";
import { usePartnerMembers } from "@/hooks/usePartnerMembers";
import { usePartnerAlertNotifications } from "@/hooks/usePartnerAlertNotifications";
import { format } from "date-fns";

interface ResidentialDashboardProps {
  partnerId: string;
  alertVisibilityEnabled?: boolean;
}

export function ResidentialDashboard({ 
  partnerId, 
  alertVisibilityEnabled = false 
}: ResidentialDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [memberSearch, setMemberSearch] = useState("");

  const { data: members, isLoading: membersLoading } = usePartnerMembers(partnerId);
  const { notifications: alertNotifications, isLoading: alertsLoading } = usePartnerAlertNotifications(partnerId);

  // Calculate stats
  const totalResidents = members?.length || 0;
  const activeMembers = members?.filter(m => !m.removed_at).length || 0;
  const pendingMembers = 0; // Would come from a different query
  const alertsThisMonth = alertNotifications?.filter(a => {
    const sentDate = new Date(a.sent_at);
    const now = new Date();
    return sentDate.getMonth() === now.getMonth() && sentDate.getFullYear() === now.getFullYear();
  }).length || 0;

  // Filter members by search
  const filteredMembers = members?.filter(m => {
    const memberName = `${m.member?.first_name || ''} ${m.member?.last_name || ''}`.toLowerCase();
    return memberName.includes(memberSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility Dashboard</h1>
          <p className="text-muted-foreground">Manage your residents and monitor alerts</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Resident
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          {alertVisibilityEnabled && (
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="onboarding" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalResidents}</div>
                <p className="text-xs text-muted-foreground">Linked to your facility</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
                <p className="text-xs text-muted-foreground">With active subscriptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingMembers}</div>
                <p className="text-xs text-muted-foreground">Awaiting activation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts This Month</CardTitle>
                <Bell className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{alertsThisMonth}</div>
                <p className="text-xs text-muted-foreground">Across all residents</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Add Resident</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Bell className="h-5 w-5" />
                  <span>View Alerts</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Download className="h-5 w-5" />
                  <span>Download Report</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Upload className="h-5 w-5" />
                  <span>Bulk Upload</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events across your facility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertNotifications?.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                      <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Alert notification sent</p>
                      <p className="text-xs text-muted-foreground">
                        Via {notification.notification_method} - {format(new Date(notification.sent_at), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                    {notification.acknowledged_at ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    )}
                  </div>
                ))}
                {(!alertNotifications || alertNotifications.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Facility Members</CardTitle>
                  <CardDescription>All residents linked to your facility</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Add
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {membersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : filteredMembers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No members found</p>
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Member
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers?.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.member?.first_name} {member.member?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Signal className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Online</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {member.relationship_type || "resident"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(member.added_at), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        {alertVisibilityEnabled && (
          <TabsContent value="alerts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alert History</CardTitle>
                    <CardDescription>Notifications sent for your residents</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : alertNotifications?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts yet</p>
                    <p className="text-sm">You'll be notified when a resident triggers an alert</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertNotifications?.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            {format(new Date(notification.sent_at), "dd MMM yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {notification.member?.first_name} {notification.member?.last_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {notification.notification_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {notification.acknowledged_at ? (
                              <Badge className="bg-green-100 text-green-800">
                                Acknowledged
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!notification.acknowledged_at && (
                              <Button size="sm" variant="outline">
                                Acknowledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add Single Resident</CardTitle>
                <CardDescription>Register a new resident for ICE Alarm protection</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Start New Registration
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload</CardTitle>
                <CardDescription>Upload multiple residents via CSV file</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV File
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Onboardings</CardTitle>
              <CardDescription>Residents awaiting device activation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending onboardings</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your facility billing arrangement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Per-Resident Monthly</h3>
                  <p className="text-sm text-muted-foreground">Billed monthly per active resident</p>
                </div>
                <Badge>Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>Past invoices and payment status</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Overview of alerts, response times, and device health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-primary">{alertsThisMonth}</p>
                  <p className="text-sm text-muted-foreground">Alerts This Month</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-green-600">100%</p>
                  <p className="text-sm text-muted-foreground">Devices Online</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">&lt;2min</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Download Reports</CardTitle>
              <CardDescription>Generate PDF reports for your records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Summary (PDF)
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Alert History (CSV)
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Member Directory (PDF)
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Device Status (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
