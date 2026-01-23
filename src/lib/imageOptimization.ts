/**
 * Image optimization utilities for WebP conversion and blur-up placeholders
 */

/**
 * Convert an image file to WebP format with quality optimization
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert to WebP"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a tiny blur placeholder (LQIP - Low Quality Image Placeholder)
 * Returns a base64 data URL of a very small, blurred version of the image
 */
export async function generateBlurPlaceholder(file: File, size = 20): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      const width = size;
      const height = Math.round(size / aspectRatio);

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw tiny version
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with low quality
      const dataUrl = canvas.toDataURL("image/webp", 0.1);
      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image for placeholder"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extract dominant color from an image for use as initial background
 */
export async function extractDominantColor(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Use tiny canvas for faster processing
      canvas.width = 1;
      canvas.height = 1;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      
      // Return as HSL for theming compatibility
      const hsl = rgbToHsl(r, g, b);
      resolve(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    };

    img.onerror = () => resolve("hsl(var(--muted))"); // Fallback to theme color
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Check if browser supports WebP encoding
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}

/**
 * Optimize image: convert to WebP and generate blur placeholder
 */
export async function optimizeImage(file: File): Promise<{
  optimizedBlob: Blob;
  blurPlaceholder: string;
  dominantColor: string;
  originalSize: number;
  optimizedSize: number;
  savedPercentage: number;
}> {
  const originalSize = file.size;
  
  // Generate blur placeholder and dominant color in parallel
  const [blurPlaceholder, dominantColor] = await Promise.all([
    generateBlurPlaceholder(file),
    extractDominantColor(file),
  ]);

  // Convert to WebP if supported and not already WebP
  let optimizedBlob: Blob;
  if (supportsWebP() && file.type !== "image/webp") {
    optimizedBlob = await convertToWebP(file);
  } else {
    optimizedBlob = file;
  }

  const optimizedSize = optimizedBlob.size;
  const savedPercentage = Math.round((1 - optimizedSize / originalSize) * 100);

  return {
    optimizedBlob,
    blurPlaceholder,
    dominantColor,
    originalSize,
    optimizedSize,
    savedPercentage,
  };
}
