import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { project_id, job_id, lip_sync, video_url, engine } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let newVideoUrl = video_url;

    if (engine === "fora") {
      // HeyGen starts translation automatically, nothing to do here
      // Encode job_id in URL for the cron job to poll
      newVideoUrl = `${video_url}#heygen_job:${job_id}`;
    } else {
      // Start Sarvam Job
      const sarvamKey = process.env.SARVAM_API_KEY;
      if (!sarvamKey) throw new Error("Missing SARVAM_API_KEY");

      const startRes = await fetch(`https://api.sarvam.ai/dubbing/jobs/${job_id}/start`, {
        method: "POST",
        headers: { "api-subscription-key": sarvamKey },
      });

      if (!startRes.ok) {
        const errorData = await startRes.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to start Sarvam job");
      }

      // Embed job_id and lip_sync config into the video_url so the cron job knows what to do
      newVideoUrl = `${video_url}#sarvam_job:${job_id}?lipsync=${lip_sync ? 'true' : 'false'}`;
    }

    // Update project status to processing
    await supabase
      .from("projects")
      .update({
        status: "processing",
        video_url: newVideoUrl,
      })
      .eq("id", project_id);

    return NextResponse.json({ success: true, message: "Translation started" });
  } catch (error: any) {
    console.error("Start API Error:", error);
    let msg = error.message;
    if (typeof msg !== "string") {
      msg = JSON.stringify(msg);
    }
    return NextResponse.json(
      { error: msg || "Failed to start processing." },
      { status: 500 }
    );
  }
}
