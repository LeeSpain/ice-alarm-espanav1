import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Loader2, Plus, Send, MessageSquare, Search,
  Phone, Mail, User, Clock, CheckCircle, ListTodo,
  ExternalLink, Paperclip, StickyNote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  priority: string;
  last_message_at: string;
  created_at: string;
  assigned_to: string | null;
  member_id: string;
  member?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  assigned_staff?: {
    first_name: string;
    last_name: string;
  } | null;
  unread_count?: number;
  last_message_preview?: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  staff?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newConversation, setNewConversation] = useState({
    memberId: "",
    subject: "",
    message: "",
    priority: "normal",
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentStaff();
    fetchConversations();
    fetchStaff();
    fetchMembers();

    // Real-time subscription for conversations
    const conversationChannel = supabase
      .channel("conversations-inbox")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationChannel);
    };
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, filter, searchQuery, currentStaffId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);

      const messageChannel = supabase
        .channel(`messages-inbox-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          () => {
            fetchMessages(selectedConversation.id);
            markMessagesAsRead(selectedConversation.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchCurrentStaff = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data } = await supabase
          .from("staff")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();
        setCurrentStaffId(data?.id || null);
      }
    } catch (error) {
      console.error("Error fetching current staff:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      // Fetch conversations with member info
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          member:members!conversations_member_id_fkey(id, first_name, last_name, email, phone)
        `)
        .order("last_message_at", { ascending: false });

      if (convError) throw convError;

      // Fetch assigned staff info
      const assignedStaffIds = convData?.filter(c => c.assigned_to).map(c => c.assigned_to) || [];
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .in("id", assignedStaffIds);

      const staffMap = new Map(staffData?.map(s => [s.id, s]) || []);

      // Fetch unread counts and last message preview
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .eq("sender_type", "member");

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            assigned_staff: conv.assigned_to ? staffMap.get(conv.assigned_to) || null : null,
            unread_count: count || 0,
            last_message_preview: lastMsg?.content?.substring(0, 60) + (lastMsg?.content && lastMsg.content.length > 60 ? "..." : "") || "",
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = [...conversations];

    // Apply filter
    switch (filter) {
      case "unread":
        filtered = filtered.filter(c => (c.unread_count || 0) > 0);
        break;
      case "mine":
        filtered = filtered.filter(c => c.assigned_to === currentStaffId);
        break;
      case "unassigned":
        filtered = filtered.filter(c => !c.assigned_to);
        break;
      case "resolved":
        filtered = filtered.filter(c => c.status === "resolved" || c.status === "closed");
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.member?.first_name?.toLowerCase().includes(query) ||
          c.member?.last_name?.toLowerCase().includes(query) ||
          c.subject?.toLowerCase().includes(query) ||
          c.last_message_preview?.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch staff names
      const staffIds = data?.filter(m => m.sender_type === "staff" && m.sender_id).map(m => m.sender_id) || [];
      const { data: staffData } = await supabase.from("staff").select("id, first_name, last_name").in("id", staffIds);
      const staffMap = new Map(staffData?.map(s => [s.id, s]) || []);

      setMessages(
        data?.map(m => ({
          ...m,
          staff: m.sender_type === "staff" && m.sender_id ? staffMap.get(m.sender_id) || null : null,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", "member")
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .eq("is_active", true);

      if (error) throw error;
      setStaffList(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, first_name, last_name, email, phone")
        .eq("status", "active")
        .order("last_name");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const createConversation = async () => {
    if (!newConversation.memberId || !newConversation.subject.trim() || !newConversation.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSending(true);
    try {
      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          member_id: newConversation.memberId,
          subject: newConversation.subject,
          status: "open",
          priority: newConversation.priority,
          assigned_to: currentStaffId,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Create first message
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: convData.id,
          sender_type: "staff",
          sender_id: currentStaffId,
          content: newConversation.message,
          message_type: "text",
        });

      if (msgError) throw msgError;

      toast.success("Conversation created");
      setIsDialogOpen(false);
      setNewConversation({ memberId: "", subject: "", message: "", priority: "normal" });
      fetchConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    } finally {
      setIsSending(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: isInternalNote ? "system" : "staff",
          sender_id: currentStaffId,
          content: isInternalNote ? `[Internal Note] ${replyMessage}` : replyMessage,
          message_type: isInternalNote ? "system" : "text",
        });

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);

      setReplyMessage("");
      setIsInternalNote(false);
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const updateConversation = async (field: string, value: string) => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ [field]: value })
        .eq("id", selectedConversation.id);

      if (error) throw error;

      setSelectedConversation({ ...selectedConversation, [field]: value });
      fetchConversations();
    } catch (error) {
      console.error("Error updating conversation:", error);
      toast.error("Failed to update conversation");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500">Open</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "resolved":
        return <Badge className="bg-green-600">Resolved</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High</Badge>;
      case "normal":
        return null;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const unreadCount = conversations.filter(c => (c.unread_count || 0) > 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Manage member conversations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>Create a new conversation with a member</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Member</label>
                <Select
                  value={newConversation.memberId}
                  onValueChange={(v) => setNewConversation({ ...newConversation, memberId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} - {member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="e.g., Payment inquiry, Device help..."
                  value={newConversation.subject}
                  onChange={(e) => setNewConversation({ ...newConversation, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newConversation.priority}
                  onValueChange={(v) => setNewConversation({ ...newConversation, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  className="min-h-[100px]"
                  value={newConversation.message}
                  onChange={(e) => setNewConversation({ ...newConversation, message: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createConversation} disabled={isSending}>
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-1">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mine">Assigned to Me</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[500px]">
            {/* Conversation List */}
            <div className="border-r flex flex-col">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted",
                        (conv.unread_count || 0) > 0 && "bg-primary/5"
                      )}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 shrink-0",
                          (conv.unread_count || 0) > 0 ? "bg-primary" : "bg-transparent"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "font-medium truncate",
                              (conv.unread_count || 0) > 0 && "font-semibold"
                            )}>
                              {conv.member?.first_name} {conv.member?.last_name}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {conv.subject || "No subject"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {conv.last_message_preview}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(conv.status)}
                            {getPriorityBadge(conv.priority)}
                            {conv.assigned_staff ? (
                              <span className="text-xs text-muted-foreground">
                                {conv.assigned_staff.first_name}
                              </span>
                            ) : (
                              <span className="text-xs text-orange-500">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Conversation Detail */}
            <div className="lg:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedConversation.member?.first_name} {selectedConversation.member?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.subject || "No subject"}
                        </p>
                      </div>
                      <Link to={`/admin/members/${selectedConversation.member_id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={selectedConversation.status}
                        onValueChange={(v) => updateConversation("status", v)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedConversation.priority}
                        onValueChange={(v) => updateConversation("priority", v)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedConversation.assigned_to || "unassigned"}
                        onValueChange={(v) => updateConversation("assigned_to", v === "unassigned" ? "" : v)}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {staffList.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.first_name} {staff.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id}>
                          {msg.message_type === "system" || msg.sender_type === "system" ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                              <Separator className="flex-1" />
                              <span className="bg-muted px-2 py-1 rounded">
                                {msg.content}
                              </span>
                              <span>{format(new Date(msg.created_at), "h:mm a")}</span>
                              <Separator className="flex-1" />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "flex",
                                msg.sender_type === "staff" ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[70%] rounded-lg p-3",
                                  msg.sender_type === "staff"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">
                                  {msg.sender_type === "staff" && msg.staff
                                    ? `${msg.staff.first_name} • `
                                    : msg.sender_type === "member"
                                    ? `${selectedConversation.member?.first_name} • `
                                    : ""}
                                  {format(new Date(msg.created_at), "h:mm a")}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Reply Box */}
                  <div className="p-4 border-t space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={isInternalNote ? "Write an internal note (only visible to staff)..." : "Type your message..."}
                        className={cn(
                          "min-h-[60px] resize-none",
                          isInternalNote && "border-yellow-500"
                        )}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant={isInternalNote ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsInternalNote(!isInternalNote)}
                          className={isInternalNote ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                          <StickyNote className="mr-2 h-4 w-4" />
                          Internal Note
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="mr-2 h-4 w-4" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          SMS
                        </Button>
                        <Button onClick={sendReply} disabled={isSending || !replyMessage.trim()}>
                          {isSending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">Choose a conversation from the list to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
