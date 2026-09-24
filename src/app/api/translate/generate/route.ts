import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // Vercel Pro: 60s; Hobby: capped at 10s

const SARVAM_LANG_MAP: Record<string, string> = {
  "hi": "hi-IN", "hi-IN": "hi-IN",
  "ta-IN": "ta-IN", "ta": "ta-IN",
  "te": "te-IN", "te-IN": "te-IN",
  "ml-IN": "ml-IN", "ml": "ml-IN",
  "bn": "bn-IN", "bn-IN": "bn-IN",
  "mr": "mr-IN", "mr-IN": "mr-IN",
  "gu": "gu-IN", "gu-IN": "gu-IN",
  "kn": "kn-IN", "kn-IN": "kn-IN",
  "pa": "pa-IN", "pa-IN": "pa-IN",
  "en": "en-IN", "auto": "en-IN",
  // Legacy display-name fallbacks
  "Hindi": "hi-IN", "Tamil": "ta-IN", "Telugu": "te-IN",
  "Malayalam": "ml-IN", "Marathi": "mr-IN", "Bengali": "bn-IN",
};

function toSarvamCode(code: string): string {
  return SARVAM_LANG_MAP[code] || code;
}

export async function POST(request: Request) {
  try {
    // Always accept JSON — the file is never sent here.
    // For file uploads: browser sends metadata only, then receives upload_url
    // to PUT the file directly to Sarvam (browser → Sarvam Azure).
    // For URL uploads: this route downloads + uploads server-side (no CORS).
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body — expected JSON." },
        { status: 400 }
      );
    }

    const {
      videoUrl,
      targetLanguage = "hi-IN",
      sourceLanguage = "en-IN",
      lipSyncEnabled = false,
      fileName,
    } = body as {
      videoUrl?: string;
      targetLanguage?: string;
      sourceLanguage?: string;
      lipSyncEnabled?: boolean;
      fileName?: string;
    };

    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey) {
      throw new Error("Server misconfiguration: missing SARVAM_API_KEY.");
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
        { error: "Insufficient credits (requires 2)." },
        { status: 402 }
      );
    }

    const sarvamSrcLang = toSarvamCode(sourceLanguage);
    const sarvamTargetLang = toSarvamCode(targetLanguage);

    // ── 1. Create Sarvam Dubbing Job ────────────────────────────────────────
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
      const text = await sarvamRes.text();
      let msg = text;
      try { msg = JSON.parse(text)?.message || text; } catch { /* noop */ }
      throw new Error(`Sarvam job creation failed (${sarvamRes.status}): ${msg}`);
    }

    const sarvamData = await sarvamRes.json();
    console.log("Sarvam Create Job:", JSON.stringify(sarvamData).substring(0, 300));

    // Sarvam returns { job_id, upload_url } either directly or under .data
    const jobPayload = sarvamData.data || sarvamData;
    const job_id: string = jobPayload.job_id;
    const upload_url: string = jobPayload.upload_url;

    if (!job_id || !upload_url) {
      throw new Error(
        `Sarvam response missing job_id/upload_url: ${JSON.stringify(sarvamData)}`
      );
    }

    // ── 2. Insert project record ──────────────────────────────────────────
    const projectTitle =
      fileName?.replace(/\.[^.]+$/, "") ||
      (videoUrl
        ? videoUrl.includes("youtu")
          ? "YouTube Video"
          : "Translated Video"
        : "Translation Job");

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: projectTitle,
        source_language: sarvamSrcLang,
        target_language: sarvamTargetLang,
        status: "uploading",
        video_url: videoUrl || `pending:${fileName || "file"}`,
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

    // ── 3. Server-side video upload for URL-based flow ────────────────────
    // For URL-based requests: download the video and upload to Sarvam here,
    // so the browser never has to touch the Azure Blob URL (avoids CORS).
    if (videoUrl) {
      console.log("Downloading video from URL:", videoUrl);
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) {
        throw new Error(
          `Failed to download source video (${videoRes.status}). ` +
          "Ensure the URL is a direct, publicly accessible video file."
        );
      }

      const videoBuffer = await videoRes.arrayBuffer();
      const sizeMB = (videoBuffer.byteLength / 1024 / 1024).toFixed(2);
      console.log(`Downloaded ${sizeMB} MB. Uploading to Sarvam...`);
      console.log("upload_url:", upload_url.substring(0, 120));

      // Do NOT set Content-Type — Azure SAS URLs reject requests
      // whose Content-Type doesn't match the signature. Omitting it
      // makes Azure use its default (application/octet-stream) which
      // always passes signature validation.
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
        },
        body: videoBuffer,
      });

      if (!uploadRes.ok) {
        // Log the full Azure XML error for debugging
        const azureErr = await uploadRes.text().catch(() => "(no body)");
        console.error(
          `Azure upload failed ${uploadRes.status}:`,
          azureErr.substring(0, 500)
        );
        throw new Error(
          `Failed to upload video to Sarvam (Azure ${uploadRes.status}). ` +
          `Detail: ${azureErr.substring(0, 200)}`
        );
      }

      console.log("Upload complete. Returning project info.");

      // Return without upload_url — browser doesn't need to upload anything
      return NextResponse.json({
        project_id: project.id,
        job_id,
        lip_sync: lipSyncEnabled,
      });
    }

    // ── 4. File upload path — return upload_url for direct browser → Sarvam ─
    // The browser will PUT the file to this Azure Blob URL.
    // Note: Sarvam's Azure storage must have CORS configured for this to work.
    return NextResponse.json({
      project_id: project.id,
      job_id,
      upload_url,
      lip_sync: lipSyncEnabled,
    });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    const msg =
      typeof error.message === "string"
        ? error.message
        : JSON.stringify(error.message);
    return NextResponse.json(
      { error: msg || "Dubberband processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
