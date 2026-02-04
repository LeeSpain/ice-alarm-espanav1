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
        <CardTitle>{t("ai.trainingData", "Training Data")}</CardTitle>
        <CardDescription>{t("ai.trainingDataDesc", "Q&A pairs and examples that help train this agent.")}</CardDescription>
      </CardHeader>
      <CardContent>
        {trainingEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("ai.noTrainingData", "No training data added yet. Add memory entries with the 'training' tag.")}</p>
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
