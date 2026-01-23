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

interface UseAIChatOptions {
  agentKey?: string;
  memberId?: string | null;
  memberName?: string | null;
  staffName?: string | null;
  userRole?: "member" | "admin" | "public";
}

// Get time-appropriate greeting
function getTimeGreeting(language: string): string {
  const hour = new Date().getHours();
  
  if (language === "es") {
    if (hour >= 5 && hour < 12) return "¡Buenos días";
    if (hour >= 12 && hour < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  }
  
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

export function useAIChat(options: UseAIChatOptions | string = {}) {
  // Support legacy string parameter for agentKey
  const normalizedOptions: UseAIChatOptions = typeof options === "string" 
    ? { agentKey: options } 
    : options;
  
  const { 
    agentKey = "customer_service_expert", 
    memberId = null,
    memberName = null,
    staffName = null,
    userRole = "public"
  } = normalizedOptions;

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

  // Create welcome message helper - personalized for different user roles
  const createWelcomeMessage = useCallback((): ChatMessage => {
    const greeting = getTimeGreeting(i18n.language);
    let content: string;

    if (userRole === "admin" && staffName) {
      // Personalized greeting for admin staff
      if (i18n.language === "es") {
        content = `${greeting}, ${staffName}! 👋 Soy el Main Brain, tu asistente de IA para la gestión del sistema ICE Alarm. Puedo ayudarte con análisis de datos, gestión de miembros, reportes, y coordinar las operaciones del negocio. ¿En qué puedo ayudarte hoy?`;
      } else {
        content = `${greeting}, ${staffName}! 👋 I'm the Main Brain, your AI assistant for managing the ICE Alarm system. I can help you with data analysis, member management, reports, and coordinating business operations. What can I help you with today?`;
      }
    } else if (userRole === "member" && memberName) {
      // Personalized greeting for logged-in members
      if (i18n.language === "es") {
        content = `${greeting}, ${memberName}! 👋 Soy tu asistente personal de ICE Alarm. Estoy aquí para ayudarte con cualquier cosa que necesites - tu dispositivo, tu cuenta, o cualquier pregunta. ¿En qué puedo ayudarte hoy?`;
      } else {
        content = `${greeting}, ${memberName}! 👋 I'm your personal ICE Alarm assistant. I'm here to help you with anything you need - your device, your account, or any questions you have. How can I help you today?`;
      }
    } else {
      // Generic welcome for public visitors
      content = t("chat.welcomeMessage");
    }

    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  }, [t, i18n.language, memberName, staffName, userRole]);

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
