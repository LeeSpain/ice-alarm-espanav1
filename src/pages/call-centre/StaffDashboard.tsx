import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  ClipboardList,
  Search,
  Phone,
  ArrowRight,
  User,
  FileText,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

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

export default function StaffDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [staffId, setStaffId] = useState<string | null>(null);
  const [stats, setStats] = useState<AlertStats>({ incoming: 0, inProgress: 0, resolvedToday: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [myTasksCount, setMyTasksCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch staff ID on mount
  useEffect(() => {
    const fetchStaffId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setStaffId(data.id);
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

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [staffId]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchAlertStats(),
      fetchActiveAlerts(),
      fetchUnreadMessages(),
      fetchRecentMessages(),
      fetchMyTasks(),
      fetchShiftNotes()
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data } = await supabase
      .from('members')
      .select('id, first_name, last_name, phone, email')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);

    setSearchResults(data || []);
    setIsSearching(false);
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
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'sos_button': return 'SOS';
      case 'fall_detected': return 'Fall';
      case 'low_battery': return 'Battery';
      case 'geo_fence': return 'Geo-fence';
      case 'check_in': return 'Check-in';
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/call-centre/alerts')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.incoming > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
                <AlertTriangle className={`h-5 w-5 ${stats.incoming > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.incoming}</p>
                <p className="text-xs text-muted-foreground">Incoming Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/call-centre/alerts')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/call-centre/messages')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${unreadMessages > 0 ? 'bg-primary/20' : 'bg-muted'}`}>
                <MessageSquare className={`h-5 w-5 ${unreadMessages > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadMessages}</p>
                <p className="text-xs text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-active/20">
                <CheckCircle className="h-5 w-5 text-status-active" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolvedToday}</p>
                <p className="text-xs text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/call-centre/tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${myTasksCount > 0 ? 'bg-blue-500/20' : 'bg-muted'}`}>
                <ClipboardList className={`h-5 w-5 ${myTasksCount > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{myTasksCount}</p>
                <p className="text-xs text-muted-foreground">My Tasks Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Alerts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/alerts">
                  View Queue <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-status-active" />
                <p>No active alerts</p>
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
                        {format(new Date(alert.received_at), 'HH:mm')} • {alert.status === 'incoming' ? 'Incoming' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                  {alert.status === 'incoming' && (
                    <Button size="sm" onClick={() => handleClaimAlert(alert.id)}>
                      Claim
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Member Search */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quick Member Search</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/members">
                  Browse All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/call-centre/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-muted-foreground">{member.phone}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${member.phone}`; }}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <p className="text-center text-muted-foreground py-4">No members found</p>
            )}
          </CardContent>
        </Card>

        {/* My Tasks Due Today */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">My Tasks (Due Today)</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/tasks">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-status-active" />
                <p>No tasks due today</p>
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
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Messages</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/call-centre/messages">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p>No unread messages</p>
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

      {/* Shift Notes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Today's Shift Notes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/call-centre/shift-notes">
                <Plus className="h-4 w-4 mr-1" /> Add Note
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {shiftNotes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No shift notes yet today</p>
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
  );
}
