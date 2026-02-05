import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VideoExport {
  id: string;
  project_id: string;
  render_id: string | null;
  mp4_url: string | null;
  srt_url: string | null;
  vtt_url: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  // YouTube fields
  youtube_video_id: string | null;
  youtube_url: string | null;
  youtube_status: string | null;
  youtube_error: string | null;
  youtube_published_at: string | null;
}

export function useVideoExports() {
  const queryClient = useQueryClient();

  // Realtime subscription for new exports
  useEffect(() => {
    const channel = supabase
      .channel('video-exports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_exports' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['video-exports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
