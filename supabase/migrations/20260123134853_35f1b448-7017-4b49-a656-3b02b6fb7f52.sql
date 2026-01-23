-- Add blur_placeholder and dominant_color columns to website_images table
ALTER TABLE public.website_images 
ADD COLUMN IF NOT EXISTS blur_placeholder TEXT,
ADD COLUMN IF NOT EXISTS dominant_color TEXT;