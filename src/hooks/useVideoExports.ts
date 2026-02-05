import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VideoExport {
  id: string;
  project_id: string;
  render_id: string | null;
  mp4_url: string | null;
  srt_url: string | null;
  vtt_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export function useVideoExports() {
  const queryClient = useQueryClient();

  const { data: exports, isLoading } = useQuery({
    queryKey: ["video-exports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_exports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VideoExport[];
    },
  });

  const sendToOutreachMutation = useMutation({
    mutationFn: async (exportId: string) => {
      // Create a link record in video_outreach_links
      const { data, error } = await supabase
        .from("video_outreach_links")
        .insert({ export_id: exportId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-outreach-links"] });
    },
  });

  return {
    exports,
    isLoading,
    sendToOutreach: sendToOutreachMutation.mutateAsync,
    isSending: sendToOutreachMutation.isPending,
  };
}
