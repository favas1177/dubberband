import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { Project } from "@/components/dashboard/ProjectCard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Video Translate – Dubberband",
  description:
    "Translate your videos into multiple languages using AI-powered lip-sync technology.",
};

/* ─── Dummy seed data (would come from DB/API in production) ─────────────── */
const seedProjects: Project[] = [
  {
    id: "proj-001",
    title: "Product Launch Keynote 2024",
    thumbnailGradient: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    thumbnailIcon: "🎬",
    sourceLanguage: "English",
    targetLanguage: "Spanish",
    status: "completed",
    duration: "12:34",
    createdAt: "Sep 22, 2026",
  },
  {
    id: "proj-002",
    title: "Customer Onboarding Tutorial",
    thumbnailGradient: "bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500",
    thumbnailIcon: "🎓",
    sourceLanguage: "English",
    targetLanguage: "French",
    status: "processing",
    duration: "8:20",
    createdAt: "Sep 23, 2026",
    progress: 67,
  },
  {
    id: "proj-003",
    title: "Monthly CEO Update – Q3",
    thumbnailGradient: "bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400",
    thumbnailIcon: "📊",
    sourceLanguage: "English",
    targetLanguage: "German",
    status: "completed",
    duration: "5:47",
    createdAt: "Sep 21, 2026",
  },
  {
    id: "proj-004",
    title: "Marketing Campaign Reel",
    thumbnailGradient: "bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500",
    thumbnailIcon: "📣",
    sourceLanguage: "English",
    targetLanguage: "Hindi",
    status: "draft",
    duration: "2:15",
    createdAt: "Sep 20, 2026",
  },
  {
    id: "proj-005",
    title: "Engineering Deep-Dive Webinar",
    thumbnailGradient: "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700",
    thumbnailIcon: "⚙️",
    sourceLanguage: "English",
    targetLanguage: "Japanese",
    status: "processing",
    duration: "45:12",
    createdAt: "Sep 24, 2026",
    progress: 23,
  },
  {
    id: "proj-006",
    title: "Sales Enablement Training",
    thumbnailGradient: "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500",
    thumbnailIcon: "💼",
    sourceLanguage: "English",
    targetLanguage: "Portuguese",
    status: "completed",
    duration: "18:05",
    createdAt: "Sep 19, 2026",
  },
];

export default async function VideoTranslatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let projects: Project[] = [];
  
  if (user) {
    const { data: dbProjects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
      
    if (!error && dbProjects) {
      projects = dbProjects.map((p) => ({
        id: p.id,
        title: p.title || "Untitled Project",
        thumbnailGradient: p.thumbnail_gradient || "bg-gradient-to-br from-indigo-500 to-teal-500",
        thumbnailIcon: p.thumbnail_icon || "🎬",
        sourceLanguage: p.source_language || "English",
        targetLanguage: p.target_language || "Unknown",
        status: p.status || "processing",
        duration: p.duration || "0:00",
        createdAt: new Date(p.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        progress: p.progress || 0,
        videoUrl: p.video_url,
      }));
    }
  }

  return (
    <main className="flex flex-col flex-1 pt-16">
      <DashboardClient initialProjects={projects} />
    </main>
  );
}
