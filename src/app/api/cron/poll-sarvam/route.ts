import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Uses service role key to bypass RLS since this is a cron job
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const sarvamKey = process.env.SARVAM_API_KEY;
    const heygenKey = process.env.HEYGEN_API_KEY;

    if (!sarvamKey) {
      return NextResponse.json({ error: "Missing SARVAM_API_KEY" }, { status: 500 });
    }

    // 1. Fetch all processing projects linked to Sarvam
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "processing")
      .like("video_url", "%#sarvam_job:%");

    if (error) throw error;

    if (!projects || projects.length === 0) {
      return NextResponse.json({ message: "No active Sarvam jobs to poll" });
    }

    const results = [];

    // 2. Poll each project
    for (const project of projects) {
      // Parse the video_url to extract the original URL, job ID, and lipSync setting
      // Format: original_url#sarvam_job:job_id?lipsync=true
      const [originalUrl, hash] = project.video_url.split("#sarvam_job:");
      if (!hash) continue;

      const [jobId, query] = hash.split("?");
      const lipSync = query?.includes("lipsync=true");

      try {
        // Poll Sarvam Live Status
        const liveRes = await fetch(`https://api.sarvam.ai/dubbing/jobs/${jobId}/live-status`, {
          headers: { "api-subscription-key": sarvamKey },
        });

        if (!liveRes.ok) {
          console.error(`Failed to fetch live-status for job ${jobId}`);
          continue;
        }

        const liveData = await liveRes.json();
        const status = liveData.data?.status;

        if (status === "failed") {
          await supabase
            .from("projects")
            .update({ status: "failed" })
            .eq("id", project.id);
          results.push({ job_id: jobId, status: "failed" });
          continue;
        }

        if (status === "completed") {
          // Fetch Export Status
          const exportRes = await fetch(`https://api.sarvam.ai/dubbing/jobs/${jobId}/export-status`, {
            headers: { "api-subscription-key": sarvamKey },
          });

          if (!exportRes.ok) {
            console.error(`Failed to fetch export-status for job ${jobId}`);
            continue;
          }

          const exportData = await exportRes.json();
          const exports = exportData.data?.exports || [];

          // Find the video export URL (fallback to first export if needed)
          const videoExport = exports.find((e: any) => e.export_type === "video") || exports[0];
          const audioExport = exports.find((e: any) => e.export_type === "audio") || videoExport;

          if (!videoExport) {
            console.error(`No exports found for job ${jobId}`);
            continue;
          }

          if (lipSync && heygenKey) {
            // Trigger HeyGen Lip-Sync using the original video and cloned audio
            const heygenRes = await fetch("https://api.heygen.com/v3/lipsyncs", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": heygenKey,
              },
              body: JSON.stringify({
                video_url: originalUrl,
                audio_url: audioExport.download_url,
                mode: "speed",
              }),
            });

            if (!heygenRes.ok) {
              console.error(`HeyGen queue failed for job ${jobId}`);
              await supabase
                .from("projects")
                .update({ status: "failed" })
                .eq("id", project.id);
              results.push({ job_id: jobId, status: "failed_heygen" });
              continue;
            }

            const heygenData = await heygenRes.json();
            const heygenJobId = heygenData.job_id || "heygen_job_" + Math.random().toString(36).substring(2, 10);

            // Update project to track HeyGen webhook
            await supabase
              .from("projects")
              .update({
                video_url: `${originalUrl}#heygen_job:${heygenJobId}`,
                // Status remains processing, HeyGen webhook will complete it
              })
              .eq("id", project.id);

            results.push({ job_id: jobId, status: "queued_heygen" });
          } else {
            // Sarvam-only complete
            await supabase
              .from("projects")
              .update({
                status: "completed",
                video_url: videoExport.download_url,
                progress: 100,
              })
              .eq("id", project.id);
            
            results.push({ job_id: jobId, status: "completed" });
          }
        } else {
          // Still processing
          await supabase
            .from("projects")
            .update({ progress: liveData.data?.progress || 0 })
            .eq("id", project.id);
            
          results.push({ job_id: jobId, status: "processing", progress: liveData.data?.progress });
        }
      } catch (err) {
        console.error(`Error polling job ${jobId}:`, err);
      }
    }

    return NextResponse.json({ message: "Polling complete", results });
  } catch (error: any) {
    console.error("Cron API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
