"use client";

import { useState, useEffect } from "react";
import { ProjectCard, type Project } from "@/components/dashboard/ProjectCard";
import { TopHeader } from "@/components/layout/TopHeader";
import { TranslationModal } from "@/components/translation/TranslationModal";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Video, Clock, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface DashboardClientProps {
  initialProjects: Project[];
}

/* ─── Stats config (static, no server data needed) ──────────────────────── */
const stats = [
  {
    id: "stat-total-videos",
    label: "Total Videos",
    value: "48",
    change: "+12 this month",
    icon: Video,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    id: "stat-hours-translated",
    label: "Hours Translated",
    value: "127h",
    change: "+23h this month",
    icon: Clock,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "stat-completed",
    label: "Completed",
    value: "41",
    change: "85% success rate",
    icon: CheckCircle,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: "stat-trending",
    label: "Avg. Turnaround",
    value: "4.2m",
    change: "2x faster this week",
    icon: TrendingUp,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export function DashboardClient({ initialProjects }: DashboardClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  // Simulate background job completion for the demo
  useEffect(() => {
    const timer = setInterval(() => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.status === "processing") {
            const tempP = p as any;
            if (!tempP._createdTs) {
              tempP._createdTs = Date.now();
            } else if (Date.now() - tempP._createdTs > 12000) {
              return { ...p, status: "completed" };
            }
          }
          return p;
        })
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Modal (portal, renders at body level) */}
      <TranslationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Top header — receives opener callback */}
      <TopHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Video Translate" },
        ]}
        onNewTranslation={() => setModalOpen(true)}
      />

      <div className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Hero welcome strip */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 p-6 mb-8 shadow-xl shadow-indigo-500/20">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Video Translate</h1>
              <p className="text-indigo-200 text-sm">
                AI-powered lip-sync translations in 50+ languages
              </p>
            </div>
            <Button
              id="hero-new-translation-btn"
              onClick={() => setModalOpen(true)}
              className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg font-semibold flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New Translation
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                id={stat.id}
                key={stat.id}
                className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  <TrendingUp className="h-3.5 w-3.5 text-teal-500" />
                </div>
                <p className="text-2xl font-bold text-slate-800 mb-0.5">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-[10px] text-teal-600 font-semibold mt-1">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Projects */}
        <section aria-labelledby="recent-projects-heading">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                id="recent-projects-heading"
                className="text-lg font-bold text-slate-800"
              >
                Recent Projects
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Your latest translation jobs
              </p>
            </div>
            <Link
              href="/projects"
              id="view-all-projects-btn"
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
            >
              View all projects
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        {/* Empty state / New project CTA */}
        <div className="mt-5">
          <button
            id="create-new-project-card"
            onClick={() => setModalOpen(true)}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-300 group"
          >
            <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors duration-300">
              <Plus
                className="h-6 w-6 group-hover:text-indigo-500 transition-colors duration-300"
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Start a new translation</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload an MP4 or paste a YouTube URL
              </p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
