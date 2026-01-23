import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAIAgent } from "@/hooks/useAIAgents";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useAIChat(agentKey: string = "customer_service_expert", memberId?: string | null) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [imagePreloaded, setImagePreloaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch the agent to get its avatar
  const { data: currentAgent, isLoading: agentLoading } = useAIAgent(agentKey);
  const avatarUrl = currentAgent?.avatar_url;

  // Preload avatar image for instant display
  useEffect(() => {
    if (avatarUrl && !imagePreloaded) {
      const img = new Image();
      img.src = avatarUrl;
      img.onload = () => setImagePreloaded(true);
    }
  }, [avatarUrl, imagePreloaded]);

  // Create welcome message helper
  const createWelcomeMessage = useCallback((): ChatMessage => ({
    id: crypto.randomUUID(),
    role: "assistant",
    content: t("chat.welcomeMessage"),
    timestamp: new Date(),
  }), [t]);

  // Reset conversation
  const resetConversation = useCallback(() => {
    setConversationId(crypto.randomUUID());
    setMessages([createWelcomeMessage()]);
    setCurrentLanguage(i18n.language);
  }, [i18n.language, createWelcomeMessage]);

  // Detect language changes and reset conversation
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      resetConversation();
    }
  }, [i18n.language, currentLanguage, resetConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with welcome message
  const initializeChat = useCallback(() => {
    if (messages.length === 0) {
      setMessages([createWelcomeMessage()]);
      setCurrentLanguage(i18n.language);
    }
  }, [messages.length, i18n.language, createWelcomeMessage]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
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
          agentKey,
          context: {
            conversationId,
            userLanguage: i18n.language,
            conversationHistory,
            currentMessage: userMessage.content,
            source: "chat_widget",
            memberId: memberId || undefined,
          },
        },
      });

      if (error) throw error;

      // Extract the response from the AI output
      let responseText = t("chat.fallbackMessage");

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

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t("chat.errorMessage"),
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

  return {
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
  };
}
