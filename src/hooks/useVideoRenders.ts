import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VideoRender {
  id: string;
  project_id: string;
  status: string;
  progress: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export function useVideoRenders(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: renders, isLoading } = useQuery({
    queryKey: ["video-renders", projectId],
    queryFn: async () => {
      let query = supabase
        .from("video_renders")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VideoRender[];
    },
    enabled: true,
  });

  const queueRenderMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // Create a render record with queued status
      const { data, error } = await supabase
        .from("video_renders")
        .insert({ project_id: projectId, status: "queued", progress: 0 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-renders"] });
    },
  });

  return {
    renders,
    isLoading,
    queueRender: queueRenderMutation.mutateAsync,
    isQueuing: queueRenderMutation.isPending,
  };
}
