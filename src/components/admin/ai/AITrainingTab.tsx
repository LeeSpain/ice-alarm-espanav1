import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIMemory } from "@/hooks/useAIAgents";
import type { AIAgent } from "@/hooks/useAIAgents";

interface AITrainingTabProps { agent: AIAgent; }

export function AITrainingTab({ agent }: AITrainingTabProps) {
  const { t } = useTranslation();
  const { data: memories } = useAIMemory(agent.id);
  const trainingEntries = memories?.filter(m => m.tags?.includes("training")) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ai.trainingData")}</CardTitle>
        <CardDescription>{t("ai.trainingDataDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {trainingEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("ai.noTrainingData")}</p>
        ) : (
          <div className="space-y-2">
            {trainingEntries.map(e => (
              <div key={e.id} className="p-3 border rounded-lg">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
