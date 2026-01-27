import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export type ImageStyle = 
  | "senior_active" 
  | "family_peace" 
  | "pendant_focus" 
  | "spanish_lifestyle" 
  | "independence" 
  | "peace_of_mind";

export const IMAGE_STYLE_OPTIONS: { value: ImageStyle; labelKey: string }[] = [
  { value: "senior_active", labelKey: "mediaManager.imageStyles.seniorActive" },
  { value: "family_peace", labelKey: "mediaManager.imageStyles.familyPeace" },
  { value: "pendant_focus", labelKey: "mediaManager.imageStyles.pendantFocus" },
  { value: "spanish_lifestyle", labelKey: "mediaManager.imageStyles.spanishLifestyle" },
  { value: "independence", labelKey: "mediaManager.imageStyles.independence" },
  { value: "peace_of_mind", labelKey: "mediaManager.imageStyles.peaceOfMind" },
];

interface ImageTextData {
  headline?: string;
  subheadline?: string;
  cta?: string;
}

interface GenerateAIImageOptions {
  style: ImageStyle;
  topic?: string;
  imageText?: ImageTextData;
  postId?: string;
}

interface GenerateAIImageResult {
  success: boolean;
  image_url?: string;
  message?: string;
  error?: string;
}

export function useAIImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = useCallback(async (options: GenerateAIImageOptions): Promise<string | null> => {
    const { style, topic, imageText, postId } = options;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke<GenerateAIImageResult>(
        "generate-ai-image",
        {
          body: {
            style,
            topic,
            image_text: imageText,
            post_id: postId,
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success || !data.image_url) {
        throw new Error(data?.error || "Failed to generate image");
      }

      toast({
        title: "AI Image Generated",
        description: "Professional image created successfully.",
      });

      return data.image_url;
    } catch (error: unknown) {
      console.error("AI image generation error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to generate AI image";
      
      // Handle specific error cases
      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("402") || errorMessage.includes("credits")) {
        toast({
          title: "Credits Exhausted",
          description: "AI credits are exhausted. Please add more credits.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  return {
    generateImage,
    isGenerating,
  };
}
