import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  ClipboardList,
  Phone,
  ArrowRight,
  FileText,
  Plus,
  Cake,
  WifiOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es, enGB } from "date-fns/locale";
import i18n from "@/i18n";
import { LeadsWidget } from "@/components/dashboard/LeadsWidget";
import { ShiftReportModal } from "@/components/call-centre/ShiftReportModal";
import { EV07BLiveStatusCard } from "@/components/call-centre/EV07BLiveStatusCard";
import { DeviceIssuesQueue } from "@/components/call-centre/DeviceIssuesQueue";
import { DeviceOfflineAlertsCard } from "@/components/call-centre/DeviceOfflineAlertsCard";
import { useOpsRealtime } from "@/hooks/useOpsRealtime";

interface AlertStats {
  incoming: number;
  inProgress: number;
  resolvedToday: number;
}

interface ActiveAlert {
  id: string;
  alert_type: string;
  status: string;
  received_at: string;
  member: {
    first_name: string;
    last_name: string;
  };
  claimed_by: string | null;
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  member?: {
    first_name: string;
    last_name: string;
  };
}

interface CourtesyCall {
  id: string;
  title: string;
  due_date: string;
  status: string;
  member_id: string;
  member: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  conversation: {
    member: {
      first_name: string;
      last_name: string;
    };
    subject: string | null;
  };
}

interface ShiftNote {
  id: string;
  note_content: string;
  created_at: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
}

interface BirthdayMember {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
}

