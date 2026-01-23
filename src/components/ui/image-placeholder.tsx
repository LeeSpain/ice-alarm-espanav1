import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithPlaceholderProps {
  imageUrl: string | null;
  altText: string;
  placeholderText?: string;
  placeholderSubtext?: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
}

export function ImageWithPlaceholder({
  imageUrl,
  altText,
  placeholderText = "Image Coming Soon",
  placeholderSubtext,
  className,
  imgClassName,
  loading = "lazy",
}: ImageWithPlaceholderProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={altText}
        className={cn("w-full h-full object-cover object-center", imgClassName)}
        loading={loading}
        decoding="async"
      />
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
