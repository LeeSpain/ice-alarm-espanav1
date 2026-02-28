import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NotificationType = "alert" | "system" | "message" | "task";

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
}

interface UseNotificationsOptions {
  /** Limit results per page */
  pageSize?: number;
  /** Only fetch for this user_id (pass null to skip fetching) */
  userId?: string | null;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pageSize = 20, userId } = options;

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch unread count (always current)
  const fetchUnreadCount = useCallback(async () => {
    try {
      let query = (supabase
        .from("notification_log") as any)
        .select("id", { count: "exact", head: true })
        .eq("read", false);

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { count, error } = await query;
      if (error) throw error;
      setUnreadCount(count ?? 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [userId]);

  // Fetch notifications with filters and pagination
  const fetchNotifications = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      setIsLoading(true);
      try {
        let query = (supabase
          .from("notification_log") as any)
          .select("*")
          .order("created_at", { ascending: false })
          .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        if (typeFilter !== "all") {
          query = query.eq("type", typeFilter);
        }

        if (readFilter === "read") {
          query = query.eq("read", true);
        } else if (readFilter === "unread") {
          query = query.eq("read", false);
        }

        const { data, error } = await query;
        if (error) throw error;

        const records = (data ?? []) as NotificationRecord[];
        setHasMore(records.length === pageSize);

        if (append) {
          setNotifications((prev) => [...prev, ...records]);
        } else {
          setNotifications(records);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, typeFilter, readFilter, pageSize]
  );

  // Mark a single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await (supabase
          .from("notification_log") as any)
          .update({ read: true })
          .eq("id", notificationId);

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to update notification");
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      let query = (supabase
        .from("notification_log") as any)
        .update({ read: true })
        .eq("read", false);

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { error } = await query;
      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to update notifications");
    }
  }, [userId]);

  // Load next page
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  }, [page, fetchNotifications]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    fetchNotifications(0, false);
  }, [typeFilter, readFilter, fetchNotifications]);

  // Fetch unread count on mount and when userId changes
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("notification-log-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_log",
        },
        (payload) => {
          const newNotification = payload.new as NotificationRecord;

          // Only include if it matches user filter
          if (userId && newNotification.user_id && newNotification.user_id !== userId) {
            return;
          }

          // Only prepend if it matches current filters
          const matchesType =
            typeFilter === "all" || newNotification.type === typeFilter;
          const matchesRead =
            readFilter === "all" ||
            (readFilter === "unread" && !newNotification.read) ||
            (readFilter === "read" && newNotification.read);

          if (matchesType && matchesRead) {
            setNotifications((prev) => [newNotification, ...prev]);
          }

          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notification_log",
        },
        (payload) => {
          const updated = payload.new as NotificationRecord;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          // Refresh count on any update
          fetchUnreadCount();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, typeFilter, readFilter, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    typeFilter,
    readFilter,
    setTypeFilter,
    setReadFilter,
    markAsRead,
    markAllAsRead,
    loadMore,
    refetch: () => {
      setPage(0);
      fetchNotifications(0, false);
      fetchUnreadCount();
    },
  };
}
