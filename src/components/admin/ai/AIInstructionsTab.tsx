import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAgentConfig } from "@/hooks/useAIAgents";
import type { AIAgent, AIAgentConfig } from "@/hooks/useAIAgents";

interface AIInstructionsTabProps {
  agent: AIAgent;
  config: AIAgentConfig;
}

export function AIInstructionsTab({ agent, config }: AIInstructionsTabProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [systemInstruction, setSystemInstruction] = useState(config.system_instruction);
  const [businessContext, setBusinessContext] = useState(config.business_context || "");
  const updateConfig = useUpdateAgentConfig();

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        configId: config.id,
        updates: { system_instruction: systemInstruction, business_context: businessContext }
      });
      toast({ title: t("common.saved"), description: t("ai.instructionsSaved") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("ai.systemInstruction")}</CardTitle>
          <CardDescription>{t("ai.systemInstructionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("ai.businessContext")}</CardTitle>
          <CardDescription>{t("ai.businessContextDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={businessContext}
            onChange={(e) => setBusinessContext(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <Button onClick={handleSave} disabled={updateConfig.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
