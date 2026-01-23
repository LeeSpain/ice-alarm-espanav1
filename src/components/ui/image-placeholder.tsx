import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ImageWithPlaceholderProps {
  imageUrl: string | null;
  altText: string;
  placeholderText?: string;
  placeholderSubtext?: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
  /** Set to true for above-the-fold images to prioritize loading */
  priority?: boolean;
  /** Explicit width to prevent layout shift */
  width?: number;
  /** Explicit height to prevent layout shift */
  height?: number;
  /** Show skeleton loader while URL is being fetched from database */
  isLoadingUrl?: boolean;
  /** Low-quality blur placeholder (base64 data URL) for blur-up effect */
  blurPlaceholder?: string | null;
  /** Dominant color for initial background before blur placeholder loads */
  dominantColor?: string | null;
}

export function ImageWithPlaceholder({
  imageUrl,
  altText,
  placeholderText = "Image Coming Soon",
  placeholderSubtext,
  className,
  imgClassName,
  loading = "lazy",
  priority = false,
  width,
  height,
  isLoadingUrl = false,
  blurPlaceholder,
  dominantColor,
}: ImageWithPlaceholderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [blurLoaded, setBlurLoaded] = useState(false);

  // Show skeleton when loading URL from database
  if (isLoadingUrl) {
    return (
      <div 
        className={cn("relative w-full h-full overflow-hidden", className)}
        style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse rounded-inherit" />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div 
        className={cn("relative w-full h-full overflow-hidden", className)}
        style={{ 
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          backgroundColor: dominantColor || undefined,
        }}
      >
        {/* Blur placeholder layer - shows immediately with blur */}
        {blurPlaceholder && !isLoaded && (
          <img
            src={blurPlaceholder}
            alt=""
            aria-hidden="true"
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-center scale-110",
              "transition-opacity duration-500",
              blurLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{ filter: "blur(20px)" }}
            onLoad={() => setBlurLoaded(true)}
          />
        )}
        
        {/* Skeleton fallback if no blur placeholder */}
        {!blurPlaceholder && !isLoaded && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse"
            style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
          />
        )}

        {/* Main image - transitions in over blur */}
        <img
          src={imageUrl}
          alt={altText}
          className={cn(
            "w-full h-full object-cover object-center",
            "transition-opacity duration-700 ease-out",
            isLoaded ? "opacity-100" : "opacity-0",
            imgClassName
          )}
          loading={priority ? "eager" : loading}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50",
        className
      )}
    >
      <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm font-medium opacity-60">{placeholderText}</p>
      {placeholderSubtext && (
        <p className="text-xs opacity-50 mt-1">{placeholderSubtext}</p>
      )}
    </div>
  );
}