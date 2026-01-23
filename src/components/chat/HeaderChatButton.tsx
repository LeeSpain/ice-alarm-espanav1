import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { AIChatWidget } from "./AIChatWidget";

interface HeaderChatButtonProps {
  className?: string;
}

export function HeaderChatButton({ className }: HeaderChatButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "gap-2 text-sm font-medium hover:text-primary transition-colors",
          className
        )}
        aria-label={t("chat.openChat", "Chat with AI Assistant")}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{t("chat.headerButton", "AI Help")}</span>
      </Button>

      {/* Render the chat widget when open */}
      {isOpen && (
        <AIChatWidget 
          defaultOpen={true} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
