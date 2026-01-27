import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MediaDraftOutput {
  research: {
    topic_insights: string;
    audience_insights: string;
    trending_angles: string;
    competitor_notes: string;
  };
  post_en: string;
  post_es: string;
  image_text: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  hashtags_en: string[];
  hashtags_es: string[];
  compliance_notes: string;
}

interface GenerateMediaDraftParams {
  topic: string;
  goal: string;
  target_audience: string;
  language: "en" | "es" | "both";
  post_id?: string;
  workflow_type?: "research" | "write" | "full";
}

export function useMediaDraft() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastOutput, setLastOutput] = useState<MediaDraftOutput | null>(null);
  const { toast } = useToast();

  const generateDraft = async (params: GenerateMediaDraftParams): Promise<MediaDraftOutput | null> => {
    if (!params.topic) {
      toast({
        title: "Topic required",
        description: "Please enter a topic before generating content",
        variant: "destructive",
      });
      return null;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("media-draft", {
        body: params,
      });

      if (error) {
        console.error("Media draft error:", error);
        
        // Handle specific error codes
        if (error.message?.includes("429")) {
          toast({
            title: "Rate limit exceeded",
            description: "Please wait a moment and try again",
            variant: "destructive",
          });
        } else if (error.message?.includes("402")) {
          toast({
            title: "AI credits exhausted",
            description: "Please add funds to continue using AI features",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Generation failed",
            description: error.message || "Failed to generate content",
            variant: "destructive",
          });
        }
        return null;
      }

      if (!data?.success) {
        toast({
          title: "Generation failed",
          description: data?.error || "Failed to generate content",
          variant: "destructive",
        });
        return null;
      }

      const output = data.output as MediaDraftOutput;
      setLastOutput(output);

      toast({
        title: "Content generated",
        description: "AI has created your draft content",
      });

      return output;
    } catch (err) {
      console.error("Media draft error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateDraft,
    isGenerating,
    lastOutput,
  };
}
