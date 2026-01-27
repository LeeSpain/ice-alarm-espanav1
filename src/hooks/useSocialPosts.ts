import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type SocialPostStatus = "draft" | "approved" | "published" | "failed";
export type SocialPostLanguage = "en" | "es" | "both";

export interface SocialPost {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  approved_by: string | null;
  platform: string;
  status: SocialPostStatus;
  language: SocialPostLanguage;
  goal: string | null;
  target_audience: string | null;
  topic: string | null;
  post_text: string | null;
  image_url: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  facebook_post_id: string | null;
  error_message: string | null;
}

export interface SocialPostResearch {
  id: string;
  created_at: string;
  post_id: string;
  sources: any[];
  key_points: string | null;
  compliance_notes: string | null;
}

export interface CreateSocialPostData {
  goal?: string;
  target_audience?: string;
  topic?: string;
  language?: SocialPostLanguage;
  post_text?: string;
  image_url?: string;
}

export interface UpdateSocialPostData extends Partial<CreateSocialPostData> {
  status?: SocialPostStatus;
  scheduled_for?: string | null;
}

export function useSocialPosts(statusFilter?: SocialPostStatus | "all") {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all posts with optional status filter
  const postsQuery = useQuery({
    queryKey: ["social-posts", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialPost[];
    },
  });

  // Create a new draft
  const createMutation = useMutation({
    mutationFn: async (data: CreateSocialPostData) => {
      const { data: post, error } = await supabase
        .from("social_posts")
        .insert({
          ...data,
          created_by: user?.id,
          status: "draft",
          platform: "facebook",
        })
        .select()
        .single();

      if (error) throw error;
      return post as SocialPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({ title: "Draft created", description: "Your post draft has been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error creating draft", description: error.message, variant: "destructive" });
    },
  });

  // Update a post
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSocialPostData }) => {
      const { data: post, error } = await supabase
        .from("social_posts")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return post as SocialPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({ title: "Draft updated", description: "Your changes have been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error updating draft", description: error.message, variant: "destructive" });
    },
  });

  // Approve a post
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: post, error } = await supabase
        .from("social_posts")
        .update({
          status: "approved",
          approved_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return post as SocialPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({ title: "Post approved", description: "The post is ready to publish." });
    },
    onError: (error: any) => {
      toast({ title: "Error approving post", description: error.message, variant: "destructive" });
    },
  });

  // Delete a post
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({ title: "Post deleted", description: "The post has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
    },
  });

  return {
    posts: postsQuery.data || [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    createDraft: createMutation.mutateAsync,
    updateDraft: updateMutation.mutateAsync,
    approvePost: approveMutation.mutateAsync,
    deletePost: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
  };
}

export function useSocialPost(id: string | null) {
  return useQuery({
    queryKey: ["social-post", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as SocialPost | null;
    },
    enabled: !!id,
  });
}
