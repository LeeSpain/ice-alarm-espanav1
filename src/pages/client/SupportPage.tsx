import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Phone, 
  MessageCircle, 
  Smartphone, 
  Loader2,
  Send,
  HelpCircle,
  Bot,
  Headphones,
  Plus,
  ArrowLeft,
  CheckCheck,
  Clock,
  Shield,
  Heart,
  Users
} from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { InlineAIChat } from "@/components/chat/InlineAIChat";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    id: "test-pendant",
    question: "How do I test my pendant?",
    answer: "Press and hold the SOS button for 3 seconds. Our team will answer and confirm your device is working correctly. We recommend testing your pendant once a month."
  },
  {
    id: "sos-button",
    question: "What happens when I press the SOS button?",
    answer: "When you press and hold the SOS button for 3 seconds, an alert is sent to our 24/7 monitoring center. A trained operator will immediately speak to you through your pendant and coordinate any necessary assistance."
  },
  {
    id: "fall-detection",
    question: "How does fall detection work?",
    answer: "Your pendant contains sensors that can detect sudden movements consistent with a fall. If a fall is detected, an automatic alert is sent to our team. We'll call through your pendant to check on you, and if there's no response, we'll follow your emergency protocol."
  },
  {
    id: "geo-fencing",
    question: "What is geo-fencing?",
    answer: "Geo-fencing creates a virtual boundary around a location (like your home). If you travel outside this boundary, an alert can be sent to designated contacts. This is useful for added peace of mind for you and your family."
  },
  {
    id: "update-medical",
    question: "How do I update my medical information?",
    answer: "Go to the 'Medical Info' section in your dashboard. Click 'Request Update' and describe the changes you'd like to make. Our team will review and update your records within 24-48 hours."
  },
  {
    id: "add-contacts",
    question: "How do I add emergency contacts?",
    answer: "Go to 'Emergency Contacts' in your dashboard. You can add up to 3 emergency contacts. These are the people we'll call if we can't reach you during an emergency."
  },
];

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

export default function SupportPage() {
  const { settings: companySettings } = useCompanySettings();
  const phoneForLink = companySettings.emergency_phone.replace(/\s/g, "");
  const { memberId, isLoading: authLoading } = useAuth();
  
  // Messaging state
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

      const channel = supabase
        .channel("support-conversations")
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
      setIsLoading(false);
    }
  }, [memberId, authLoading]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      const channel = supabase
        .channel(`support-messages-${selectedConversation.id}`)
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!memberId) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("member_id", memberId)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

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

      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", "staff")
        .eq("is_read", false);

      const staffIds = data?.filter(m => m.sender_type === "staff" && m.sender_id).map(m => m.sender_id) || [];
      const { data: staffData } = await supabase.from("staff").select("id, first_name").in("id", staffIds);
      const staffMap = new Map(staffData?.map(s => [s.id, s.first_name]) || []);

      setMessages(
        data?.map(m => ({
          ...m,
          staff_name: m.sender_type === "staff" && m.sender_id ? staffMap.get(m.sender_id) || "Support" : undefined,
        })) || []
      );

      fetchConversations();
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

      toast.success("Message sent to our support team!");
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

  const unreadCount = conversations.filter(c => c.has_unread).length;

  // Conversation detail view
  if (selectedConversation) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => setSelectedConversation(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedConversation.subject || "Conversation"}</CardTitle>
                <CardDescription>
                  Started {formatDistanceToNow(new Date(selectedConversation.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
              {getStatusBadge(selectedConversation.status)}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
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
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        msg.sender_type === "member"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end gap-2 mt-1 text-xs opacity-70">
                        <span>
                          {msg.sender_type === "staff" && msg.staff_name
                            ? `${msg.staff_name} • `
                            : msg.sender_type === "member"
                            ? "You • "
                            : ""}
                          {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                        {msg.sender_type === "member" && msg.is_read && (
                          <CheckCheck className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  className="min-h-[60px] resize-none flex-1"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <Button
                  onClick={sendReply}
                  disabled={isSending || !replyMessage.trim()}
                  size="icon"
                  className="h-auto aspect-square"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground mt-1">We're here to help you 24/7</p>
        </div>
      </div>

      {/* Emergency Banner */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-20 w-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2">For Emergencies</h2>
              <p className="text-primary-foreground/80 mb-1">
                Press and hold your pendant's SOS button for 3 seconds
              </p>
              <p className="text-primary-foreground/80 text-sm">
                Our team will be with you immediately
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a 
                href={`tel:${phoneForLink}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
              >
                <Phone className="h-5 w-5" />
                {companySettings.emergency_phone}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="chat" className="flex items-center gap-2 py-3">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2 py-3 relative">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
            <span className="sm:hidden">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2 py-3">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help Center</span>
            <span className="sm:hidden">FAQ</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <InlineAIChat memberContext={true} />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>Our AI assistant can help you with:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Device setup and troubleshooting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Account and billing questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Service information</span>
                    </li>
                  </ul>
                  <p className="pt-2 text-xs">
                    For complex issues, the AI can connect you with our support team.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Need to speak with a person? Switch to the <strong>Messages</strong> tab to chat directly with our support team.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Support Conversations</h2>
              <p className="text-sm text-muted-foreground">Chat directly with our support team</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send a Message</DialogTitle>
                  <DialogDescription>
                    Our support team will respond as soon as possible
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      placeholder="What is your message about?"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="Write your message here..."
                      className="min-h-[120px]"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createConversation} disabled={isSending} className="w-full">
                    {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Message
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Headphones className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a conversation with our support team
                </p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Send Your First Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    conv.has_unread && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {conv.has_unread && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <h3 className={cn(
                            "font-medium truncate",
                            conv.has_unread && "font-semibold"
                          )}>
                            {conv.subject || "Conversation"}
                          </h3>
                        </div>
                        {conv.last_message_preview && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {conv.last_message_preview}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {getStatusBadge(conv.status)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Help Center Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Find quick answers to common questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {FAQ_ITEMS.map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contact Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a 
                    href={`tel:${phoneForLink}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Call Us</p>
                      <p className="text-primary text-sm">{companySettings.emergency_phone}</p>
                    </div>
                  </a>

                  <a 
                    href={`https://wa.me/${phoneForLink.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">WhatsApp</p>
                      <p className="text-[#25D366] text-sm">Chat with us</p>
                    </div>
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Can't find your answer?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our AI assistant and support team are ready to help.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
