import { useEffect } from "react";
import { X, Send, Loader2, Bot, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AIChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    sendMessage,
    handleKeyPress,
    resetConversation,
    initializeChat,
    scrollRef,
    inputRef,
    avatarUrl,
    agentLoading,
    imagePreloaded,
  } = useAIChat();

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, inputRef]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, initializeChat]);

  return (
    <>
      {/* Chat Toggle Button - Shows Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-20 right-6 z-50 h-18 w-18 rounded-full shadow-lg transition-all duration-300",
          "bg-background border-2 border-primary/30 hover:border-primary/50 hover:shadow-xl hover:scale-105",
          "flex items-center justify-center overflow-hidden",
          isOpen && "scale-0 opacity-0"
        )}
        style={{ height: "72px", width: "72px" }}
        aria-label={t("chat.openChat", "Open chat")}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Chat Assistant" 
            className={cn(
              "h-full w-full object-cover transition-opacity duration-200",
              imagePreloaded ? "opacity-100" : "opacity-0"
            )}
            loading="eager"
            fetchPriority="high"
          />
        ) : null}
        {/* Fallback shown while loading or if no avatar */}
        {(!avatarUrl || !imagePreloaded) && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <Bot className="h-8 w-8 text-primary" />
          </div>
        )}
        {/* Pulsing online indicator */}
        <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-green-500 border-2 border-background">
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
        </span>
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
            {!agentLoading && avatarUrl ? (
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={resetConversation}
              aria-label={t("chat.newChat", "New chat")}
              title={t("chat.newChat", "New chat")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
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
                    {!agentLoading && avatarUrl ? (
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
