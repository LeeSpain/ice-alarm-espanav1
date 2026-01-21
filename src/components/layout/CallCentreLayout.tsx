import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FileText, User, Phone, LogOut, MessageSquare, CheckSquare, LayoutDashboard, Users, AlertTriangle, Ticket, Clock, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function CallCentreLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigateTo = useNavigate();
  const location = useLocation();
  
  const [incomingAlerts, setIncomingAlerts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetchCounts();

    const alertsChannel = supabase
      .channel('layout-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, fetchCounts)
      .subscribe();

    const messagesChannel = supabase
      .channel('layout-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  const fetchCounts = async () => {
    const [alertsRes, messagesRes] = await Promise.all([
      supabase.from('alerts').select('id', { count: 'exact' }).eq('status', 'incoming'),
      supabase.from('messages').select('id', { count: 'exact' }).eq('is_read', false).eq('sender_type', 'member')
    ]);
    setIncomingAlerts(alertsRes.count || 0);
    setUnreadMessages(messagesRes.count || 0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigateTo("/staff/login");
  };

  const isActive = (path: string) => {
    if (path === '/call-centre' && location.pathname === '/call-centre') return true;
    if (path !== '/call-centre' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-sidebar px-4">
        <div className="flex items-center gap-4">
          <Logo variant="white" size="sm" />
          <Badge variant="outline" className="bg-status-active/20 text-status-active border-status-active/30">
            <Phone className="w-3 h-3 mr-1" />
            On Duty
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Dashboard */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre') && location.pathname === '/call-centre' ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>

          {/* Alerts */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre/alerts') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/alerts" className="relative">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t("navigation.alerts")}
              {incomingAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {incomingAlerts}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Members */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre/members') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </Link>
          </Button>

          {/* Messages */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre/messages') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/messages" className="relative">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {unreadMessages > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                  {unreadMessages}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Tasks */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre/tasks') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks
            </Link>
          </Button>

          {/* Support Tickets */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre/tickets') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </Link>
          </Button>

          {/* Shift Notes */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isActive('/call-centre/shift-notes') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/shift-notes">
              <FileText className="h-4 w-4 mr-2" />
              {t("navigation.shiftNotes")}
            </Link>
          </Button>

          {/* Language Selector */}
          <LanguageSelector variant="icon-only" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent gap-2">
                <div className="h-7 w-7 rounded-full bg-sidebar-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <span className="hidden md:inline">{user?.email?.split('@')[0] || 'Operator'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.email?.split('@')[0] || 'Operator'}</span>
                  <span className="text-xs text-muted-foreground">Call Centre Operator</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/call-centre/shift-history" className="flex items-center cursor-pointer">
                  <Clock className="w-4 h-4 mr-2" />
                  My Shift History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/call-centre/preferences" className="flex items-center cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                End Shift
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
