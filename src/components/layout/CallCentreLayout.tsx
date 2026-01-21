import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FileText, User, Phone, LogOut, MessageSquare, CheckSquare } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

export function CallCentreLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/staff/login");
  };
  const location = useLocation();
  const isShiftNotesActive = location.pathname.includes("shift-notes");

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

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${!isShiftNotesActive ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre">
              <Phone className="h-4 w-4 mr-2" />
              {t("navigation.alerts")}
            </Link>
          </Button>

          {/* Messages */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${location.pathname.includes('messages') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Link>
          </Button>

          {/* Tasks */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${location.pathname.includes('tasks') ? 'bg-sidebar-accent' : ''}`}
            asChild
          >
            <Link to="/call-centre/tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks
            </Link>
          </Button>

          {/* Shift Notes */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sidebar-foreground hover:bg-sidebar-accent ${isShiftNotesActive ? 'bg-sidebar-accent' : ''}`}
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
              <DropdownMenuItem>My Shift History</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
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
