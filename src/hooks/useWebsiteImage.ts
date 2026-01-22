import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WebsiteImage {
  id: string;
  location_key: string;
  image_url: string;
  alt_text: string | null;
  updated_at: string;
}

export function useWebsiteImage(locationKey: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["website-image", locationKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_images")
        .select("*")
        .eq("location_key", locationKey)
        .maybeSingle();
      
      if (error) throw error;
      return data as WebsiteImage | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    imageUrl: isLoading ? null : (data?.image_url || null),
    altText: data?.alt_text || "",
    isLoading,
    error,
    hasCustomImage: !!data?.image_url,
  };
}

export function useWebsiteImages() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["website-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_images")
        .select("*")
        .order("location_key");
      
      if (error) throw error;
      return (data || []) as WebsiteImage[];
    },
  });

  return {
    images: data || [],
    isLoading,
    error,
    refetch,
  };
}
