import { useState, useEffect } from "react";
import { Bell, MessageSquare, AlertTriangle, ListTodo, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: "message" | "alert" | "task";
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
}

interface NotificationBellProps {
  staffId: string | null;
}

export function NotificationBell({ staffId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { requestPermission, showNotification } = useBrowserNotifications();

  useEffect(() => {
    if (staffId) {
      fetchNotifications();
      setupRealtimeSubscriptions();
      requestPermission();
    }
  }, [staffId]);

  const fetchNotifications = async () => {
    if (!staffId) return;

    try {
      // Fetch unread messages assigned to this staff
      const { data: unreadMessages } = await supabase
        .from("conversations")
        .select(`
          id,
          subject,
          last_message_at,
          member:members!conversations_member_id_fkey(first_name, last_name)
        `)
        .eq("assigned_to", staffId)
        .eq("status", "open")
        .order("last_message_at", { ascending: false })
        .limit(5);

      // Fetch incoming alerts
      const { data: incomingAlerts } = await supabase
        .from("alerts")
        .select(`
          id,
          alert_type,
          received_at,
          member:members!alerts_member_id_fkey(first_name, last_name)
        `)
        .in("status", ["incoming", "in_progress"])
        .order("received_at", { ascending: false })
        .limit(5);

      // Fetch tasks assigned to this staff due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: dueTasks } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          due_date,
          priority
        `)
        .eq("assigned_to", staffId)
        .eq("status", "pending")
        .gte("due_date", today.toISOString())
        .lt("due_date", tomorrow.toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      const allNotifications: Notification[] = [];

      // Add message notifications
      unreadMessages?.forEach((msg) => {
        allNotifications.push({
          id: `msg-${msg.id}`,
          type: "message",
          title: `Message from ${msg.member?.first_name} ${msg.member?.last_name}`,
          description: msg.subject || "New message",
          timestamp: new Date(msg.last_message_at),
          isRead: false,
          link: "/admin/messages",
        });
      });

      // Add alert notifications
      incomingAlerts?.forEach((alert) => {
        allNotifications.push({
          id: `alert-${alert.id}`,
          type: "alert",
          title: `${alert.alert_type.replace("_", " ").toUpperCase()}`,
          description: `${alert.member?.first_name} ${alert.member?.last_name}`,
          timestamp: new Date(alert.received_at),
          isRead: false,
          link: "/call-centre",
        });
      });

      // Add task notifications
      dueTasks?.forEach((task) => {
        allNotifications.push({
          id: `task-${task.id}`,
          type: "task",
          title: "Task due today",
          description: task.title,
          timestamp: new Date(task.due_date),
          isRead: false,
          link: "/admin/members",
        });
      });

      // Sort by timestamp
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new alerts
    const alertChannel = supabase
      .channel("notification-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          const newAlert = payload.new as { id: string; alert_type: string; received_at: string };
          showNotification("New Alert!", {
            body: `New ${newAlert.alert_type.replace("_", " ")} alert received`,
            icon: "/favicon.ico",
            tag: `alert-${newAlert.id}`,
          });
          fetchNotifications();
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel("notification-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_type=eq.member`,
        },
        (payload) => {
          showNotification("New Message", {
            body: "You have a new message from a member",
            icon: "/favicon.ico",
            tag: `message-${payload.new.id}`,
          });
          fetchNotifications();
        }
      )
      .subscribe();

    // Subscribe to task assignments
    const taskChannel = supabase
      .channel("notification-tasks")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${staffId}`,
        },
        (payload) => {
          const newTask = payload.new as { title: string; id: string };
          showNotification("New Task Assigned", {
            body: newTask.title,
            icon: "/favicon.ico",
            tag: `task-${newTask.id}`,
          });
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(taskChannel);
    };
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "task":
        return <ListTodo className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        !notification.isRead && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-sm" 
              onClick={() => {
                navigate("/admin/messages");
                setIsOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
