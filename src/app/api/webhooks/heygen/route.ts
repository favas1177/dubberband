import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use the service role key to bypass RLS since the webhook isn't authenticated as the user
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[HeyGen Webhook] Received payload:", body);

    // According to HeyGen's webhook docs, the job_id is usually provided in the payload
    // You may need to adjust this depending on the exact webhook payload structure of HeyGen's LipSync v3 API
    const jobId = body.job_id || body.data?.job_id;
    const status = body.status || body.data?.status; // e.g., 'completed', 'failed'
    const videoUrl = body.video_url || body.data?.video_url || body.data?.url;

    if (!jobId) {
      return NextResponse.json({ error: "Missing job_id in payload" }, { status: 400 });
    }

    // Find the project where video_url ends with #heygen_job:{jobId}
    const { data: projects, error: searchError } = await supabase
      .from("projects")
      .select("*")
      .like("video_url", `%#heygen_job:${jobId}`);

    if (searchError || !projects || projects.length === 0) {
      console.error("[HeyGen Webhook] Project not found for job_id:", jobId);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projects[0];

    // Update the project based on the HeyGen status
    let updateData: any = {};
    
    // Check if the webhook payload indicates completion
    if (status === "completed" || status === "success" || videoUrl) {
      updateData = {
        status: "completed",
        video_url: videoUrl || project.video_url.split('#')[0], // Fallback to original if HeyGen didn't provide one
        progress: 100,
      };
    } else if (status === "failed") {
      updateData = {
        status: "failed",
      };
    } else if (status === "processing") {
      updateData = {
        progress: body.progress || 50, // Arbitrary progress update
      };
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", project.id);

      if (updateError) {
        console.error("[HeyGen Webhook] Error updating project:", updateError);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[HeyGen Webhook] Error processing payload:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
