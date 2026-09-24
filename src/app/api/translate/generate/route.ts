import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// BCP-47 UI codes → Sarvam-accepted language codes for dubbing
const SARVAM_LANG_MAP: Record<string, string> = {
  // BCP-47 codes (what the UI sends)
  "hi": "hi-IN",
  "hi-IN": "hi-IN",
  "ta-IN": "ta-IN",
  "ta": "ta-IN",
  "te": "te-IN",
  "te-IN": "te-IN",
  "ml-IN": "ml-IN",
  "bn": "bn-IN",
  "bn-IN": "bn-IN",
  "mr": "mr-IN",
  "mr-IN": "mr-IN",
  "gu": "gu-IN",
  "gu-IN": "gu-IN",
  "kn": "kn-IN",
  "kn-IN": "kn-IN",
  "pa": "pa-IN",
  "pa-IN": "pa-IN",
  "en": "en-IN",
  "auto": "en-IN",
  // Legacy display-name fallbacks
  "Hindi": "hi-IN",
  "Tamil": "ta-IN",
  "Telugu": "te-IN",
  "Malayalam": "ml-IN",
  "Marathi": "mr-IN",
  "Bengali": "bn-IN",
};

function toSarvamCode(code: string): string {
  return SARVAM_LANG_MAP[code] || code;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let videoUrl: string | null = null;
    let targetLanguage = "hi-IN";
    let sourceLanguage = "en-IN";
    let lipSyncEnabled = false;
    let uploadedFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      // File upload path
      const formData = await request.formData();
      uploadedFile = formData.get("file") as File | null;
      if (!uploadedFile) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      targetLanguage = (formData.get("targetLanguage") as string) || "hi-IN";
      sourceLanguage = (formData.get("sourceLanguage") as string) || "en-IN";
      lipSyncEnabled = formData.get("lipSyncEnabled") === "true";
    } else {
      // JSON / URL path
      const body = await request.json();
      videoUrl = body.videoUrl;
      targetLanguage = body.targetLanguage || "hi-IN";
      sourceLanguage = body.sourceLanguage || "en-IN";
      lipSyncEnabled = !!body.lipSyncEnabled;

      if (!videoUrl) {
        return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
      }
    }

    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      throw new Error("Missing SARVAM_API_KEY");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return NextResponse.json(
        { error: "Insufficient credits (requires 2)" },
        { status: 402 }
      );
    }

    // Insert new project in uploading state
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: uploadedFile ? uploadedFile.name.replace(/\.[^.]+$/, "") : "Translation Job",
        source_language: toSarvamCode(sourceLanguage),
        target_language: toSarvamCode(targetLanguage),
        status: "uploading",
        video_url: videoUrl || `pending:${uploadedFile?.name}`,
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

    const sarvamSrcLang = toSarvamCode(sourceLanguage);
    const sarvamTargetLang = toSarvamCode(targetLanguage);

    // Create Sarvam Dubbing Job
    const sarvamRes = await fetch("https://api.sarvam.ai/dubbing/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey,
      },
      body: JSON.stringify({
        src_lang: sarvamSrcLang,
        target_langs: [sarvamTargetLang],
        options: {
          speaker_voice_cloning: true,
          disable_watermark: true,
        },
      }),
    });

    if (!sarvamRes.ok) {
      const errorData = await sarvamRes.json().catch(() => null);
      const errorMessage =
        errorData?.message ||
        errorData?.error ||
        `Sarvam API Error (${sarvamRes.status})`;
      throw new Error(
        typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)
      );
    }

    const sarvamData = await sarvamRes.json();
    console.log("Sarvam Create Job Response:", JSON.stringify(sarvamData).substring(0, 400));

    // Sarvam returns { job_id, upload_url } directly OR nested under .data
    const jobPayload = sarvamData.data || sarvamData;
    const job_id: string = jobPayload.job_id;
    const upload_url: string = jobPayload.upload_url;

    if (!job_id || !upload_url) {
      throw new Error(
        `Sarvam response missing job_id or upload_url: ${JSON.stringify(sarvamData)}`
      );
    }

    return NextResponse.json({
      project_id: project.id,
      job_id,
      upload_url,
      lip_sync: lipSyncEnabled,
    });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    let msg = error.message;
    if (typeof msg !== "string") msg = JSON.stringify(msg);
    return NextResponse.json(
      { error: msg || "Dubberband processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
