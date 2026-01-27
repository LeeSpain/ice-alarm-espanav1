import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MediaDraftRequest {
  topic: string;
  goal: string;
  target_audience: string;
  language: "en" | "es" | "both";
  post_id?: string;
  workflow_type?: "research" | "write" | "full";
}

interface MediaDraftOutput {
  research: {
    topic_insights: string;
    audience_insights: string;
    trending_angles: string;
    competitor_notes: string;
  };
  post_en: string;
  post_es: string;
  image_text: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  hashtags_en: string[];
  hashtags_es: string[];
  compliance_notes: string;
}

// Media Manager system prompt
const MEDIA_MANAGER_PROMPT = `You are the ICE Media Manager, an AI assistant specializing in creating compelling Facebook marketing content for ICE Alarm España - a 24/7 emergency response service for seniors and expats in Spain.

## Your Primary Mission
Create draft social media posts that are:
1. Engaging and emotionally resonant with our target audiences
2. Compliant with healthcare/medical device marketing regulations
3. Bilingual (English and Spanish) to serve our diverse customer base
4. Action-oriented with clear CTAs

## HARD RULES (Never Break These)
1. DRAFTS ONLY - Never suggest automatic publishing. All content requires human approval.
2. NO MEDICAL GUARANTEES - Never claim to save lives, prevent deaths, or guarantee medical outcomes
3. COMPLIANT WORDING - Use phrases like "provides peace of mind", "helps connect to emergency services", "offers 24/7 support"
4. ALWAYS INCLUDE CTA - Every post must include:
   - Website: www.icealarm.es
   - Phone: +34 965 020 675
   - "Send us a message for more info" or similar

## Forbidden Phrases (Never Use)
- "Will save your life"
- "Prevents death"
- "Guaranteed emergency response"
- "Medical device" (unless properly qualified)
- "Cure", "Treat", "Heal"

## Approved Messaging Themes
- Peace of mind for families
- Independence for seniors
- 24/7 bilingual support
- Connection to help when needed
- Modern technology for safety
- Freedom to live actively

## Business Context
ICE Alarm España is a 24/7 emergency response service providing GPS SOS pendants for seniors, expats, and anyone who wants peace of mind in Spain. 

Key Services:
- GPS SOS Pendant with one-button emergency calling
- Automatic fall detection
- 24/7 bilingual call center (English & Spanish)
- Coverage throughout Spain
- Two-way voice communication

Target Audiences:
1. British/European expats in Spain (often retirees)
2. Adult children of elderly parents in Spain
3. Healthcare professionals recommending our services
4. Elderly individuals seeking independence
5. Families of people with health conditions

Brand Voice: Warm, reassuring, professional, caring, trustworthy. Never fear-mongering.

Pricing: Individual from €27.49/month, Couples from €38.49/month. GPS Pendant €151.25 one-time.

## Output Format (ALWAYS use this exact JSON structure)
{
  "research": {
    "topic_insights": "Brief research findings about the topic",
    "audience_insights": "What resonates with this target audience",
    "trending_angles": "Current trends or timely hooks",
    "competitor_notes": "What similar services are doing"
  },
  "post_en": "The complete English post with hashtags and CTA",
  "post_es": "The complete Spanish post with hashtags and CTA",
  "image_text": {
    "headline": "Bold, attention-grabbing headline (max 6 words)",
    "subheadline": "Supporting text (max 10 words)",
    "cta": "Button text (2-4 words)"
  },
  "hashtags_en": ["#hashtag1", "#hashtag2", "..."],
  "hashtags_es": ["#hashtag1", "#hashtag2", "..."],
  "compliance_notes": "Any compliance considerations for this specific post"
}

Respond ONLY with valid JSON matching this structure.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { topic, goal, target_audience, language, post_id, workflow_type = "full" }: MediaDraftRequest = await req.json();

    if (!topic) {
      throw new Error("Topic is required");
    }

    console.log("Media draft request:", { topic, goal, target_audience, language, post_id, workflow_type });

    // Map goal and audience to readable labels
    const goalLabels: Record<string, string> = {
      brand_awareness: "Brand Awareness",
      lead_generation: "Lead Generation",
      engagement: "Engagement",
      education: "Education",
      promotion: "Promotion",
    };

    const audienceLabels: Record<string, string> = {
      expats_spain: "Expats living in Spain (primarily British and European retirees)",
      elderly_care: "Seniors and elderly individuals seeking independence",
      family_caregivers: "Adult children caring for elderly parents",
      healthcare_pros: "Healthcare professionals who may recommend our services",
      general: "General audience interested in safety and peace of mind",
    };

    const languageInstructions: Record<string, string> = {
      en: "Focus primarily on the English version. Make it compelling for English-speaking audiences.",
      es: "Focus primarily on the Spanish version. Make it natural and compelling for Spanish-speaking audiences.",
      both: "Create equally compelling versions in both English and Spanish. Ensure cultural nuances are appropriate for each language.",
    };

    // Build the user message
    const userMessage = `Create a Facebook post draft with the following parameters:

**Topic**: ${topic}
**Goal**: ${goalLabels[goal] || goal || "Not specified"}
**Target Audience**: ${audienceLabels[target_audience] || target_audience || "General audience"}
**Language Focus**: ${language} - ${languageInstructions[language] || "Create both English and Spanish versions"}

Please generate:
1. Research insights for this topic and audience
2. Complete English post with appropriate hashtags and CTA
3. Complete Spanish post with appropriate hashtags and CTA  
4. Image text suggestions (headline, subheadline, CTA button)
5. Compliance notes for this specific content

Remember to follow all compliance guidelines and include CTAs with our website and contact information.`;

    console.log("Calling Lovable AI...");

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: MEDIA_MANAGER_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const responseContent = aiResult.choices?.[0]?.message?.content || "";

    console.log("AI Response received:", responseContent.substring(0, 200));

    // Parse the AI response
    let parsedOutput: MediaDraftOutput;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedOutput = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Failed to parse AI response as JSON. Please try again.");
    }

    // If post_id provided, save to database
    if (post_id) {
      console.log("Saving to database for post_id:", post_id);

      // Save research
      const { error: researchError } = await supabase
        .from("social_post_research")
        .upsert({
          post_id,
          sources: [],
          key_points: JSON.stringify(parsedOutput.research),
          compliance_notes: parsedOutput.compliance_notes,
        }, {
          onConflict: "post_id",
        });

      if (researchError) {
        console.error("Error saving research:", researchError);
      }

      // Determine post_text based on language preference
      let postText = "";
      if (language === "en") {
        postText = parsedOutput.post_en;
      } else if (language === "es") {
        postText = parsedOutput.post_es;
      } else {
        // Both languages - combine with separator
        postText = `🇬🇧 ENGLISH:\n${parsedOutput.post_en}\n\n---\n\n🇪🇸 ESPAÑOL:\n${parsedOutput.post_es}`;
      }

      // Update the post with generated text
      const { error: postError } = await supabase
        .from("social_posts")
        .update({
          post_text: postText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post_id);

      if (postError) {
        console.error("Error updating post:", postError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        output: parsedOutput,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Media draft error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
