import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface VideoProject {
  id: string;
  name: string;
  template_id: string | null;
  language: string;
  format: string;
  duration: number;
  status: string;
  data_json: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateProjectData {
  name: string;
  template_id: string | null;
  format: string;
  duration: number;
  language: string;
  status: string;
  data_json: Json;
}

export function useVideoProjects() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["video-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as VideoProject[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      const { data, error } = await supabase
        .from("video_projects")
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-projects"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; name?: string }) => {
      const { data, error } = await supabase
        .from("video_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-projects"] });
    },
  });

  const duplicateProject = async (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (!project) return;

    await createMutation.mutateAsync({
      name: `${project.name} (Copy)`,
      template_id: project.template_id,
      format: project.format,
      duration: project.duration,
      language: project.language,
      status: "draft",
      data_json: project.data_json as Json,
    });
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    await updateMutation.mutateAsync({ id: projectId, status });
  };

  return {
    projects,
    isLoading,
    createProject: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProject: updateMutation.mutateAsync,
    duplicateProject,
    updateProjectStatus,
  };
}
