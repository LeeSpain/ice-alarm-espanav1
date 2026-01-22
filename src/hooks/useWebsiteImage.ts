import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultAsset } from "@/config/websiteImages";

interface WebsiteImage {
  id: string;
  location_key: string;
  image_url: string;
  alt_text: string | null;
  updated_at: string;
}

/**
 * Fetch a single website image with instant fallback to bundled asset.
 * Shows the local default immediately while loading, then swaps to custom if available.
 */
export function useWebsiteImage(locationKey: string) {
  const defaultAsset = getDefaultAsset(locationKey);
  
  const { data, error } = useQuery({
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
    staleTime: 1000 * 60 * 10, // 10 minutes cache (increased from 5)
  });

  // Return default asset immediately while loading - eliminates visual flicker
  return {
    imageUrl: data?.image_url || defaultAsset,
    altText: data?.alt_text || "",
    isLoading: false, // Never show loading state - always have an image ready
    error,
    hasCustomImage: !!data?.image_url,
  };
}

/**
 * Batch fetch all website images in a single query.
 * Use this when a page needs multiple images to reduce network requests.
 */
export function useWebsiteImagesBatch(locationKeys: string[]) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["website-images-batch", locationKeys.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_images")
        .select("*")
        .in("location_key", locationKeys);
      
      if (error) throw error;
      
      // Return as a map for easy access
      const imageMap: Record<string, WebsiteImage> = {};
      (data || []).forEach((img: WebsiteImage) => {
        imageMap[img.location_key] = img;
      });
      return imageMap;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    enabled: locationKeys.length > 0,
  });

  // Helper to get a specific image from the batch with fallback
  const getImage = (locationKey: string) => {
    const defaultAsset = getDefaultAsset(locationKey);
    const customImage = data?.[locationKey];
    return {
      imageUrl: customImage?.image_url || defaultAsset,
      altText: customImage?.alt_text || "",
      hasCustomImage: !!customImage?.image_url,
    };
  };

  return {
    images: data || {},
    getImage,
    isLoading,
    error,
  };
}

/**
 * Fetch all website images for admin management.
 */
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
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  return {
    images: data || [],
    isLoading,
    error,
    refetch,
  };
}
