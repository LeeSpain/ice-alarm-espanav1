import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VideoBrandSettings {
  id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  watermark_enabled: boolean;
  disclaimers_en: string | null;
  disclaimers_es: string | null;
  default_cta_en: string | null;
  default_cta_es: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateSettingsData {
  logo_url?: string | null;
  watermark_enabled?: boolean;
  disclaimers_en?: string;
  disclaimers_es?: string;
  default_cta_en?: string;
  default_cta_es?: string;
}

export function useVideoBrandSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["video-brand-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_brand_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as VideoBrandSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateSettingsData) => {
      if (!settings?.id) throw new Error("No settings found");
      
      const { data, error } = await supabase
        .from("video_brand_settings")
        .update(updates)
        .eq("id", settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-brand-settings"] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
