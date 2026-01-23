import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useWebsiteImage } from "@/hooks/useWebsiteImage";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { imageUrl: avatarUrl, isLoading: avatarLoading } = useWebsiteImage("chat_avatar");

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: i18n.language === "es" 
          ? "¡Hola! 👋 Soy tu asistente virtual de ICE Alarm. ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre nuestros servicios, precios, o ayudarte a comenzar."
          : "Hello! 👋 I'm your ICE Alarm virtual assistant. How can I help you today? I can answer questions about our services, pricing, or help you get started.",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, i18n.language]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: userMessage.content });

      const { data, error } = await supabase.functions.invoke("ai-run", {
        body: {
          agentKey: "customer_service_expert",
          context: {
            conversationId,
            userLanguage: i18n.language,
            conversationHistory,
            currentMessage: userMessage.content,
            source: "chat_widget",
          },
        },
      });

      if (error) throw error;

      let responseText = i18n.language === "es"
        ? "Lo siento, no pude procesar tu mensaje. Por favor, intenta de nuevo."
        : "Sorry, I couldn't process your message. Please try again.";

      if (data?.output) {
        if (typeof data.output === "string") {
          responseText = data.output;
        } else if (data.output.response) {
          responseText = data.output.response;
        } else if (data.output.message) {
          responseText = data.output.message;
        } else if (data.output.analysis) {
          responseText = data.output.analysis;
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: i18n.language === "es"
          ? "Lo siento, hubo un problema al conectar. Por favor, intenta de nuevo más tarde."
          : "Sorry, there was a connection issue. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full">
      {/* Chat Toggle Bar - Below Header */}
      <div 
        className={cn(
          "w-full bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground",
          "border-b border-primary/20 shadow-sm",
          "transition-all duration-300"
        )}
      >
        <div className="container mx-auto px-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center justify-between py-3",
              "hover:opacity-90 transition-opacity"
            )}
            aria-label={isOpen ? t("chat.closeChat", "Close chat") : t("chat.openChat", "Open chat")}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary-foreground/30 shadow-md">
                  {!avatarLoading && avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="AI Assistant" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary-foreground/20">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-primary rounded-full" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {t("chat.assistantName", "ICE Alarm Assistant")}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                </div>
                <p className="text-xs opacity-80">
                  {t("chat.available", "Available 24/7")} • {i18n.language === "es" ? "Haz clic para chatear" : "Click to chat"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">
                {i18n.language === "es" ? "Soporte en vivo" : "Live Support"}
              </span>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isOpen && "rotate-180"
                )} 
              />
            </div>
          </button>
        </div>
      </div>

      {/* Expandable Chat Panel */}
      <div
        className={cn(
          "w-full bg-background border-b border-border shadow-lg overflow-hidden",
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col h-[460px] py-4">
            {/* Messages Area */}
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-9 w-9 shrink-0 shadow-sm">
                        {!avatarLoading && avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="Assistant" className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-3 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-md"
                          : "bg-muted text-foreground rounded-2xl rounded-bl-md border border-border"
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-9 w-9 shrink-0 shadow-sm">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                          {i18n.language === "es" ? "Tú" : "You"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-9 w-9 shrink-0">
                      {!avatarLoading && avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Assistant" className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md border border-border">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="pt-4 border-t mt-4">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t("chat.placeholder", "Type your message...")}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-full px-5 text-sm border-2 focus-visible:ring-primary/20"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="lg"
                  className="rounded-full h-12 w-12 shrink-0 shadow-md"
                  aria-label={t("chat.send", "Send")}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {i18n.language === "es" 
                  ? "Respuestas generadas por IA • Disponible 24/7"
                  : "AI-powered responses • Available 24/7"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
