import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2, Plus, Send, MessageSquare, ArrowLeft,
  CheckCheck, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
  last_message_preview?: string;
  has_unread?: boolean;
}

interface Message {
  id: string;
  sender_type: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  staff_name?: string;
}

export default function MessagesPage() {
  const { memberId, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (memberId) {
      fetchConversations();

      // Real-time subscription for conversations
      const channel = supabase
        .channel("client-conversations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `member_id=eq.${memberId}`,
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // No memberId and auth is done loading - set loading to false
      setIsLoading(false);
    }
  }, [memberId, authLoading]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      const channel = supabase
        .channel(`client-messages-${selectedConversation.id}`)
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
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const fetchConversations = async () => {
    if (!memberId) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("member_id", memberId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Fetch last message and unread status for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, is_read, sender_type")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .eq("sender_type", "staff");

          return {
            ...conv,
            last_message_preview: lastMsg?.content?.substring(0, 80) + (lastMsg?.content && lastMsg.content.length > 80 ? "..." : "") || "",
            has_unread: (count || 0) > 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark staff messages as read
      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", "staff")
        .eq("is_read", false);

      // Get staff names for staff messages
      const staffIds = data?.filter(m => m.sender_type === "staff" && m.sender_id).map(m => m.sender_id) || [];
      const { data: staffData } = await supabase.from("staff").select("id, first_name").in("id", staffIds);
      const staffMap = new Map(staffData?.map(s => [s.id, s.first_name]) || []);

      setMessages(
        data?.map(m => ({
          ...m,
          staff_name: m.sender_type === "staff" && m.sender_id ? staffMap.get(m.sender_id) || "Support" : undefined,
        })) || []
      );

      fetchConversations(); // Refresh to update unread status
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const createConversation = async () => {
    if (!newSubject.trim() || !newMessage.trim() || !memberId) {
      toast.error("Please enter a subject and message");
      return;
    }

    setIsSending(true);
    try {
      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          member_id: memberId,
          subject: newSubject,
          status: "open",
        })
        .select()
        .single();

      if (convError) throw convError;

      // Create first message
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: convData.id,
          sender_type: "member",
          sender_id: memberId,
          content: newMessage,
          message_type: "text",
        });

      if (msgError) throw msgError;

      toast.success("Message sent successfully!");
      setIsDialogOpen(false);
      setNewSubject("");
      setNewMessage("");
      fetchConversations();
      setSelectedConversation(convData);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation || !memberId) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: "member",
          sender_id: memberId,
          content: replyMessage,
          message_type: "text",
        });

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);

      setReplyMessage("");
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500 text-lg px-3 py-1">Open</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-lg px-3 py-1">Pending</Badge>;
      case "resolved":
        return <Badge className="bg-green-600 text-lg px-3 py-1">Resolved</Badge>;
      case "closed":
        return <Badge variant="outline" className="text-lg px-3 py-1">Closed</Badge>;
      default:
        return <Badge className="text-lg px-3 py-1">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Conversation detail view
  if (selectedConversation) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setSelectedConversation(null)}
          className="text-lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Messages
        </Button>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{selectedConversation.subject || "Conversation"}</CardTitle>
              {getStatusBadge(selectedConversation.status)}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[400px] p-6">
              <div className="space-y-6">
                {messages.filter(m => m.message_type !== "system").map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender_type === "member" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl p-4",
                        msg.sender_type === "member"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-lg whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end gap-2 mt-2 text-sm opacity-70">
                        <span>
                          {msg.sender_type === "staff" && msg.staff_name
                            ? `${msg.staff_name} • `
                            : msg.sender_type === "member"
                            ? "You • "
                            : ""}
                          {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                        {msg.sender_type === "member" && msg.is_read && (
                          <CheckCheck className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Box */}
            <div className="p-6 border-t">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your message..."
                  className="min-h-[80px] text-lg resize-none"
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
              <Button
                onClick={sendReply}
                disabled={isSending || !replyMessage.trim()}
                className="w-full mt-3 text-lg h-14"
                size="lg"
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Messages</h1>
          <p className="text-lg text-muted-foreground mt-1">Contact our support team</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="text-lg h-14 px-6">
              <Plus className="mr-2 h-5 w-5" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Send a Message</DialogTitle>
              <DialogDescription className="text-lg">
                Our support team will respond as soon as possible
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-lg font-medium">Subject</label>
                <Input
                  placeholder="What is your message about?"
                  className="text-lg h-14"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-lg font-medium">Message</label>
                <Textarea
                  placeholder="Write your message here..."
                  className="min-h-[150px] text-lg"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createConversation} disabled={isSending} size="lg" className="w-full text-lg h-14">
                {isSending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-xl font-medium">No messages yet</p>
            <p className="text-lg text-muted-foreground mt-2">
              Send us a message and we'll get back to you soon
            </p>
            <Button size="lg" className="mt-6 text-lg h-14 px-8" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Send Your First Message
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors",
                conv.has_unread && "border-primary bg-primary/5"
              )}
              onClick={() => setSelectedConversation(conv)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {conv.has_unread && (
                        <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                      )}
                      <h3 className={cn(
                        "text-xl truncate",
                        conv.has_unread && "font-semibold"
                      )}>
                        {conv.subject || "No subject"}
                      </h3>
                    </div>
                    <p className="text-lg text-muted-foreground mt-2 line-clamp-2">
                      {conv.last_message_preview}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(conv.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