export default function StaffDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Enable realtime updates for devices and alerts
  useOpsRealtime();
  
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string>("");
  const [stats, setStats] = useState<AlertStats>({ incoming: 0, inProgress: 0, resolvedToday: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [myTasksCount, setMyTasksCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [courtesyCalls, setCourtesyCalls] = useState<CourtesyCall[]>([]);
  const [isCompletingCall, setIsCompletingCall] = useState<string | null>(null);

  // Locale-aware date formatting
  const dateLocale = i18n.language === 'es' ? es : enGB;
  const currentDate = format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale });

  // Fetch staff ID and name on mount
  useEffect(() => {
    const fetchStaffId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('staff')
        .select('id, first_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setStaffId(data.id);
        setStaffName(data.first_name || '');
      }
    };
    fetchStaffId();
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const alertsChannel = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlertStats();
        fetchActiveAlerts();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('dashboard-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnreadMessages();
        fetchRecentMessages();
      })
      .subscribe();

    const membersChannel = supabase
      .channel('dashboard-members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchBirthdays();
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('dashboard-courtesy-calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchCourtesyCalls();
      })
      .subscribe();

    // Subscribe to device updates for realtime EV-07B status
    const devicesChannel = supabase
      .channel('dashboard-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        // Device updates are handled by the individual EV-07B components
        // which have their own realtime subscriptions
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(devicesChannel);
    };
  }, [staffId]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchAlertStats(),
      fetchActiveAlerts(),
      fetchUnreadMessages(),
      fetchRecentMessages(),
      fetchMyTasks(),
      fetchShiftNotes(),
      fetchBirthdays(),
      fetchCourtesyCalls()
    ]);
  };

  const fetchAlertStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [incomingRes, inProgressRes, resolvedRes] = await Promise.all([
      supabase.from('alerts').select('id', { count: 'exact' }).eq('status', 'incoming'),
      supabase.from('alerts').select('id', { count: 'exact' }).eq('status', 'in_progress'),
      supabase.from('alerts').select('id', { count: 'exact' }).eq('status', 'resolved').gte('resolved_at', today.toISOString())
    ]);

    setStats({
      incoming: incomingRes.count || 0,
      inProgress: inProgressRes.count || 0,
      resolvedToday: resolvedRes.count || 0
    });
  };

  const fetchActiveAlerts = async () => {
    const { data } = await supabase
      .from('alerts')
      .select(`
        id,
        alert_type,
        status,
        received_at,
        claimed_by,
        member:members(first_name, last_name)
      `)
      .in('status', ['incoming', 'in_progress'])
      .order('received_at', { ascending: false })
      .limit(5);

    setActiveAlerts((data as any[]) || []);
  };

  const fetchUnreadMessages = async () => {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('is_read', false)
      .eq('sender_type', 'member');

    setUnreadMessages(count || 0);
  };

  const fetchRecentMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        conversation:conversations(
          subject,
          member:members(first_name, last_name)
        )
      `)
      .eq('sender_type', 'member')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(3);

    setRecentMessages((data as any[]) || []);
  };

  const fetchMyTasks = async () => {
    if (!staffId) return;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const { data, count } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        priority,
        member:members(first_name, last_name)
      `, { count: 'exact' })
      .eq('assigned_to', staffId)
      .neq('status', 'completed')
      .lte('due_date', today.toISOString())
      .order('due_date', { ascending: true })
      .limit(4);

    setMyTasks((data as any[]) || []);
    setMyTasksCount(count || 0);
  };

  const fetchShiftNotes = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('shift_notes')
      .select(`
        id,
        note_content,
        created_at,
        staff:staff(first_name, last_name)
      `)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    setShiftNotes((data as any[]) || []);
  };

  const fetchBirthdays = async () => {
    // Use optimized database function instead of loading all members
    const { data, error } = await supabase.rpc('get_todays_birthdays');
    
    if (!error && data) {
      setBirthdays(data);
    }
  };

  const fetchCourtesyCalls = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        status,
        member_id,
        member:members(first_name, last_name, phone)
      `)
      .eq('task_type', 'courtesy_call')
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
      .limit(10);

    if (!error && data) {
      setCourtesyCalls((data as any[]) || []);
    }
  };

  const handleCompleteCourtesyCall = async (taskId: string) => {
    setIsCompletingCall(taskId);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchCourtesyCalls();
    } catch (error) {
      console.error('Error completing courtesy call:', error);
    } finally {
      setIsCompletingCall(null);
    }
  };

  const handleClaimAlert = async (alertId: string) => {
    if (!staffId) return;

    await supabase
      .from('alerts')
      .update({
        status: 'in_progress',
        claimed_by: staffId,
        claimed_at: new Date().toISOString()
      })
      .eq('id', alertId);

    navigate('/call-centre/alerts');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sos_button':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'fall_detected':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'device_offline':
        return <WifiOff className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'sos_button': return 'SOS';
      case 'fall_detected': return t('alerts.fallDetected');
      case 'low_battery': return t('alerts.lowBattery');
      case 'geo_fence': return t('alerts.geoFenceAlert');
      case 'check_in': return t('alerts.checkIn');
      case 'device_offline': return 'Device Offline';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('staffDashboard.welcomeBack')}, {staffName || t('common.staff')}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
        </div>
        <ShiftReportModal />
      </div>

      {/* Stats Cards */}
      <div className="bg-gradient-to-r from-primary/5 via-background to-accent/5 p-4 rounded-lg border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow shadow-sm bg-background/80 backdrop-blur-sm" onClick={() => navigate('/call-centre/alerts')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.incoming > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
                  <AlertTriangle className={`h-5 w-5 ${stats.incoming > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.incoming}</p>
                  <p className="text-xs text-muted-foreground">{t('staffDashboard.incomingAlerts')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow shadow-sm bg-background/80 backdrop-blur-sm" onClick={() => navigate('/call-centre/alerts')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">{t('staffDashboard.inProgress')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow shadow-sm bg-background/80 backdrop-blur-sm" onClick={() => navigate('/call-centre/messages')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${unreadMessages > 0 ? 'bg-primary/20' : 'bg-muted'}`}>
                  <MessageSquare className={`h-5 w-5 ${unreadMessages > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadMessages}</p>
                  <p className="text-xs text-muted-foreground">{t('staffDashboard.unreadMessages')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-active/20">
                  <CheckCircle className="h-5 w-5 text-status-active" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.resolvedToday}</p>
                  <p className="text-xs text-muted-foreground">{t('staffDashboard.resolvedToday')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow shadow-sm bg-background/80 backdrop-blur-sm" onClick={() => navigate('/call-centre/tasks')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${myTasksCount > 0 ? 'bg-blue-500/20' : 'bg-muted'}`}>
                  <ClipboardList className={`h-5 w-5 ${myTasksCount > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myTasksCount}</p>
                  <p className="text-xs text-muted-foreground">{t('staffDashboard.myTasksDue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EV-07B Status Row */}
      <div className="grid md:grid-cols-3 gap-6">
        <EV07BLiveStatusCard />
        <DeviceOfflineAlertsCard />
        <DeviceIssuesQueue />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card className="shadow-sm bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('staffDashboard.activeAlerts')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/alerts">
                  {t('staffDashboard.viewQueue')} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-status-active" />
                <p>{t('staffDashboard.noActiveAlerts')}</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alert_type)}
                    <div>
                      <p className="font-medium">
                        {getAlertLabel(alert.alert_type)} - {alert.member?.first_name} {alert.member?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.received_at), 'HH:mm')} • {alert.status === 'incoming' ? t('common.incoming') : t('common.inProgress')}
                      </p>
                    </div>
                  </div>
                  {alert.status === 'incoming' && (
                    <Button size="sm" onClick={() => handleClaimAlert(alert.id)}>
                      {t('staffDashboard.claim')}
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Courtesy Calls */}
        <Card className="shadow-sm bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                {t('staffDashboard.courtesyCalls', 'Courtesy Calls')}
                {courtesyCalls.length > 0 && (
                  <Badge variant="secondary">{courtesyCalls.length}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/tasks?filter=courtesy_call">
                  {t('staffDashboard.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {courtesyCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-status-active" />
                <p>{t('staffDashboard.noCourtesyCallsDue', 'No courtesy calls pending')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {courtesyCalls.map((call) => (
                  <div 
                    key={call.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/call-centre/members/${call.member_id}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{call.member?.first_name} {call.member?.last_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.member?.phone} • {call.due_date ? format(new Date(call.due_date), 'MMM d') : 'No date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${call.member?.phone}`; }}
                        title={t('common.call', 'Call')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleCompleteCourtesyCall(call.id)}
                        disabled={isCompletingCall === call.id}
                        title={t('common.markComplete', 'Mark Complete')}
                        className="text-status-active hover:text-status-active"
                      >
                        {isCompletingCall === call.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tasks Due Today */}
        <Card className="shadow-sm bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('staffDashboard.myTasksDueToday')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/tasks">
                  {t('staffDashboard.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-status-active" />
                <p>{t('staffDashboard.noTasksDueToday')}</p>
              </div>
            ) : (
              myTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.member && (
                        <p className="text-xs text-muted-foreground">
                          {task.member.first_name} {task.member.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="shadow-sm bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('staffDashboard.recentMessages')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/messages">
                  {t('staffDashboard.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p>{t('staffDashboard.noUnreadMessages')}</p>
              </div>
            ) : (
              recentMessages.map((message) => (
                <div key={message.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {message.conversation?.member?.first_name} {message.conversation?.member?.last_name}
                    </span>
                    {message.conversation?.subject && (
                      <span className="text-xs text-muted-foreground">- {message.conversation.subject}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Leads, Birthdays and Shift Notes */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Leads Widget */}
        <LeadsWidget variant="staff" />
        {/* Today's Birthdays */}
        <Card className="shadow-sm bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cake className="h-5 w-5 text-pink-500" />
                {t('staffDashboard.todaysBirthdays')}
              </CardTitle>
              {birthdays.length > 0 && (
                <Badge className="bg-pink-500/20 text-pink-600 border-pink-500/30">
                  {birthdays.length} {birthdays.length === 1 ? t('staffDashboard.birthday') : t('staffDashboard.birthdays')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {birthdays.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Cake className="h-8 w-8 mx-auto mb-2" />
                <p>{t('staffDashboard.noBirthdaysToday')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {birthdays.map((member) => {
                  const dob = new Date(member.date_of_birth);
                  const age = new Date().getFullYear() - dob.getFullYear();
                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-pink-500/5 border-pink-500/20 cursor-pointer hover:bg-pink-500/10"
                      onClick={() => navigate(`/call-centre/members/${member.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <Cake className="h-5 w-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-medium">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('staffDashboard.turningXToday', { age })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${member.phone}`; }}
                        title={t('staffDashboard.callToWishHappyBirthday')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shift Notes */}
        <Card className="shadow-sm bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('staffDashboard.todaysShiftNotes')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/shift-notes">
                  <Plus className="h-4 w-4 mr-1" /> {t('staffDashboard.addNote')}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {shiftNotes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>{t('staffDashboard.noShiftNotesYetToday')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shiftNotes.map((note) => (
                  <div key={note.id} className="flex gap-3 p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(note.created_at), 'HH:mm')}
                    </p>
                    <div>
                      <p className="text-sm font-medium">
                        {note.staff?.first_name} {note.staff?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{note.note_content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
