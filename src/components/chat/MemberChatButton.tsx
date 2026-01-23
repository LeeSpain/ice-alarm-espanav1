import { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { AIChatWidget } from "./AIChatWidget";
import { useAIAgent } from "@/hooks/useAIAgents";

const AGENT_KEY = "member_specialist";

interface MemberChatButtonProps {
  className?: string;
  memberId?: string | null;
}

export function MemberChatButton({ className, memberId }: MemberChatButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreloaded, setImagePreloaded] = useState(false);
  
  // Fetch the member specialist agent to get its avatar
  const { data: agent } = useAIAgent(AGENT_KEY);
  const avatarUrl = agent?.avatar_url;

  // Preload avatar image for instant display
  useEffect(() => {
    if (avatarUrl && !imagePreloaded) {
      const img = new Image();
      img.src = avatarUrl;
      img.onload = () => setImagePreloaded(true);
    }
  }, [avatarUrl, imagePreloaded]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative h-10 w-10 rounded-full transition-all duration-200",
          "bg-background border border-border hover:border-primary/50 hover:shadow-md",
          "flex items-center justify-center overflow-hidden",
          className
        )}
        aria-label={t("chat.openChat", "Open chat")}
      >
        {avatarUrl && imagePreloaded ? (
          <img 
            src={avatarUrl} 
            alt="AI Assistant" 
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <Bot className="h-5 w-5 text-primary" />
        )}
        {/* Pulsing online indicator */}
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background">
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
        </span>
      </button>

      {isOpen && (
        <AIChatWidget 
          defaultOpen={true} 
          onClose={() => setIsOpen(false)}
          agentKey={AGENT_KEY}
          memberId={memberId}
        />
      )}
    </>
  );
}
