import { NextResponse } from "next/server";
import { generateSchema } from "@/lib/validations/translation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateSchema.parse(body);

    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      throw new Error("Missing SARVAM_API_KEY");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return NextResponse.json({ error: "Insufficient credits (requires 2)" }, { status: 402 });
    }

    // Insert new project in uploading state
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: "Translation Job",
        source_language: "English",
        target_language: parsed.targetLanguage,
        status: "uploading",
        video_url: parsed.videoUrl,
      })
      .select()
      .single();

    if (insertError || !project) {
       throw new Error("Failed to create project record.");
    }

    // Deduct credits
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - 2 })
      .eq("id", user.id);

    // Map target language to Sarvam code (e.g., 'Hindi' -> 'hi-IN')
    const targetLangMap: Record<string, string> = {
      Hindi: "hi-IN",
      Tamil: "ta-IN",
      Telugu: "te-IN",
      Malayalam: "ml-IN",
      Marathi: "mr-IN",
      Bengali: "bn-IN",
    };
    const sarvamTargetLang = targetLangMap[parsed.targetLanguage] || "hi-IN";

    // Create Sarvam Job
    const sarvamRes = await fetch("https://api.sarvam.ai/dubbing/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey,
      },
      body: JSON.stringify({
        src_lang: "en-IN", // Hardcoded to english for now
        target_langs: [sarvamTargetLang],
        options: { speaker_voice_cloning: true },
      }),
    });

    if (!sarvamRes.ok) {
      const errorData = await sarvamRes.json().catch(() => null);
      throw new Error(errorData?.message || "Failed to create Sarvam job");
    }

    const sarvamData = await sarvamRes.json();
    const { job_id, upload_url } = sarvamData.data;

    return NextResponse.json({
      project_id: project.id,
      job_id: job_id,
      upload_url: upload_url,
      lip_sync: parsed.lipSyncEnabled
    });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    let msg = error.message;
    if (typeof msg !== "string") {
      msg = JSON.stringify(msg);
    }
    return NextResponse.json(
      { error: msg || "Dubberband processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
