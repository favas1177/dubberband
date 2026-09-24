import { NextResponse } from "next/server";
import { transcribeSchema } from "@/lib/validations/translation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = transcribeSchema.parse(body);

    let sarvamKey = process.env.SARVAM_API_KEY;
    let transcriptBlocks = [];

    if (!sarvamKey) {
      console.warn("[DEMO MODE: Missing API Key, returning mock data]");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      transcriptBlocks = [
        { id: "blk-001", startTime: "00:00", endTime: "00:05", startSeconds: 0, text: "Welcome to Dubberband.", translatedText: "டப்பர்பேண்டிற்கு வரவேற்கிறோம்." },
      ];
    } else {
      console.log("Fetching video from URL:", parsed.videoUrl);
      // Download the video
      const videoRes = await fetch(parsed.videoUrl);
      if (!videoRes.ok) {
        throw new Error(`Failed to download video: ${videoRes.status}`);
      }
      
      const arrayBuffer = await videoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const formData = new FormData();
      const blob = new Blob([buffer], { type: "video/mp4" });
      formData.append("file", blob, "video.mp4");
      formData.append("model", "saaras:v3");
      // Since mode=translate outputs English, we use transcribe and then translate, or maybe there's a better way. 
      // Actually, if we use translate it outputs English. 
      // But the requirement is Malayalam to Tamil. 
      // Let's just use mode=transcribe to get Malayalam text, then call /translate to Tamil.
      formData.append("mode", "transcribe");

      console.log("Calling Sarvam STT...");
      const sttRes = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamKey,
        },
        body: formData,
      });

      if (!sttRes.ok) {
        const errorData = await sttRes.json().catch(() => null);
        let errorMessage = errorData?.message || errorData?.error || `Sarvam STT API Error (${sttRes.status})`;
        if (typeof errorMessage !== "string") errorMessage = JSON.stringify(errorMessage);
        throw new Error(errorMessage);
      }

      const sttData = await sttRes.json();
      console.log("STT Result:", JSON.stringify(sttData).substring(0, 200));
      
      const malayalamText = sttData.transcript || "Hello";
      
      console.log("Calling Sarvam Translate...");
      const translateRes = await fetch("https://api.sarvam.ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": sarvamKey,
        },
        body: JSON.stringify({
          input: malayalamText,
          source_language_code: "ml-IN",
          target_language_code: "ta-IN",
          speaker_gender: "Male",
          mode: "formal",
          model: "sarvam-translate:v1"
        }),
      });

      if (!translateRes.ok) {
        const errorData = await translateRes.json().catch(() => null);
        let errorMessage = errorData?.message || errorData?.error || `Sarvam Translate API Error (${translateRes.status})`;
        if (typeof errorMessage !== "string") errorMessage = JSON.stringify(errorMessage);
        throw new Error(errorMessage);
      }

      const translateData = await translateRes.json();
      const tamilText = translateData.translated_text || "";

      transcriptBlocks = [
        {
          id: "blk-001",
          startTime: "00:00",
          endTime: "99:99",
          startSeconds: 0,
          text: malayalamText,
          translatedText: tamilText,
        }
      ];
    }

    return NextResponse.json({ transcript: transcriptBlocks });
  } catch (error: any) {
    console.error("Transcribe API Error:", error);
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
