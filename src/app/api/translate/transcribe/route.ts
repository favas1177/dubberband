import { NextResponse } from "next/server";

// BCP-47 → Sarvam language codes
const SARVAM_LANG_MAP: Record<string, string> = {
  "ml-IN": "ml-IN",
  "hi": "hi-IN",
  "hi-IN": "hi-IN",
  "ta-IN": "ta-IN",
  "ta": "ta-IN",
  "te": "te-IN",
  "te-IN": "te-IN",
  "bn": "bn-IN",
  "bn-IN": "bn-IN",
  "mr": "mr-IN",
  "mr-IN": "mr-IN",
  "gu": "gu-IN",
  "gu-IN": "gu-IN",
  "kn": "kn-IN",
  "kn-IN": "kn-IN",
  "or": "od-IN",
  "pa": "pa-IN",
  "pa-IN": "pa-IN",
  "en": "en-IN",
  "auto": "unknown",
};

function toSarvamCode(code: string): string {
  return SARVAM_LANG_MAP[code] || code;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const sarvamKey = process.env.SARVAM_API_KEY;

    let audioBlob: Blob | null = null;
    let videoUrl: string | null = null;
    let sourceLanguage = "auto";
    let targetLanguage = "hi-IN";

    if (contentType.includes("multipart/form-data")) {
      // File upload path
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      audioBlob = new Blob([await file.arrayBuffer()], { type: file.type || "video/mp4" });
      sourceLanguage = (formData.get("sourceLanguage") as string) || "auto";
      targetLanguage = (formData.get("targetLanguage") as string) || "hi-IN";
    } else {
      // JSON / URL path
      const body = await request.json();
      videoUrl = body.videoUrl;
      sourceLanguage = body.sourceLanguage || "auto";
      targetLanguage = body.targetLanguage || "hi-IN";

      if (!videoUrl) {
        return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
      }
    }

    let transcriptBlocks = [];

    if (!sarvamKey) {
      console.warn("[DEMO MODE: Missing SARVAM_API_KEY, returning mock data]");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      transcriptBlocks = [
        {
          id: "blk-001",
          startTime: "00:00",
          endTime: "00:05",
          startSeconds: 0,
          text: "Welcome to Dubberband.",
          translatedText: "டப்பர்பேண்டிற்கு வரவேற்கிறோம்.",
        },
      ];
    } else {
      // ── Step 1: Get the video as a blob ──────────────────────────────
      if (!audioBlob) {
        console.log("Fetching video from URL:", videoUrl);
        const videoRes = await fetch(videoUrl!);
        if (!videoRes.ok) {
          throw new Error(`Failed to download video: ${videoRes.status}`);
        }
        const buffer = await videoRes.arrayBuffer();
        audioBlob = new Blob([buffer], { type: "video/mp4" });
      }

      // ── Step 2: Sarvam Speech-to-Text ────────────────────────────────
      const sttForm = new FormData();
      sttForm.append("file", audioBlob, "input.mp4");
      sttForm.append("model", "saaras:v2");
      sttForm.append("mode", "transcribe");
      // Only pass language_code if not auto-detect
      const sarvamSource = toSarvamCode(sourceLanguage);
      if (sarvamSource !== "unknown") {
        sttForm.append("language_code", sarvamSource);
      }

      console.log("Calling Sarvam STT...");
      const sttRes = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamKey,
        },
        body: sttForm,
      });

      if (!sttRes.ok) {
        const errorData = await sttRes.json().catch(() => null);
        let errorMessage =
          errorData?.message ||
          errorData?.error ||
          `Sarvam STT API Error (${sttRes.status})`;
        if (typeof errorMessage !== "string") errorMessage = JSON.stringify(errorMessage);
        throw new Error(errorMessage);
      }

      const sttData = await sttRes.json();
      console.log("STT Result:", JSON.stringify(sttData).substring(0, 300));
      const sourceText = sttData.transcript || "";

      // ── Step 3: Sarvam Text Translate ────────────────────────────────
      const sarvamTarget = toSarvamCode(targetLanguage);
      // Only translate if source ≠ target
      let translatedText = sourceText;

      if (sarvamSource !== sarvamTarget && sourceText.trim()) {
        console.log("Calling Sarvam Translate...");
        const translateRes = await fetch("https://api.sarvam.ai/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": sarvamKey,
          },
          body: JSON.stringify({
            input: sourceText,
            source_language_code: sarvamSource !== "unknown" ? sarvamSource : "auto",
            target_language_code: sarvamTarget,
            speaker_gender: "Male",
            mode: "formal",
            model: "mayura:v1",
          }),
        });

        if (!translateRes.ok) {
          const errorData = await translateRes.json().catch(() => null);
          let errorMessage =
            errorData?.message ||
            errorData?.error ||
            `Sarvam Translate API Error (${translateRes.status})`;
          if (typeof errorMessage !== "string")
            errorMessage = JSON.stringify(errorMessage);
          throw new Error(errorMessage);
        }

        const translateData = await translateRes.json();
        translatedText = translateData.translated_text || sourceText;
      }

      transcriptBlocks = [
        {
          id: "blk-001",
          startTime: "00:00",
          endTime: "99:99",
          startSeconds: 0,
          text: sourceText,
          translatedText,
        },
      ];
    }

    return NextResponse.json({ transcript: transcriptBlocks });
  } catch (error: any) {
    console.error("Transcribe API Error:", error);
    let msg = error.message;
    if (typeof msg !== "string") msg = JSON.stringify(msg);
    return NextResponse.json(
      { error: msg || "Dubberband processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
