import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Image style templates for ICE Alarm España
const IMAGE_STYLES: Record<string, string> = {
  senior_active: "A happy, healthy senior (65-75 years old) wearing an ICE Alarm SOS pendant around their neck, enjoying outdoor activities in a sunny Spanish Mediterranean setting. The pendant should be clearly visible on a lanyard or chain. The person is active, smiling, and full of life. Warm golden sunlight, terrace or garden background. Professional lifestyle photography, warm and inviting atmosphere.",
  family_peace: "A caring adult child (40-50 years) sharing a warm, loving moment with their elderly parent (70-80 years) who is wearing an ICE Alarm SOS pendant visibly around their neck. Mediterranean home setting with soft natural light. The pendant provides a subtle but reassuring presence. Emotional connection, reassuring and heartfelt. Professional family photography style.",
  pendant_focus: "A modern, sleek ICE Alarm SOS emergency pendant device worn prominently around the neck of an active, well-dressed senior. The pendant is the focal point - clearly visible on a professional lanyard or elegant chain. Lifestyle context showing independence and confidence. Clean, professional product-lifestyle photography.",
  spanish_lifestyle: "Happy seniors enjoying the beautiful Spanish Mediterranean lifestyle, with one or more wearing a visible ICE Alarm SOS pendant around their neck. Terrace with sea views, garden with olive trees, or charming Spanish courtyard. The pendant is naturally integrated into their outfit. Warm golden hour light, relaxed and content atmosphere. Professional travel-lifestyle photography.",
  independence: "A confident, independent senior (70s) wearing an ICE Alarm SOS pendant around their neck, going about daily activities with a smile - walking in a park, reading in a café, or gardening. The pendant is clearly visible, symbolizing their freedom and safety. Empowering imagery showing active aging. Natural light, authentic moments. Professional documentary-style photography.",
  peace_of_mind: "A serene scene showing a senior couple or individual relaxing safely at home in Spain, with the ICE Alarm SOS pendant visible around their neck. Comfortable living room or sunny balcony. The pendant provides a sense of security and contentment. Soft, warm lighting. Professional interior-lifestyle photography.",
};

interface ImageTextData {
  headline?: string;
  subheadline?: string;
  cta?: string;
}

interface RequestBody {
  style: string;
  topic?: string;
  image_text?: ImageTextData;
  post_id?: string;
}

function buildImagePrompt(style: string, topic?: string, imageText?: ImageTextData): string {
  const baseContext = `Create a professional, high-quality social media image for ICE Alarm España, a trusted 24/7 emergency response service for seniors living in Spain.`;
  
  const stylePrompt = IMAGE_STYLES[style] || IMAGE_STYLES.senior_active;
  
  const topicContext = topic ? `\n\nContent theme: ${topic}` : "";
  
  const requirements = `

CRITICAL Requirements:
- Professional photography quality, sharp and well-composed
- Warm, caring, and reassuring emotional tone
- THE PERSON MUST BE WEARING A VISIBLE SOS/EMERGENCY PENDANT around their neck on a lanyard or chain - this is MANDATORY
- The pendant should be a small, sleek, modern emergency device (similar to a medical alert pendant)
- DO NOT include any text, logos, or overlays in the image
- Suitable for Facebook marketing (1200x630 landscape)
- Natural, authentic representation of seniors
- Avoid clinical, hospital, or medical settings
- Focus on independence, dignity, peace of mind, and active living
- Use warm Mediterranean color palette (golden light, blue skies, terracotta)
- Include diverse but authentic representation`;

  return `${baseContext}\n\nStyle: ${stylePrompt}${topicContext}${requirements}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { style, topic, image_text, post_id }: RequestBody = await req.json();

    if (!style) {
      return new Response(
        JSON.stringify({ error: "Style is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = buildImagePrompt(style, topic, image_text);
    console.log("Generating image with prompt:", prompt.substring(0, 200) + "...");

    // Call Lovable AI Gateway with image model
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the image from the response
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData).substring(0, 500));
      throw new Error("No image generated by AI");
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to Supabase Storage
    const fileName = `ai-generated-${Date.now()}-${style}.${imageFormat}`;
    const filePath = fileName;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("social-post-images")
      .upload(filePath, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("social-post-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("Image uploaded successfully:", publicUrl);

    // Optionally update the social post with the image
    if (post_id) {
      const { error: updateError } = await supabase
        .from("social_posts")
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", post_id);

      if (updateError) {
        console.warn("Failed to update post with image:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        image_url: publicUrl,
        style,
        message: aiData.choices?.[0]?.message?.content || "Image generated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-ai-image error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate image" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
