import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VideoRender {
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

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('video-renders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_renders' },
        (payload) => {
          console.log('Video render update:', payload);
          queryClient.invalidateQueries({ queryKey: ['video-renders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  // Memoized map of latest render per project
  const latestRenderByProject = useMemo(() => {
    if (!renders) return new Map<string, VideoRender>();
    const map = new Map<string, VideoRender>();
    // Since renders are ordered by created_at desc, first one for each project is latest
    for (const render of renders) {
      if (!map.has(render.project_id)) {
        map.set(render.project_id, render);
      }
    }
    return map;
  }, [renders]);

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
    latestRenderByProject,
    queueRender: queueRenderMutation.mutateAsync,
    isQueuing: queueRenderMutation.isPending,
  };
}
