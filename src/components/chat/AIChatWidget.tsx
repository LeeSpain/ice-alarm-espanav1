import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
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
      inputRef.current.focus();
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
      // Build conversation history for context
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

      // Extract the response from the AI output
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
    <>
      {/* Chat Toggle Button - Shows Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-background border-2 border-primary/20 hover:border-primary/40 hover:shadow-xl",
          "flex items-center justify-center overflow-hidden",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label={t("chat.openChat", "Open chat")}
      >
        {!avatarLoading && avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Chat Assistant" 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-7 w-7 text-primary" />
          </div>
        )}
        {/* Online indicator */}
        <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed top-20 right-6 z-50 flex flex-col",
          "w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-120px)]",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "transition-all duration-300 origin-top-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-primary text-primary-foreground rounded-t-2xl">
          <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
            {!avatarLoading && avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Assistant" />
            ) : null}
            <AvatarFallback className="bg-primary-foreground/20">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {t("chat.assistantName", "ICE Alarm Assistant")}
            </h3>
            <p className="text-xs opacity-80 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
              {t("chat.available", "Available 24/7")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
            aria-label={t("chat.closeChat", "Close chat")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    {!avatarLoading && avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Assistant" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("chat.placeholder", "Type your message...")}
              disabled={isLoading}
              className="flex-1 rounded-full"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="rounded-full shrink-0"
              aria-label={t("chat.send", "Send")}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
